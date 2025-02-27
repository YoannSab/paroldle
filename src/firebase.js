import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCrWIxJq_5D_nU5SNgK_fbG1IEYTfQdQrs",
  authDomain: "paroldle-7ac72.firebaseapp.com",
  databaseURL: "https://paroldle-7ac72-default-rtdb.firebaseio.com",
  projectId: "paroldle-7ac72",
  storageBucket: "paroldle-7ac72.firebasestorage.app",
  messagingSenderId: "62280359190",
  appId: "1:62280359190:web:d9177bcefd4ee026220437",
  measurementId: "G-GBC5GJ742X"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, onValue, remove };
