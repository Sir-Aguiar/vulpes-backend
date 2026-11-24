import { Module } from '@nestjs/common';
import { FirestoreUserRepository } from './repositories/firestore-user.repository';
import { UserRepository } from './repositories/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepository,
      useClass: FirestoreUserRepository,
    },
  ],
})
export class UserModule {}
