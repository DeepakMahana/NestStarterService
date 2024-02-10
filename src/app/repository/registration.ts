import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/db/mongo/mongo.helper';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Brand } from '../model/brand';
import { Logger } from 'src/logger/logservice';

@Injectable()
export class BrandRegistrationRepository extends AbstractRepository<Brand> {

  constructor(
    logger: Logger,
    @InjectModel(Brand.name) brandModel: Model<Brand>,
    @InjectConnection() connection: Connection,

  ) {
    super(logger, brandModel, connection);
  }
}