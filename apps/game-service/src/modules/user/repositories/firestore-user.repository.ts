import { Injectable } from '@nestjs/common';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { FirestoreService } from '../../../infra/firestore/firestore.service';
import { dbOf } from '../../../infra/firestore/db';
import {
  GameUser,
  UserAlreadyExistsError,
  UserRepository,
} from './user.repository';

const USERS_COLLECTION = 'users';
const INITIAL_XP = 0;
const INITIAL_LEVEL = 1;

@Injectable()
export class FirestoreUserRepository implements UserRepository {
  constructor(private readonly firestore: FirestoreService) {}

  async create(userId: string): Promise<GameUser> {
    const db = dbOf(this.firestore);
    const ref = doc(db, USERS_COLLECTION, userId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);

      if (snapshot.exists()) {
        throw new UserAlreadyExistsError(userId);
      }

      transaction.set(ref, {
        xp: INITIAL_XP,
        level: INITIAL_LEVEL,
        createdAt: serverTimestamp(),
      });
    });

    return {
      userId,
      xp: INITIAL_XP,
      level: INITIAL_LEVEL,
    };
  }
}
