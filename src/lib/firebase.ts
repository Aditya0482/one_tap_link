import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const effectiveFirebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
};

const app = getApps().length === 0 ? initializeApp(effectiveFirebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const firestore = getFirestore(app);
export const storage = getStorage(app);

/**
 * Uploads an image file or blob directly to Firebase Cloud Storage.
 * Returns a permanent CDN download URL.
 */
export async function uploadImageToFirebaseStorage(fileOrBlob: Blob | File, filename?: string): Promise<string> {
  const safeName = (filename || `img_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fullPath = `templates/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, fullPath);
  const snapshot = await uploadBytes(storageRef, fileOrBlob, {
    contentType: fileOrBlob.type || 'image/jpeg',
  });
  return await getDownloadURL(snapshot.ref);
}

/**
 * Recursively sanitizes data before sending to Firebase Firestore:
 * 1. Converts nested arrays (forbidden by Firestore) into array of objects with `{ cells: [...] }`
 * 2. Removes `undefined` values (which cause Firestore setDoc/updateDoc to throw)
 * 3. Recursively cleans objects and arrays
 */
export function sanitizeForFirestore<T>(data: T): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (Array.isArray(item)) {
        return { cells: item.map((sub) => sanitizeForFirestore(sub)) };
      }
      return sanitizeForFirestore(item);
    });
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (Array.isArray(item)) {
          return { cells: item.map((sub) => sanitizeForFirestore(sub)) };
        }
        return sanitizeForFirestore(item);
      });
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged
};
export type { User };
export default app;
