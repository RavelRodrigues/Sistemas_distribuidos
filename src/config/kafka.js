
//COnfiguração do Kafka
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "fraud-detection-app",
  brokers: ["localhost:9092"], //Aqui é o endereço do kafka que coloquei no Docker
});

module.exports = kafka;
