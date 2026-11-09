# ETAT_PROJET - Synthetiseur

## Etat actuel : Termine (audit securite + refonte UI du 2026-10-05)

## Prompt utilisateur
> Creer un fichier de suivi ETAT_PROJET.md et noter toutes les etapes de travail.
> Travail a effectuer :
> 1. Creer ou remplacer musique.py
> 2. Creer requirements.txt
> 3. Creer templates/index.html
> 4. Creer static/style.css
> 5. Creer README.md
> 6. Tester l'application et corriger les erreurs
>
> Fonctionnalites :
> 1) L'application doit ecouter au micro de l'utilisateur et transformer le son en image comme sur un oscilloscope
> 2) Le titre sera "Synthetiseur"
> 3) Un bouton indiquant que le micro est bien reconnu et un curseur pour augmenter ou baisser l'ecoute du micro
> 4) Une image occupant pratiquement toute la place et un curseur pour gerer la taille de l'image
> 5) Design moderne, responsive et avec de petites animations CSS
>
> Contraintes : Python et Flask uniquement, pas de Node/React/Next, pas d'installation automatique de dependances, ecrire les fichiers directement, ne pas demander quels fichiers creer.

## Prompt utilisateur (2e demande)
> Lire et mettre a jour le fichier de suivi ETAT_PROJET.md en notant toutes les etapes de travail ainsi que le prompt en premier.
> Travail a effectuer :
> 1. Lire les fichiers du repertoire et des sous-repertoires
> 2. Changer le port en 5002

## Prompt utilisateur (3e demande)
> Lire et mettre a jour le fichier de suivi ETAT_PROJET.md et noter toutes les etapes de travail ainsi que le prompt en premier.
> Travailler dans le dossier courant.
> Travail a effectuer :
> 1. Lire les fichiers du repertoire et des sous-repertoires
> 2. L'image de l'onde s'affiche a 70% et ne fonctionne pas bien vers la droite quand on bouge le curseur "Taille Image", corriger
> 3. Augmenter le curseur du micro de 200 a 400%
> 4. Augmenter aussi l'onde generee car en Y elle ne prend que 20% de l'image, la doubler

## Prompt utilisateur (4e demande)
> Lire et mettre a jour le fichier de suivi ETAT_PROJET.md et noter toutes les etapes de travail ainsi que le prompt en premier.
> Travailler dans le dossier courant.
> Travail a effectuer :
> 1. Lire les fichiers du repertoire et des sous-repertoires
> 2. L'image est floue et contient deux signaux, donc creer plutot 2 images et envoyer l'onde du son gauche sur l'image de gauche et l'onde du son droit sur l'image de droite
> 3. Ajouter aussi a gauche des curseurs une liste contenant la selection de la source d'entree :
>    - micro
>    - autre application...
>    - chrome
>    (prendre exemple sur le melangeur de Windows qui donne cette information)

## Prompt utilisateur (5e demande)
> Lit et met a jour le fichier de suivi ETAT_PROJET.md et note toutes tes etapes de travail ainsi que le prompt en premier.
> Travaille dans le dossier courant.
> Analyse et corrige mon application Flask Synthetiseur dans templates/index.html.
> J'ai deux oscilloscopes stereo gauche/droite. Je soupconne un probleme de duplication du rendu ou de plusieurs boucles d'animation.
> 1. Verifie qu'une seule boucle requestAnimationFrame est active a la fois. Utilise un identifiant de frame et annule proprement l'ancienne boucle lors d'un changement de source ou de l'arret de la capture.
> 2. Verifie que le canvas gauche et le canvas droit ne sont pas dessines plusieurs fois par plusieurs boucles concurrentes.
> 3. Pour le micro, utilise un ChannelSplitterNode lorsque la source possede deux canaux. Si la source est mono, indique clairement que les deux courbes representent le meme signal.
> 4. Pour Chrome, verifie que les canaux gauche et droit sont reellement distincts. Ne pretend pas qu'il s'agit de deux signaux differents si la source est mono ou si les deux canaux sont identiques.
> 5. Ajoute, si possible, une indication visuelle « Mono » ou « Stereo ».
> 6. Conserve le design actuel, les deux canvas, le reglage de gain et la selection de source.
> 7. Verifie la syntaxe JavaScript et Python apres les modifications.

