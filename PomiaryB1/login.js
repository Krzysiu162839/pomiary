  const firebaseConfig = {
    apiKey: "AIzaSyANr1kiQuEzA03fhyyNTLSr9d7nQt8dWWU",
    authDomain: "system-b1.firebaseapp.com",
    projectId: "system-b1",
    storageBucket: "system-b1.firebasestorage.app",
    messagingSenderId: "410034258273",
    appId: "1:410034258273:web:393aefd413d4f9ca328520"
  };


firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

function login(){
  const id = document.getElementById("login").value.trim();
  const pass = document.getElementById("haslo").value;

  const email = id + "@firma.local";

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      localStorage.setItem("operatorId", id);
      window.location.href = "home.html";
    })
    .catch(e => {
      document.getElementById("err").textContent = "❌ Błąd logowania";
    });
}