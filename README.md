# Sistema de Detecção de Fraude com Apache Kafka

## Descrição
Sistema que simula transações financeiras e detecta possíveis fraudes em tempo real usando Apache Kafka.

## Tecnologias
- Apache Kafka
- Node.js
- PostgreSQL
- Docker

## Como executar
1. Subir os containers:
```
   docker compose up -d
```

2. Verificar se está rodando:
```
   docker ps
```

## Arquitetura
- **Producer**: Gera transações simuladas a cada 3 segundos
- **Kafka**: Sistema de mensageria
- **Consumer**: Consome transações, detecta fraudes e salva no banco
- **PostgreSQL**: Armazena todas as transações