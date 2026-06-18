<div align="center">
  <img src="./public/pwa-512x512.png" alt="OneUp Logo" width="50" style="border-radius: 10%;" />
  <h1>OneUp: Le Défi Fitness Ultime sur 365 Jours 🚀</h1>
  <p><b>Transformez votre corps et votre mental avec une progression jour après jour.</b></p>
</div>

**OneUp** n'est pas qu'une simple application de fitness. C'est un défi quotidien sur 365 jours conçu pour bâtir la discipline. Chaque jour, le nombre de répétitions de vos exercices augmente progressivement. L'objectif ? Ne jamais briser la chaîne et tenir toute l'année.

Avec un savant mélange de gamification, d'aspects sociaux (Clans) et de statistiques poussées, OneUp vous aide à devenir la meilleure version de vous-même.

Built with **Vibe Coding**.

---

## 🔥 Fonctionnalités Principales

### 🏋️‍♂️ Exercices Progressifs
- **Plusieurs Exercices au Poids du Corps** : Pompes, Squats, Tractions, Abdos, Jumping Jacks, Fentes, Burpees, Gainage (s), Dips, Mountain Climbers.
- **Le Concept** : Le nombre de répétitions augmente chaque jour pendant 365 jours selon un multiplicateur adapté à chaque exercice.
- **Exercices Lestés (Premium)** : Intégration d'exercices avec haltères et barres (Biceps Curl, Hammer Curl, Bench Press, Overhead Press, Squats, Deadlift, Barbell Row) pour aller encore plus loin.

### 🎮 Gamification & Motivation
- **Streak** : Maintenez votre flamme en vie ! Elle s'affiche fièrement sur votre Dashboard.
- **Système de Clans** : Ne souffrez pas seul. Créez ou rejoignez un clan, affrontez vos amis, et envoyez des "pokes" (notifications) aux membres de votre clan pour les motiver ! 

### 📊 Statistiques & Suivi (Data-Driven)
- **Tableau de Bord Complet** : Répétitions totales, exercice champion, meilleur jour, moyenne hebdomadaire, etc.
- **Calendrier Visuel** : Suivez votre régularité et votre taux de complétion d'un coup d'œil.
- **Suivi Avancé de la Performance** : Graphiques, répartition de l'effort et métriques approfondies pour ajuster vos entraînements.

## 📱 Installer l'Application

L'application est cross-platform (PWA / Android). Vous pouvez la télécharger directement depuis le Play Store :

[![Disponible sur Google Play](https://img.shields.io/badge/Google_Play-414141?style=for-the-badge&logo=google-play&logoColor=white)](https://play.google.com/store/apps/details?id=com.lucasm548.oneup&pcampaignid=web_share)

---

## 🛠 Technique & Architecture

OneUp mise sur une architecture moderne, fluide et sécurisée :

- **Front-end** : **React 19 + Vite** pour une UI ultra-réactive.
- **Mobile** : **Capacitor** pour un runtime natif fluide sur Android.
- **Interface & Design** : Design "Dark Premium" avec animations fluides, confettis CSS, UI adaptative en onglets sur mobile, et composants réalisés avec Tailwind CSS / Lucide React.
- **Backend & Données** : **Firebase Realtime Database** avec un système robuste de *Security Rules* granulaires (pour protéger les Clans, Profils et Données Premium).
- **Authentification** : Authentification Google via Firebase Auth.
- **Paiements** : Intégration RevenueCat renforcée par des webhooks serveur pour vérifier et sécuriser les abonnements.

---

## 🧑‍💻 Installation & Build (Pour les développeurs)

### Prérequis
- Node.js (v18+)
- Android SDK (pour le build via Capacitor)

### Démarrage Rapide

```bash
git clone https://github.com/LucasM548/OneUp.git
cd OneUp
npm install
npm run dev
```

### Commandes de Build

| Commande | Description |
|----------|-------------|
| `npm run build` | Build l'application web (dossier `dist/`) idéale pour l'hébergement PWA |
| `npm run build:bundle` | Génère un Android App Bundle (AAB) signé pour le Google Play Store |
| `npm run build:apk` | Génère un APK natif installable manuellement pour les tests Android |

*Note: Les APK se trouvent dans `android/app/build/outputs/apk/release/`.*

### Qualité du Code & Validation Cohérence 🛠️

Pour garantir la stabilité, la cohérence et la propreté de l'ensemble du projet, un script de validation globale est disponible :

```bash
npm run lint
```

Ce script regroupe et exécute séquentiellement **8 vérifications critiques** pour s'assurer que tout le code reste robuste et cohérent :
1. 🔍 **ESLint & SonarJS** : Analyse de la syntaxe JS/React et détection de code spaghetti, de complexité cognitive, ou de bugs potentiels.
2. ✂️ **Knip** : Identification des fichiers inutilisés, des exports morts et des dépendances orphelines.
3. 🌐 **check-i18n-keys** : Vérification de la correspondance entre les clés de traduction utilisées dans l'application et celles déclarées dans le fichier de référence `en.json`.
4. ⚖️ **check-i18n-consistency** : Contrôle de cohérence (structure, clés manquantes, doublons) entre toutes les langues gérées.
5. 🎨 **check-unused-css** : Scan et détection automatique des classes CSS inutilisées au sein de l'application.
6. 💅 **Stylelint** : Validation et uniformisation des styles CSS (bonnes pratiques et erreurs de syntaxe).
7. 🔄 **Dépendances circulaires (Madge)** : Détection et prévention des cycles d'importation dans les modules de l'application.
8. 👥 **Duplication de code (Jscpd)** : Analyse et détection de blocs de code en double (respect du principe DRY).

Un rapport visuel synthétique s'affiche à la fin, facilitant le diagnostic rapide.


### Configuration Cloud (Firebase)

Afin d'activer la synchronisation temps réel, l'authentification et les clans :
1. Créez un projet sur la console Firebase.
2. Activez Google Auth, Realtime Database et configurez vos [Règles de Sécurité](./database.rules.json).
3. Adaptez vos variables d'environnement dans le fichier `.env` (inspirez-vous du `.env example`).
4. Suivez le guide détaillé dans [`CLOUD_SETUP.md`](./CLOUD_SETUP.md).

---

## ✍️ Auteur

Conçu, développé et maintenu par **[Lucas Martinati](https://github.com/lucas-martinati)**.
N'hésitez pas à me suivre ou à me contacter pour toute question, idée ou retour !

## 🤝 Contribuer

Les contributions, issues, et pull requests sont les bienvenues. L'application évoluant rapidement (nouveaux exercices, optimisations UI, nouvelles features back-end), toute aide est appréciée :
1. **Fork** le repo
2. Créez une branche feature (`git checkout -b feature/AmazingIdea`)
3. Commitez vos ajouts (`git commit -m 'Add: feature AmazingIdea'`)
4. Poussez sur la branche (`git push origin feature/AmazingIdea`)
5. Ouvrez une **Pull Request** descriptives !

## 📄 Licence

Distribué sous la licence **MIT**. Vous êtes libre d'utiliser et modifier ce projet, à condition de citer explicitement l'auteur original (**Lucas Martinati**) dans toute copie ou modification. Voir [LICENSE](LICENSE) pour plus de détails.
