import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../pipes/Zod.pipe';
import {
  LoginSchema,
  SignupSchema,
  type ILoginDTO,
  type ISignupDTO,
} from '../../dtos/Auth';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body(new ZodValidationPipe(SignupSchema)) data: ISignupDTO) {
    return this.authService.signup(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(LoginSchema)) data: ILoginDTO) {
    return this.authService.login(data);
  }
}
