import firebase from "firebase";
require("@firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyBuqO5isOi7STdbf2y4zZsLsycirn2d9KM",
    authDomain: "biblioteca-aacad.firebaseapp.com",
    projectId: "biblioteca-aacad",
    storageBucket: "biblioteca-aacad.appspot.com",
    messagingSenderId: "349495500247",
    appId: "1:349495500247:web:50e22a1862445943dbbf92",
    measurementId: "G-WJFWEKM1VW"
};

firebase.initializeApp(firebaseConfig);

export default firebase.firestore();