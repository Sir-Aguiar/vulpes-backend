import * as Zod from 'zod';

export const CreateTeacherPermissionSchema = Zod.object({
  name: Zod.string().min(1, 'Defina o nome da permissão'),
  personalEmail: Zod.string()
    .min(1, 'Defina o email pessoal')
    .email('Defina um email pessoal válido'),
  institutionalEmail: Zod.string()
    .min(1, 'Defina o email escolar')
    .email('Defina um email escolar válido'),
  institution: Zod.string().min(1, 'Defina a instituição de ensino'),
  requestFileUrl: Zod.string().url('Defina uma URL válida para o documento'),
});

export type ICreateTeacherPermissionDTO = Zod.infer<
  typeof CreateTeacherPermissionSchema
>;
