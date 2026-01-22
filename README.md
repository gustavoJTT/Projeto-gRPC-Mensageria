# Order Service - gRPC + Mensageria

Sistema de pedidos com Python (backend) e Next.js/Angular (frontend).

## 🎯 O que faz

- Criar pedidos
- Processar de forma assíncrona
- Consultar status

## 📂 Estrutura

```
Projeto-gRPC-Mensageria/
├── backend/
│   ├── proto/order_service.proto
│   └── services/
│       ├── rest_api.py       # API Flask
│       ├── grpc_server.py    # Servidor gRPC
│       └── order_worker.py   # Worker RabbitMQ
└── frontend/                 # ⬜ FALTA FAZER
```

## 🚀 Como Rodar

### Opção 1: Docker (Recomendado) 🐳

```bash
docker-compose up
```

Pronto! Tudo rodando em:
- API REST: `http://localhost:8000`
- gRPC Server: `localhost:50051`
- RabbitMQ: `localhost:5672`

### Opção 2: Manual

```bash
# 1. RabbitMQ
docker run -d --name rabbitmq -p 5672:5672 rabbitmq:3

# 2. Configurar
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m grpc_tools.protoc -I./proto --python_out=./proto --grpc_python_out=./proto ./proto/order_service.proto

# 3. Executar (3 terminais)
python services/grpc_server.py
python services/order_worker.py
python services/rest_api.py
```

## 🧪 Testar

```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_name": "João", "items": ["Pizza"], "total": 45.90}'
```

## ⬜ Frontend (FALTA FAZER)

**2 páginas:**
1. Criar Pedido → `POST http://localhost:8000/api/orders`
2. Consultar Status → `GET http://localhost:8000/api/orders/:id`

**Exemplo:**
```javascript
const response = await fetch('http://localhost:8000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_name: 'Maria',
    items: ['Pizza'],
    total: 45.90
  })
});
const data = await response.json();
console.log(data.order_id);
```

## 📊 Fluxo

```
Frontend → API REST → gRPC → RabbitMQ → Worker
Status: RECEIVED → PROCESSING → PROCESSED
```
