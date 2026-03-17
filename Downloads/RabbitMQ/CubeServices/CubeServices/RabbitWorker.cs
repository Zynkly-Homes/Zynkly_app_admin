using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;

namespace CubeServices
{
    public class RabbitWorker : BackgroundService
    {
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var factory = new ConnectionFactory()
            {
                HostName = "localhost"
            };

            var connection = await factory.CreateConnectionAsync();
            var channel = await connection.CreateChannelAsync();

            await channel.QueueDeclareAsync("square_queue", false, false, false);

            Console.WriteLine("CubeService running...");

            var consumer = new AsyncEventingBasicConsumer(channel);

            consumer.ReceivedAsync += async (sender, ea) =>
            {
                var number = int.Parse(Encoding.UTF8.GetString(ea.Body.ToArray()));
                int cube = number * number * number;

                var cubeMsg = $"cube:{cube}";
                var body = Encoding.UTF8.GetBytes(cubeMsg);

                var props = new BasicProperties();
                props.CorrelationId = ea.BasicProperties.CorrelationId;
                props.ReplyTo = ea.BasicProperties.ReplyTo;

                await channel.BasicPublishAsync(
                    exchange: "",
                    routingKey: ea.BasicProperties.ReplyTo,
                    mandatory: false,
                    basicProperties: props,
                    body: body);

                await Task.CompletedTask;
            };

            await channel.BasicConsumeAsync("square_queue", true, consumer);
        }
    }
}


//using Microsoft.AspNetCore.Connections;
//using RabbitMQ.Client;
//using RabbitMQ.Client.Events;
//using System.Text;

//namespace CubeServices
//{
//    public class RabbitWorker:BackgroundService
//    {
//        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//        {
//            var factory = new ConnectionFactory()
//            {
//                HostName = "localhost"
//            };

//            var connection = await factory.CreateConnectionAsync();
//            var channel = await connection.CreateChannelAsync();

//            // ensure queues exist
//            await channel.QueueDeclareAsync("square_queue", false, false, false);
//            await channel.QueueDeclareAsync("result_queue", false, false, false);

//            Console.WriteLine("CubeService waiting for messages...");

//            var consumer = new AsyncEventingBasicConsumer(channel);

//            consumer.ReceivedAsync += async (sender, ea) =>
//            {
//                var message = Encoding.UTF8.GetString(ea.Body.ToArray());

//                int number = int.Parse(message);
//                int cube = number * number * number;

//                Console.WriteLine($"Cube calculated: {cube}");

//                // copy correlation id
//                var props = new BasicProperties();
//                props.CorrelationId = ea.BasicProperties.CorrelationId;
//                props.ReplyTo = ea.BasicProperties.ReplyTo;

//                var body = Encoding.UTF8.GetBytes(cube.ToString());

//                // send result back to reply queue
//                await channel.BasicPublishAsync(
//                    exchange: "",
//                    routingKey: ea.BasicProperties.ReplyTo,
//                    mandatory: false,
//                    basicProperties: props,
//                    body: body);

//                await Task.CompletedTask;
//            };

//            await channel.BasicConsumeAsync(
//                queue: "square_queue",
//                autoAck: true,
//                consumer: consumer);
//        }
//    }
//}
