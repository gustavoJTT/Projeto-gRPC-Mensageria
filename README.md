# � Sistema de Gerenciamento de Pedidos - Arquitetura gRPC Puro

## 🎯 Objetivo do Projeto

Demonstrar uma arquitetura de sistema distribuído baseada em **gRPC** que estabelece comunicação entre **duas linguagens diferentes** (TypeScript/Node.js e Python), seguindo os requisitos:

✅ **Transmissão necessariamente com gRPC**  
✅ **Duas linguagens diferentes com comunicação entre elas**  
✅ **Demonstração de arquitetura**  

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Port 8080)                            │
│              TypeScript/React (Next.js v16)                         │
│         Cliente gRPC Web que consome API do Gateway                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
          ▼──── gRPC Channel (porta 9090) ────▼
                             │
┌─────────────────────────────────────────────────────────────────────┐
│                   GATEWAY gRPC (Port 9090)                          │
│               Node.js/JavaScript gRPC Server                        │
│     ✓ Recebe requisições gRPC do Frontend                           │
│     ✓ Faz proxy para Backend                                        │
│     ✓ Implementa comunicação interserviços                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
          ▼──── gRPC Channel (porta 50051) ────▼
                             │
┌─────────────────────────────────────────────────────────────────────┐
│                   BACKEND gRPC (Port 50051)                         │
│                Python gRPC Server                                   │
│         ✓ Implementa OrderService                                    │
│         ✓ Persiste dados em Redis                                   │
│         ✓ Publica eventos em RabbitMQ                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
          ▼──────────────────┼──────────────────▼
          │                  │
    ┌─────▼────┐        ┌────▼──────┐        ┌──────────────┐
    │   Redis  │        │ RabbitMQ  │        │   Worker     │
    │ (Cache)  │        │  (Fila)   │        │  (Async)     │
    └──────────┘        └────┬──────┘        └──────────────┘
                             │
                    Processa Pedidos
                    Status: RECEIVED → PROCESSING → PROCESSED
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Framework**: Next.js 16
- **Linguagem**: TypeScript 5
- **Comunicação**: gRPC Web
- **Styling**: TailwindCSS 4

### Gateway
- **Runtime**: Node.js 20 (LTS)
- **Framework**: @grpc/grpc-js
- **Padrão**: gRPC Server (Proxy)
- **Porta**: 9090

### Backend
- **Linguagem**: Python 3.11
- **Framework gRPC**: grpcio + grpcio-tools
- **Message Queue**: RabbitMQ (pika)
- **Cache**: Redis
- **Porta**: 50051

### Infraestrutura
- **Orquestração**: Docker Compose
- **Message Broker**: RabbitMQ 3
- **Cache Store**: Redis 7
                                                                     │               │
                                                                     └───────────────┘
```

## 🔄 Fluxo de Comunicação

### 1️⃣ Criar Pedido

1. **Frontend → REST API** (HTTP POST)
   - Usuário preenche formulário
   - Frontend envia JSON via `fetch()` para `http://localhost:8000/api/orders`

2. **REST API → gRPC Server** (gRPC)
   - Flask recebe JSON
   - Converte para mensagem Protobuf (`CreateOrderRequest`)
   - Chama método gRPC `CreateOrder()`

3. **gRPC Server → RabbitMQ** (Message Queue)
   - Gera UUID para o pedido
   - Salva em memória com status `RECEIVED`
   - Publica mensagem na fila `orders`
   - Retorna resposta ao cliente

4. **Worker** (Background Processing)
   - Consome mensagem da fila
   - Atualiza status para `PROCESSING`
   - Simula processamento (2 segundos)
   - Atualiza status para `PROCESSED`

### 2️⃣ Consultar Pedido

1. **Frontend → REST API** (HTTP GET)
   - Usuário fornece order_id
   - Frontend busca em `http://localhost:8000/api/orders/{order_id}`

2. **REST API → gRPC Server** (gRPC)
   - Flask converte para `GetOrderStatusRequest`
   - Chama método gRPC `GetOrderStatus()`

3. **gRPC Server → REST API** (gRPC Response)
   - Busca pedido na memória
   - Retorna detalhes completos (id, cliente, itens, total, status)

