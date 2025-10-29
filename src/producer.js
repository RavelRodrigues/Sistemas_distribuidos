const kafka = require('./config/kafka');

const producer = kafka.producer();

// Lista de usuários para simular
const users = ['USER-001', 'USER-002', 'USER-003', 'USER-004', 'USER-005'];
const locations = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador'];
const merchants = ['Amazon', 'Mercado Livre', 'Magazine Luiza', 'Americanas', 'Shopee'];

// Contador para criar cenários de fraude
let transactionCount = 0;

// Função para gerar transações simuladas
function generateTransaction() {
  transactionCount++;
  
  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // A cada 10 transações, cria cenários específicos de fraude
  let userId, amount, location, merchant;
  
  if (transactionCount % 20 === 0) {
    // CENÁRIO: ALTO_VALOR
    userId = users[0];
    amount = parseFloat((10000 + Math.random() * 5000).toFixed(2)); // >= 10000
    location = locations[0];
    merchant = merchants[0];
    console.log('Gerando transação de ALTO_VALOR...');
    
  } else if (transactionCount % 15 === 0) {
    // CENÁRIO: GEO_10m (mesma pessoa, cidades diferentes)
    userId = users[1];
    amount = parseFloat((Math.random() * 1000).toFixed(2));
    location = locations[Math.floor(Math.random() * locations.length)];
    merchant = merchants[Math.floor(Math.random() * merchants.length)];
    console.log('Gerando transação para teste GEO_10m...');
    
  } else if (transactionCount % 3 === 0) {
    // CENÁRIO: TEMPO_60s (mesma pessoa, várias transações)
    userId = users[2];
    amount = parseFloat((Math.random() * 1000).toFixed(2));
    location = locations[0];
    merchant = merchants[Math.floor(Math.random() * merchants.length)];
    
  } else {
    // Transação normal
    userId = users[Math.floor(Math.random() * users.length)];
    amount = parseFloat((Math.random() * 5000).toFixed(2));
    location = locations[Math.floor(Math.random() * locations.length)];
    merchant = merchants[Math.floor(Math.random() * merchants.length)];
  }

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
  console.log('Enviando transações a cada 3 segundos...\n');

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

    console.log('Transação enviada:', {
      id: transaction.transactionId,
      user: transaction.userId,
      amount: `R$ ${transaction.amount.toFixed(2)}`,
      location: transaction.location
    });
  }, 3000);
}

run().catch(console.error);