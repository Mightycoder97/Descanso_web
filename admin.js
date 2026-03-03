import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDeqbWO-Q7Xb3JlJsUxCZokPAyhHymLKBQ",
    authDomain: "desanso-5f4c6.firebaseapp.com",
    projectId: "desanso-5f4c6",
    storageBucket: "desanso-5f4c6.firebasestorage.app",
    messagingSenderId: "372972310406",
    appId: "1:372972310406:web:542650c27435ab487ca607",
    measurementId: "G-NY5NKY3KPZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const errorMessage = document.getElementById('login-error');

    // Forms
    const clientForm = document.getElementById('client-form');

    // Login Logic
    // Check if already logged in via session storage
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Mock simple validation
        if (username === 'admin' && password === 'admin123') {
            sessionStorage.setItem('adminLoggedIn', 'true');
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
        } else {
            errorMessage.style.display = 'block';
        }
    });

    // Handle Logout 
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('adminLoggedIn');
            location.reload();
        });
    }

    // Handle Save to Firebase
    const btnGuardar = document.getElementById('btn-guardar');
    btnGuardar.addEventListener('click', async () => {
        btnGuardar.disabled = true;
        const originalText = btnGuardar.textContent;
        btnGuardar.textContent = 'Guardando...';

        const data = {
            // Client
            cliente: {
                nombre: document.getElementById('cli-nombre').value,
                dni: document.getElementById('cli-dni').value,
                telefono: document.getElementById('cli-telefono').value,
                correo: document.getElementById('cli-correo').value,
                direccion: document.getElementById('cli-direccion').value
            },
            // Pet
            mascota: {
                nombre: document.getElementById('pet-nombre').value,
                especie: document.getElementById('pet-especie').value,
                raza: document.getElementById('pet-raza').value,
                edad: document.getElementById('pet-edad').value,
                peso: document.getElementById('pet-peso').value
            },
            // Plan
            plan: {
                servicio: document.getElementById('plan-servicio').options[document.getElementById('plan-servicio').selectedIndex].text,
                precio: document.getElementById('plan-precio').value,
                fecha: document.getElementById('plan-fecha').value || new Date().toISOString()
            },
            // Estado de gestión
            estado: "Contactado",
            tipoPago: null,
            comprobante: null,
            timestamp: new Date()
        };

        try {
            const docRef = await addDoc(collection(db, "clientes"), data);
            console.log("Documento escrito con ID: ", docRef.id);
            alert("Datos guardados exitosamente en Firebase!");
        } catch (e) {
            console.error("Error al añadir documento: ", e);
            alert("Error al guardar los datos. Revisa la consola para más detalles.");
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = originalText;
        }
    });

    // End of DOMContentLoaded

});
