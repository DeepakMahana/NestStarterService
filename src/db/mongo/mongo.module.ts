import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from 'src/config/default.module';
import { ConfigService } from 'src/config/default.service';
import { DbConfigError } from './mongo.error';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';

@Module({})
export class DatabaseModule {

  public static getNoSqlConnectionOptions(config: ConfigService): MongooseModuleOptions {
    const dbhost = config.get().mongo.host
    const dbname = config.get().mongo.dbname
    if (!dbhost && !dbname) {
      throw new DbConfigError('Database config is missing');
    }
    const dburi = dbhost + "/" + dbname
    return {
      uri: dburi,
      retryAttempts: 3,
      retryDelay: 1000,
    };
  }

  public static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
      MongooseModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => DatabaseModule.getNoSqlConnectionOptions(configService),
        inject: [ConfigService],
      }),
      ],
      controllers: [],
      providers: [],
      exports: [],
    };
  }
}