import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { paginate } from '../../common/pagination/pagination.types';
import type { AuthUser } from '../../common/types/auth-user.type';
import { GetUsersQueryDto } from './dto/get-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ChangePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('user')
@ApiBearerAuth('bearer')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Lista usuários cadastrados (ADMIN)',
    description:
      'Retorna uma lista paginada com busca por nome ou e-mail e ' +
      'ordenação por data de criação (padrão: mais recentes primeiro).',
  })
  async getUsers(@Query() query: GetUsersQueryDto) {
    const { users, total } = await this.userService.getUsers(query);
    return paginate(users, total, query);
  }

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

  @Patch('desativar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desativa a conta do usuário autenticado',
    description: 'Desativa a própria conta do usuário logado.',
  })
  deactivateUser(@CurrentUser() user: AuthUser): Promise<void> {
    return this.userService.deactivateUser(user);
  }

  @Patch(':userId/status')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ativa ou desativa um usuário (ADMIN)',
    description:
      'Atualiza o campo `desativado` do usuário informado. Um administrador ' +
      'não pode desativar a própria conta.',
  })
  updateStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateUserStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.userService.updateStatus(userId, body, user);
  }
}
