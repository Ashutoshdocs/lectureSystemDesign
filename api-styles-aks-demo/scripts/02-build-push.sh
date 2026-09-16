#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/00-vars.sh

# `az acr build` builds the Docker image IN THE CLOUD and pushes it to ACR,
# so you do not need Docker installed locally.
echo ">> Building & pushing image to ACR: $IMAGE"
az acr build \
  --registry "$ACR_NAME" \
  --image "${IMAGE_NAME}:${IMAGE_TAG}" \
  --file Dockerfile \
  .

echo ">> Image available: $IMAGE"
echo ">> Next: scripts/03-deploy.sh"
