import { Role } from '@prisma/client';
import { UserPreferences } from '../../modules/user/dto/user-preferences.dto';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
  institutionId?: number | null;
  userPreferences: UserPreferences;
}