## Prompt utilisateur (6e demande)
> Lit et met a jour le fichier de suivit : ETAT_PROJET.md et note toutes tes etapes de travail ainsi que le prompt en premier
> Travaille dans le dossier courant.
>
> Je veux modifier l'application Synthetiseur pour que le curseur « ECOUTE » controle reellement le volume du son capture, et pas seulement l'affichage de l'oscilloscope.
>
> Objectif :
> - Le son provenant de la source selectionnee (Chrome/onglet ou microphone) doit pouvoir etre entendu dans les haut-parleurs/casque.
> - Le curseur « ECOUTE » doit controler le volume d'ecoute en temps reel.
> - Le niveau d'ecoute doit pouvoir etre regle de 0 % a 100 %.
> - Le reglage doit etre independant du reglage de gain/zoom utilise pour l'affichage de l'oscilloscope.
>
> Architecture Web Audio souhaitee :
>
> Source audio
>     |
>     v
> GainNode d'ecoute
>     |
>     v
> AudioContext.destination
>
> Et en parallele, la source continue d'alimenter les analyseurs gauche/droit pour l'oscilloscope.
>
> Utilise donc un `GainNode`, par exemple :
> `listenGain = audioCtx.createGain()`
>
> Puis :
> `listenGain.connect(audioCtx.destination)`
>
> Le volume doit etre pilote par le curseur « ECOUTE », avec une valeur comprise entre 0 et 1 :
> `listenGain.gain.value = valeur / 100`
>
> IMPORTANT :
> - Ne pas modifier le gain utilise pour l'affichage de l'oscilloscope.
> - Le curseur ECOUTE doit uniquement controler le volume sonore reellement envoye vers `AudioContext.destination`.
> - A 0 %, aucun son ne doit sortir.
> - A 100 %, le signal doit etre envoye a son niveau normal.
> - Afficher la valeur numerique du volume a cote/sous le curseur, comme actuellement pour les autres reglages.
>
> GESTION DU MICRO :
> Attention au risque de larsen avec le microphone.
> Si la source selectionnee est le microphone, ne pas activer automatiquement la restitution dans les haut-parleurs si cela peut creer une boucle acoustique.
> Dans ce cas, ajoute plutot un comportement sur :
> - soit desactiver l'ecoute du microphone par defaut ;
> - soit afficher un avertissement demandant d'utiliser un casque ;
> - idealement, l'utilisateur doit pouvoir activer l'ecoute du micro volontairement.
>
> Pour une source Chrome/onglet, l'ecoute peut etre activee normalement.
>
> GESTION DES SOURCES :
> Quand `startCapture()` change de source :
> - conserver un seul `GainNode` d'ecoute ;
> - deconnecter proprement l'ancienne source ;
> - connecter la nouvelle source au `listenGain` si l'ecoute est autorisee ;
> - eviter toute double connexion qui ferait entendre le son deux fois.
>
> IMPORTANT POUR LE PROBLEME DE DOUBLON :
> Verifie egalement que le meme signal audio n'est pas connecte deux fois a `AudioContext.destination`.
> Je ne veux absolument pas avoir deux fois le meme son superpose.
>
> Je veux conserver exactement le design actuel de l'application :
> - meme interface ;
> - meme oscilloscope stereo ;
> - meme couleurs ;
> - meme curseurs ;
> - meme selection de source.
>
> Fais les modifications directement dans le code existant sans reecrire inutilement toute l'application.
>
> A la fin :
> 1. verifie qu'il n'y a qu'une seule chaine d'ecoute vers `AudioContext.destination` ;
> 2. verifie que le curseur ECOUTE agit reellement sur `GainNode.gain` ;
> 3. verifie que le gain d'affichage de l'oscilloscope reste independant ;
> 4. verifie qu'un changement de source ne cree pas de connexions audio supplementaires ;
> 5. verifie qu'il n'y a pas de risque de larsen automatique avec le microphone ;
> 6. verifie la syntaxe JavaScript et Python.

