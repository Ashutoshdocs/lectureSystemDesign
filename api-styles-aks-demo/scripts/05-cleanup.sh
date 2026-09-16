#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/00-vars.sh

echo ">> Deleting resource group '$RESOURCE_GROUP' (AKS + ACR + LB + public IP)..."
az group delete --name "$RESOURCE_GROUP" --yes --no-wait
echo ">> Deletion started in the background. Verify with: az group list -o table"
