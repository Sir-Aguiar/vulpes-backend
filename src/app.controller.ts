import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Healthcheck' })
  healthcheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
