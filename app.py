"""Synthetiseur - serveur Flask (oscilloscope stereo, traitement audio 100 % navigateur).

Configuration par variables d'environnement :
    HOST           Interface d'ecoute (defaut 127.0.0.1 ; 0.0.0.0 = reseau local)
    PORT           Port TCP (defaut 5011, celui de source.sh)
    ALLOWED_HOSTS  Noms d'hote acceptes, separes par des virgules
                   (defaut : localhost + nom de la machine ; une adresse IP
                   litterale est toujours acceptee, ex. telephone via Windows)
    SSL_CERT / SSL_KEY  Certificat + cle PEM pour servir en HTTPS
                   (indispensable pour le micro depuis une autre machine)
    FLASK_DEBUG    1 pour activer le mode debug (refuse hors 127.0.0.1)
"""

import ipaddress
import os
import socket
import sys

from flask import Flask, abort, render_template, request
from werkzeug.serving import WSGIRequestHandler

LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}

app = Flask(__name__)
app.config.update(
    # Aucune requete ne transporte de donnees : on refuse tout corps > 1 Ko.
    MAX_CONTENT_LENGTH=1024,
    MAX_FORM_MEMORY_SIZE=1024,
    MAX_FORM_PARTS=1,
    # Fichiers statiques mis en cache 1 h (le HTML lui n'est jamais cache).
    SEND_FILE_MAX_AGE_DEFAULT=3600,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Strict",
)

# Politique de securite du contenu : uniquement nos propres fichiers,
# aucun script inline, aucun appel reseau externe, pas d'integration en iframe.
CSP = "; ".join([
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
])

# Seules les API reellement utilisees (micro + capture d'ecran/onglet) sont permises.
PERMISSIONS_POLICY = ", ".join([
    "microphone=(self)",
    "display-capture=(self)",
    "camera=()",
    "geolocation=()",
    "usb=()",
    "serial=()",
    "hid=()",
    "bluetooth=()",
    "payment=()",
    "midi=()",
    "accelerometer=()",
    "gyroscope=()",
    "magnetometer=()",
    "interest-cohort=()",
])


def local_addresses():
    """Adresses IP sous lesquelles la machine peut etre jointe."""
    addrs = set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None):
            addrs.add(info[4][0])
    except OSError:
        pass
    # Adresse de sortie principale (aucun paquet n'est envoye avec UDP connect).
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("192.0.2.1", 9))
            addrs.add(s.getsockname()[0])
    except OSError:
        pass
    return addrs


def trusted_hosts(host):
    """Liste blanche des en-tetes Host (protection contre le DNS rebinding)."""
    env = os.environ.get("ALLOWED_HOSTS", "").strip()
    if env:
        return [h.strip() for h in env.split(",") if h.strip()]
    hosts = set(LOOPBACK_HOSTS) | {"[::1]"}
    if host not in LOOPBACK_HOSTS:
        hosts.add(socket.gethostname())
        for addr in local_addresses():
            hosts.add(f"[{addr}]" if ":" in addr else addr)
        if host not in ("0.0.0.0", "::"):
            hosts.add(host)
    return sorted(hosts)


def host_is_allowed(raw_host):
    """Le DNS rebinding passe par un NOM de domaine : une IP litterale est sure.

    Indispensable quand on vient d'un telephone : WSL est derriere le portproxy
    Windows, l'en-tete Host porte alors l'IP Windows (192.168.x.x), inconnue ici.
    """
    host = raw_host.rsplit(":", 1)[0] if raw_host.count(":") == 1 else raw_host
    if host.startswith("[") and "]" in host:
        host = host[1:host.index("]")]
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        pass
    allowed = app.config.get("ALLOWED_HOST_NAMES")
    return allowed is None or host.lower() in allowed


@app.before_request
def check_host():
    if not host_is_allowed(request.host):
        abort(400)


@app.after_request
def security_headers(response):
    h = response.headers
    h["Content-Security-Policy"] = CSP
    h["Permissions-Policy"] = PERMISSIONS_POLICY
    h["X-Content-Type-Options"] = "nosniff"
    h["X-Frame-Options"] = "DENY"
    h["Referrer-Policy"] = "no-referrer"
    h["Cross-Origin-Opener-Policy"] = "same-origin"
    h["Cross-Origin-Resource-Policy"] = "same-origin"
    h["Cross-Origin-Embedder-Policy"] = "require-corp"
    h["X-Permitted-Cross-Domain-Policies"] = "none"
    h["Origin-Agent-Cluster"] = "?1"
    if app.config.get("HTTPS_ENABLED"):
        h["Strict-Transport-Security"] = "max-age=31536000"
    if response.mimetype == "text/html":
        h["Cache-Control"] = "no-store"
    return response


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


def is_loopback(host):
    if host == "localhost":
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def main():
    host = os.environ.get("HOST", "127.0.0.1")
    try:
        port = int(os.environ.get("PORT", "5011"))
    except ValueError:
        sys.exit("PORT invalide : doit etre un entier.")
    if not 1024 <= port <= 65535:
        sys.exit("PORT invalide : choisir un port non privilegie (1024-65535).")

    debug = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
    if debug and not is_loopback(host):
        # Le debogueur Werkzeug permet d'executer du code : jamais sur le reseau.
        print("⚠️  FLASK_DEBUG ignore : interdit lorsque HOST n'est pas 127.0.0.1.")
        debug = False

    app.config["ALLOWED_HOST_NAMES"] = {h.strip("[]").lower() for h in trusted_hosts(host)}

    ssl_context = None
    cert, key = os.environ.get("SSL_CERT"), os.environ.get("SSL_KEY")
    if cert and key:
        ssl_context = (cert, key)
        app.config["HTTPS_ENABLED"] = True
    elif not is_loopback(host):
        print("ℹ️  Sans HTTPS (SSL_CERT/SSL_KEY), les navigateurs n'autorisent le micro"
              " que sur http://localhost.")

    # Ne pas divulguer les versions de Werkzeug/Python dans l'en-tete Server.
    WSGIRequestHandler.server_version = "Synthetiseur"
    WSGIRequestHandler.sys_version = ""

    print("🔒 Hotes autorises : toute adresse IP + "
          + ", ".join(sorted(app.config["ALLOWED_HOST_NAMES"])))
    app.run(host=host, port=port, debug=debug, ssl_context=ssl_context)


if __name__ == "__main__":
    main()
