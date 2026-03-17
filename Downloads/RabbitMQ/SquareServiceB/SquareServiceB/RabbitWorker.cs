using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;

namespace SquareServiceB
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

            await channel.QueueDeclareAsync("number_queue", false, false, false);
            await channel.QueueDeclareAsync("square_queue", false, false, false);

            Console.WriteLine("SquareService running...");

            var consumer = new AsyncEventingBasicConsumer(channel);

            consumer.ReceivedAsync += async (sender, ea) =>
            {
                var number = int.Parse(Encoding.UTF8.GetString(ea.Body.ToArray()));
                int square = number * number;

                // 🔹 send square result
                var squareMsg = $"square:{square}";
                var squareBody = Encoding.UTF8.GetBytes(squareMsg);

                var props = new BasicProperties();
                props.CorrelationId = ea.BasicProperties.CorrelationId;
                props.ReplyTo = ea.BasicProperties.ReplyTo;

                await channel.BasicPublishAsync(
                    exchange: "",
                    routingKey: ea.BasicProperties.ReplyTo,
                    mandatory: false,
                    basicProperties: props,
                    body: squareBody);

                // 🔹 send number to cube service
                var numberBody = Encoding.UTF8.GetBytes(number.ToString());

                await channel.BasicPublishAsync(
                    exchange: "",
                    routingKey: "square_queue",
                    mandatory: false,
                    basicProperties: props,
                    body: numberBody);

                await Task.CompletedTask;
            };

            await channel.BasicConsumeAsync("number_queue", true, consumer);
        }
    }
}










//using RabbitMQ.Client;
//using RabbitMQ.Client.Events;
//using System.Text;

//namespace SquareServiceB;

////public class RabbitWorker:BackgroundService
////{
////    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
////    {
////        var factory = new ConnectionFactory()
////        {
////            HostName = "localhost"
////        };

////        var connection = await factory.CreateConnectionAsync();
////        var channel = await connection.CreateChannelAsync();

////        await channel.QueueDeclareAsync(
////            queue: "number_queue",
////            durable: false,
////            exclusive: false,
////            autoDelete: false,
////            arguments: null);

////        await channel.QueueDeclareAsync(
////            queue: "square_queue",
////            durable: false,
////            exclusive: false,
////            autoDelete: false,
////            arguments: null);

////        Console.WriteLine("SquareService waiting for messages...");

////        var consumer = new AsyncEventingBasicConsumer(channel);

////        consumer.ReceivedAsync += async (sender, ea) =>
////        {
////            var body = ea.Body.ToArray();
////            var message = Encoding.UTF8.GetString(body);

////            int number = int.Parse(message);
////            int square = number * number;

////            Console.WriteLine($"Square calculated: {square}");

////            var newBody = Encoding.UTF8.GetBytes(square.ToString());

////            await channel.BasicPublishAsync(
////                exchange: "",
////                routingKey: "square_queue",
////                body: newBody);


////            await Task.CompletedTask;
////        };

////        await channel.BasicConsumeAsync(
////            queue: "number_queue",
////            autoAck: true,
////            consumer: consumer);
////    }
////}




//    public class RabbitWorker : BackgroundService
//    {
//        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//        {
//            var factory = new ConnectionFactory()
//            {
//                HostName = "localhost"
//            };

//            var connection = await factory.CreateConnectionAsync();
//            var channel = await connection.CreateChannelAsync();

//            await channel.QueueDeclareAsync(
//                queue: "number_queue",
//                durable: false,
//                exclusive: false,
//                autoDelete: false,
//                arguments: null);

//            await channel.QueueDeclareAsync(
//                queue: "square_queue",
//                durable: false,
//                exclusive: false,
//                autoDelete: false,
//                arguments: null);

//            var consumer = new AsyncEventingBasicConsumer(channel);

//            consumer.ReceivedAsync += async (sender, ea) =>
//            {
//                var body = ea.Body.ToArray();
//                var message = Encoding.UTF8.GetString(body);

//                int number = int.Parse(message);
//                int square = number * number;

//                var newBody = Encoding.UTF8.GetBytes(square.ToString());
//                var num = Encoding.UTF8.GetBytes(number.ToString());
//                // ⭐ copy message metadata
//                var props = new BasicProperties();
//                props.CorrelationId = ea.BasicProperties.CorrelationId;
//                props.ReplyTo = ea.BasicProperties.ReplyTo;

//                await channel.BasicPublishAsync(
//                    exchange: "",
//                    routingKey: ea.BasicProperties.ReplyTo,
//                    mandatory: false,
//                    basicProperties: props,
//                    body: newBody);

//                await channel.BasicPublishAsync(
//                    exchange: "",
//                    routingKey: "square_queue",
//                    mandatory: false,
//                    basicProperties: props,
//                    body: num);

//                await Task.CompletedTask;
//            };

//            await channel.BasicConsumeAsync(
//                queue: "number_queue",
//                autoAck: true,
//                consumer: consumer);
//        }
//    }

