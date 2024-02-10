import {
  Controller, Get, Post, Body, Res, HttpStatus, HttpCode, Req, Inject
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';

import { Logger } from 'src/logger/logservice';
import { RegisterBrandRequest, RegisterBrandResponse, RegisterBrandEvent } from '../dto/register';
import { RegistrationService } from '../services/registration';
import { PARAMETERS_FAILED_VALIDATION } from '../../constants/validationerror';
import { BRAND_REGISTRATION_SUCCESS } from 'src/constants/rmqueues';
import { RmqService } from 'src/queue/rabbitmq/rmqservice';
import { GenericResponse } from '../dto/genericres';

@Controller('/api/v1/')
export class RegistrationController {

  constructor(
    private readonly logger: Logger,
    private readonly regService: RegistrationService,
    private readonly rmqService: RmqService
  ) { }

  @ApiTags('Health')
  @Get()
  @ApiOperation({ summary: 'Health Check', description: 'Health Check' })
  async testFunc(@Res() res): Promise<String> {
    let resp = new GenericResponse();
    try {
      this.logger.info("Logging Message");
      const data = await this.regService.testService();
      resp.status = 'Success';
      resp.message = `Success`;
      resp.data = data;
    } catch (err) {
      resp.status = 'Failed';
      resp.message = `Error`;
      resp.error = err.message;
    }
    return res.status(HttpStatus.OK).json({
      ...resp
    })
  }

  @ApiTags('Health')
  @Get('/err')
  @ApiOperation({ summary: 'Health Check Err', description: 'Health Check Err' })
  async testErr(@Res() res): Promise<String> {
    let resp = new GenericResponse();
    resp.status = 'Failed';
    resp.message = `Error`;
    resp.error = 'Internal Server Err';
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ...resp
    })
  }

  @EventPattern(BRAND_REGISTRATION_SUCCESS)
  async handleMessage(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.info(`Pattern: ${context.getPattern()}`);
    this.logger.info(`Received from Queue : ${JSON.stringify(data)}`);
    this.rmqService.ack(context);
  }

  @ApiTags('Brand')
  @Post('/brand/register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Brand Successfully Registered' })
  @ApiOperation({ summary: 'Register Brand', description: 'Register Brand' })
  @ApiBadRequestResponse({ description: PARAMETERS_FAILED_VALIDATION })
  async registerBrand(@Res() res, @Body() brand: RegisterBrandRequest) {
    let resp = new RegisterBrandResponse();
    try {
      const brandReg = await this.regService.registerBrand(brand);
      resp.status = 'Success';
      resp.message = `Brand Successfully Registered`;
      resp.data = brandReg;
    } catch (err) {
      resp.status = 'Failed';
      resp.message = `Failed to register brand`;
      resp.error = err.message;
    }
    return res.status(HttpStatus.OK).json({
      ...resp
    })
  }

  @ApiTags('Brand')
  @Get('/brand/listusers')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Brand users successfully fetched' })
  @ApiOperation({ summary: 'Brand users', description: 'list of the registered brand users' })
  @ApiBadRequestResponse({ description: PARAMETERS_FAILED_VALIDATION })
  @ApiInternalServerErrorResponse({ description: 'Unable to fetch brand users' })
  async getCompanies(@Res() res, @Req() req) {
    let resp = new RegisterBrandResponse();
    try {
      this.logger.info("brand controller");
      const brandUsers = await this.regService.getAllRegisteredBrandUsers();
      resp.status = 'Success';
      resp.message = `Brand users successfully fetched`;
      resp.data = brandUsers;
    } catch (err) {
      resp.status = 'Failed';
      resp.message = `Failed to fetch brand users`;
      resp.error = err.message;
    }
    return res.status(HttpStatus.OK).json({
      ...resp
    })
  }

  @ApiTags('Elastic')
  @Get('/pushintoelk')
  async pushtoElk(@Res() res) {
    let resp = new GenericResponse();
    try {
      const data = await this.regService.createUserInELK();
      resp.status = 'Success';
      resp.message = `Success`;
      resp.data = data;
    } catch (err) {
      resp.status = 'Failed';
      resp.message = `Error`;
      resp.error = err.message;
    }
    return res.status(HttpStatus.OK).json({
      ...resp
    })
  }

  @ApiTags('Elastic')
  @Get('/getFromElk')
  async getFromElk(@Res() res) {
    let resp = new GenericResponse();
    try {
      const data = await this.regService.getUsersFromELK();
      resp.status = 'Success';
      resp.message = `Success`;
      resp.data = data;
    } catch (err) {
      resp.status = 'Failed';
      resp.message = `Error`;
      resp.error = err.message;
    }
    return res.status(HttpStatus.OK).json({
      ...resp
    })
  }

}