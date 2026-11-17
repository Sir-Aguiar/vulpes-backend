import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RabbitmqClient } from '../../../../../libs/messaging/src';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('internal')
@Controller('internal')
export class PingController {
  constructor(private readonly rabbitmq: RabbitmqClient) {}

  @Public()
  @Post('ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envia um ping ao game-service pelo RabbitMQ e espera o pong',
  })
  async ping() {
    try {
      const pong = await this.rabbitmq.ping();
      return { status: 'ok', ...pong };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao enviar o ping.';
      throw new ServiceUnavailableException(message);
    }
  }
}
