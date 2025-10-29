const kafka = require('./config/kafka');
const { initDatabase, saveTransaction } = require('./config/database');

const consumer = kafka.consumer({ groupId: 'fraud-detection-group' });

// Função com as regras de detecção de fraude
function detectFraud(transaction) {
  const reasons = [];

  if (transaction.amount > 5000) {
    reasons.push('Valor acima de R$ 5000');
  }

  const suspiciousMerchants = ['Shopee'];
  if (suspiciousMerchants.includes(transaction.merchant)) {
    reasons.push(`Loja suspeita: ${transaction.merchant}`);
  }

  const highRiskLocations = ['Salvador'];
  if (highRiskLocations.includes(transaction.location)) {
    reasons.push(`Localização de risco: ${transaction.location}`);
  }

  return {
    isFraud: reasons.length > 0,
    reasons
  };
}

// Função principal
async function run() {
  // Inicializar o banco de dados
  await initDatabase();

  //Conectar ao Kafka
  await consumer.connect();
  await consumer.subscribe({ topic: 'transactions', fromBeginning: false });

  console.log('Consumer conectado ao Kafka!');
  console.log(' Aguardando transações...\n');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const transaction = JSON.parse(message.value.toString());
      const fraudCheck = detectFraud(transaction);

      // Salvar no banco
      await saveTransaction(transaction, fraudCheck.isFraud);

      // Exibir no console
      if (fraudCheck.isFraud) {
        console.log('===== ALERTA DE FRAUDE =====');
        console.log('Transação ID:', transaction.transactionId);
        console.log('Usuário:', transaction.userId);
        console.log('Valor: R$', transaction.amount);
        console.log('Loja:', transaction.merchant);
        console.log('Localização:', transaction.location);
        console.log('Motivos:', fraudCheck.reasons.join(', '));
        console.log('Timestamp:', transaction.timestamp);
        console.log('================================\n');
      } else {
        console.log('Transação normal');
        console.log('ID:', transaction.transactionId);
        console.log('Valor: R$', transaction.amount);
        console.log('Loja:', transaction.merchant, '|', transaction.location);
        console.log('---\n');
      }
    }
  });
}

run().catch(console.error);