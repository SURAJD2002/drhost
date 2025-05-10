// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';

// const firebaseConfig = {
//     apiKey: "AIzaSyAKfzCsV77rhArYHZw7YzYUzr8vPfPwcFY",
//     authDomain: "dream-ee3b3.firebaseapp.com",
//     projectId: "dream-ee3b3",
//     storageBucket: "dream-ee3b3.firebasestorage.app",
//     messagingSenderId: "417725152177",
//     appId: "1:417725152177:web:d5d60e2c2aca5f9b235b90",
//     measurementId: "G-G6J1S5PNLH"
//   };

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);


// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKfzCsV77rhArYHZw7YzYUzr8vPfPwcFY",
  authDomain: "dream-ee3b3.firebaseapp.com",
  projectId: "dream-ee3b3",
  storageBucket: "dream-ee3b3.firebasestorage.app",
  messagingSenderId: "417725152177",
  appId: "1:417725152177:web:d5d60e2c2aca5f9b235b90",
  measurementId: "G-G6J1S5PNLH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ─── Add these lines ────────────────────────────────────────────────
// Ensure the settings object exists so RecaptchaVerifier won't crash:
auth.settings = auth.settings || {};

// In dev, disable actual app verification and point at your emulator:
if (process.env.NODE_ENV === "development") {
  auth.settings.appVerificationDisabledForTesting = true;
  connectAuthEmulator(auth, "http://localhost:9099");
}
// ────────────────────────────────────────────────────────────────────

// Helper to create an invisible reCAPTCHA verifier
export function createRecaptcha(containerId = "recaptcha-container") {
  return new RecaptchaVerifier(
    containerId,
    { size: "invisible" },
    auth
  );
}
