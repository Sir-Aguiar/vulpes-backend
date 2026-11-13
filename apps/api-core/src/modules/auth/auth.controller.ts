import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastro de novo estudante',
    description:
      'Cria um usuário com role STUDENT e retorna um JWT pronto para uso. ' +
      'Promoção a professor é feita via `/professor-permission-request`.',
  })
  signup(@Body() data: SignupDto) {
    return this.authService.signup(data);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticação',
    description:
      'Valida email/senha e retorna um JWT Bearer. Use o token retornado ' +
      'no header `Authorization: Bearer <token>` para acessar rotas protegidas.',
  })
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }
}
