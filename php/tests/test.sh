#!/usr/bin/env bash
# Tests locaux : lance le serveur PHP intégré sur www/ puis vérifie les pages.
# Usage : bash tests/test.sh   (depuis le dossier du projet)
# NB : le serveur intégré de PHP ignore les .htaccess (ils seront actifs chez OVH).
set -u
cd "$(dirname "$0")/.."
WWW="${WWW:-www}"
PORT="${PORT:-18765}"
BASE="http://127.0.0.1:$PORT"
if curl -s --max-time 10 -o /dev/null "$BASE/"; then echo "Port $PORT déjà utilisé : relancer avec PORT=xxxx bash tests/test.sh"; exit 2; fi
php -S 127.0.0.1:$PORT -t "$WWW" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
for _ in $(seq 50); do curl -s --max-time 10 -o /dev/null "$BASE/" && break; sleep 0.1; done
OK=0; KO=0
check() { # description, commande
    if eval "$2" >/dev/null 2>&1; then echo "  OK  $1"; OK=$((OK+1)); else echo "  KO  $1"; KO=$((KO+1)); fi
}
code() { curl -s --max-time 10 -o /dev/null -w '%{http_code}' "$@"; }
body() { curl -s --max-time 10 "$@"; }
echo "Synthetiseur"
check "page d'accueil 200"            '[ "$(code $BASE/)" = 200 ]'
check "titre présent"                 'body $BASE/ | grep -q "<title>Synthetiseur</title>"'
check "plus de syntaxe Jinja"         '! body $BASE/ | grep -q "{{"'
check "CSS en chemin relatif"         'body $BASE/ | grep -q "href=\"static/style.css\""'
check "CSS servi"                     '[ "$(code $BASE/static/style.css)" = 200 ]'
check "JS servi et valide"            '[ "$(code $BASE/static/app.js)" = 200 ] && node --check www/static/app.js'
check "aucun script inline (CSP)"     '! body $BASE/ | grep -q "<script>"'
check "en-tête CSP strict"            'curl -s --max-time 10 -D- -o /dev/null $BASE/ | grep -qi "content-security-policy: default-src .none."'
check "Permissions-Policy (micro)"    'curl -s --max-time 10 -D- -o /dev/null $BASE/ | grep -qi "permissions-policy: microphone=(self)"'
check "POST refusé (405)"             '[ "$(code -X POST $BASE/)" = 405 ]'
check "bouton source mis en avant"    'grep -q "mic-btn:not(.active):not(.pending)" www/static/style.css'
echo "$OK réussi(s), $KO échec(s)"; [ $KO -eq 0 ]
