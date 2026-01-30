import pika
import json
import time
import os
import redis

redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_client = redis.Redis(host=redis_host, port=6379, decode_responses=True)


def callback(ch, method, properties, body):
    order_data = json.loads(body)
    order_id = order_data['order_id']

    order_json = redis_client.get(f'order:{order_id}')

    if not order_json:
        print(f"Pedido {order_id} não encontrado no Redis\n")
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    order = json.loads(order_json)

    order['status'] = 'PROCESSING'
    redis_client.set(f'order:{order_id}', json.dumps(order))
    print(f"Status: PROCESSING")

    time.sleep(30)

    order['status'] = 'PROCESSED'
    redis_client.set(f'order:{order_id}', json.dumps(order))
    print(f"Status: PROCESSED")

    ch.basic_ack(delivery_tag=method.delivery_tag)


def start_worker():
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')

    max_retries = 10
    retry_delay = 3

    for attempt in range(max_retries):
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(rabbitmq_host)
            )
            channel = connection.channel()
            channel.queue_declare(queue='orders', durable=True)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue='orders',
                on_message_callback=callback
            )

            channel.start_consuming()
            break

        except pika.exceptions.AMQPConnectionError:
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise

        except KeyboardInterrupt:
            try:
                channel.stop_consuming()
                connection.close()
            except:
                pass
            break

if __name__ == '__main__':
    start_worker()
