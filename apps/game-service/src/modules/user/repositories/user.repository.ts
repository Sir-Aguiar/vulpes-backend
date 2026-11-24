export type GameUser = {
  userId: string;
  xp: number;
  level: number;
};

export class UserAlreadyExistsError extends Error {
  constructor(readonly userId: string) {
    super(`User ${userId} already exists`);
    this.name = UserAlreadyExistsError.name;
  }
}

export abstract class UserRepository {
  abstract create(userId: string): Promise<GameUser>;
}
