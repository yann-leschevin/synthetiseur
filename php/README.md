# synthetiseur — version PHP (OVH)

Oscilloscope stéréo temps réel, en ligne sur https://leschevin.com/projets/synthetiseur/.
Tout le traitement audio se fait dans le navigateur (Web Audio) : aucun son n'est envoyé au serveur.

Portage de https://github.com/yann-leschevin/synthetiseur (version « studio » d'octobre 2026, Flask → PHP).

## Ce que fait PHP
`www/index.php` sert la page avec les **mêmes en-têtes de sécurité** que `app.py` :
Content-Security-Policy stricte (aucun script inline), Permissions-Policy limitée au micro et à la
capture d'écran, X-Frame-Options, COOP/CORP/COEP, HSTS en https, méthode GET uniquement.
La vérification de l'en-tête Host (DNS rebinding) n'est pas reprise : l'hébergement OVH ne répond
qu'aux noms de domaine du site.

Version en ligne : le bouton « Activer la source » est mis en avant (plus grand, dégradé, halo)
tant qu'aucune source n'est active.

## Arborescence
- `www/` : **seul dossier à envoyer** (son contenu va dans `www/projets/synthetiseur/` chez OVH).
- `tests/test.sh` : tests locaux (`bash tests/test.sh`, PHP + curl requis). Ne pas envoyer.

## Tester en local
```bash
php -S 127.0.0.1:18765 -t www     # puis http://127.0.0.1:18765/
bash tests/test.sh
```
Le micro exige un contexte sécurisé : `localhost`/`127.0.0.1` en local, **https** en ligne.
Le serveur intégré de PHP ignore les `.htaccess` : ils ne s'appliqueront que chez OVH.
