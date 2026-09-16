# Six API Styles on AKS — one deployment, one LoadBalancer

A hands-on demo of the six API styles from the slide, all served by a **single
Node.js container**, deployed to **Azure Kubernetes Service (AKS)** as one
`Deployment` and exposed through one `LoadBalancer` `Service`.

| # | API style | What the slide says | Endpoint (via LB) | Demonstrates |
|---|-----------|---------------------|-------------------|--------------|
| 1 | **REST**      | most widely used for web apps        | `GET/POST http://<IP>/api/rest/books` | Resources + HTTP verbs + status codes |
| 2 | **GraphQL**   | flexible data fetching               | `POST http://<IP>/graphql` (UI at `/graphql`) | Ask for exactly the fields you want |
| 3 | **WebSocket** | real-time communication              | `ws://<IP>/ws` | Full-duplex, server pushes live ticks |
| 4 | **gRPC**      | between microservices                | `<IP>:50051` `demo.Calculator` | HTTP/2 + Protobuf, unary + streaming |
| 5 | **SOAP**      | some enterprise systems              | `POST http://<IP>/soap` (WSDL `/soap?wsdl`) | XML envelopes + WSDL contract |
| 6 | **Webhooks**  | event-based notifications            | `POST http://<IP>/api/webhooks/*` | Server calls you when an event fires |

A browser dashboard at `http://<IP>/` lets you click through five of them
(gRPC needs a client — command provided).

---

## Architecture

```
                       ┌──────────────────────────────────────────┐
   Internet            │  AKS cluster (2 nodes)                    │
      │                │                                          │
      ▼                │   Deployment: api-styles-demo (2 pods)   │
 ┌──────────┐  :80     │   ┌────────────────────────────────┐     │
 │  Azure   │─────────►│   │ Node container                 │     │
 │  Load    │          │   │  :3000  REST /api/rest         │     │
 │ Balancer │  :50051  │   │         GraphQL /graphql       │     │
 │ (public  │─────────►│   │         WebSocket /ws          │     │
 │   IP)    │          │   │         SOAP /soap             │     │
 └──────────┘          │   │         Webhooks /api/webhooks │     │
                       │   │  :50051 gRPC demo.Calculator   │     │
                       │   └────────────────────────────────┘     │
                       └──────────────────────────────────────────┘
```

- HTTP-based protocols (REST, GraphQL, WebSocket, SOAP, Webhooks) share
  container port **3000** → Service port **80**.
- gRPC needs its own HTTP/2 listener on **50051** → Service port **50051**.
- WebSocket rides the same port 80 via the HTTP upgrade handshake; the Azure
  L4 Load Balancer passes it through unchanged.

---

## Prerequisites

- An Azure subscription
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az`)
- `kubectl` (installed by `az aks install-cli` if you don't have it)
- No local Docker needed — the image is built in the cloud with `az acr build`.

```bash
az login
az account set --subscription "<your-subscription-id>"
```

---

## Quickstart

```bash
# 1. Edit the ACR name to something globally unique
nano scripts/00-vars.sh        # set ACR_NAME

# 2. Create resource group + ACR + AKS cluster (~5-8 min)
./scripts/01-create-aks.sh

# 3. Build & push the image into ACR (no local Docker)
./scripts/02-build-push.sh

# 4. Deploy the Deployment + LoadBalancer, wait for public IP
./scripts/03-deploy.sh

# 5. Exercise all six APIs against the live IP
./scripts/04-test.sh

# 6. Tear everything down when finished (stops billing)
./scripts/05-cleanup.sh
```

Open `http://<PUBLIC_IP>/` in a browser for the interactive dashboard.

---

## Per-API demo (manual)

Set the IP first:

```bash
IP=$(kubectl get svc api-styles-demo-lb -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
```

### 1) REST
```bash
curl http://$IP/api/rest/books
curl -X POST http://$IP/api/rest/books -H 'Content-Type: application/json' \
  -d '{"title":"REST Book","author":"Demo"}'
```

