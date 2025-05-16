// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCyaKfteozUrJ1Vr8XXTb63MBvoPd_K1w8",
    authDomain: "synergies-africa.firebaseapp.com",
    projectId: "synergies-africa",
    storageBucket: "synergies-africa.firebasestorage.app",
    messagingSenderId: "303096273859",
    appId: "1:303096273859:web:6ebf2b51b62c7dd7dc7b76",
    measurementId: "G-3E91HN097W",
};

export const environment = {
    production: false,
    firebase: firebaseConfig, // Nous lions votre config ici
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
