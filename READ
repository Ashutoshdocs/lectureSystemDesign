
===============================================================================
 SIX API STYLES ON AKS  -  WHAT THIS DEMO IS AND WHAT IT PROVES
===============================================================================

-------------------------------------------------------------------------------
1. THE ONE-LINE SUMMARY
-------------------------------------------------------------------------------
We take the six API styles from the slide (REST, GraphQL, WebSocket, gRPC,
SOAP, Webhooks), implement a small working example of each, put them ALL inside
one container, deploy that container to a Kubernetes cluster on Azure (AKS) as
a single Deployment, and expose it to the internet through a single
LoadBalancer Service. Then we call each API and watch it behave the way its
description on the slide says it should.

In short: the slide makes six claims. This demo turns each claim into
something you can actually run, hit with a request, and see respond.


-------------------------------------------------------------------------------
2. WHY THIS DEMO EXISTS (THE LEARNING GOAL)
-------------------------------------------------------------------------------
API "styles" are usually taught as bullet points on a slide. Bullet points are
easy to memorise and easy to forget, because they stay abstract. The gap this
demo closes is the gap between "I read that gRPC uses HTTP/2 and Protobuf" and
"I sent a gRPC call and got a binary response back over HTTP/2."

The demo is built to answer three questions for a learner:

  (a) WHAT is each style?        -> a running endpoint you can inspect.
  (b) WHEN would you pick it?    -> each example is shaped around the exact
                                    situation the slide names for that style.
  (c) HOW do they coexist?       -> they all run in one deployment, so you see
                                    that "API style" is a choice per use-case,
                                    not a whole-platform decision. One backend
                                    can, and often does, speak several.

Secondary goal: it doubles as a minimal but real AKS walkthrough - build an
image, push it to a registry, deploy it, expose it, and tear it down.


-------------------------------------------------------------------------------
3. THE CLAIM-BY-CLAIM PROOF
-------------------------------------------------------------------------------
The slide says one thing about each style. Here is the claim, what we built to
test it, and what you actually observe when you run it.

...............................................................................
 3.1  REST  -  "the most widely used API style for industry web applications"
...............................................................................
CLAIM:      REST is the default, general-purpose style for web APIs.
WHAT WE DO: A /api/rest/books resource with the standard HTTP verbs:
              GET  /api/rest/books        -> list
              GET  /api/rest/books/:id    -> one item
              POST /api/rest/books        -> create   (returns 201 Created)
              PUT  /api/rest/books/:id    -> update
              DELETE /api/rest/books/:id  -> delete   (returns 204 No Content)
WHAT IT PROVES:
    REST's whole model is "resources addressed by URLs, acted on by HTTP verbs,
    with HTTP status codes carrying the outcome." You SEE that model directly:
    the URL names the thing, the verb names the action, the status code (200 /
    201 / 204 / 404 / 400) reports what happened. This is exactly why REST is
    the common default - it maps cleanly onto plain HTTP and needs no extra
    machinery.


...............................................................................
 3.2  GraphQL  -  "used when clients need flexible data fetching"
...............................................................................
CLAIM:      GraphQL lets the client decide what data comes back.
WHAT WE DO: One endpoint, /graphql, with a schema of Book { id title author
            pages year }. We run the SAME resource through two different
            queries:
              { books { title } }
              { books { title author year } }
