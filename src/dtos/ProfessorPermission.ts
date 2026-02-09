import * as Zod from 'zod';

export const CreateProfessorPermissionSchema = Zod.object({
  name: Zod.string().min(1, 'Defina o nome da permissão'),
  personalEmail: Zod.email().min(1, 'Defina o email pessoal'),
  institutionalEmail: Zod.email().min(1, 'Defina o email escolar'),
  institutionId: Zod.number().min(1, 'Defina a instituição de ensino'),
  requestFileUrl: Zod.url('Defina uma URL válida para o documento'),
});

export type ICreateProfessorPermissionDTO = Zod.infer<
  typeof CreateProfessorPermissionSchema
>;
