from flask import Flask, request, jsonify
from flask_cors import CORS
import grpc
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'proto'))
import order_service_pb2
import order_service_pb2_grpc

app = Flask(__name__)
CORS(app)

def get_grpc_stub():
    grpc_host = os.getenv('GRPC_HOST', 'localhost')
    channel = grpc.insecure_channel(f'{grpc_host}:50051')
    return order_service_pb2_grpc.OrderServiceStub(channel)

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json

    if not data.get('customer_name') or not data.get('items') or not data.get('total'):
        return jsonify({
            'error': 'Campos obrigatórios: customer_name, items, total'
        }), 400

    try:
        stub = get_grpc_stub()
        response = stub.CreateOrder(
            order_service_pb2.CreateOrderRequest(
                customer_name=data['customer_name'],
                items=data['items'],
                total=data['total']
            )
        )

        return jsonify({
            'order_id': response.order_id,
            'status': response.status
        }), 201  # 201 = criado

    except grpc.RpcError as e:
        return jsonify({'error': str(e.details())}), 500

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order_status(order_id):
    print("CHEGUEI")
    try:
        stub = get_grpc_stub()
        response = stub.GetOrderStatus(
            order_service_pb2.GetOrderStatusRequest(order_id=order_id)
        )
        return jsonify({
            "order": {
                "id": response.order_id,
                "customer_name": response.customer_name,
                "items": list(response.items),
                "total": response.total,
                "status": response.status
            }
        }), 200

    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.NOT_FOUND:
            return jsonify({'error': 'Pedido não encontrado'}), 404
        return jsonify({'error': str(e.details())}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    print("API REST rodando na porta 8000...")
    app.run(host='0.0.0.0', port=8000, debug=True)
