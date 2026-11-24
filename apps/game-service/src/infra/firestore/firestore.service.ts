import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { EnvService } from '../../config/env.service';

@Injectable()
export class FirestoreService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FirestoreService.name);
  private readonly firebaseApp: FirebaseApp;
  readonly db: Firestore;

  constructor(env: EnvService) {
    const measurementId = env.get('FIREBASE_MEASUREMENT_ID');

    this.firebaseApp = initializeApp({
      apiKey: env.get('FIREBASE_API_KEY'),
      authDomain: env.get('FIREBASE_AUTH_DOMAIN'),
      projectId: env.get('FIREBASE_PROJECT_ID'),
      storageBucket: env.get('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: env.get('FIREBASE_MESSAGING_SENDER_ID'),
      appId: env.get('FIREBASE_APP_ID'),
      ...(measurementId ? { measurementId } : {}),
    });
    this.db = getFirestore(this.firebaseApp);
  }

  onModuleInit(): void {
    this.logger.log(
      `Firestore initialized for ${this.firebaseApp.options.projectId}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await deleteApp(this.firebaseApp);
    this.logger.log('Firestore disconnected');
  }
}
