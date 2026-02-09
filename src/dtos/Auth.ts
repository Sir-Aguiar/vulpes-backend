import * as Zod from 'zod';

export const LoginSchema = Zod.object({
  email: Zod.email('Email inválido'),
  password: Zod.string().min(1, 'Senha é obrigatória'),
});

export const SignupSchema = Zod.object({
  name: Zod.string().min(3, 'O nome de usuário deve ter ao menos 3 caracteres'),
  email: Zod.email('Email inválido'),
  password: Zod.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});

export type ILoginDTO = Zod.infer<typeof LoginSchema>;
export type ISignupDTO = Zod.infer<typeof SignupSchema>;
