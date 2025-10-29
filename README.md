# Sistema de Detecção de Fraude com Apache Kafka

## Descrição
Sistema que simula transações financeiras em tempo real e detecta possíveis fraudes usando Apache Kafka, Node.js e PostgreSQL.

## Tecnologias
- **Apache Kafka** - Sistema de mensageria distribuída
- **Node.js** - Runtime JavaScript
- **PostgreSQL** - Banco de dados relacional
- **Docker** - Containerização dos serviços

## Arquitetura
- **Producer**: Gera transações financeiras simuladas a cada 3 segundos
- **Kafka**: Broker de mensagens (tópico: transactions)
- **Consumer**: Consome transações, aplica regras de detecção de fraude e salva no banco
- **PostgreSQL**: Armazena todas as transações com flag de fraude

## Regras de Detecção de Fraude
1. **Valor alto**: Transações acima de R$ 5.000
2. **Loja suspeita**: Transações na loja "Shopee"
3. **Localização de risco**: Transações em "Salvador"

## Como executar

### 1. Subir os containers Docker:
```bash
docker compose up -d
```

### 2. Verificar se os containers estão rodando:
```bash
docker ps
```
Devem aparecer 3 containers: kafka, zookeeper e postgres

### 3. Instalar dependências Node.js:
```bash
npm install
```

### 4. Rodar o Producer (Terminal 1):
```bash
node src/producer.js
```

### 5. Rodar o Consumer (Terminal 2):
```bash
node src/consumer.js
```

## Verificar dados no banco

### Conectar no PostgreSQL:
```bash
docker exec -it sistemas_distribuidos-postgres-1 psql -U admin -d fraud_detection


### Ver todas as transações:
```sql
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
```

### Ver apenas fraudes:
```sql
SELECT transaction_id, amount, merchant, location, is_fraud 
FROM transactions 
WHERE is_fraud = true;
```

### Estatísticas:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_fraud = true) as fraudes,
  COUNT(*) FILTER (WHERE is_fraud = false) as normais
FROM transactions;
```

### Sair do PostgreSQL:
```
\q
```

## Parar o sistema
```bash
docker compose down
```

## Estrutura do Projeto
```
kafka-fraud-detection/
├── src/
│   ├── producer.js          # Gerador de transações
│   ├── consumer.js          # Detector de fraudes
│   └── config/
│       ├── kafka.js         # Configuração Kafka
│       └── database.js      # Configuração PostgreSQL
├── docker-compose.yml       # Configuração dos containers
├── package.json
└── README.md
```

## Autor
Projeto desenvolvido por Ravel Rodrigues Pereira para a disciplina de Sistemas Distribuídos