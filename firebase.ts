import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration provided in prompt
const firebaseConfig = {
  apiKey: "AIzaSyC1VIO3lEU6v0ZOT5E3NQ282oAmPq0In5I",
  authDomain: "circademic-new.firebaseapp.com",
  projectId: "circademic-new",
  storageBucket: "circademic-new.firebasestorage.app",
  messagingSenderId: "939215029590",
  appId: "1:939215029590:web:0ad25e04fd53a0c82302f7",
  measurementId: "G-3MV8RP9TTJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);