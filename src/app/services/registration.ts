import { Inject, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterBrandRequest } from '../dto/register';
import { Brand } from '../model/brand';
import { RABBIT_MQ_REGISTRATION_QUEUE, BRAND_REGISTRATION_SUCCESS } from 'src/constants/rmqueues';
import { BrandRegistrationRepository } from '../repository/registration';
import { Logger } from 'src/logger/logservice';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PostUserBody, PostUserResult } from '../dto/userelk'
import { text } from 'stream/consumers';

@Injectable()
export class RegistrationService {

  index = "users"

  constructor(
    private readonly logger: Logger,

    @Inject(RABBIT_MQ_REGISTRATION_QUEUE)
    private registrationClient: ClientProxy,

    private readonly brandRegistrationRepository: BrandRegistrationRepository,

    private readonly elasticsearchService: ElasticsearchService
  ) { }


  async testService(): Promise<String> {
    this.registrationClient.emit<string>('registration_success', "Wohoooo")
    return "Hello World";
  }

  async registerBrand(brand: RegisterBrandRequest) {
    const session = await this.brandRegistrationRepository.startTransaction();
    try {
      const branduser = await this.brandRegistrationRepository.create(brand, {});
      this.logger.info(`Brand User : ${JSON.stringify(branduser)}`);
      await lastValueFrom(this.registrationClient.emit(BRAND_REGISTRATION_SUCCESS, { branduser }));
      await session.commitTransaction();
      return branduser;
    } catch (err) {
      await session.abortTransaction();
      this.logger.error(`Brand Registration Error : ${err}`);
      throw err;
    }

  }

  async getAllRegisteredBrandUsers() {
    return await this.brandRegistrationRepository.find({});
  }

  async createUserInELK() {
    const data = await this.elasticsearchService.index<PostUserBody>({
      index: this.index,
      body: {
        id: 1,
        title: "User",
        username: "deepak",
        password: "123"
      }
    })
    console.log(data);
    return data;
  }

  async getUsersFromELK() {
    const data = await this.elasticsearchService.search<PostUserResult>({
      index: this.index,
      body: {
        query: {
          bool: {
            must: {
              multi_match: {
                query: "deepak",
                fields: ["username"]
              }
            }
          }
        }
      }
    })
    console.log(data)
    const hits = data.hits.hits;
    return hits.map((item) => item._source);
  }

}