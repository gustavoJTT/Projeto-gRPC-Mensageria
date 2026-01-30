#!/bin/bash

# Script de teste manual da arquitetura gRPC
# Demonstra a comunicação entre Frontend (TypeScript) → Gateway (Node.js) → Backend (Python)

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║         Sistema de Pedidos gRPC - Teste da Arquitetura            ║"
echo "║      Frontend (TypeScript) ↔ Gateway (Node.js) ↔ Backend (Python)  ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar pré-requisitos
echo -e "${BLUE}[1/6]${NC} Verificando pré-requisitos..."
echo "--------------------------------------------"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 não encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 encontrado${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js não encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js encontrado${NC}"

if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠ Redis CLI não encontrado (necessário para verificar dados)${NC}"
fi
echo ""

# Compilar proto
echo -e "${BLUE}[2/6]${NC} Compilando Protocol Buffers..."
echo "--------------------------------------------"
cd "$PROJECT_DIR/backend"
python3 -m grpc_tools.protoc \
    -I./proto \
    --python_out=./proto \
    --grpc_python_out=./proto \
    ./proto/order_service.proto
echo -e "${GREEN}✓ Proto compilado com sucesso${NC}"
echo ""

# Instalar dependências Python
echo -e "${BLUE}[3/6]${NC} Instalando dependências Python..."
echo "--------------------------------------------"
pip install -q grpcio grpcio-tools pika redis flask flask-cors 2>/dev/null || pip3 install -q grpcio grpcio-tools pika redis flask flask-cors
echo -e "${GREEN}✓ Dependências instaladas${NC}"
echo ""

# Instalar dependências Node.js
echo -e "${BLUE}[4/6]${NC} Instalando dependências Node.js..."
echo "--------------------------------------------"
cd "$PROJECT_DIR/gateway"
npm install --silent 2>/dev/null
echo -e "${GREEN}✓ Dependências instaladas${NC}"
echo ""

# Iniciar serviços
echo -e "${BLUE}[5/6]${NC} Iniciando serviços (em background)..."
echo "--------------------------------------------"

# Verificar se Redis está rodando
if ! redis-cli ping &> /dev/null; then
    echo -e "${YELLOW}⚠ Redis não está rodando. Iniciando...${NC}"
    redis-server --daemonize yes
    sleep 2
fi
echo -e "${GREEN}✓ Redis está disponível${NC}"

# Verificar se RabbitMQ está rodando
if ! (rabbitmqctl status &> /dev/null || rabbitmq-server &> /dev/null); then
    echo -e "${YELLOW}⚠ RabbitMQ não está rodando.${NC}"
    echo "   Execute em outro terminal: rabbitmq-server"
    echo ""
fi

echo ""
echo -e "${BLUE}[6/6]${NC} Status dos serviços..."
echo "--------------------------------------------"
echo ""
echo -e "${YELLOW}Inicie os serviços em terminais separados:${NC}"
echo ""
echo "Terminal 1 - Backend gRPC Server (Python):"
echo -e "${BLUE}cd $PROJECT_DIR/backend && python3 services/grpc_server.py${NC}"
echo ""
echo "Terminal 2 - Order Worker (Python):"
echo -e "${BLUE}cd $PROJECT_DIR/backend && python3 services/order_worker.py${NC}"
echo ""
echo "Terminal 3 - Gateway gRPC (Node.js):"
echo -e "${BLUE}cd $PROJECT_DIR/gateway && node gateway.js${NC}"
echo ""
echo "Terminal 4 - Frontend (Next.js):"
echo -e "${BLUE}cd $PROJECT_DIR/frontend && npm run dev${NC}"
echo ""
echo -e "${YELLOW}Após iniciar todos os serviços:${NC}"
echo -e "${GREEN}→ Acesse http://localhost:3000 (frontend dev)${NC}"
echo -e "${GREEN}→ Ou http://localhost:8080 (frontend com Docker)${NC}"
echo ""
echo "Arquitetura:"
echo ""
echo "  Frontend (TypeScript/React)"
echo "           ↓ (gRPC)"
echo "  Gateway gRPC (Node.js) - porta 9090"
echo "           ↓ (gRPC)"
echo "  Backend gRPC (Python) - porta 50051"
echo "           ↓"
echo "       ┌───┴───┐"
echo "       ↓       ↓"
echo "    Redis  RabbitMQ + Worker"
echo ""
