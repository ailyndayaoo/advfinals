import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; 

  

const firebaseConfig = {
  apiKey: "AIzaSyAfnIMDnwu8KR_X6b7yfpz_CWH-cpDW-0E",
  authDomain: "advfinals.firebaseapp.com",
  databaseURL: "https://advfinals-default-rtdb.firebaseio.com/",
  projectId: "advfinals",
  storageBucket: "advfinals.appspot.com",
  messagingSenderId: "485483092395",
  appId: "1:485483092395:web:44e4ad86e662f2631c9aee",
  measurementId: "G-VPJJET5P4M"
};
const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app); 

export { app, db, auth, storage };
