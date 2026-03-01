# OneUp

**OneUp** est un défi fitness quotidien sur 365 jours. Chaque jour, le nombre de répétitions augmente progressivement sur 6 exercices. L'objectif ? Tenir toute l'année.

Built with **Vibe Coding**.

## Features

- **6 exercices** : Pompes, Squats, Tractions, Abdos, Jumping Jacks, Fentes
- **Objectifs progressifs** : Le nombre de reps augmente chaque jour pendant 365 jours
- **Streak Duolingo-style** : Toujours visible, passe en gris si vous manquez un jour
- **Leaderboard** : Classement global et par exercice, profil joueur avec pseudo et photo Google
- **Statistiques completes** : Reps totales, exercice champion, meilleur jour, activite mensuelle, taux de completion, moyenne hebdomadaire
- **Calendrier visuel** : Suivez votre progression jour par jour sur l'annee
- **Cloud Sync** : Synchronisation via compte Google (Firebase Realtime Database)
- **Notifications** : Rappels quotidiens configurables
- **Design dark premium** : Animations, confettis, retour haptique, sons

## Installer l'app sur Android

OneUp est disponible en test ferme sur le Google Play Store. Pour l'installer :

1. **Rejoindre le groupe Google de test** : https://groups.google.com/g/close-test-oneup
2. **Devenir testeur** en cliquant sur ce lien : https://play.google.com/apps/testing/com.lucasm548.oneup
3. **Installer l'app** depuis le Google Play Store une fois accepte comme testeur

## Installation (Développeur)

### Prerequisites
- Node.js
- Android SDK (pour le build mobile)

### Setup

```bash
git clone https://github.com/LucasM548/OneUp.git
cd OneUp
npm install
```

### Lancer en local

```bash
npm run dev
```

### Commandes de build

Plusieurs commandes sont disponibles pour générer l'application :

| Commande | Description |
|----------|-------------|
| `npm run build` | Build web (dist/) pour PWA |
| `npm run build:bundle` | Build AAB (Android App Bundle) signé pour Play Store |
| `npm run build:apk` | Build APK (fichier directement installable) |

#### Exemple - Build APK pour tester :

```bash
npm run build:apk
```

L'APK se trouve dans `android/app/build/outputs/apk/release/`.

#### Exemple - Build Bundle pour Play Store :

```bash
npm run build:bundle
```

Le bundle se trouve dans `android/app/build/outputs/bundle/release/`.

### Cloud Sync Setup

Pour activer la synchronisation cloud :

1. Suivre le guide dans [`CLOUD_SETUP.md`](./CLOUD_SETUP.md)
2. Configurer Firebase et Realtime Database
3. Mettre à jour les credentials Firebase dans `.env`

### Deploy GitHub Pages

```bash
npm run deploy
```

## Built With

- **React 19 + Vite** - Framework web
- **Capacitor** - Runtime natif cross-platform
- **Firebase Realtime Database** - Cloud sync et authentification Google
- **Recharts** - Graphiques (pie chart statistiques)
- **Lucide React** - Icones
- **Canvas Confetti** - Effets de celebration
