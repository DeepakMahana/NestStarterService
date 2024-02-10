import { ConfigData } from './default.interface';

export const DEFAULT_CONFIG: ConfigData = {
  env: 'local',
  port: parseInt(process.env.PORT, 10) || 3000,
  mongo: {
    host: process.env.MONGO_URI || "mongodb://localhost:27017",
    dbname: process.env.MONGO_DBNAME || "user",
  },
  rabbitmq: {
    host: process.env.RABBITMQ_URI || "amqp://localhost:5672",
  },
  elastic: {
    node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
    username: process.env.ELASTICSEARCH_USERNAME || "user",
    password: process.env.ELASTICSEARCH_PASSWORD || "user@123"
  },
  loglevel: process.env.LOG_LEVEL || "info"
};