import grpc
from concurrent import futures
import json
import uuid
import pika
import os
import redis
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'proto'))
import order_service_pb2
import order_service_pb2_grpc

redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_client = redis.Redis(host=redis_host, port=6379, decode_responses=True)


class OrderService(order_service_pb2_grpc.OrderServiceServicer):

    def CreateOrder(self, request, context):
        order_id = str(uuid.uuid4())
        order_data = {
            'customer_name': request.customer_name,
            'items': list(request.items),
            'total': request.total,
            'status': 'RECEIVED'
        }


        redis_client.set(f'order:{order_id}', json.dumps(order_data))

        self._publish_to_queue(order_id, request)

        return order_service_pb2.CreateOrderResponse(
            order_id=order_id,
            status='RECEIVED'
        )

    def GetOrderStatus(self, request, context):
        order_id = request.order_id

        order_json = redis_client.get(f'order:{order_id}')

        if not order_json:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('Pedido não encontrado')
            return order_service_pb2.GetOrderStatusResponse()

        order = json.loads(order_json)

        return order_service_pb2.GetOrderStatusResponse(
            order_id=order_id,
            customer_name=order['customer_name'],
            items=order['items'],
            total=order['total'],
            status=order['status']
        )

    def _publish_to_queue(self, order_id, request):
        try:
            rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(rabbitmq_host)
            )
            channel = connection.channel()

            channel.queue_declare(queue='orders', durable=True)

            message = json.dumps({
                'order_id': order_id,
                'customer_name': request.customer_name,
                'items': list(request.items),
                'total': request.total
            })

            channel.basic_publish(
                exchange='',           # Exchange padrão
                routing_key='orders',  # Nome da fila
                body=message           # Conteúdo da mensagem
            )

            connection.close()
            print(f"Enviado para fila: {order_id}")

        except Exception as e:
            print(f"Erro ao enviar para RabbitMQ: {e}")


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    order_service_pb2_grpc.add_OrderServiceServicer_to_server(
        OrderService(),
        server
    )

    server.add_insecure_port('[::]:50051')
    server.start()
    print("Servidor gRPC rodando na porta 50051...")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
