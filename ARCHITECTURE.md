# Projeto gRPC - Sistema de Gerenciamento de Pedidos

## 📋 Visão Geral

Sistema de gerenciamento de pedidos baseado em **gRPC puro**, demonstrando comunicação entre duas linguagens diferentes:
- **Frontend**: TypeScript/React (porta 8080)
- **Gateway**: Node.js/JavaScript (porta 9090 - gRPC Server)
- **Backend**: Python (porta 50051 - gRPC Server)
- **Fila de Mensagens**: RabbitMQ (processamento assíncrono)
- **Cache**: Redis (persistência de pedidos)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                   CAMADA DE APRESENTAÇÃO                        │
│             Frontend (TypeScript/React - Next.js)               │
│                    Porta: 8080                                  │
│        Comunica com Gateway via gRPC-Web (JSON-RPC)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
           ┌────────────────────────────────────┐
           │    gRPC Channel (porta 9090)       │
           │    Serialização: Protocol Buffers  │
           └───────────────┬──────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE GATEWAY                            │
│          Gateway gRPC (Node.js - gRPC Server)                   │
│                    Porta: 9090                                  │
│      • Recebe requisições gRPC do Frontend                      │
│      • Faz proxy para o Backend gRPC Server                     │
│      • Implementa padrão de comunicação interserviços          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
           ┌────────────────────────────────────┐
           │    gRPC Channel (porta 50051)      │
           │    Serialização: Protocol Buffers  │
           └───────────────┬──────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE NEGÓCIO                            │
│           Backend gRPC (Python - gRPC Server)                   │
│                    Porta: 50051                                 │
│                                                                 │
│    OrderService:                                                │
│    ├─ CreateOrder(request) → response                           │
│    │  └─ Persiste em Redis + Publica em RabbitMQ              │
│    └─ GetOrderStatus(order_id) → response                       │
│       └─ Recupera status do Redis                               │
└─────────────────────────────────────────────────────────────────┘
          │                               │
          ▼                               ▼
  ┌────────────────┐            ┌────────────────┐
  │  Redis Cache   │            │   RabbitMQ     │
  │  Porta: 6379   │            │   Porta: 5672  │
  │                │            │                │
  │ Armazena:      │            │ Fila: orders   │
  │ order:{id}     │            │                │
  └────────────────┘            └────────────────┘
                                        │
                                        ▼
                                ┌──────────────────┐
                                │  Order Worker    │
                                │  (Python)        │
                                │                  │
                                │ Processa pedidos │
                                │ assincronamente  │
                                │                  │
                                │ Muda status:     │
                                │ RECEIVED →       │
                                │ PROCESSING →     │
                                │ PROCESSED        │
                                └──────────────────┘
```

---

## 🔄 Fluxo de Comunicação

### 1. **Criar Novo Pedido**

```
Frontend (TypeScript)
    ↓ (gRPC Call: CreateOrder)
    ├─ customer_name: string
    ├─ items: string[]
    └─ total: number
         ↓
Gateway (Node.js - gRPC Server)
    ↓ (Proxy gRPC)
    ↓
Backend (Python - gRPC Server)
    ├─ Gera UUID para order_id
    ├─ Persiste em Redis: order:{id} = JSON
    ├─ Publica mensagem em RabbitMQ (fila: orders)
    └─ Retorna CreateOrderResponse
         ↓
Gateway
    ↓
Frontend
    └─ Exibe: "Pedido criado com sucesso! ID: {id}"

         │ (Paralelo)
         ↓
Order Worker (Python)
    ├─ Consome mensagem de RabbitMQ
    ├─ Atualiza status para PROCESSING
    ├─ Simula processamento (30s)
    ├─ Atualiza status para PROCESSED
    └─ Confirma entrega da mensagem
```

### 2. **Consultar Status do Pedido**

```
Frontend (TypeScript)
    ↓ (gRPC Call: GetOrderStatus)
    └─ order_id: string
         ↓
Gateway (Node.js - gRPC Server)
    ↓ (Proxy gRPC)
    ↓
Backend (Python - gRPC Server)
    └─ Recupera de Redis: order:{id}
       └─ Retorna GetOrderStatusResponse
            ↓
Gateway
    ↓
Frontend
    └─ Exibe: {
         order_id,
         customer_name,
         items,
         total,
         status
       }
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Linguagem**: TypeScript
- **Comunicação**: gRPC Web (JSON-RPC)
- **Styling**: TailwindCSS

### Gateway
- **Runtime**: Node.js 20
- **Framework**: @grpc/grpc-js
- **Padrão**: gRPC Server (Proxy/Load Balancer)

### Backend
- **Linguagem**: Python 3.11
- **Framework gRPC**: grpcio + grpcio-tools
- **Message Queue**: pika (RabbitMQ)
- **Cache**: redis-py

### Infraestrutura
- **Orquestração**: Docker Compose
- **Message Broker**: RabbitMQ 3-management
- **Cache/Data Store**: Redis 7-alpine

---

## 📦 Protocol Buffers

### Definição (order_service.proto)

