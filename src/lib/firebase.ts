import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch(console.error);
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
}, firebaseConfig.firestoreDatabaseId);

export const checkRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const preferredRole = sessionStorage.getItem('preferredRole') || 'student';
        let role = preferredRole;
        
        if (user.email === "engineeringstudies5@gmail.com") {
          role = 'admin';
        } else if (userDoc.exists()) {
          role = userDoc.data().role || preferredRole;
        }

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: role,
          lastLogin: new Date().toISOString()
        }, { merge: true });
        
        sessionStorage.removeItem('preferredRole');
      } catch (fsError) {
        console.error("Error saving user profile to Firestore via redirect:", fsError);
      }
    }
  } catch (error) {
    console.error("Redirect check error:", error);
    throw error;
  }
};

export const signInWithGoogle = async (preferredRole: 'student' | 'employee' | 'mentor' | 'admin' = 'student') => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  sessionStorage.setItem('preferredRole', preferredRole);
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Save user profile to Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let role: string = preferredRole;
      
      if (user.email === "engineeringstudies5@gmail.com") {
        role = 'admin';
      } else if (userDoc.exists()) {
        role = userDoc.data().role || preferredRole;
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: role,
        lastLogin: new Date().toISOString()
      }, { merge: true });
    } catch (fsError) {
      console.error("Error saving user profile to Firestore:", fsError);
    }
    
    return user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    
    // Fallback to Redirect if Popup is blocked
    if (error.code === 'auth/popup-blocked') {
      console.warn("Popup blocked by browser. Falling back to signInWithRedirect...");
      await signInWithRedirect(auth, provider);
      return null;
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Sign-in cancelled. Use the Google login window to complete the process.");
    }
    if (error.code === 'auth/popup-blocked-by-user') {
      throw new Error("Popup blocked. Please enable popups in your browser settings to sign in.");
    }
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      // Sometimes this error persists, forcing a prompt for user to retry
      throw new Error("Sign-in attempt interrupted. Please click the button to try again.");
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error("Domain not authorized. Check Firebase Auth settings.");
    }

    if (error.message && (error.message.includes('INTERNAL ASSERTION FAILED') || error.message.includes('Pending promise'))) {
      // This is a known Firebase SDK issue in specific environments (like iframes)
      throw new Error("Auth connection issue. Please refresh the page and try logging in again.");
    }
    
    throw new Error(error.message || "An unexpected error occurred during sign in.");
  }
};

export const logout = () => signOut(auth);

// Error handling helper as per instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
