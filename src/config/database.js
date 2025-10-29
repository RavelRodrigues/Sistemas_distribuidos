const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fraud_detection',
  user: 'admin',
  password: 'admin123'
});

// Criar tabela de transações se não existir
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        location VARCHAR(255) NOT NULL,
        merchant VARCHAR(255) NOT NULL,
        is_fraud BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela "transactions" criada/verificada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    client.release();
  }
}

// Salvar transação no banco
async function saveTransaction(transaction, isFraud) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO transactions (transaction_id, user_id, amount, location, merchant, is_fraud, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (transaction_id) DO NOTHING`,
      [
        transaction.transactionId,
        transaction.userId,
        transaction.amount,
        transaction.location,
        transaction.merchant,
        isFraud,
        transaction.timestamp
      ]
    );
  } catch (error) {
    console.error('Erro ao salvar transação:', error);
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase, saveTransaction };