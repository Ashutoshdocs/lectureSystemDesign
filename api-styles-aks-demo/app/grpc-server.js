// ---------------------------------------------------------------------------
// gRPC  ->  "used between microservices"
// HTTP/2 + binary Protobuf. Contract-first (proto/demo.proto). Supports
// streaming. Runs on its own port (gRPC needs HTTP/2, so we keep it separate).
// ---------------------------------------------------------------------------
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDef = protoLoader.loadSync(path.join(__dirname, 'proto', 'demo.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const demoProto = grpc.loadPackageDefinition(packageDef).demo;

// Unary RPC
function add(call, callback) {
  const { a, b } = call.request;
  callback(null, { result: Number(a) + Number(b) });
}

// Server-streaming RPC
function generateNumbers(call) {
  const count = Number(call.request.count) || 5;
  let i = 0;
  const timer = setInterval(() => {
    if (i >= count) {
      clearInterval(timer);
      call.end();
      return;
    }
    call.write({ value: (i + 1) * 10 });
    i++;
  }, 300);
}

function startGrpcServer(port) {
  const server = new grpc.Server();
  server.addService(demoProto.Calculator.service, {
    Add: add,
    GenerateNumbers: generateNumbers,
  });
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.error('gRPC bind error:', err);
      return;
    }
    console.log(`gRPC server ready on port ${port} (demo.Calculator)`);
  });
}

module.exports = { startGrpcServer };
