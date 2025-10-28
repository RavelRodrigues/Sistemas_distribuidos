const kafka = require("./config/kafka");

const producer = kafka.producer();

function gerarTransacaoAleatoria() {
  const usuarios = ["João", "Maria", "Pedro", "Ana", "Lucas"];
  const id = Math.floor(Math.random() * 10000);
  const usuario = usuarios[Math.floor(Math.random() * usuarios.length)];
  const valor = (Math.random() * 1000).toFixed(2);
  const local = ["SP", "RJ", "MG", "BA", "RS"][Math.floor(Math.random() * 5)];
  const data = new Date().toISOString();

  return { id, usuario, valor, local, data };
}

async function run() {
  await producer.connect();

  console.log("Producer conectado. Enviando transações a cada 3 segundos");

  setInterval(async () => {
    const transacao = gerarTransacaoAleatoria();

    await producer.send({
      topic: "transactions",
      messages: [{ value: JSON.stringify(transacao) }],
    });

    console.log("Transação enviada:", transacao);
  }, 3000);
}

run().catch(console.error);
