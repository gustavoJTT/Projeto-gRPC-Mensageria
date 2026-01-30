'use client';

import { useState } from 'react';

interface Order {
  id: string;
  customer_name: string;
  items: string[];
  total: number;
  status: string;
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

  const API_URL = 'http://localhost:8000/api';

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: customerName,
          items: items.split(',').map(item => item.trim()),
          total: parseFloat(total),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pedido');
      }

      const data = await response.json();

      setSuccess(`Pedido criado com sucesso! ID: ${data.order_id}`);

      setCustomerName('');
      setItems('');
      setTotal('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrderDetails(null);

    try {
      const response = await fetch(`${API_URL}/orders/${searchOrderId}`);

      if (!response.ok) {
        throw new Error('Pedido não encontrado');
      }

      const data = await response.json();

      setOrderDetails({
        id: data.order.id,
        customer_name: data.order.customer_name,
        items: data.order.items,
        total: data.order.total,
        status: data.order.status,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'PROCESSED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Cabeçalho */}
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          Sistema de Pedidos
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          gRPC + RabbitMQ + REST API
        </p>

        {/* Grid com 2 colunas: Criar e Consultar */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* ===== COLUNA 1: CRIAR PEDIDO ===== */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
              Criar Novo Pedido
            </h2>

            <form onSubmit={handleCreateOrder} className="space-y-4">

              {/* Campo: Nome do Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="João Silva"
                  required
                />
              </div>

              {/* Campo: Itens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Itens (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Pizza, Refrigerante, Sobremesa"
                  required
                />
              </div>

              {/* Campo: Valor Total */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Total (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="89.90"
                  required
                />
              </div>

              {/* Botão Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando...' : 'Criar Pedido'}
              </button>
            </form>

            {/* Mensagem de Sucesso */}
            {success && (
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded-lg">
                {success}
              </div>
            )}
          </div>

          {/* ===== COLUNA 2: CONSULTAR PEDIDO ===== */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
              Consultar Pedido
            </h2>

            <form onSubmit={handleSearchOrder} className="space-y-4">

              {/* Campo: ID do Pedido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID do Pedido
                </label>
                <input
                  type="text"
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Cole o ID do pedido aqui"
                  required
                />
              </div>

              {/* Botão Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Buscando...' : 'Buscar Pedido'}
              </button>
            </form>

            {/* Mensagem de Erro */}
            {error && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Detalhes do Pedido (se encontrado) */}
            {orderDetails && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-white">
                  Detalhes do Pedido
                </h3>
                <div className="space-y-2 text-sm">

                  {/* ID */}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ID:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      {orderDetails.id}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {orderDetails.customer_name}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      R$ {orderDetails.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Status com cor */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        orderDetails.status
                      )}`}
                    >
                      {orderDetails.status}
                    </span>
                  </div>

                  {/* Lista de Itens */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-gray-600 dark:text-gray-400 block mb-1">Itens:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {orderDetails.items.map((item, index) => (
                        <li key={index} className="text-gray-800 dark:text-gray-200">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
