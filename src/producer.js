const kafka = require('./config/kafka');

const producer = kafka.producer();

// Função para gerar transações aleatórias
function generateTransaction() {
  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const userId = `USER-${Math.floor(Math.random() * 1000)}`;
  const amount = parseFloat((Math.random() * 10000).toFixed(2)); // Valor entre 0 e 10000
  const location = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador'][Math.floor(Math.random() * 5)];
  const merchant = ['Amazon', 'Mercado Livre', 'Magazine Luiza', 'Americanas', 'Shopee'][Math.floor(Math.random() * 5)];

  return {
    transactionId,
    userId,
    amount,
    location,
    merchant,
    timestamp: new Date().toISOString()
  };
}

// Função principal
async function run() {
  await producer.connect();
  console.log('Producer conectado ao Kafka!');

  // Enviar uma transação a cada 3 segundos
  setInterval(async () => {
    const transaction = generateTransaction();
    
    await producer.send({
      topic: 'transactions',
      messages: [
        {
          key: transaction.transactionId,
          value: JSON.stringify(transaction)
        }
      ]
    });

    console.log('Transação enviada:', transaction);
  }, 3000); // 3000ms = 3 segundos
}

run().catch(console.error);