4. **REST API → Frontend** (HTTP Response)
   - Converte Protobuf para JSON
   - Frontend exibe informações com cores baseadas no status

## 🛠️ Tecnologias

### Backend
- **Python 3.x** - Linguagem principal
- **gRPC** - Comunicação de alta performance entre serviços
- **Protocol Buffers** - Serialização de dados
- **Flask** - REST API
- **Flask-CORS** - Habilita CORS para o frontend
- **RabbitMQ** - Fila de mensagens
- **Pika** - Cliente Python para RabbitMQ

### Frontend
- **Next.js 16** - Framework React com SSG
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Estilização
- **React Hooks** - Gerenciamento de estado

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **Nginx** - Servidor web para o frontend

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- Portas disponíveis: 5672, 15672, 50051, 8000, 8080

### Executar o Projeto Completo

```bash
# Clone o repositório
git clone <seu-repo>
cd Projeto-gRPC-Mensageria

# Inicie todos os serviços
docker-compose up --build

# Ou em background
docker-compose up -d --build
```

### Acessar os Serviços

- **Frontend**: http://localhost:8080
- **REST API**: http://localhost:8000/health
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **gRPC Server**: localhost:50051 (não tem interface web)

### Executar Apenas o Frontend (desenvolvimento)

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000

**Importante**: Certifique-se de que o backend está rodando (via Docker Compose) para que o frontend funcione corretamente.

## 📂 Estrutura

```
Projeto-gRPC-Mensageria/
├── backend/
│   ├── proto/order_service.proto
│   └── services/
│       ├── rest_api.py       # API Flask
│       ├── grpc_server.py    # Servidor gRPC
│       └── order_worker.py   # Worker RabbitMQ
└── frontend/
    ├── app/
    │   └── page.tsx          # Página principal
    ├── Dockerfile
    └── nginx.conf
```

## 📦 Estrutura de Dados

### Criar Pedido (Request)
```json
{
  "customer_name": "João Silva",
  "items": ["Pizza", "Refrigerante", "Sobremesa"],
  "total": 89.90
}
```

### Criar Pedido (Response)
```json
{
  "order_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "RECEIVED"
}
```

### Consultar Pedido (Response)
```json
{
  "order": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "customer_name": "João Silva",
    "items": ["Pizza", "Refrigerante", "Sobremesa"],
    "total": 89.90,
    "status": "PROCESSED"
  }
}
```

## 📊 Status dos Pedidos

- `RECEIVED` 🔵 - Pedido recebido e aguardando processamento
- `PROCESSING` 🟡 - Pedido sendo processado pelo worker
- `PROCESSED` 🟢 - Pedido concluído

## 🧪 Testar com cURL

### Criar pedido
```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "João Silva",
    "items": ["Pizza", "Refrigerante"],
    "total": 55.90
  }'
```

### Consultar pedido
```bash
curl http://localhost:8000/api/orders/{order_id}
```

## 🎯 Por que essa arquitetura?

### gRPC
- ✅ Comunicação binária (mais rápida que JSON)
- ✅ Type-safe com Protocol Buffers
- ✅ Streaming bidirecional
- ✅ Ideal para comunicação entre microserviços

### RabbitMQ
- ✅ Desacoplamento entre produtores e consumidores
- ✅ Processamento assíncrono
- ✅ Tolerância a falhas
- ✅ Escalabilidade horizontal

### REST API
- ✅ Interface amigável para clientes HTTP
- ✅ Facilita integração com frontend
- ✅ Simplicidade e familiaridade

## 📝 Logs e Monitoramento

### Ver logs dos containers
```bash
# Todos os logs
docker-compose logs -f

# Logs específicos
docker-compose logs -f grpc-server
docker-compose logs -f worker
docker-compose logs -f api
```

### RabbitMQ Management
Acesse http://localhost:15672
- Usuário: `guest`
- Senha: `guest`

Você pode monitorar:
- Mensagens na fila
- Taxa de processamento
- Conexões ativas

## 🔧 Desenvolvimento

### Compilar Protocol Buffers
```bash
cd backend
python -m grpc_tools.protoc \
  -I./proto \
  --python_out=./proto \
  --grpc_python_out=./proto \
  ./proto/order_service.proto
```

### Parar os serviços
```bash
docker-compose down

# Remover volumes também
docker-compose down -v
```
