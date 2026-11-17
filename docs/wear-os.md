# OneUp sur Wear OS

L'application montre native est dans `android/wear`. Elle reprend l'accueil à tuiles, les catégories verticales, le choix des exercices et les panneaux en boucle de la maquette. Le téléphone reste la source des objectifs, traductions des exercices, catégories personnalisées, poids et droits Pro.

## Construire et installer une paire de développement

Prérequis : Node/npm, JDK 21, SDK Android 36, un téléphone Android et une montre Wear OS 3 ou supérieure avec Google Play Services. La montre doit être jumelée au téléphone par le système Wear OS.

```sh
npm install
npm run build:wear:apk
```

Les deux APK se trouvent ici :

- Téléphone : `android/app/build/outputs/apk/dev/debug/app-dev-debug.apk`
- Montre : `android/wear/build/outputs/apk/dev/debug/wear-dev-debug.apk`

Les deux versions `dev` utilisent `com.lucasm548.oneup.dev` et la même configuration de signature. Il faut installer les deux depuis le même poste/configuration. Une montre `dev` ne peut pas communiquer avec le téléphone de production `com.lucasm548.oneup`.

```sh
adb devices
adb -s TELEPHONE install -r android/app/build/outputs/apk/dev/debug/app-dev-debug.apk
adb -s MONTRE install -r android/wear/build/outputs/apk/dev/debug/wear-dev-debug.apk
```

Le débogage Wi-Fi de la montre permet également son installation via `adb pair`, puis `adb connect`. Utiliser les ports de jumelage et de connexion affichés par la montre ; ils sont distincts.

1. Ouvrir OneUp sur le téléphone, terminer l'onboarding et se connecter au compte habituel si nécessaire.
2. Garder le téléphone ouvert pour la première synchronisation.
3. Ouvrir OneUp sur la montre et toucher « Synchroniser » si son catalogue n'est pas encore arrivé.
4. Glisser horizontalement entre les pages d'exercices ; verticalement, ou avec la couronne, entre les catégories. Toucher un exercice pour son compteur individuel.
5. « Ma séance » permet de sélectionner les exercices dans l'ordre des touches, y compris dans plusieurs catégories. Le bouton lecture démarre la séance.
6. Dans une séance, le dernier exercice revient au premier dans les deux sens. Le drapeau ouvre la confirmation de fin ; la séance rejoint ensuite l'historique mobile.

Une séance démarrée sur le téléphone apparaît aussi sur la montre. L'accueil affiche six tuiles sur les grands cadrans et quatre sur les petits, pour préserver les libellés. L'interface native propose actuellement le français et l'anglais ; les noms d'exercices et de catégories suivent la langue du téléphone.

## Synchronisation et fonctionnement hors connexion

- `wear-shared` expose les chemins et transports de la Data Layer officielle Google Play Services.
- Le téléphone publie un instantané privé sur `/oneup/v1/snapshot`. Chaque version du catalogue possède un identifiant et conserve ses objectifs historiques pour importer une séance après reconnexion.
- La montre enregistre chaque action en SharedPreferences avant son émission : progression, début et fin de séance. Les opérations sont immuables et publiées sous `/oneup/v1/operations/<flux>/<séquence>`.
- Chaque compte possède un flux distinct. Les identifiants de compte transmis sont des empreintes propres à l'installation ; aucun jeton Firebase ou secret n'est envoyé.
- Le service Android du téléphone conserve les opérations entrantes même si l'interface est fermée. L'import dans Zustand et la synchronisation Firebase se font lorsque OneUp est ouvert ou revient au premier plan. La montre signale les actions en attente par un point ambré.
- Le téléphone enregistre la progression et son reçu ensemble avant de confirmer la livraison. Les répétitions sont ajoutées à la progression mobile courante, bornées à l'objectif ; les livraisons répétées ne les ajoutent pas une deuxième fois.
- Le changement de compte suspend les opérations de l'ancien compte et sépare les données locales de la montre. Elles pourront être importées en revenant au compte concerné.
- Les objectifs restent utilisables hors connexion jusqu'au prochain minuit du téléphone. Il faut ensuite rouvrir l'app mobile pour récupérer les objectifs du nouveau jour. Les actions déjà enregistrées restent conservées.
- Les chronomètres d'exercice créditent les secondes écoulées par lots de cinq et se mettent en pause en quittant l'app. Le repos se base sur une échéance persistée et reprend son affichage au retour. Il n'y a pas encore d'alarme de repos en arrière-plan ni de comptage par capteurs.

## Validation

```sh
npm test
npm run lint
npm run test:wear
```

Les tests JavaScript couvrent les doublons, l'ordre d'arrivée, les comptes, les anciens objectifs, les droits Pro et la persistance après échec disque. Les tests JVM Android couvrent les seuils des dix niveaux, la navigation circulaire, le journal hors connexion, les reçus et la séparation des comptes. Un test Robolectric parcourt l'accueil, la sélection et un panneau natif ; ses rendus sont dans `android/wear/build/test-previews/`.

Une validation sur une vraie paire téléphone/montre reste indispensable : première connexion, coupure Bluetooth, reprise après arrêt des apps, changement de compte, frontière de minuit et fin d'une séance pilotée depuis le téléphone.

## Distribution

La version mobile conserve son circuit de publication existant. La montre dispose d'une version indépendante (`wearVersionCode`, 1000001 par défaut), distincte de celle du téléphone. Avant chaque publication, choisir un code encore inutilisé dans la même fiche Google Play :

```sh
cd android
./gradlew :wear:bundleProdRelease -PwearVersionCode=1000001
```

Le bundle est produit dans `android/wear/build/outputs/bundle/prodRelease/`. La signature de production utilise le même `keystore.properties` que le téléphone. L'APK installé depuis Google Play doit avoir le même certificat de signature d'application que la version mobile ; une signature locale d'upload seule ne suffit pas à communiquer avec une app signée par Play App Signing.

L'envoi sur la piste Wear OS de Google Play est séparé et n'est pas automatisé par cette modification. Aucune publication n'est effectuée par les commandes de test ou de construction.

Références : [Data Layer et conditions de signature](https://developer.android.com/training/wearables/data/overview), [persistance du DataClient](https://developers.google.com/android/reference/com/google/android/gms/wearable/DataClient), [distribution et versions propres à Wear OS](https://developer.android.com/training/wearables/packaging).
