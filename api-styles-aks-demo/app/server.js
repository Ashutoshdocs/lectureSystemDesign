// ===========================================================================
// One container, six API styles (from the slide):
//   REST       -> /api/rest/books        (HTTP verbs + status codes)
//   GraphQL    -> /graphql               (flexible data fetching + GraphiQL UI)
//   WebSocket  -> /ws                     (real-time, full-duplex)
//   gRPC       -> :50051  demo.Calculator (microservice contract, HTTP/2)
//   SOAP       -> /soap  (+ /soap?wsdl)  (XML envelopes, enterprise)
//   Webhooks   -> /api/webhooks/*        (event-based notifications)
//
// HTTP-based protocols share port 3000. gRPC needs its own HTTP/2 port 50051.
// NOTE: express.json() is applied per-router (REST + webhooks), NOT globally,
//       so it does not swallow the request body that GraphQL Yoga needs.
// ===========================================================================
const express = require('express');
const http = require('http');
const path = require('path');
const { createYoga } = require('graphql-yoga');
const { WebSocketServer } = require('ws');
const soap = require('soap');

const restRouter = require('./rest');
const webhookRouter = require('./webhooks');
const schema = require('./graphql');
const { setupWebSocket } = require('./websocket');
const { startGrpcServer } = require('./grpc-server');
const { service: soapService, wsdl: soapWsdl } = require('./soap');

const HTTP_PORT = process.env.HTTP_PORT || 3000;
const GRPC_PORT = process.env.GRPC_PORT || 50051;

const app = express();

// Health / readiness endpoint for Kubernetes probes.
app.get('/healthz', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Static dashboard (browser demo for REST / GraphQL / WebSocket / SOAP / Webhooks).
app.use(express.static(path.join(__dirname, 'public')));

// REST
app.use('/api/rest', restRouter);

// GraphQL (Yoga serves GraphiQL UI at GET /graphql)
const yoga = createYoga({ schema, graphqlEndpoint: '/graphql' });
app.use(yoga.graphqlEndpoint, yoga);

// Webhooks
app.use('/api/webhooks', webhookRouter);

// SOAP (registers a route on the express app; WSDL at /soap?wsdl)
soap.listen(app, '/soap', soapService, soapWsdl);

// Create the HTTP server AFTER routes are mounted; attach WebSocket to it.
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

server.listen(HTTP_PORT, () => {
  console.log('==========================================================');
  console.log(`HTTP server (REST/GraphQL/SOAP/Webhooks/WS) on :${HTTP_PORT}`);
  console.log(`  REST      GET  /api/rest/books`);
  console.log(`  GraphQL   POST /graphql   (UI at GET /graphql)`);
  console.log(`  WebSocket      /ws`);
  console.log(`  SOAP      POST /soap      (WSDL at /soap?wsdl)`);
  console.log(`  Webhooks  POST /api/webhooks/{subscribe,trigger}`);
  console.log(`  Dashboard GET  /`);
  console.log('==========================================================');
});

// gRPC on its own HTTP/2 port
startGrpcServer(GRPC_PORT);
