import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAOBNEgeLAuR-tU1_dtSrqEPGkERYx2OV4",
    authDomain: "cemo-b3ee6.firebaseapp.com",
    projectId: "cemo-b3ee6",
    storageBucket: "cemo-b3ee6.firebasestorage.app",
    messagingSenderId: "667171201257",
    appId: "1:667171201257:web:f2ba1f371619bdad685078",
    measurementId: "G-Q35LGK7MPC",
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, db, auth, analytics };
