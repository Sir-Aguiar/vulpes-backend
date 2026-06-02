import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ConfirmResetDto } from './dto/confirm-reset.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordService } from './reset-password.service';

@ApiTags('reset-password')
@Public()
@Controller('reset-password')
export class ResetPasswordController {
  constructor(private readonly resetPasswordService: ResetPasswordService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicita a troca de senha',
    description:
      'Recebe o email do usuário, cria uma ordem de troca e envia o link de ' +
      'confirmação. Sempre retorna 200 — mesmo que o email não exista — ' +
      'para não expor quais endereços estão cadastrados.',
  })
  requestReset(@Body() body: RequestResetDto): Promise<void> {
    return this.resetPasswordService.requestReset(body.email);
  }

  @Get('verify/:token')
  @ApiOperation({
    summary: 'Valida o link de troca de senha',
    description:
      'Verifica o JWT e confirma que a ordem ainda está ativa. ' +
      'Retorna o `orderId` que o frontend usará na etapa de confirmação.',
  })
  verifyLink(@Param('token') token: string) {
    return this.resetPasswordService.verifyLink(token);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirma a nova senha',
    description:
      'Recebe o `orderId` (obtido em `verify`) e a nova senha. ' +
      'Atualiza a senha do usuário e invalida a ordem.',
  })
  confirmReset(@Body() body: ConfirmResetDto): Promise<void> {
    return this.resetPasswordService.confirmReset(body);
  }
}
