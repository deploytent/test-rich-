import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDF6sAAVr7-KXkitfRFHZYrDRmb0f3MbuA',
  authDomain: 'rich-man-a0332.firebaseapp.com',
  databaseURL: 'https://rich-man-a0332-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'rich-man-a0332',
  storageBucket: 'rich-man-a0332.firebasestorage.app',
  messagingSenderId: '337794776869',
  appId: '1:337794776869:web:80e8a8b428aa1c49d824cc',
  measurementId: 'G-VZJ5JK2766',
};

export const isFirebaseConfigured: boolean =
  Boolean(firebaseConfig.apiKey) &&
  !firebaseConfig.apiKey.includes('YOUR_') &&
  Boolean(firebaseConfig.databaseURL) &&
  !firebaseConfig.databaseURL.includes('YOUR_') &&
  Boolean(firebaseConfig.projectId) &&
  !firebaseConfig.projectId.includes('YOUR_');

const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db: Database = getDatabase(app);
export const rtdb: Database = db;
export { app };
