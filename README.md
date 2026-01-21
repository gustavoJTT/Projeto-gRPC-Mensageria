# Projeto Order Service - gRPC + Mensageria

Sistema de gerenciamento de pedidos com arquitetura baseada em gRPC e mensageria assíncrona usando RabbitMQ.

## 📋 Visão Geral

**Tecnologias:**
- Backend: Python + gRPC + RabbitMQ
- API: Next.js + Node.js gRPC Client
- Frontend: React/Next.js

**Arquitetura:**
- **Comunicação Síncrona**: gRPC para criação e consulta de pedidos
- **Processamento Assíncrono**: RabbitMQ para processar pedidos em background

## 🎯 Funcionalidades

- ✅ Criar pedidos (CreateOrder)
- ✅ Consultar status de pedidos (GetOrderStatus)
- ✅ Processamento assíncrono via fila
- ✅ Status tracking: RECEIVED → PROCESSING → PROCESSED/FAILED

## 📂 Estrutura do Projeto

```
Projeto-gRPC-Mensageria/
├── backend/              # Parte 1 - Backend Python (✅ IMPLEMENTADO)
│   ├── proto/           # Contrato gRPC
│   ├── services/        # Servidor gRPC + Worker
│   └── README.md        # Documentação detalhada
├── frontend/            # Parte 2 - API Next.js (🔜 A IMPLEMENTAR)
│   └── app/api/orders/  # API Routes
└── ui/                  # Parte 3 - UI + Infra (🔜 A IMPLEMENTAR)
    └── pages/           # Páginas React
```

## 👥 Divisão de Responsabilidades

### Parte 1 - Backend Python ✅
**Status**: CONCLUÍDA

**Responsável**: [Seu Nome]

**Componentes**:
- Arquivo `.proto` com definição do serviço OrderService
- Servidor gRPC em Python (porta 50051)
- Worker de processamento com RabbitMQ
- Scripts de geração de stubs

**Documentação**: [backend/README.md](backend/README.md)

---

### Parte 2 - API Next.js 🔜
**Status**: PENDENTE

**Responsável**: [Nome Colega 1]

**Componentes**:
- Client gRPC em Node.js
- API Routes Next.js:
  - `POST /api/orders` → CreateOrder
  - `GET /api/orders/:id` → GetOrderStatus
- Geração de stubs Node.js do .proto
- Configuração Next.js

**Entregas**:
- `/frontend/lib/grpc-client.js` - Client gRPC
- `/frontend/app/api/orders/route.ts` - API routes
- `/frontend/package.json` - Dependências
- `/frontend/README.md` - Documentação

---

### Parte 3 - Frontend UI + Infraestrutura 🔜
**Status**: PENDENTE

**Responsável**: [Nome Colega 2]

**Componentes**:
- Página "Criar Pedido" (formulário)
- Página "Consultar Status" (busca por ID)
- Docker Compose para RabbitMQ
- Configuração de ambiente
- Integração final

**Entregas**:
- `/ui/pages/criar-pedido.tsx`
- `/ui/pages/consultar-status.tsx`
- `docker-compose.yml` (raiz do projeto)
- Documentação de deploy

---

## 🚀 Como Rodar (Parte 1 - Backend)

### Pré-requisitos
- Python 3.8+
- RabbitMQ

### Instalação

```bash
# 1. Iniciar RabbitMQ (Docker)
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# 2. Configurar backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Gerar stubs gRPC
chmod +x generate_proto.sh
./generate_proto.sh

# 4. Executar servidor gRPC (Terminal 1)
python services/grpc_server.py

# 5. Executar worker (Terminal 2)
python services/order_worker.py
```

**Documentação completa**: [backend/README.md](backend/README.md)

## 📊 Modelo de Dados

### Order (Pedido)
```json
{
  "id": "uuid",
  "customer_name": "string",
  "items": ["string"],
  "total": "number",
  "status": "RECEIVED | PROCESSING | PROCESSED | FAILED"
}
```

## 🔌 API gRPC

### CreateOrder
```protobuf
rpc CreateOrder (CreateOrderRequest) returns (CreateOrderResponse)

CreateOrderRequest {
  string customer_name = 1;
  repeated string items = 2;
  double total = 3;
}

CreateOrderResponse {
  string order_id = 1;
  string status = 2;
}
```

### GetOrderStatus
```protobuf
rpc GetOrderStatus (GetOrderStatusRequest) returns (GetOrderStatusResponse)

GetOrderStatusRequest {
  string order_id = 1;
}

GetOrderStatusResponse {
  string order_id = 1;
  string status = 2;
}
```

## 🔄 Fluxo de Processamento

```
Cliente → gRPC Server → RabbitMQ Queue → Worker → Atualiza Status
   ↓           ↓
Retorna    Salva em
order_id   memória
```

## 📝 Próximas Etapas

- [ ] **Parte 2**: Implementar API Next.js com client gRPC
- [ ] **Parte 3**: Criar interface de usuário e configurar Docker
- [ ] Integração completa entre as 3 partes
- [ ] Testes end-to-end

## 📄 Licença

MIT

## 🤝 Contribuidores

- **Backend Python** - [Seu Nome]
- **API Next.js** - [Nome Colega 1]
- **Frontend + Infra** - [Nome Colega 2]
