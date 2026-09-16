#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/00-vars.sh

echo ">> Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" -o table

echo ">> Creating Azure Container Registry ($ACR_NAME)..."
az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic -o table

echo ">> Creating AKS cluster ($CLUSTER_NAME) with 2 nodes, attaching ACR..."
az aks create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CLUSTER_NAME" \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --generate-ssh-keys \
  --attach-acr "$ACR_NAME" \
  -o table

echo ">> Fetching kubeconfig credentials..."
az aks get-credentials --resource-group "$RESOURCE_GROUP" --name "$CLUSTER_NAME" --overwrite-existing

echo ">> Nodes:"
kubectl get nodes
echo ">> Done. Next: scripts/02-build-push.sh"
