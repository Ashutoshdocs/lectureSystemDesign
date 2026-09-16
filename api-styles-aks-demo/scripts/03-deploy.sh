#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/00-vars.sh

echo ">> Applying Deployment (image = $IMAGE)..."
# sed injects $IMAGE into the deployment manifest's image field.
sed "s|__IMAGE__|${IMAGE}|g" k8s/deployment.yaml | kubectl apply -f -

echo ">> Applying LoadBalancer Service..."
kubectl apply -f k8s/service.yaml

echo ">> Waiting for rollout..."
kubectl rollout status deployment/api-styles-demo --timeout=120s

echo ">> Waiting for the LoadBalancer public IP (can take 1-3 min)..."
for i in $(seq 1 40); do
  IP=$(kubectl get svc api-styles-demo-lb -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
  [ -n "${IP:-}" ] && break
  sleep 6
done

echo
kubectl get deploy,pods,svc -l app=api-styles-demo
echo
if [ -n "${IP:-}" ]; then
  echo ">> Public IP: $IP"
  echo ">> Dashboard: http://$IP/"
  echo ">> Now run:  scripts/04-test.sh"
else
  echo ">> IP not ready yet. Check with: kubectl get svc api-styles-demo-lb -w"
fi
