// ---------------------------------------------------------------------------
// gRPC test client. Usage:
//   node grpc-client.js [host:port]
// Example (against AKS LoadBalancer):
//   node grpc-client.js 20.10.20.30:50051
// ---------------------------------------------------------------------------
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const target = process.argv[2] || 'localhost:50051';

const packageDef = protoLoader.loadSync(path.join(__dirname, 'proto', 'demo.proto'), {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const demoProto = grpc.loadPackageDefinition(packageDef).demo;
const client = new demoProto.Calculator(target, grpc.credentials.createInsecure());

console.log(`Calling gRPC server at ${target}`);

// 1) Unary
client.Add({ a: 5, b: 7 }, (err, res) => {
  if (err) return console.error('Add error:', err.message);
  console.log('[unary] Add(5, 7) =>', res.result);

  // 2) Server streaming
  console.log('[stream] GenerateNumbers(count=5):');
  const stream = client.GenerateNumbers({ count: 5 });
  stream.on('data', (d) => console.log('   received', d.value));
  stream.on('end', () => { console.log('   stream ended'); process.exit(0); });
  stream.on('error', (e) => { console.error('   stream error', e.message); process.exit(1); });
});
