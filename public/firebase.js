import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Firebase 프로젝트 설정
const firebaseConfig = {
  apiKey: "AIzaSyBy00Auvz1psRo7YzfgsXrAbe50zitO5IA",
  authDomain: "wlrn111.firebaseapp.com",
  projectId: "wlrn111",
  storageBucket: "wlrn111.appspot.com",
  messagingSenderId: "542337866692",
  appId: "1:542337866692:web:4f9e24b346e438cccc2291",
  measurementId: "G-R29WJLP1FG"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
