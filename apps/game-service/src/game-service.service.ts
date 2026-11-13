import { Injectable } from '@nestjs/common';

@Injectable()
export class GameServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
