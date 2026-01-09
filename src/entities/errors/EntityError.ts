export class EntityError extends Error {
  constructor(
    message: string,
    public stack?: string,
  ) {
    super(message);
  }
}
