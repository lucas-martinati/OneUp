#!/bin/bash
# OneUp Component Reorganization Script (V1.27)
# Run this from the root of the project: ./scripts/reorganize.sh

echo "Création des dossiers thématiques..."
mkdir -p src/components/social
mkdir -p src/components/exercises
mkdir -p src/components/stats
mkdir -p src/components/settings
mkdir -p src/components/feedback
mkdir -p src/components/core
mkdir -p src/components/ui

echo "Déplacement vers social/"
git mv src/components/Leaderboard.jsx src/components/social/ || true
git mv src/components/ClanModal.jsx src/components/social/ || true
git mv src/components/ChallengeModal.jsx src/components/social/ || true
git mv src/components/NotificationManager.jsx src/components/social/ || true

echo "Déplacement vers exercises/"
git mv src/components/WorkoutSession.jsx src/components/exercises/ || true
git mv src/components/CustomExercisesModal.jsx src/components/exercises/ || true
git mv src/components/CustomProgramPanel.jsx src/components/exercises/ || true
git mv src/components/RoutineManager.jsx src/components/exercises/ || true
git mv src/components/Counter.jsx src/components/exercises/ || true
git mv src/components/Timer.jsx src/components/exercises/ || true

echo "Déplacement vers stats/"
git mv src/components/Stats.jsx src/components/stats/ || true
git mv src/components/Calendar.jsx src/components/stats/ || true

echo "Déplacement vers settings/"
git mv src/components/Settings.jsx src/components/settings/ || true
git mv src/components/CloudSyncPanel.jsx src/components/settings/ || true
git mv src/components/Onboarding.jsx src/components/settings/ || true

echo "Déplacement vers feedback/"
git mv src/components/Achievements.jsx src/components/feedback/ || true
git mv src/components/AchievementToast.jsx src/components/feedback/ || true
git mv src/components/CSSConfetti.jsx src/components/feedback/ || true

echo "Déplacement vers core/"
git mv src/components/ErrorBoundary.jsx src/components/core/ || true

echo "Déplacement de Avatar vers ui/"
git mv src/components/Avatar.jsx src/components/ui/ || true

echo "✅ Fichiers déplacés avec succès ! Ne relance pas encore l'app, les chemins d'imports vont être mis à jour."
