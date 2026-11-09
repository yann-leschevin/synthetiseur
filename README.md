# Synthétiseur — oscilloscope stéréo

> 🌐 **Essayer en ligne : <https://leschevin.com/projets/synthetiseur/>**
>
> 🤝 **Version PHP et mise en ligne réalisées par Yann Leschevin ([@yann-leschevin](https://github.com/yann-leschevin)) en collaboration avec Claude (Anthropic), via [Claude Code](https://claude.com/claude-code)** — novembre 2026.

Oscilloscope stéréo en temps réel : le son du micro (ou d'un onglet / d'une application) est dessiné en direct. Traitement 100 % dans le navigateur.

Ce dépôt contient **deux versions** du projet :

| Partie | Dossier | Rôle | Lancer en local |
|--------|---------|------|-----------------|
| 🐍 **Python** (Flask) | racine du dépôt | version d'origine, à lancer sur son ordinateur | `./source.sh` (ou `python3 app.py`) puis http://localhost:5011 |
| 🐘 **PHP** | [`php/`](php/) | version publiée sur [leschevin.com](https://leschevin.com/projets/synthetiseur/) (hébergement OVH) | `cd php && php -S 127.0.0.1:8080 -t www` |

---

## 🐘 Partie PHP — version en ligne

👉 <https://leschevin.com/projets/synthetiseur/> · documentation détaillée : [`php/README.md`](php/README.md)

- `index.php` sert la page avec **les mêmes en-têtes de sécurité** que `app.py`
  (CSP stricte, Permissions-Policy limitée au micro et à la capture d'écran, COOP/COEP…) ;
- bouton « Activer la source » mis en avant tant qu'aucune source n'est active ;
- le micro exige le **https** (c'est le cas sur leschevin.com).

Tests : `bash php/tests/test.sh`.

Le dossier `php/www/` est exactement ce qui est envoyé sur l'hébergement (dans `www/projets/synthetiseur/`).

---

## 🐍 Partie Python — version d'origine

Le code Python n'a pas été modifié par le portage : il reste à la racine du dépôt.
Sa documentation d'origine suit.

### Synthetiseur

Application web Python/Flask qui écoute le micro de l'utilisateur et transforme le son en image, comme un oscilloscope temps réel.

#### Fonctionnalites

1. Selection de la source d'entree : Micro, Autre application (fenetre) ou Chrome (onglet), a la maniere du melangeur Windows
2. Ecoute reelle du son dans les haut-parleurs/casque via la Web Audio API (en pur navigateur, aucun fichier audio n'est stocké)
3. Double oscilloscope stereo : l'onde du canal gauche sur l'image de gauche, l'onde du canal droit sur l'image de droite (canvas HTML5)
4. Bouton d'etat indiquant que la source est reconnue
5. Curseur « Ecoute » (0 a 100%) controlant reellement le volume audible (GainNode vers destination), independant de l'affichage
6. Curseur « Grossissement » (0 a 400%) pour le zoom d'affichage de l'oscilloscope
7. Curseur pour regler la taille de l'image
8. Securite larsen : l'ecoute du micro est desactivee par defaut (avertissement + bouton « ÉCOUTE », casque recommande)
9. VU-metres et niveau dBFS par canal, badge Mono/Stereo, statut LIVE
10. Design "studio" sombre, responsive, animations CSS (respecte prefers-reduced-motion)

#### Prérequis

- Python 3.8+
- `pip`

#### Installation

```bash
pip install -r requirements.txt
```

#### Lancement

```bash
./source.sh            # venv + Flask, ecoute sur 0.0.0.0:5011
# ou
python app.py          # ecoute sur 127.0.0.1:5011 uniquement
```

Puis ouvrir [http://localhost:5011](http://localhost:5011) dans un navigateur.

**Attention** : les navigateurs n'autorisent le micro et la capture qu'en contexte sécurisé : `http://localhost` ou HTTPS. Depuis une autre machine du réseau, fournissez un certificat (`SSL_CERT` / `SSL_KEY`).

#### Configuration (variables d'environnement)

| Variable        | Defaut                       | Role |
|-----------------|------------------------------|------|
| `HOST`          | `127.0.0.1`                  | Interface d'ecoute (`0.0.0.0` = reseau local) |
| `PORT`          | `5011`                       | Port TCP (1024-65535) |
| `ALLOWED_HOSTS` | localhost + IP locales       | Noms d'hote acceptes (virgules) - anti DNS rebinding |
| `SSL_CERT` / `SSL_KEY` | -                     | Certificat/cle PEM pour servir en HTTPS |
| `FLASK_DEBUG`   | `0`                          | Mode debug, refuse si `HOST` n'est pas loopback |

#### Securite

- Content-Security-Policy stricte (aucun script inline, aucune ressource externe, pas d'iframe)
- Permissions-Policy : seuls `microphone` et `display-capture` sont autorises
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP/CORP/COEP, HSTS en HTTPS
- Validation de l'en-tete `Host` (`TRUSTED_HOSTS`), seule la methode GET est acceptee, corps de requete limite a 1 Ko
- Debogueur Werkzeug jamais expose sur le reseau ; banniere `Server` sans numeros de version
- Aucun son ne quitte le navigateur : le serveur ne sert que des fichiers statiques
- Le serveur integre est un serveur de developpement : pour une exposition durable, placer l'application derriere un serveur WSGI (gunicorn/waitress) et un reverse proxy HTTPS

#### Structure

```
.
├── app.py              # Serveur Flask (en-tetes de securite, config par env)
├── source.sh           # Lanceur (venv + Flask)
├── requirements.txt    # Dependances
├── templates/
│   └── index.html      # Interface oscilloscope
├── static/
│   ├── app.js          # Capture audio, analyse, dessin
│   ├── style.css       # Styles
│   └── favicon.svg     # Icone
├── ETAT_PROJET.md      # Suivi du projet
└── README.md           # Cette documentation
```

#### Details techniques

- Backend : Flask (uniquement Python)
- Cote client : Web Audio API pour capturer la source (`getUserMedia` pour le micro, `getDisplayMedia` avec `displaySurface` window/browser pour les applications et onglets Chrome)
- Un `ChannelSplitterNode` separe les canaux gauche/droit pour un micro stereo ou une application ; chaque canal est analyse separement et dessine sur son propre oscilloscope
- Le tracé de la forme d'onde est dessiné en temps réel sur deux `<canvas>` avec une boucle `requestAnimationFrame`
- Le volume audible est gere par un `GainNode` (`listenGain`) relie a `AudioContext.destination` ; le curseur « Ecoute » (0-100 %) pilote `listenGain.gain` en temps reel. Par securite (larsen), l'ecoute du micro est desactivee par defaut et doit etre activee volontairement avec un casque
- Le zoom d'affichage est independant : le curseur « Grossissement » (0-400 %) ne modifie que l'amplitude du tracé de l'oscilloscope
