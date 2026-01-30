'use client';

import { useState, useCallback } from 'react';

interface Order {
  id: string;
  customer_name: string;
  items: string[];
  total: number;
  status: string;
}

// Client gRPC Web stub
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:9090';

// Função para chamar gRPC via fetch (gRPC Web)
async function callGrpcService(methodName: string, request: any) {
  try {
    console.log(`📤 Chamando ${methodName}:`, request);

    // Usar base64 para transmitir dados binários
    const response = await fetch(`${GATEWAY_URL}/${methodName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/grpc-web+proto',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`gRPC error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`📥 Resposta:`, data);
    return data;
  } catch (error) {
    console.error(`❌ Erro:`, error);
    throw error;
  }
}

export default function Home() {
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState('');
  const [total, setTotal] = useState('');

  const [searchOrderId, setSearchOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await callGrpcService('orderservice.OrderService/CreateOrder', {
        customer_name: customerName,
        items: items.split(',').map(item => item.trim()),
        total: parseFloat(total),
      });

      setSuccess(`✅ Pedido criado! ID: ${response.order_id}`);
      setCustomerName('');
      setItems('');
      setTotal('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [customerName, items, total]);

  const handleGetOrderStatus = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await callGrpcService('orderservice.OrderService/GetOrderStatus', {
        order_id: searchOrderId,
      });

      setOrderDetails({
        id: response.order_id,
        customer_name: response.customer_name,
        items: response.items || [],
        total: response.total,
        status: response.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setOrderDetails(null);
    } finally {
      setLoading(false);
    }
  }, [searchOrderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📦 Sistema de Pedidos gRPC</h1>
          <p className="text-gray-600">Arquitetura com gRPC puro - Frontend (TypeScript) ↔ Gateway (Node.js) ↔ Backend (Python)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Criar Pedido */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">➕ Criar Novo Pedido</h2>
            
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Itens (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  placeholder="Ex: Notebook, Mouse, Teclado"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Total
                </label>
                <input
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="Ex: 1500.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? '⏳ Enviando...' : '📤 Criar Pedido'}
              </button>
            </form>
          </div>

          {/* Form Consultar Pedido */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔍 Consultar Pedido</h2>
            
            <form onSubmit={handleGetOrderStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Pedido
                </label>
                <input
                  type="text"
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  placeholder="Cole o ID do pedido aqui"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? '⏳ Buscando...' : '🔎 Consultar Status'}
              </button>
            </form>

            {/* Detalhes do Pedido */}
            {orderDetails && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalhes do Pedido</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">ID:</span> {orderDetails.id}</p>
                  <p><span className="font-medium">Cliente:</span> {orderDetails.customer_name}</p>
                  <p><span className="font-medium">Itens:</span> {orderDetails.items.join(', ')}</p>
                  <p><span className="font-medium">Total:</span> R$ {orderDetails.total.toFixed(2)}</p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      orderDetails.status === 'RECEIVED' ? 'bg-yellow-100 text-yellow-800' :
                      orderDetails.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {orderDetails.status}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mensagens */}
        {success && (
          <div className="mt-8 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Arquitetura */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🏗️ Arquitetura do Sistema</h2>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <pre className="overflow-x-auto">
{`
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (TypeScript/React)                 │
│                  Comunica via gRPC-Web                       │
└────────────────────────────────────────────────────────────┬─┘
                                                               │
                                                               ▼
                    🔄 gRPC Channel (porta 9090)
                                                               │
                                                               ▼
┌─────────────────────────────────────────────────────────────┐
│             GATEWAY (Node.js - gRPC Server)                  │
│      Faz proxy gRPC para o Backend + Load Balancing         │
└────────────────────────────────────────────────────────────┬─┘
                                                               │
                                                               ▼
                    🔄 gRPC Channel (porta 50051)
                                                               │
                                                               ▼
┌─────────────────────────────────────────────────────────────┐
│           BACKEND (Python - gRPC Server)                     │
│  OrderService com persistência em Redis + fila RabbitMQ     │
├─────────────────────────────────────────────────────────────┤
│  - CreateOrder: Cria pedido → publica em fila               │
│  - GetOrderStatus: Consulta status em Redis                 │
│  - Order Worker: Processa pedidos de forma assíncrona       │
└─────────────────────────────────────────────────────────────┘
`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