### 2) GraphQL — same query, different field sets
```bash
curl -X POST http://$IP/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ books { title } }"}'
curl -X POST http://$IP/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ books { title author year } }"}'
```
Or open `http://$IP/graphql` for the GraphiQL IDE.

### 3) WebSocket
Open `http://$IP/` and watch the tick stream, or from a shell with Node:
```bash
cd app
node -e 'const W=require("ws");const s=new W("ws://'$IP'/ws");s.on("message",m=>console.log(m.toString()));s.on("open",()=>s.send("hi"))'
```

### 4) gRPC
```bash
cd app
node grpc-client.js $IP:50051
# or, if you have grpcurl:
grpcurl -plaintext -d '{"a":5,"b":7}' $IP:50051 demo.Calculator/Add
```

### 5) SOAP
```bash
curl http://$IP/soap?wsdl        # the WSDL contract
curl -X POST http://$IP/soap -H 'Content-Type: text/xml' \
  -H 'SOAPAction: http://example.com/calculator/Add' \
  --data-binary @scripts/soap-request.xml
```

### 6) Webhooks (end-to-end inside one pod)
Because there are 2 replicas and the receiver log is in-memory per pod, run
the loop inside a single pod so subscribe/trigger/log hit the same process:
```bash
POD=$(kubectl get pods -l app=api-styles-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$POD" -- node -e '
const b="http://localhost:3000";
(async()=>{
  const sub=await(await fetch(b+"/api/webhooks/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:b+"/api/webhooks/receiver"})})).json();
  console.log("subscribe:",JSON.stringify(sub));
  const trig=await(await fetch(b+"/api/webhooks/trigger",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"order.created",data:{orderId:42}})})).json();
  console.log("trigger:",JSON.stringify(trig));
  const log=await(await fetch(b+"/api/webhooks/receiver/log")).json();
  console.log("log:",JSON.stringify(log));
})();
'
```

---

## Run locally first (optional, no Azure)

```bash
cd app
npm install
npm start                 # http://localhost:3000
# in another terminal:
node grpc-client.js localhost:50051
```

---

## Project layout

```
api-styles-aks-demo/
├── app/
│   ├── server.js          # wires all protocols together
│   ├── rest.js            # REST CRUD
│   ├── graphql.js         # GraphQL schema + resolvers
│   ├── websocket.js       # WebSocket handler
│   ├── grpc-server.js     # gRPC service
│   ├── grpc-client.js     # gRPC test client
│   ├── soap.js            # SOAP service + WSDL
│   ├── webhooks.js        # subscribe / trigger / receiver
│   ├── proto/demo.proto   # gRPC contract
│   ├── public/index.html  # browser dashboard
│   └── package.json
├── Dockerfile
├── k8s/
│   ├── deployment.yaml    # 2 replicas, ports 3000 + 50051, probes
│   └── service.yaml       # LoadBalancer, ports 80 + 50051
└── scripts/
    ├── 00-vars.sh         # editable config
    ├── 01-create-aks.sh   # RG + ACR + AKS
    ├── 02-build-push.sh   # az acr build
    ├── 03-deploy.sh       # apply + wait for IP
    ├── 04-test.sh         # hit all six APIs
    ├── 05-cleanup.sh      # delete everything
    └── soap-request.xml
```

## Notes & production hardening

- This is a **demo**: gRPC and SOAP are unauthenticated/plaintext. For
  production, terminate TLS (e.g. an Ingress controller or `HTTP/2` with certs)
  and add authn/authz.
- Webhook subscribers and the receiver log are in-memory; a real system would
  persist subscriptions and use a queue with retries/signatures.
- For gRPC through an L7 ingress you'd need HTTP/2 support (NGINX ingress with
  `nginx.ingress.kubernetes.io/backend-protocol: GRPC`). The L4 `LoadBalancer`
  used here passes gRPC through without special config.
```
