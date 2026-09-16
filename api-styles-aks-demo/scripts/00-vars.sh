#!/usr/bin/env bash
# Edit these, then `source scripts/00-vars.sh` (the other scripts source it too).

export RESOURCE_GROUP="api-styles-rg"
export LOCATION="eastus"
export CLUSTER_NAME="api-styles-aks"

# ACR name must be GLOBALLY UNIQUE, 5-50 lowercase alphanumerics (no dashes).
# Change this to something unique to you:
export ACR_NAME="apistylesacr$USER"

export IMAGE_NAME="api-styles-demo"
export IMAGE_TAG="v1"

# Derived (leave as-is)
export ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
export IMAGE="${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "Using:"
echo "  RESOURCE_GROUP = $RESOURCE_GROUP"
echo "  LOCATION       = $LOCATION"
echo "  CLUSTER_NAME   = $CLUSTER_NAME"
echo "  ACR_NAME       = $ACR_NAME"
echo "  IMAGE          = $IMAGE"