## Prompt utilisateur (7e demande)
> Lit et met a jour le fichier de suivit : ETAT_PROJET.md et note toutes tes etapes de travail ainsi que le prompt en premier
> Travaille dans le dossier courant.
>
> Ajoute également un petit indicateur à côté du bouton « ÉCOUTE » :
> - « ÉCOUTE : OFF » lorsque le son n'est pas envoyé vers les haut-parleurs.
> - « ÉCOUTE : ON » lorsque la restitution est active.
> - Pour le microphone, indiquer « ⚠️ Casque recommandé » lorsque l'écoute est activée.
>
> Le bouton/contrôle d'écoute doit permettre d'activer et désactiver rapidement la restitution audio sans arrêter l'analyse de l'oscilloscope.

## Prompt utilisateur (8e demande)
> Travaille dans le dossier courant.
> lit le fichier de suivit : ETAT_PROJET.md et note toutes tes étapes de travail.
>  - scan le projet et vérifie que tout est OK
>  - ajoute un maximum de securité si tu vois que l'on a oublié des protocols ou des ports qui ne sont pas scannés
>  - rend l'interface sexy et professionelle

## Historique des etapes

### [2026-10-05] Audit, durcissement securite + refonte interface "studio"
- [x] Lecture de ETAT_PROJET.md, app.py, requirements.txt, .gitignore, README.md, source.sh, templates/index.html, static/style.css ; inventaire du .venv (Flask 3.1.3, Werkzeug 3.1.8)
- [x] Scan des ports en ecoute (ss -ltn) : aucune instance Synthetiseur lancee, pas de conflit sur 5011
- [x] Constat CRITIQUE : app.py lancait `debug=True` sur `0.0.0.0` -> debogueur Werkzeug (execution de code a distance) expose au reseau local
- [x] Constat : source.sh en permissions `-r-xr-xrwx` (modifiable par tout utilisateur alors qu'il est execute) -> corrige en 755
- [x] Constat : documentation incoherente (musique.py inexistant -> app.py ; port 5002 dans app.py/doc vs 5011 dans source.sh) -> port unifie a 5011, doc corrigee
- [x] Constat : aucun en-tete de securite HTTP, aucune validation de l'en-tete Host, script JS inline (empeche une CSP stricte)
- [x] app.py reecrit : configuration par variables d'environnement (HOST, PORT, ALLOWED_HOSTS, SSL_CERT/SSL_KEY, FLASK_DEBUG)
- [x] HOST par defaut 127.0.0.1 (source.sh garde 0.0.0.0 volontairement pour l'acces depuis Windows/LAN) ; PORT valide (1024-65535)
- [x] FLASK_DEBUG desactive par defaut et refuse automatiquement si HOST n'est pas une adresse loopback
- [x] Protection DNS rebinding : TRUSTED_HOSTS (Flask 3.1) = localhost + IP locales detectees, ou liste ALLOWED_HOSTS -> Host inconnu = HTTP 400
- [x] En-tetes de securite sur toutes les reponses : Content-Security-Policy stricte (script-src 'self', aucun inline, frame-ancestors 'none', object-src 'none'...), Permissions-Policy (seuls microphone et display-capture autorises, camera/geoloc/usb/serial/hid/bluetooth/payment/midi/capteurs interdits), X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy no-referrer, COOP/CORP/COEP, Origin-Agent-Cluster, Cache-Control no-store sur le HTML, HSTS si HTTPS
- [x] Support HTTPS optionnel (SSL_CERT/SSL_KEY) : necessaire pour utiliser le micro depuis une autre machine du reseau (contexte securise)
- [x] Limites de requete : MAX_CONTENT_LENGTH 1 Ko, route / restreinte a GET (POST -> 405)
- [x] Banniere `Server: Werkzeug/x Python/y` masquee (plus de divulgation de versions)
- [x] requirements.txt : Flask>=3.1 (TRUSTED_HOSTS)
- [x] JavaScript extrait dans static/app.js (IIFE, 'use strict') pour respecter la CSP
- [x] JS : verification du contexte securise avant capture, messages d'erreur clairs (acces refuse, aucun peripherique, peripherique occupe, audio non partage)
- [x] JS : arret propre lorsque l'utilisateur coupe le partage depuis le bandeau du navigateur (evenement `ended`) et a la fermeture de la page
- [x] JS : correction du texte d'avertissement micro (« cochez la case » -> bouton ÉCOUTE)
- [x] Refonte interface : barre superieure (logo SVG anime, statut LIVE, badge Mono/Stereo, frequence d'echantillonnage), rack lateral en 3 panneaux numerotes (Source / Ecoute / Affichage), curseurs avec remplissage de piste, cartes oscilloscope avec en-tete, VU-metres et niveau en dBFS par canal, graticule 10x8, ecran d'attente/erreur, mention « traitement 100 % local », favicon SVG
- [x] Accessibilite : focus visibles, aria-live sur le statut, respect de prefers-reduced-motion ; responsive (rack en grille < 960 px, scopes empiles < 640 px)
- [x] Fonctionnalites conservees : selection de source, bouton ÉCOUTE + indicateur ON/OFF/casque, volume 0-100 %, grossissement 0-400 %, taille image, boucle RAF unique, detection mono/stereo, anti-larsen micro
- [x] Verification syntaxe Python (py_compile) : OK
- [x] Verification syntaxe JavaScript (node --check static/app.js) : OK
- [x] Verification coherence : les 26 IDs utilises par app.js existent dans index.html, aucun script/style inline
- [x] Tests serveur (curl) : GET / 200 avec tous les en-tetes ; Host: evil.example -> 400 ; POST -> 405 ; /static/../app.py -> 404 ; FLASK_DEBUG=1 + HOST=0.0.0.0 -> debug refuse ; en-tete Server masque
- [ ] Non verifie : rendu visuel en navigateur (aucun navigateur headless disponible dans l'environnement)
- [x] Mise a jour README.md et ETAT_PROJET.md

### [2026-09-16] Bouton ECOUTE + indicateur ON/OFF (micro : casque recommande)
- [x] Lecture de tous les fichiers du repertoire (ETAT_PROJET.md, musique.py, templates/index.html, static/style.css, README.md, requirements.txt)
- [x] Diagnostic : la restitution n'etait activee que via la case a cocher « Activer l'ecoute » sans etat visible au premier coup d'oeil ; aucun bouton d'activation/desactivation rapide dedie a l'ecoute
- [x] Remplacement de la case a cocher par un bouton bascule « ÉCOUTE » (id #listen-btn) avec point lumineux : clic = activer/desactiver instantanement `listenAllowed` sans toucher a la boucle requestAnimationFrame ni aux analyseurs -> l'oscilloscope continue de fonctionner
- [x] Ajout d'un indicateur #listen-state a cote du bouton : « ÉCOUTE : OFF » (restitution coupee, gain=0), « ÉCOUTE : ON » (restitution active), et « ÉCOUTE : ON · ⚠️ Casque recommandé » si la source est le micro et l'ecoute activee
- [x] Fonction `updateListenUI()` : synchronise l'etat visuel du bouton (aria-pressed, classe .active, point clignotant), desactive le bouton quand aucune capture n'est en cours, et met a jour le texte/la couleur de l'indicateur (.on = vert, .warn = ambre pour le micro)
- [x] Toggle rapide sans re-demarrage de la capture : le clic ne modifie que `listenAllowed` / `listenGain.gain` ; l'analyse de l'oscilloscope et le cycle de dessin ne sont jamais interrompus
- [x] Renforcement securite micro : ecoute toujours desactivee par defaut au lancement (gain force a 0), activation volontaire via le bouton, avertissement larsen conserve + indicateur « casque recommande »
- [x] Documentation : fichiers HTML et CSS mis a jour (remplacement des styles .listen-toggle par .listen-btn/.listen-state)
- [x] Verification syntaxe JavaScript (node --check) : OK
- [x] Verification syntaxe Python (py_compile) : OK
- [x] Verification absence de references residuelles a l'ancienne case a cocher (grep listen-enabled/listen-toggle) : OK
- [x] Mise a jour du fichier de suivi ETAT_PROJET.md (inscription du prompt en premier)

### [2026-09-16] Ecoute reelle du volume + GainNode dedie a la destination
- [x] Lecture de tous les fichiers du repertoire (ETAT_PROJET.md, musique.py, templates/index.html, static/style.css, README.md, requirements.txt)
- [x] Diagnostic : le curseur « Ecoute » (0-400%) ne pilotait qu'un gain d'affichage pur ; AUCUN noeud n'etait connecte a audioCtx.destination -> aucun son n'etait audible. Une seule source d'entree avec les deux canaux downmix nes sur les analyseurs
- [x] Creation d'un GainNode d'ecoute unique par contexte : `listenGain = audioCtx.createGain()` puis `listenGain.connect(audioCtx.destination)` (une seule connexion vers destination, les analyseurs/splitter n'y sont jamais relies)
- [x] Connexion de la source en parallele : `source.connect(splitter)` (analyseurs gauche/droit pour l'oscilloscope) et `source.connect(listenGain)` (restitution audible)
- [x] Curseur « Ecoute » redefini en volume d'ecoute : min 0, max 100, valeur par defaut 100 ; `listenGain.gain.value = parseInt(listenSlider.value, 10) / 100` en temps reel (evenement input + a chaque demarrage)
- [x] A 0 % aucun son ne sort (gain a 0), a 100 % le signal est restitue a son niveau normal (gain a 1.0)
- [x] Nouveau curseur « Grossissement » (0 a 400%, valeur par defaut 100) dedie uniquement au gain d'affichage de l'oscilloscope : `draw()` utilise `parseInt(zoomSlider.value, 10) / 100`. Gain d'affichage totalement independant du volume d'ecoute
- [x] Valeur numerique affichee a cote des nouveaux curseurs (output #listen-value et #zoom-value), meme format que les autres reglages
- [x] Securite micro / larsen : `listenAllowed = sourceType !== 'micro'` -> micro ecoute desactivee par defaut (gain force a 0) ; avertissement visible « Ecoute du micro desactivee par defaut... utilisez un casque » ; activation volontaire via la case a cocher « Activer l'ecoute » ; si activee, avertissement permanent « portez un casque pour eviter le larsen »
- [x] Pour les sources Chrome/onglet et Autre application : ecoute activee par defaut (case cochee), aucun avertissement
- [x] Changement de source sans doublon : stopTracks() deconnecte la source, le splitter, le listenGain et ferme l'ancien AudioContext ; startCapture() reconstruit un contexte propre (un seul listenGain, une seule connexion vers destination) -> aucune double connexion/aucun son superpose
- [x] Design conserve : 2 canvases stereo, couleurs, curseurs, selection de source ; seules la fonction du curseur Ecoute et l'ajout de Grossissement/la case a cocher changent
- [x] Verification 1 : une seule chaine d'ecoute vers destination (listenGain->destination), pas de connexion des analyseurs vers destination
- [x] Verification 2 : le curseur Ecoute agit reellement sur listenGain.gain (updateListenGain)
- [x] Verification 3 : gain d'affichage (Grossissement) independant du gain d'ecoute
- [x] Verification 4 : changement de source -> reconstruction propre, cptes captureSeq, aucune connexion audio supplementaire
- [x] Verification 5 : micro non restitue automatiquement (gain 0 par defaut + avertissement + activation volontaire)
- [x] Verification syntaxe JS (node --check) : OK
- [x] Verification syntaxe Python (py_compile) : OK
- [x] Mise a jour du fichier de suivi ETAT_PROJET.md (inscription du prompt en premier)

### [2026-09-16] Boucle d'animation unique + detection Mono/Stereo
- [x] Lecture de tous les fichiers du repertoire (ETAT_PROJET.md, musique.py, templates/index.html, static/style.css, README.md, requirements.txt)
- [x] Diagnostic : startCapture() relancait requestAnimationFrame(draw) sans annuler l'ancienne boucle -> 2 boucles concurrentes lors d'un changement de source a chaud (les 2 canvas etaient dessines 2x par frame). Micro mono connecte directement aux 2 analyser (downmix) : les 2 courbes affichaient le meme signal sans aucune indication
- [x] Boucle RAF unique : ajout de l'identifiant animationFrameId ; startCapture annule d'abord cancelAnimationFrame(animationFrameId), stopCapture fait de meme, draw se reschedule via animationFrameId. Un compteur captureSeq permet d'ignorer les demarrages/arrets obsoletes (gardien anti-course)
- [x] ChannelSplitterNode(2) utilise desormais pour TOUTES les sources (micro stereo, autre application, Chrome) : canal 0 -> analyser gauche, canal 1 -> analyser droit
- [x] Detection Mono/Stereo : forcedMono si track.getSettings().channelCount === 1 ; sinon analyse en temps reel (niveau RMS de chaque canal + correlation des canaux) sur une fenetre glissante de 45 frames avec hysteresis (seuil signal 0.04, correlation >= 0.985)
- [x] En mode mono : le meme signal (dataL) est dessine sur les DEUX canvases, libelles de canaux "Gauche (mono)" / "Droite (mono)"
- [x] Badge visuel #scope-mode "Mono" / "Stereo" en haut a droite des oscilloscopes (span ajoute dans index.html) + styles .scope-mode et .scope-mode.mono dans style.css
- [x] Detection appliquee aussi pour Chrome : si un onglet est mono ou a ses 2 canaux quasi identiques (forte correlation), le mode Mono est affiche au lieu de pretendre une vraie stereo
- [x] Design conserve : 2 canvases, reglage de gain (0-400%), selection de source (Micro/Autre application/Chrome), curseur taille image
- [x] Verification syntaxe Python (py_compile) : OK
- [x] Verification syntaxe JavaScript (node --check) : OK
- [x] Mise a jour du fichier de suivi ETAT_PROJET.md (inscription des prompts en premier)

### [2026-09-16] Oscilloscope stereo + selection de source
- [x] Lecture de tous les fichiers du repertoire et sous-repertoires (musique.py, templates/index.html, static/style.css, README.md, ETAT_PROJET.md, requirements.txt)
- [x] Diagnostic : l'image floue avec "deux signaux" etait due au downmix stereo -> mono de l'AnalyserNode qui superposait les canaux gauche/droit dans la meme image
- [x] Creation de 2 canvas cote a cote (.scope-grid, .scope-item) avec etiquette "Gauche" et "Droite" (templates/index.html, static/style.css)
- [x] Separation des canaux via ChannelSplitterNode : canal gauche -> scope gauche, canal droit -> scope droit (source apps/Chrome)
- [x] Micro mono connecte directement aux deux analyser (les 2 images affichent la meme onde)
- [x] Net thread de l'image : shadowBlur reduit de 12 a 6 et couleur d'ombre adoucie
- [x] Ajout a gauche des curseurs d'une liste de selection de source d'entree (select "Source d'entree") : Micro / Autre application... / Chrome (onglet), inspiree du melangeur Windows
- [x] Implementations capture : getUserMedia pour le micro, getDisplayMedia avec displaySurface 'window' (autre application) ou 'browser' (onglet Chrome), pistes video arretees apres capture
- [x] Changement de source a chaud : re-selection automatique si la lecture est en cours (sourceSelect change -> startCapture)
- [x] Mise a jour du README.md (fonctionnalites, details techniques)
- [x] Verification syntaxe Python (py_compile) : OK
- [x] Verification syntaxe JavaScript (node --check) : OK
- [x] Mise a jour du fichier de suivi ETAT_PROJET.md (inscription des prompts en premier)

### [2026-09-16] Correction affichage onde + curseurs
- [x] Lecture de tous les fichiers du repertoire et sous-repertoires (musique.py, templates/index.html, static/style.css, README.md, ETAT_PROJET.md, requirements.txt)
- [x] Correction du redimensionnement du canvas : suppression de la largeur/hauteur inline figees, le canvas suit desormais toujours son conteneur (clientWidth/clientHeight + devicePixelRatio)
- [x] Re-appel de resizeCanvas lors du drag du curseur "Taille Image" (requestAnimationFrame), a la fin de la transition CSS (transitionend) et a chaque frame de dessin
- [x] Resultat : l'onde occupe 100% de la largeur disponible et plus de coupure vers la droite
- [x] Augmentation du curseur "Ecoute micro" de 200% a 400% max (templates/index.html)
- [x] Doublement de l'amplitude verticale de l'onde (0.48 -> 0.96 de la hauteur)
- [x] Verification syntaxe Python (py_compile) : OK
- [x] Mise a jour du fichier de suivi ETAT_PROJET.md (inscription des prompts en premier)

### [2026-09-16] Demarrage du projet
- [x] Creation du fichier de suivi ETAT_PROJET.md
- [x] Creation de musique.py (Flask app)
- [x] Creation de requirements.txt
- [x] Creation de templates/index.html
- [x] Creation de static/style.css
- [x] Creation de README.md
- [x] Verification syntaxe Python
- [x] Verification existence de tous les fichiers

### [2026-09-16] Changement de port
- [x] Lecture de tous les fichiers du repertoire et sous-repertoires (find . -type f)
- [x] Changement du port de 5000 a 5002 dans musique.py
- [x] Mise a jour du lien d'acces dans README.md (localhost:5002)
- [x] Mise a jour du lien d'acces dans ETAT_PROJET.md (localhost:5002)
- [x] Verification syntaxe Python (py_compile) : OK
- [x] Mise a jour du fichier de suivi ETAT_PROJET.md (inscription des prompts en premier)

## Fichiers crees
| Fichier                | Description                           |
|------------------------|---------------------------------------|
| app.py                 | Serveur Flask securise (port 5011)    |
| static/app.js          | Logique audio / oscilloscope          |
| static/favicon.svg     | Icone                                 |
| source.sh              | Lanceur (venv + Flask, port 5011)     |
| requirements.txt       | Dependances Python                    |
| templates/index.html   | Template HTML oscilloscope            |
| static/style.css       | Styles CSS modernes et responsives    |
| README.md              | Documentation du projet               |
| ETAT_PROJET.md         | Ce fichier de suivi                   |

## Fonctionnalités implementees
1. Selection de la source d'entree (Micro / Autre application / Chrome) via une liste cote gauche des curseurs
2. Ecoute reelle du son dans les haut-parleurs/casque via un GainNode d'ecoute connecte a `AudioContext.destination`
3. Bouton bascule « ÉCOUTE » avec indicateur ON/OFF (« ÉCOUTE : OFF » / « ÉCOUTE : ON », et « ⚠️ Casque recommandé » en mode micro) permettant d'activer/couper la restitution sans arreter l'oscilloscope + curseur « Ecoute » (0 a 100%) pilotant `listenGain.gain` en temps reel (micro desactive par defaut avec avertissement larsen)
4. Double oscilloscope stereo : onde gauche sur l'image de gauche, onde droite sur l'image de droite
5. Bouton d'indication statut source + curseur « Grossissement » (0 a 400%) pour le zoom d'affichage de l'oscilloscope (independant du volume)
6. Curseur pour gerer la taille de l'image oscilloscope
7. Design moderne, responsive, animations CSS
8. Detection Mono/Stereo en temps reel avec badge visuel (source mono : les 2 courbes affichent le meme signal)
9. VU-metres et niveau dBFS par canal, statut LIVE et frequence d'echantillonnage
10. Securite : CSP stricte, Permissions-Policy, anti-clickjacking, protection DNS rebinding (TRUSTED_HOSTS), debug interdit sur le reseau, HTTPS optionnel

## Comment lancer
```bash
./source.sh
```
Puis ouvrir http://localhost:5011 dans un navigateur.
