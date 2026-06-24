#!/usr/bin/env bash
# ─── set-secrets.sh ──────────────────────────────────────────────────────────
# Configure tous les secrets Firebase Cloud Functions depuis le fichier .env.
#
# Contourne le bug "Premature close" de node-fetch dans firebase-tools sur
# Node 22+ en appelant directement l'API Google Secret Manager via curl.
#
# Usage : bash scripts/set-secrets.sh
#         npm run secrets:set
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Résoudre le répertoire racine du projet ─────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT/.env"

# ─── ANSI Colors ─────────────────────────────────────────────────────────────
RESET='\033[0m'
BOLD='\033[1m'
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
CYAN='\033[36m'
WHITE='\033[37m'
GRAY='\033[90m'

# ─── Box drawing (même style que generate-config.js / run-all-lints.cjs) ─────
BOX_WIDTH=64
INNER=$((BOX_WIDTH - 2))
BAR=$(printf '═%.0s' $(seq 1 $INNER))

box_top()     { echo -e "${CYAN}╔${BAR}╗${RESET}"; }
box_bottom()  { echo -e "${CYAN}╚${BAR}╝${RESET}"; }
box_divider() { echo -e "${CYAN}╠${BAR}╣${RESET}"; }

# Affiche une ligne dans la boîte, paddée à INNER colonnes.
box_line() {
  local content="$1"
  local clean
  clean=$(echo -e "$content" | sed 's/\x1b\[[0-9;]*m//g')
  local vw=${#clean}
  local pad=$((INNER - 2 - vw))
  if [ "$pad" -lt 0 ]; then pad=0; fi
  printf "${CYAN}║${RESET} %b%*s ${CYAN}║${RESET}\n" "$content" "$pad" ""
}

# ─── .env parser ─────────────────────────────────────────────────────────────
get_env() {
  local key="$1"
  if [ ! -f "$ENV_FILE" ]; then
    return 1
  fi
  local val
  val=$(grep "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | tr -d '\r' | sed "s/^${key}=//g" | sed "s/^['\"]//;s/['\"]$//")
  echo "$val"
}

# ─── Vérification prérequis ─────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Fichier .env introuvable à la racine du projet ($ROOT).${RESET}" >&2
  exit 1
fi

if ! command -v curl &>/dev/null; then
  echo -e "${RED}❌ curl est requis mais introuvable.${RESET}" >&2
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo -e "${RED}❌ python3 est requis pour lire le token Firebase.${RESET}" >&2
  exit 1
fi

# ─── Récupérer le token d'accès Firebase ─────────────────────────────────────
FIREBASE_CONFIG="$HOME/.config/configstore/firebase-tools.json"

if [ ! -f "$FIREBASE_CONFIG" ]; then
  echo -e "${RED}❌ Configuration Firebase introuvable.${RESET}" >&2
  echo -e "${RED}   Lance d'abord : npx firebase login${RESET}" >&2
  exit 1
fi

# Extraire l'access token et le refresh token
read -r ACCESS_TOKEN REFRESH_TOKEN < <(python3 -c "
import json, sys
with open('$FIREBASE_CONFIG') as f:
    data = json.load(f)
tokens = data.get('tokens', {})
at = tokens.get('access_token', '')
rt = tokens.get('refresh_token', '')
print(at, rt)
")

if [ -z "$ACCESS_TOKEN" ] && [ -z "$REFRESH_TOKEN" ]; then
  echo -e "${RED}❌ Aucun token Firebase trouvé.${RESET}" >&2
  echo -e "${RED}   Lance d'abord : npx firebase login${RESET}" >&2
  exit 1
fi

# ─── Rafraîchir le token si nécessaire ───────────────────────────────────────
# Firebase CLI utilise le client OAuth bien connu de firebase-tools
FIREBASE_CLIENT_ID="563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com"
FIREBASE_CLIENT_SECRET="j9iVZfS8kkCEFUPaAeJV0sAi"

refresh_access_token() {
  local response
  response=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
    -d "client_id=${FIREBASE_CLIENT_ID}" \
    -d "client_secret=${FIREBASE_CLIENT_SECRET}" \
    -d "refresh_token=${REFRESH_TOKEN}" \
    -d "grant_type=refresh_token")

  local new_token
  new_token=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

  if [ -n "$new_token" ]; then
    ACCESS_TOKEN="$new_token"
    return 0
  fi
  return 1
}

# Teste si le token actuel est valide
test_token() {
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets?pageSize=1")
  [ "$status" = "200" ]
}

# ─── Variables ───────────────────────────────────────────────────────────────
PROJECT_ID=$(get_env "VITE_FIREBASE_PROJECT_ID")

# Si PROJECT_ID est vide, on arrête tout proprement
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ ERREUR : VITE_FIREBASE_PROJECT_ID est manquant dans le .env${RESET}" >&2
  exit 1
fi

SM_API="https://secretmanager.googleapis.com/v1"

# Liste des secrets à configurer
declare -a SECRET_NAMES=(
  "STRAVA_CLIENT_ID"
  "STRAVA_CLIENT_SECRET"
  "GOOGLE_HEALTH_CLIENT_ID"
  "GOOGLE_HEALTH_CLIENT_SECRET"
  "ADMIN_API_KEY"
)

# Mapping vers les clés .env (avec fallback VITE_ → sans VITE_)
get_secret_value() {
  local name="$1"
  local val=""
  case "$name" in
    STRAVA_CLIENT_ID)
      val=$(get_env "VITE_STRAVA_CLIENT_ID")
      [ -z "$val" ] && val=$(get_env "STRAVA_CLIENT_ID")
      ;;
    GOOGLE_HEALTH_CLIENT_ID)
      val=$(get_env "VITE_GOOGLE_HEALTH_CLIENT_ID")
      [ -z "$val" ] && val=$(get_env "GOOGLE_HEALTH_CLIENT_ID")
      ;;
    *)
      val=$(get_env "$name")
      ;;
  esac
  echo "$val"
}

