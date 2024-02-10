import { Injectable } from '@nestjs/common';
import { DEFAULT_CONFIG } from './default';
import { ConfigData } from './default.interface';

/**
 * Provides a means to access the application configuration.
 */
@Injectable()
export class ConfigService {
  private config: ConfigData;

  constructor(data: ConfigData = DEFAULT_CONFIG) {
    this.config = data;
  }

  /**
   * Loads the config from environment variables.
   */
  public loadFromEnv() {
    this.config = this.parseConfigFromEnv(process.env);
  }

  private parseConfigFromEnv(env: NodeJS.ProcessEnv): ConfigData {
    return {
      env: env.NODE_ENV || DEFAULT_CONFIG.env,
      port: parseInt(env.PORT, 10) || DEFAULT_CONFIG.port,
      mongo: {
        host: env.MONGO_URI || DEFAULT_CONFIG.mongo.host,
        dbname: env.MONGO_DBNAME || DEFAULT_CONFIG.mongo.dbname
     },
    rabbitmq: {
        host: env.RABBITMQ_URI || DEFAULT_CONFIG.rabbitmq.host
    },
    elastic: {
      node: env.ELASTICSEARCH_NODE || DEFAULT_CONFIG.elastic.node,
      username: env.ELASTICSEARCH_USERNAME || DEFAULT_CONFIG.elastic.username,
      password: env.ELASTICSEARCH_PASSWORD || DEFAULT_CONFIG.elastic.password
    },
    loglevel: env.LOG_LEVEL || DEFAULT_CONFIG.loglevel
    };
  }

  /**
   * Retrieves the config.
   * @returns immutable view of the config data
   */
  public get(): Readonly<ConfigData> {
    return this.config;
  }
}