WHAT IT PROVES:
    The first query returns ONLY titles. The second returns titles, authors and
    years. Same endpoint, same data source, different response - because the
    CLIENT specified the fields. That is the flexible-fetching claim made
    visible: no over-fetching (getting fields you don't need) and no
    under-fetching (having to make a second call). Contrast with REST, where
    /books returns whatever the server decided to include. There is also a
    built-in IDE at /graphql so you can type queries and watch the shape of the
    response change.


...............................................................................
 3.3  WebSocket  -  "used for real-time communication"
...............................................................................
CLAIM:      WebSocket is for live, two-way, push-style communication.
WHAT WE DO: A /ws endpoint. On connect, the server immediately starts PUSHING a
            timestamped "tick" message every 2 seconds without being asked. You
            can also type a message and the server echoes it back instantly.
WHAT IT PROVES:
    Plain HTTP/REST is request-response: the client must ask before the server
    can answer. WebSocket keeps a single connection open in BOTH directions, so
    the server can send data on its own. The ticks arriving on their own, with
    no polling, is the proof - that is precisely what "real-time" needs (chat,
    live dashboards, notifications, multiplayer, price feeds). The echo shows
    the full-duplex nature: client->server and server->client on one socket.


...............................................................................
 3.4  gRPC  -  "used between microservices"
...............................................................................
CLAIM:      gRPC is the style for fast, strict service-to-service calls.
WHAT WE DO: A Calculator service defined in a .proto contract
            (proto/demo.proto), served on its own port 50051, with two RPCs:
              Add(a, b) -> result                (unary: one call, one reply)
              GenerateNumbers(count) -> stream    (server streams many replies)
            Called with a generated client: node grpc-client.js <IP>:50051
WHAT IT PROVES:
    Three things that make gRPC the microservice choice:
      1. CONTRACT-FIRST: the .proto file is the single source of truth. Both
         sides generate code from it, so the interface can't silently drift.
      2. HTTP/2 + BINARY PROTOBUF: smaller and faster on the wire than JSON
         text over HTTP/1.1 - it matters when services call each other
         constantly inside a cluster.
      3. STREAMING: GenerateNumbers returns a stream of values from a single
         call - something REST does not do natively. You watch 10, 20, 30, 40,
         50 arrive one at a time.
    It runs on a SEPARATE port because gRPC requires HTTP/2, which is why the
    LoadBalancer exposes 50051 in addition to 80.


...............................................................................
 3.5  SOAP  -  "used in some enterprise systems"
...............................................................................
CLAIM:      SOAP is the older, formal, XML-based enterprise style.
WHAT WE DO: A /soap endpoint with a real WSDL contract at /soap?wsdl and one
            operation, Add(a, b). You send a SOAP XML "envelope" and get a SOAP
            XML envelope back containing the result.
WHAT IT PROVES:
    SOAP shows what "formal and enterprise" actually looks like:
      - Every message is wrapped in a rigid XML <Envelope><Body>...</Body>.
      - The service is described by a WSDL - a machine-readable contract that
        tools can consume to auto-generate clients.
      - It is strongly typed and verbose compared to REST/JSON.
    Seeing the XML request go in and the XML response come out makes clear WHY
    it is described as "some enterprise systems": it is heavier and more
    ceremonious than REST, which is exactly why newer systems moved away from
    it, but its strict contracts are why banking / telecom / government / legacy
    integrations still run on it.


...............................................................................
 3.6  Webhooks  -  "used for event-based notifications"
...............................................................................
CLAIM:      Webhooks flip the direction: the server notifies you of events.
WHAT WE DO: Three endpoints that model the whole pattern:
              POST /api/webhooks/subscribe  -> register a URL to be notified
              POST /api/webhooks/trigger    -> an event happens
              POST /api/webhooks/receiver   -> a built-in listener (so the loop
                                               is self-contained)
              GET  /api/webhooks/receiver/log -> proof of delivery
WHAT IT PROVES:
    In REST/GraphQL/SOAP, YOU call the server. A webhook is the reverse: you
    give the server a URL, and when an event fires the SERVER calls YOU with an
    HTTP POST. When we subscribe the receiver, then trigger an event, the log
    shows the event payload arrived on its own. That is the event-driven model
    that powers "payment succeeded", "build finished", "PR merged", "new
    message" style notifications - no polling, the sender pushes.

    (Alternatives compared: WebSocket is real-time over a persistent OPEN
    connection between two parties; a webhook is a one-shot HTTP callback to a
    URL, ideal for occasional events between separate systems.)


-------------------------------------------------------------------------------
4. THE KUBERNETES / AKS PART - WHAT THAT PROVES
-------------------------------------------------------------------------------
Beyond the six APIs, the deployment itself demonstrates core Kubernetes ideas.

  DEPLOYMENT (k8s/deployment.yaml)
    - Runs the container with replicas: 2, so there are always two copies.
    - Declares BOTH ports the app listens on: 3000 (HTTP-family protocols) and
      50051 (gRPC).
    - Has readiness/liveness probes on /healthz, so Kubernetes only sends
      traffic to healthy pods and restarts unhealthy ones.
    - Sets CPU/memory requests and limits, so the scheduler can place it and it
      can't starve the node.
    PROVES: the "desired state" model - you declare what you want (2 healthy
    copies of this image) and Kubernetes keeps it true.

  LOADBALANCER SERVICE (k8s/service.yaml)
    - type: LoadBalancer makes Azure provision a real public IP + L4 load
      balancer automatically.
    - Exposes port 80  -> container 3000 (REST/GraphQL/WebSocket/SOAP/Webhooks)
      and port 50051    -> container 50051 (gRPC).
    - The selector app=api-styles-demo makes it spread traffic across BOTH pods.
    PROVES: how a cluster-internal app becomes reachable from the internet, and
    that one Service can front multiple ports/protocols.

  ONE CONTAINER, MANY PROTOCOLS
    - The HTTP-family styles share port 3000. WebSocket rides that same port via
      the HTTP "upgrade" handshake, and the Azure L4 load balancer passes it
      through untouched.
    - gRPC needs HTTP/2, so it gets its own port. That single design decision is
      why the Service lists two ports.
    PROVES: "which API style" is a per-endpoint decision. A single service can
    legitimately speak REST to browsers, gRPC to sibling services, and fire
    webhooks to third parties - all at once.


-------------------------------------------------------------------------------
5. ARCHITECTURE AT A GLANCE
-------------------------------------------------------------------------------

    Internet
       |
       |  http://<PUBLIC_IP>/...        (port 80)
       |  <PUBLIC_IP>:50051             (port 50051, gRPC)
       v
  +--------------------+
  |  Azure Load        |   public IP, provisioned automatically by the
  |  Balancer (L4)     |   LoadBalancer Service
  +--------------------+
       |
       v
  +-------------------------------------------------------------+
  |  AKS cluster                                                |
  |                                                             |
  |   Deployment: api-styles-demo   (2 identical pods)          |
  |   +-----------------------------------------------------+   |
  |   |  Node.js container                                  |   |
  |   |   port 3000 :  REST     /api/rest/books             |   |
  |   |               GraphQL  /graphql                     |   |
  |   |               WebSocket /ws                         |   |
  |   |               SOAP     /soap  (+ /soap?wsdl)        |   |
  |   |               Webhooks /api/webhooks/*              |   |
  |   |   port 50051:  gRPC     demo.Calculator             |   |
  |   +-----------------------------------------------------+   |
  +-------------------------------------------------------------+


-------------------------------------------------------------------------------
6. HOW TO RUN IT (SUMMARY)
-------------------------------------------------------------------------------
   1. Edit scripts/00-vars.sh   -> set a globally-unique ACR_NAME.
   2. ./scripts/01-create-aks.sh -> resource group + container registry + AKS.
   3. ./scripts/02-build-push.sh -> builds the image in the cloud (no local
                                    Docker) and pushes it to the registry.
   4. ./scripts/03-deploy.sh     -> applies the Deployment + Service, waits for
                                    the public IP.
   5. ./scripts/04-test.sh       -> calls all six APIs against the live IP.
   6. Open http://<PUBLIC_IP>/   -> the browser dashboard for five of them.
   7. ./scripts/05-cleanup.sh    -> deletes everything so billing stops.

   NOTE on the webhook test: the image is node:20-alpine, which has no `curl`.
   Run the in-pod webhook check with Node's built-in fetch instead:

     POD=$(kubectl get pods -l app=api-styles-demo -o jsonpath='{.items[0].metadata.name}')
     kubectl exec "$POD" -- node -e '
     const b="http://localhost:3000";
     (async()=>{
       await fetch(b+"/api/webhooks/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:b+"/api/webhooks/receiver"})});
       await fetch(b+"/api/webhooks/trigger",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"order.created"})});
       console.log(await (await fetch(b+"/api/webhooks/receiver/log")).text());
     })();'

   Doing subscribe + trigger + log inside ONE pod matters because the receiver
   log is kept in memory per pod and there are two replicas.


-------------------------------------------------------------------------------
7. WHAT A VIEWER SHOULD WALK AWAY UNDERSTANDING
-------------------------------------------------------------------------------
   - REST      = resources + HTTP verbs; the general-purpose default.
   - GraphQL   = client asks for exactly the fields it wants; flexible fetching.
   - WebSocket = one open connection, both directions; real-time push.
   - gRPC      = contract-first, HTTP/2, binary, streaming; fast service-to-
                 service calls.
   - SOAP      = rigid XML envelopes + WSDL contract; formal, legacy/enterprise.
   - Webhooks  = the server calls you when an event happens; event-driven.

   And architecturally: these are not competing "platforms" you must choose
   between once. They are tools. A single deployment behind a single load
   balancer can serve whichever style fits each specific need - which is exactly
   what real production systems do.

-------------------------------------------------------------------------------
8. HONEST LIMITATIONS (SO NO ONE IS MISLED)
-------------------------------------------------------------------------------
   - This is a teaching demo. gRPC and SOAP here are plaintext and
     unauthenticated; production would add TLS and auth.
   - Webhook subscriptions and the delivery log are in-memory; a real system
     would persist subscriptions and use a durable queue with retries and
     signed payloads.
   - The LoadBalancer is L4 (pass-through). Routing gRPC through an L7 ingress
     would need explicit HTTP/2 configuration.

===============================================================================
 END
===============================================================================
