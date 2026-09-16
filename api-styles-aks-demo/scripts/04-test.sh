#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

IP=$(kubectl get svc api-styles-demo-lb -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -z "$IP" ]; then echo "No LoadBalancer IP yet. Try: kubectl get svc api-styles-demo-lb -w"; exit 1; fi
echo "LoadBalancer IP: $IP"
echo "Dashboard in a browser: http://$IP/"
echo

echo "================ 1) REST ================"
echo "GET /api/rest/books"
curl -s "http://$IP/api/rest/books"; echo
echo "POST /api/rest/books"
curl -s -w "  [HTTP %{http_code}]\n" -X POST "http://$IP/api/rest/books" \
  -H 'Content-Type: application/json' -d '{"title":"REST Book","author":"Demo"}'

echo; echo "================ 2) GraphQL ================"
echo "Only { title }:"
curl -s -X POST "http://$IP/graphql" -H 'Content-Type: application/json' \
  -d '{"query":"{ books { title } }"}'; echo
echo "More fields { title author year }:"
curl -s -X POST "http://$IP/graphql" -H 'Content-Type: application/json' \
  -d '{"query":"{ books { title author year } }"}'; echo

echo; echo "================ 3) gRPC ================"
echo "(needs the node client from app/, or grpcurl)"
if command -v grpcurl >/dev/null 2>&1; then
  grpcurl -plaintext -d '{"a":5,"b":7}' "$IP:50051" demo.Calculator/Add
else
  echo "Run:  cd app && node grpc-client.js $IP:50051"
fi

echo; echo "================ 4) WebSocket ================"
echo "Open http://$IP/ in a browser, or:"
echo "  cd app && node -e 'const W=require(\"ws\");const s=new W(\"ws://$IP/ws\");s.on(\"message\",m=>console.log(m.toString()))'"

echo; echo "================ 5) SOAP ================"
echo "WSDL: http://$IP/soap?wsdl"
curl -s -X POST "http://$IP/soap" -H 'Content-Type: text/xml' \
  -H 'SOAPAction: http://example.com/calculator/Add' \
  -d '<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://example.com/calculator"><soap:Body><tns:AddRequest><a>5</a><b>7</b></tns:AddRequest></soap:Body></soap:Envelope>'; echo

echo; echo "================ 6) Webhooks ================"
echo "NOTE: replicas=2 keep the receiver log in-memory per pod. For a clean"
echo "      end-to-end log check, exec into one pod so subscribe+trigger+log"
echo "      all hit the same process:"
echo
POD=$(kubectl get pods -l app=api-styles-demo -o jsonpath='{.items[0].metadata.name}')
echo "Using pod: $POD"
kubectl exec "$POD" -- sh -c '
  curl -s -X POST localhost:3000/api/webhooks/subscribe -H "Content-Type: application/json" -d "{\"url\":\"http://localhost:3000/api/webhooks/receiver\"}"; echo;
  curl -s -X POST localhost:3000/api/webhooks/trigger  -H "Content-Type: application/json" -d "{\"type\":\"order.created\",\"data\":{\"orderId\":42}}"; echo;
  echo "--- receiver log ---";
  curl -s localhost:3000/api/webhooks/receiver/log; echo
'
echo
echo "All six API styles exercised."
