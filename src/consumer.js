const kafka = require('./config/kafka');
const { initDatabase, saveTransaction } = require('./config/database');

const consumer = kafka.consumer({ groupId: 'fraud-detection-group' });

// Cache de transações por usuário (últimos 10 minutos)
const userTransactions = new Map();

// Limpar transações antigas do cache (> 10 minutos)
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  
  for (const [userId, transactions] of userTransactions.entries()) {
    const recentTransactions = transactions.filter(t => 
      new Date(t.timestamp).getTime() > tenMinutesAgo
    );
    
    if (recentTransactions.length === 0) {
      userTransactions.delete(userId);
    } else {
      userTransactions.set(userId, recentTransactions);
    }
  }
}, 30000); // Limpa a cada 30 segundos

// Regras de detecção de fraude
function detectFraud(transaction) {
  const reasons = [];
  const userId = transaction.userId;

  // REGRA 1: ALTO_VALOR - Transação >= R$ 10.000
  if (transaction.amount >= 10000) {
    reasons.push('ALTO_VALOR');
  }

  // Obter transações anteriores do usuário
  const userHistory = userTransactions.get(userId) || [];
  
  // REGRA 2: TEMPO_60s - 4 transações em menos de 60 segundos
  const sixtySecondsAgo = Date.now() - 60 * 1000;
  const recentTransactions = userHistory.filter(t => 
    new Date(t.timestamp).getTime() > sixtySecondsAgo
  );
  
  if (recentTransactions.length >= 3) { // +1 da atual = 4
    reasons.push('TEMPO_60s');
  }

  // REGRA 3: GEO_10m - 2 transações em cidades diferentes em 10 minutos
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const last10MinTransactions = userHistory.filter(t => 
    new Date(t.timestamp).getTime() > tenMinutesAgo
  );
  
  const locations = new Set(last10MinTransactions.map(t => t.location));
  locations.add(transaction.location); // Adiciona localização atual
  
  if (locations.size >= 2) { // 2 ou mais cidades diferentes
    reasons.push('GEO_10m');
  }

  // Adicionar transação atual ao histórico
  userHistory.push(transaction);
  userTransactions.set(userId, userHistory);

  return {
    isFraud: reasons.length > 0,
    reasons
  };
}

// Função principal
async function run() {
  // Inicializar banco de dados
  await initDatabase();

  // Conectar ao Kafka
  await consumer.connect();
  await consumer.subscribe({ topic: 'transactions', fromBeginning: false });

  console.log('Consumer conectado ao Kafka!');
  console.log('Aguardando transações...\n');
  console.log('REGRAS DE FRAUDE:');
  console.log('   1. ALTO_VALOR: Transações >= R$ 10.000');
  console.log('   2. TEMPO_60s: 4 transações em < 60 segundos');
  console.log('   3. GEO_10m: 2 cidades diferentes em 10 minutos\n');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const transaction = JSON.parse(message.value.toString());
      const fraudCheck = detectFraud(transaction);

      // Salvar no banco
      await saveTransaction(transaction, fraudCheck.isFraud);

      // Exibir no console
      if (fraudCheck.isFraud) {
        console.log('🚨 =============== ALERTA DE FRAUDE =============== 🚨');
        console.log('Transação ID:', transaction.transactionId);
        console.log('Usuário:', transaction.userId);
        console.log('Valor: R$', transaction.amount.toFixed(2));
        console.log('Loja:', transaction.merchant);
        console.log('Localização:', transaction.location);
        console.log('TIPOS DE FRAUDE:', fraudCheck.reasons.join(', '));
        console.log('Timestamp:', transaction.timestamp);
        console.log('==================================================\n');
      } else {
        console.log('Transação Normal');
        console.log('   ID:', transaction.transactionId);
        console.log('   Usuário:', transaction.userId);
        console.log('   Valor: R$', transaction.amount.toFixed(2));
        console.log('   Loja:', transaction.merchant, '|', transaction.location);
        console.log('   Timestamp:', new Date(transaction.timestamp).toLocaleTimeString());
        console.log('---\n');
      }
    }
  });
}

run().catch(console.error);