import grpc
from concurrent import futures
import json
import uuid
import pika
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'proto'))
import order_service_pb2
import order_service_pb2_grpc

# Armazena pedidos em memória
orders = {}

class OrderService(order_service_pb2_grpc.OrderServiceServicer):

    def CreateOrder(self, request, context):
        # Cria o pedido
        order_id = str(uuid.uuid4())
        orders[order_id] = {
            'customer_name': request.customer_name,
            'items': list(request.items),
            'total': request.total,
            'status': 'RECEIVED'
        }

        print(f"Pedido criado: {order_id} - {request.customer_name}")

        # Envia para fila RabbitMQ
        try:
            rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
            connection = pika.BlockingConnection(pika.ConnectionParameters(rabbitmq_host))
            channel = connection.channel()
            channel.queue_declare(queue='orders', durable=True)

            message = json.dumps({
                'order_id': order_id,
                'customer_name': request.customer_name,
                'items': list(request.items),
                'total': request.total
            })

            channel.basic_publish(exchange='', routing_key='orders', body=message)
            connection.close()
            print(f"Enviado para fila: {order_id}")
        except Exception as e:
            print(f"Erro RabbitMQ: {e}")

        return order_service_pb2.CreateOrderResponse(
            order_id=order_id,
            status='RECEIVED'
        )

    def GetOrderStatus(self, request, context):
        order_id = request.order_id

        if order_id not in orders:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('Pedido não encontrado')
            return order_service_pb2.GetOrderStatusResponse()

        status = orders[order_id]['status']
        print(f"Status do pedido {order_id}: {status}")

        return order_service_pb2.GetOrderStatusResponse(
            order_id=order_id,
            status=status
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    order_service_pb2_grpc.add_OrderServiceServicer_to_server(OrderService(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("Servidor gRPC rodando na porta 50051...")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
