import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from 'src/config/default.module';
import { ConfigService } from 'src/config/default.service';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({})
export class ElasticModule {

    public static getElasticConnectionOptions(config: ConfigService): any {
        const node = config.get().elastic.node
        const username = config.get().elastic.username
        const pwd = config.get().elastic.password
        if (!node && !username && !pwd) {
          throw new Error('Elasticservice Env Config Missing')
        }
        
        return {
         node: node,
         auth: {
            username: username,
            password: pwd
         }
        };
    }

    public static elkRegister(): DynamicModule {
        return {
          module: ElasticModule,
          imports: [
            ElasticsearchModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ElasticModule.getElasticConnectionOptions(configService),
            inject: [ConfigService],
          }),
          ],
          controllers: [],
          providers: [],
          exports: [ElasticsearchModule],
        };
      }

}