import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const GITHUB_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAB4ElNeTesYmSSZwBKKiOhmKoX0jxkd6Y",
  authDomain: "zmk-arsenal-calc.firebaseapp.com",
  projectId: "zmk-arsenal-calc",
  storageBucket: "zmk-arsenal-calc.firebasestorage.app",
  messagingSenderId: "277666739262",
  appId: "1:277666739262:web:31c72113e8ad2af4234d6f"
};

let app, auth, db, appId;

try {
  // @ts-ignore
  const envConfigStr = typeof window !== 'undefined' && window.__firebase_config ? window.__firebase_config : null;
  const envConfig = envConfigStr ? JSON.parse(envConfigStr) : null;
  const finalConfig = envConfig || GITHUB_FIREBASE_CONFIG;

  if (finalConfig) {
    app = !getApps().length ? initializeApp(finalConfig) : getApp();
    auth = getAuth(app);
    try {
      db = initializeFirestore(app, { experimentalForceLongPolling: true });
    } catch (e) {
      db = getFirestore(app);
    }
    // @ts-ignore
    appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'github-arsenal-app';
  }
} catch (e) {
  console.error("Ошибка инициализации облака:", e);
}

export { app, auth, db, appId };
