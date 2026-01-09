import * as Zod from 'zod';

export const CreateTeacherPermissionSchema = Zod.object({
  name: Zod.string().min(1, 'Defina o nome da permissão'),
  personalEmail: Zod.email().min(1, 'Defina o email pessoal'),
  institutionalEmail: Zod.email().min(1, 'Defina o email escolar'),
  institution: Zod.string().min(1, 'Defina a instituição de ensino'),
  requestFileUrl: Zod.url('Defina uma URL válida para o documento'),
});

export type ICreateTeacherPermissionDTO = Zod.infer<
  typeof CreateTeacherPermissionSchema
>;
