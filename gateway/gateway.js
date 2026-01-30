const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');

// Carregar proto
const possiblePaths = [
  path.join(__dirname, 'proto/order_service.proto'),
  path.join(__dirname, '../proto/order_service.proto'),
];

let PROTO_PATH;
for (const pathOption of possiblePaths) {
  if (fs.existsSync(pathOption)) {
    PROTO_PATH = pathOption;
    console.log(`✅ Proto encontrado em: ${PROTO_PATH}`);
    break;
  }
}

if (!PROTO_PATH) {
  console.error('❌ Arquivo proto não encontrado');
  process.exit(1);
}

// Carregar definição do proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const orderservice = grpcObject.orderservice;

// Cliente para conectar ao servidor backend
const backendHost = process.env.BACKEND_HOST || 'localhost';
const backendPort = process.env.BACKEND_PORT || '50051';

console.log(`🔗 Conectando ao backend gRPC em ${backendHost}:${backendPort}`);

const backendChannel = grpc.createChannel(
  `${backendHost}:${backendPort}`,
  grpc.ChannelCredentials.createInsecure()
);

const backendStub = new orderservice.OrderService(
  `${backendHost}:${backendPort}`,
  grpc.credentials.createInsecure()
);

// Implementar serviço OrderService que faz proxy
class GatewayOrderService {
  CreateOrder(call, callback) {
    console.log('📤 Gateway recebeu CreateOrder:', call.request);
    
    // Fazer proxy para o backend
    backendStub.CreateOrder(call.request, (err, response) => {
      if (err) {
        console.error('❌ Erro ao chamar backend:', err);
        callback(err);
      } else {
        console.log('✅ Resposta do backend:', response);
        callback(null, response);
      }
    });
  }

  GetOrderStatus(call, callback) {
    console.log('📥 Gateway recebeu GetOrderStatus:', call.request);
    
    // Fazer proxy para o backend
    backendStub.GetOrderStatus(call.request, (err, response) => {
      if (err) {
        console.error('❌ Erro ao chamar backend:', err);
        callback(err);
      } else {
        console.log('✅ Resposta do backend:', response);
        callback(null, response);
      }
    });
  }
}

// Criar servidor gRPC
function startGatewayServer() {
  const server = new grpc.Server();

  // Registrar o serviço
  server.addService(orderservice.OrderService.service, new GatewayOrderService());

  // Iniciar na porta 9090
  const port = process.env.GATEWAY_PORT || '9090';
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) {
      console.error('Erro ao iniciar servidor:', err);
      process.exit(1);
    }
    
    console.log(`\n🚀 Gateway gRPC iniciado na porta ${boundPort}`);
    console.log('📝 Serviços disponíveis:');
    console.log('   - OrderService.CreateOrder');
    console.log('   - OrderService.GetOrderStatus\n');
    
    server.start();
  });
}

startGatewayServer();
