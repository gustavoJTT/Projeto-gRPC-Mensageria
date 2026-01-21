import pika
import json
import time
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from grpc_server import orders

def callback(ch, method, properties, body):
    order_data = json.loads(body)
    order_id = order_data['order_id']

    print(f"\nProcessando pedido: {order_id}")
    print(f"Cliente: {order_data['customer_name']}")

    # Atualiza status
    if order_id in orders:
        orders[order_id]['status'] = 'PROCESSING'

    # Simula processamento
    time.sleep(2)

    # Finaliza
    if order_id in orders:
        orders[order_id]['status'] = 'PROCESSED'
        print(f"Pedido {order_id} processado!\n")

    ch.basic_ack(delivery_tag=method.delivery_tag)

def start_worker():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()
    channel.queue_declare(queue='orders', durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='orders', on_message_callback=callback)

    print("Worker aguardando mensagens...")
    print("Pressione CTRL+C para sair\n")

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("\nEncerrando...")
        channel.stop_consuming()
        connection.close()

if __name__ == '__main__':
    start_worker()
