# OneUp Architecture & Conventions

Ce document décrit l'architecture du projet OneUp, l'organisation des fichiers et les conventions à respecter, en particulier pour les assistants de code (IA) et les nouveaux contributeurs.

## Structure Globale

L'application est structurée en utilisant une séparation stricte entre les pages (vues principales) et les composants réutilisables.

```text
/src
├── /pages          # Les vues principales de l'application (Dashboard, Settings, Stats)
├── /components     # Les composants réutilisables (UI, feedback, etc.)
├── /features       # Les fonctionnalités métier isolées (ex: événements, cardio)
├── /hooks          # Les hooks React globaux (useProgressStore, useCloudAutoSave...)
├── /contexts       # Les fournisseurs de contexte React (AuthContext, SubscriptionContext)
├── /store          # L'état global géré via Zustand
├── /utils          # Les fonctions utilitaires pures
├── /services       # L'intégration avec des API externes (ex: RevenueCat)
├── /config         # Les constantes de configuration (thèmes, catégories)
└── /styles         # Les variables globales (souvent gérées via index.css)
```

## Conventions de Dossiers

### 1. `/src/pages/`
Contient les composants de niveau page qui correspondent généralement à des routes ou aux écrans principaux de l'application. 
- **Règle d'or** : Si un composant est une vue complète (ex: `Dashboard.jsx`, `Settings.jsx`, `Stats.jsx`), il doit être placé ici.
- Les sous-composants *spécifiques* à une page (ex: `DashboardHeader.jsx`) doivent être placés dans `/src/pages/[PageName]/components/`.

### 2. `/src/components/`
Contient uniquement des composants transverses et réutilisables.
- `/components/ui/` : Les composants purement présentiels (Button, Card, Modal, Input).
- `/components/feedback/` : Les éléments de retour visuel (Toasts, Bannières, Confettis).
- `/components/social/` : Les éléments sociaux réutilisables (Profils, Leaderboards).
- **Règle d'or** : N'y placez pas de composants liés à une logique métier complexe ou spécifiques à un seul écran.

### 3. `/src/features/`
Contient des modules métier indépendants qui regroupent leurs propres composants, hooks et états.
- Exemple : `/src/features/announcements/`, `/src/features/cardio/`.

## Conventions de Code

- **Imports Absolus** : Utilisez les alias de chemins pour les imports hors du dossier courant :
  - `@pages/*` pour les vues principales
  - `@components/*` pour les composants réutilisables
  - `@hooks/*` pour les hooks
  - `@features/*` pour les modules métier
  - `@utils/*`, `@config/*`, `@store/*`, `@contexts/*`

> [!WARNING]
> **Attention aux imports de composants (`@components` vs `./components`)** :
> - Utilisez `@components/...` pour importer des composants globaux et réutilisables (qui se trouvent dans `/src/components/`).
> - Utilisez `./components/...` pour importer des sous-composants spécifiques et locaux à la page courante (qui se trouvent par exemple dans `/src/pages/Dashboard/components/`).
> Ne mélangez pas les deux !

- **Gestion de l'État** :
  - Utilisez **Zustand** (`/src/store/`) pour l'état global (progression, paramètres).
  - Utilisez **React Context** (`/src/contexts/`) pour les dépendances d'infrastructure (Auth, Subscriptions).
- **Tests** :
  - Les composants métier et logiques (hooks, utils) doivent avoir des tests associés.
  - La couverture de test ignore volontairement certains composants purement UI (voir `vite.config.js`).

## Instructions pour les IA (Agents de Code)

Si vous êtes une IA travaillant sur cette base de code :
1. **Cherchez avant de créer** : Avant de créer un composant UI (bouton, modale, carte), vérifiez toujours le dossier `/src/components/ui/`.
2. **Respectez l'architecture** : Si vous devez ajouter un nouvel écran complet, placez-le dans `/src/pages/`.
3. **Mettez à jour les alias** : Si vous déplacez des fichiers importants, assurez-vous de mettre à jour `jsconfig.paths.json` et `vite.config.js` (`coverage.exclude`).
4. **Utilisez les icônes existantes** : Importez les icônes depuis `@utils/icons` (qui enveloppe les icônes `lucide-react`) plutôt que de les importer directement.
