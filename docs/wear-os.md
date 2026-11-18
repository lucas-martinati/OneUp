# OneUp sur Wear OS

L'application montre native est située dans `android/wear`. Conçue spécifiquement pour les cadrans circulaires Wear OS (225dp+), elle propose l'accueil à tuiles Canvas haute densité, les routines enregistrées en un geste, la navigation verticale et rotative par catégories, le compteur ergonomique (`−1` / `+1` / `+5` / appui long `+10`), le chronomètre temps réel seconde par seconde, le minuteur de récupération avec aperçu de l'exercice suivant et les emblèmes hexagonaux des 10 niveaux.

Le téléphone reste la source de vérité des objectifs journaliers, des 10 langues de l'application, du thème visuel actif, des routines enregistrées, des catégories personnalisées, des charges (kg) et des droits OneUp Pro.

## Construire et installer une paire de développement

Prérequis : Node/npm, JDK 21, SDK Android 36, un téléphone Android et une montre Wear OS 3 ou supérieure avec Google Play Services. La montre doit être jumelée au téléphone par le système Wear OS.

```sh
npm install
npm run build:wear:apk
```

Les deux APK générés se trouvent ici :

- Téléphone : `android/app/build/outputs/apk/dev/debug/app-dev-debug.apk`
- Montre : `android/wear/build/outputs/apk/dev/debug/wear-dev-debug.apk`

Les deux versions `dev` partagent l'identifiant `com.lucasm548.oneup.dev` et la même signature de débogage. Il faut installer les deux depuis le même poste. Une montre `dev` ne communique pas avec l'application de production `com.lucasm548.oneup`.

```sh
adb devices
adb -s TELEPHONE install -r android/app/build/outputs/apk/dev/debug/app-dev-debug.apk
adb -s MONTRE install -r android/wear/build/outputs/apk/dev/debug/wear-dev-debug.apk
```

Le débogage Wi-Fi de la montre permet également l'installation via `adb pair` puis `adb connect` (les ports de jumelage et de connexion affichés par la montre sont distincts).

1. Ouvrir OneUp sur le téléphone, terminer l'onboarding et se connecter au compte habituel si nécessaire.
2. Vérifier l'état de connexion ou forcer une synchronisation à tout moment depuis **Paramètres › Montre Wear OS** sur le téléphone Android.
3. Ouvrir OneUp sur la montre et toucher « Synchroniser » si le catalogue initial n'est pas encore arrivé.
4. Glisser horizontalement entre les pages d'exercices ; verticalement, ou via la couronne rotative, entre les catégories. Toucher une tuile ouvre son compteur rapide.
5. « Ma séance » permet soit de lancer directement l'une des **Routines** enregistrées sur le téléphone en un geste, soit de composer une sélection ordonnée multi-catégories.
6. Pendant la séance :
   - Exercices de répétitions : boutons `−1`, `+1`, `+5` (appui long `+10`) ou appui direct sur le compteur central (`+1`), avec vibration haptique à chaque palier de niveau franchi.
   - Exercices chronométrés : boutons `−5s`, `Chrono / Pause`, `+5s`, progression fluide seconde par seconde sur l'anneau à 10 segments et arrêt automatique avec double vibration au niveau 10.
   - Récupération (`Repos`) : anneau de décompte visuel, maintien de l'écran actif, ajustement `−15s` / `+15s`, aperçu du prochain exercice et vibration au poignet à `00:00`.
7. Le drapeau ouvre la confirmation de fin ; l'écran de bilan affiche la durée exacte, les exercices validés et le volume total, puis la séance rejoint l'historique mobile (identifiée par le badge montre Wear OS).

L'interface native de la montre suit automatiquement les **10 langues** et le **thème de couleur** actif du téléphone, ainsi que les **64 icônes vectorielles** des exercices standards et personnalisés.

## Synchronisation et fonctionnement hors connexion

- `wear-shared` expose les chemins et transports de la Data Layer officielle Google Play Services.
- Le téléphone publie un instantané privé sur `/oneup/v1/snapshot`. Chaque version du catalogue possède un identifiant `catalogId` ; les catalogues obsolètes déjà acquittés sont nettoyés automatiquement pour préserver le stockage local.
- La montre enregistre chaque action dans `SharedPreferences` avant émission : progression, début et fin de séance (incluant le nom de la routine éventuelle). Les opérations sont immuables et publiées sous `/oneup/v1/operations/<flux>/<séquence>`.
- Chaque compte possède un flux isolé identifié par une empreinte SHA-256 propre à l'installation ; aucun jeton Firebase ni secret n'est transmis à la montre.
- Le service Android du téléphone conserve les opérations entrantes même lorsque la WebView est fermée. L'import dans Zustand, la génération automatique du nom de séance et la synchronisation Firebase s'effectuent à l'ouverture ou au retour au premier plan.
- Le téléphone enregistre durablement la progression et son reçu avant d'acquitter l'opération auprès de la montre, garantissant l'absence de double comptage.
- Les objectifs restent utilisables hors connexion jusqu'au prochain minuit local du téléphone.
- Sur la montre, la police variable `Outfit` est mise en cache en mémoire et les rafraîchissements chaque seconde mettent à jour les vues en place sans reconstruire l'arbre UI, minimisant la consommation batterie.

## Validation

```sh
npm test
npm run lint
npm run test:wear
```

Les tests JavaScript vérifient le protocole idempotent, l'isolation des comptes, l'export des routines/thèmes/traductions, la reprise et le nommage des séances ainsi que la synchronisation manuelle. Les tests JVM/Robolectric Android vérifient les seuils des 10 niveaux, la persistance hors connexion, le lancement des routines, le compteur `+1`/`+5`, le chronomètre temps réel et génèrent les aperçus circulaires dans `android/wear/build/test-previews/`.

## Distribution

La montre utilise un `versionCode` indépendant (`wearVersionCode`, `1000001` par défaut), distinct de celui du téléphone :

```sh
cd android
./gradlew :wear:bundleProdRelease -PwearVersionCode=1000001
```

Le bundle AAB est généré dans `android/wear/build/outputs/bundle/prodRelease/` avec le même certificat de signature (`keystore.properties`) que l'application mobile afin d'autoriser la communication Data Layer via Google Play App Signing.