```protobuf
syntax = "proto3";

package orderservice;

service OrderService {
  rpc CreateOrder (CreateOrderRequest) returns (CreateOrderResponse);
  rpc GetOrderStatus (GetOrderStatusRequest) returns (GetOrderStatusResponse);
}

message CreateOrderRequest {
  string customer_name = 1;
  repeated string items = 2;
  double total = 3;
}

message CreateOrderResponse {
  string order_id = 1;
  string status = 2;
}

message GetOrderStatusRequest {
  string order_id = 1;
}

message GetOrderStatusResponse {
  string order_id = 1;
  string customer_name = 2;
  repeated string items = 3;
  double total = 4;
  string status = 5;
}
```

---

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- ou
- Python 3.11, Node.js 20 e Redis/RabbitMQ localmente

### Opção 1: Com Docker Compose

```bash
# Clone o repositório
cd Projeto-gRPC-Mensageria

# Inicie os serviços
docker compose up --build

# Acesse no navegador
# Frontend: http://localhost:8080
```

### Opção 2: Execução Local

```bash
# Terminal 1 - Redis
redis-server

# Terminal 2 - RabbitMQ
rabbitmq-server

# Terminal 3 - Backend gRPC Server
cd backend
pip install -r requirements.txt
python services/grpc_server.py

# Terminal 4 - Order Worker
cd backend
python services/order_worker.py

# Terminal 5 - Gateway gRPC
cd gateway
npm install
node gateway.js

# Terminal 6 - Frontend
cd frontend
npm install
npm run dev
# Acesse http://localhost:3000
```

---

## 📊 Estados do Pedido

| Estado | Descrição |
|--------|-----------|
| **RECEIVED** | Pedido recebido e armazenado |
| **PROCESSING** | Pedido sendo processado pelo worker |
| **PROCESSED** | Pedido processado com sucesso |

---

## 🔍 Monitoramento

### RabbitMQ Management
- URL: http://localhost:15672
- Usuário: guest
- Senha: guest

### Redis CLI
```bash
docker exec -it projeto-grpc-mensageria-redis-1 redis-cli
> KEYS order:*
> GET order:{id}
```

---

## ✨ Características Principais

✅ **gRPC Puro**: Toda comunicação interserviços usa gRPC  
✅ **Duas Linguagens**: Frontend (TypeScript) ↔ Backend (Python)  
✅ **Processamento Assíncrono**: RabbitMQ + Worker pattern  
✅ **Cache Distribuído**: Redis para persistência de estado  
✅ **Gateway Pattern**: Node.js como intermediário  
✅ **Protocol Buffers**: Serialização eficiente de dados  
✅ **Containerização**: Docker Compose para orquestração  

---

## 📝 Exemplos de Requisição

### Criar Pedido (Frontend → Gateway → Backend)

**Requisição gRPC:**
```json
{
  "customer_name": "João Silva",
  "items": ["Notebook", "Mouse", "Teclado"],
  "total": 3500.00
}
```

**Resposta:**
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RECEIVED"
}
```

### Consultar Status (Frontend → Gateway → Backend)

**Requisição gRPC:**
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Resposta:**
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_name": "João Silva",
  "items": ["Notebook", "Mouse", "Teclado"],
  "total": 3500.00,
  "status": "PROCESSED"
}
```

---

## 🧑‍💻 Estrutura de Arquivos

```
Projeto-gRPC-Mensageria/
├── frontend/                    # TypeScript/React App
│   ├── app/
│   │   ├── page.tsx            # Componente principal (gRPC client)
│   │   └── layout.tsx
│   └── package.json
│
├── gateway/                     # Node.js gRPC Server
│   ├── gateway.js              # Servidor gRPC (proxy)
│   ├── package.json
│   └── Dockerfile
│
├── backend/                     # Python gRPC Server
│   ├── services/
│   │   ├── grpc_server.py      # Servidor gRPC
│   │   └── order_worker.py     # Worker assíncrono
│   ├── proto/
│   │   └── order_service.proto
│   ├── requirements.txt
│   └── Dockerfile
│
├── proto/                       # Definições compartilhadas
│   └── order_service.proto
│
└── docker-compose.yml          # Orquestração de containers
```

---

## 🐛 Resolução de Problemas

### Gateway não conecta ao Backend
```bash
# Verificar logs do gateway
docker logs projeto-grpc-mensageria-grpc-gateway-1

# Verificar se backend está rodando
docker ps | grep grpc-server
```

### Redis não inicializa
```bash
# Limpar volumes
docker compose down -v

# Reiniciar
docker compose up --build
```

### Erro ao processar pedidos
```bash
# Verificar fila RabbitMQ
docker exec projeto-grpc-mensageria-rabbitmq-1 rabbitmqctl list_queues

# Verificar dados em Redis
docker exec projeto-grpc-mensageria-redis-1 redis-cli KEYS "*"
```

---

## 📚 Referências

- [gRPC Official Documentation](https://grpc.io)
- [Protocol Buffers Guide](https://developers.google.com/protocol-buffers)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [Redis Documentation](https://redis.io/documentation)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Desenvolvido com ❤️ usando gRPC e comunicação entre linguagens diferentes.**
