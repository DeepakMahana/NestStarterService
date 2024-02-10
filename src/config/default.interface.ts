  /**
   * Configuration data for the app.
   */
  export interface ConfigData {
    env: string;
    port: number;
    mongo: {
      host: string,
      dbname: string
    },
    rabbitmq: {
      host: string
    },
    elastic: {
      node: string,
      username: string,
      password: string
    }
    loglevel: string
  }