# ─── Header ──────────────────────────────────────────────────────────────────
echo ""
box_top
box_line "${BOLD}${WHITE}🔐  CONFIGURATION DES SECRETS FIREBASE${RESET}"
box_line "${GRAY}Projet : ${WHITE}${PROJECT_ID}${RESET}"
box_line "${GRAY}Méthode : API Secret Manager (curl)${RESET}"
box_bottom
echo ""

# ─── Vérification / refresh du token ─────────────────────────────────────────
echo -e "  ${BLUE}▸${RESET}  Vérification du token d'accès..."

if ! test_token; then
  echo -e "  ${YELLOW}↻${RESET}  Token expiré, rafraîchissement..."
  if refresh_access_token; then
    echo -e "  ${GREEN}✓${RESET}  Token rafraîchi avec succès"
  else
    echo -e "${RED}❌ Impossible de rafraîchir le token. Relance : npx firebase login${RESET}" >&2
    exit 1
  fi
else
  echo -e "  ${GREEN}✓${RESET}  Token valide"
fi
echo ""

# ─── Fonction pour créer/mettre à jour un secret via l'API ───────────────────
# L'API Secret Manager fonctionne en deux étapes :
#   1. Créer le secret (si pas encore existant)
#   2. Ajouter une nouvelle version avec la valeur
set_secret() {
  local name="$1"
  local value="$2"

  # Étape 1 : Créer le secret s'il n'existe pas
  local check_status
  check_status=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${SM_API}/projects/${PROJECT_ID}/secrets/${name}")

  if [ "$check_status" = "404" ]; then
    # Le secret n'existe pas, on le crée
    local create_response
    create_response=$(curl -s -w "\n%{http_code}" \
      -X POST \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"replication\": {\"automatic\": {}}}" \
      "${SM_API}/projects/${PROJECT_ID}/secrets?secretId=${name}")

    local create_status
    create_status=$(echo "$create_response" | tail -1)

    if [ "$create_status" != "200" ]; then
      echo -e "  ${RED}✗${RESET}  Impossible de créer le secret ${BOLD}${name}${RESET}"
      echo "$create_response" | head -n -1 | head -3
      return 1
    fi
  elif [ "$check_status" != "200" ]; then
    echo -e "  ${RED}✗${RESET}  Erreur lors de la vérification du secret ${BOLD}${name}${RESET} (HTTP $check_status)"
    return 1
  fi

  # Étape 2 : Ajouter une nouvelle version avec la valeur en base64
  local b64_value
  b64_value=$(echo -n "$value" | openssl base64 -A)

  local add_response
  add_response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"payload\": {\"data\": \"${b64_value}\"}}" \
    "${SM_API}/projects/${PROJECT_ID}/secrets/${name}:addVersion")

  local add_status
  add_status=$(echo "$add_response" | tail -1)

  if [ "$add_status" = "200" ]; then
    return 0
  else
    echo "$add_response" | head -n -1 | head -3
    return 1
  fi
}

# ─── Envoi des secrets ───────────────────────────────────────────────────────
SUCCESS=0
SKIPPED=0
FAILED=0
TOTAL=0

for SECRET_NAME in "${SECRET_NAMES[@]}"; do
  VALUE=$(get_secret_value "$SECRET_NAME")

  if [ -z "$VALUE" ]; then
    echo -e "  ${YELLOW}⊘${RESET}  ${GRAY}${SECRET_NAME}${RESET} — ${YELLOW}absent du .env, ignoré${RESET}"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  TOTAL=$((TOTAL + 1))
  echo -e "  ${BLUE}▸${RESET}  Envoi de ${BOLD}${SECRET_NAME}${RESET}..."

  if set_secret "$SECRET_NAME" "$VALUE"; then
    SUCCESS=$((SUCCESS + 1))
    echo -e "  ${GREEN}✓${RESET}  ${SECRET_NAME} — ${GREEN}configuré${RESET}"
  else
    FAILED=$((FAILED + 1))
    echo -e "  ${RED}✗${RESET}  ${SECRET_NAME} — ${RED}échec${RESET}"
  fi

  echo ""
done

# ─── Résumé ──────────────────────────────────────────────────────────────────
echo ""
box_top
box_line "${BOLD}${WHITE}RÉSUMÉ${RESET}"
box_divider
box_line "${GREEN}✓ Configurés :  ${SUCCESS}${RESET}"
box_line "${RED}✗ Échoués :     ${FAILED}${RESET}"
box_line "${YELLOW}⊘ Ignorés :     ${SKIPPED}${RESET}"
box_divider

if [ "$FAILED" -eq 0 ] && [ "$TOTAL" -gt 0 ]; then
  box_line "${GREEN}${BOLD}✅ Tous les secrets ont été configurés avec succès !${RESET}"
elif [ "$TOTAL" -eq 0 ]; then
  box_line "${YELLOW}${BOLD}⚠  Aucun secret trouvé dans le .env${RESET}"
else
  box_line "${RED}${BOLD}❌ Certains secrets ont échoué. Vérifiez les erreurs ci-dessus.${RESET}"
fi

box_bottom
echo ""

# Code de sortie non-zéro si au moins un secret a échoué
[ "$FAILED" -eq 0 ]
