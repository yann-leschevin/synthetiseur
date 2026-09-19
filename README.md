# Synthetiseur

Application web Python/Flask qui écoute le micro de l'utilisateur et transforme le son en image, comme un oscilloscope temps réel.

## Fonctionnalites

1. Selection de la source d'entree : Micro, Autre application (fenetre) ou Chrome (onglet), a la maniere du melangeur Windows
2. Ecoute reelle du son dans les haut-parleurs/casque via la Web Audio API (en pur navigateur, aucun fichier audio n'est stocké)
3. Double oscilloscope stereo : l'onde du canal gauche sur l'image de gauche, l'onde du canal droit sur l'image de droite (canvas HTML5)
4. Bouton d'etat indiquant que la source est reconnue
5. Curseur « Ecoute » (0 a 100%) controlant reellement le volume audible (GainNode vers destination), independant de l'affichage
6. Curseur « Grossissement » (0 a 400%) pour le zoom d'affichage de l'oscilloscope
7. Curseur pour regler la taille de l'image
8. Securite larsen : l'ecoute du micro est desactivee par defaut (avertissement + case a cocher « Activer l'ecoute », casque recommande)
9. Design moderne, responsive, animations CSS

## Prérequis

- Python 3.8+
- `pip`

## Installation

```bash
pip install -r requirements.txt
```

## Lancement

```bash
python musique.py
```

Puis ouvrir [http://localhost:5002](http://localhost:5002) dans un navigateur.

**Attention** : le micro est accessible uniquement via HTTP(S) ou localhost. Ouvrez l'application avec le micro autorisé dans le navigateur.

## Structure

```
.
├── musique.py          # Serveur Flask
├── requirements.txt    # Dependances
├── templates/
│   └── index.html      # Interface oscilloscope
├── static/
│   └── style.css       # Styles
├── ETAT_PROJET.md      # Suivi du projet
└── README.md           # Cette documentation
```

## Details techniques

- Backend : Flask (uniquement Python)
- Cote client : Web Audio API pour capturer la source (`getUserMedia` pour le micro, `getDisplayMedia` avec `displaySurface` window/browser pour les applications et onglets Chrome)
- Un `ChannelSplitterNode` separe les canaux gauche/droit pour un micro stereo ou une application ; chaque canal est analyse separement et dessine sur son propre oscilloscope
- Le tracé de la forme d'onde est dessiné en temps réel sur deux `<canvas>` avec une boucle `requestAnimationFrame`
- Le volume audible est gere par un `GainNode` (`listenGain`) relie a `AudioContext.destination` ; le curseur « Ecoute » (0-100 %) pilote `listenGain.gain` en temps reel. Par securite (larsen), l'ecoute du micro est desactivee par defaut et doit etre activee volontairement avec un casque
- Le zoom d'affichage est independant : le curseur « Grossissement » (0-400 %) ne modifie que l'amplitude du tracé de l'oscilloscope