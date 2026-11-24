import { type Firestore } from 'firebase/firestore';
import { FirestoreService } from './firestore.service';

export const dbOf = (firestore: FirestoreService): Firestore => firestore.db;
