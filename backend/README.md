# Backend Python - Order Service

## 📋 O que faz

- **gRPC Server** → Recebe e consulta pedidos
- **Worker** → Processa pedidos da fila
- **RabbitMQ** → Fila de mensagens

## 📁 Arquivos Essenciais

```
backend/
├── proto/
│   └── order_service.proto    # "Cardápio" - define a API
├── services/
│   ├── grpc_server.py         # "Garçom" - atende pedidos (77 linhas)
│   └── order_worker.py        # "Cozinha" - processa pedidos (42 linhas)
└── requirements.txt           # Bibliotecas necessárias (3 linhas)
```

## 🚀 Como Rodar

### 1. Instalar RabbitMQ

**Docker (mais fácil):**
```bash
docker run -d --name rabbitmq -p 5672:5672 rabbitmq:3
```

### 2. Configurar Python

```bash
cd backend

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar bibliotecas
pip install -r requirements.txt

# Gerar código a partir do .proto
python -m grpc_tools.protoc -I./proto --python_out=./proto --grpc_python_out=./proto ./proto/order_service.proto
```

### 3. Rodar os Serviços

**Terminal 1 - Servidor:**
```bash
python services/grpc_server.py
```

**Terminal 2 - Worker:**
```bash
python services/order_worker.py
```

## ✅ Pronto!

O servidor estará em `localhost:50051`

Status do pedido muda: `RECEIVED` → `PROCESSING` → `PROCESSED`
