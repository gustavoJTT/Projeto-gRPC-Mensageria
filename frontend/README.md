# 🚀 Sistema de Pedidos - Frontend

## Como Funcionar

### Para rodar localmente (desenvolvimento):

1. Instale as dependências:
```bash
cd frontend
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse: http://localhost:3000

### Para rodar com Docker:

No diretório raiz do projeto:
```bash
docker-compose up --build
```

Acesse: http://localhost:8080

## 🏗️ Funcionalidades

- ✅ **Criar Pedidos**: Preencha o formulário com nome, itens e valor
- ✅ **Consultar Status**: Busque pedidos pelo ID e veja o status em tempo real
- ✅ **Interface Responsiva**: Funciona em desktop e mobile
- ✅ **Dark Mode**: Suporte automático ao tema escuro

## 🎨 Interface

O frontend possui duas seções principais:

1. **Criar Novo Pedido** (esquerda)
   - Nome do cliente
   - Itens (separados por vírgula)
   - Valor total

2. **Consultar Pedido** (direita)
   - Busca por ID
   - Visualização de detalhes
   - Status colorido (RECEIVED, PROCESSING, PROCESSED)
