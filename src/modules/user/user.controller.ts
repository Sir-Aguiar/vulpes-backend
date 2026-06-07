import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { ChangePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('user')
@ApiBearerAuth('bearer')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualiza os dados do usuário autenticado',
    description:
      'Aceita `name` e/ou `email`. O nome é atualizado imediatamente. Para ' +
      'o email, é disparado um email de confirmação ao novo endereço — a ' +
      'troca só é efetivada quando o usuário acessa o link recebido.',
  })
  async update(
    @Body() body: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.userService.update(user, body);
  }

  @Public()
  @Get('verify-email-link/:token')
  @Header('Content-Type', 'text/html')
  @ApiOperation({
    summary: 'Confirma a troca de email a partir do link enviado',
  })
  verifyEmailLink(@Param('token') token: string) {
    return this.userService.verifyEmailLink(token);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Altera a senha do usuário',
    description:
      'Recebe a senha atual e a nova senha e altera a senha do usuário.',
  })
  changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.userService.changePassword(user, body);
  }
}
