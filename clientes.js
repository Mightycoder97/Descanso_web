import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Same config
const firebaseConfig = {
    apiKey: "AIzaSyDeqbWO-Q7Xb3JlJsUxCZokPAyhHymLKBQ",
    authDomain: "desanso-5f4c6.firebaseapp.com",
    projectId: "desanso-5f4c6",
    storageBucket: "desanso-5f4c6.firebasestorage.app",
    messagingSenderId: "372972310406",
    appId: "1:372972310406:web:542650c27435ab487ca607",
    measurementId: "G-NY5NKY3KPZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // ---- Login Logic ----
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const errorMessage = document.getElementById('login-error');

    // ---- Data Table Elements ----
    const tbody = document.getElementById('clientes-tbody');
    const loadingIndicator = document.getElementById('loading-indicator');
    let clientsData = {};

    // Check if already logged in via session storage
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        loadClients();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'admin' && password === 'admin123') {
            sessionStorage.setItem('adminLoggedIn', 'true');
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
            loadClients(); // Load data once logged in
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

    function getStatusClass(status) {
        switch (status) {
            case 'Contactado': return 'status-contactado';
            case 'Cotizacion Enviada': return 'status-cotizacion';
            case 'Cancelado': return 'status-cancelado';
            case 'Atendido': return 'status-atendido';
            default: return 'status-contactado';
        }
    }

    async function loadClients() {
        loadingIndicator.style.display = 'inline';
        tbody.innerHTML = '';
        try {
            // Fetch ordered by timestamp descending
            const q = query(collection(db, "clientes"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 2rem;">No hay clientes registrados aún.</td></tr>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                clientsData[doc.id] = data;

                // Formatting Date
                let dateStr = "N/A";
                if (data.timestamp) {
                    const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                    dateStr = date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td>
                        <strong>${data.cliente?.nombre || 'Sin nombre'}</strong><br>
                        <span style="font-size: 0.8rem; color: #666;">${data.cliente?.telefono || ''}</span>
                    </td>
                    <td>${data.mascota?.nombre || ''} (${data.mascota?.especie || ''})</td>
                    <td>${data.plan?.servicio || ''}</td>
                    <td>
                        <span class="badge-status ${getStatusClass(data.estado)}">${data.estado || 'Contactado'}</span>
                    </td>
                    <td>
                        <button class="btn-admin btn-admin-primary btn-change-status" 
                            data-id="${doc.id}" 
                            data-estado="${data.estado || 'Contactado'}"
                            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; display: block; width: 100%; margin-bottom: 5px;">
                            Cambiar Estado
                        </button>
                        <button class="btn-admin btn-outline btn-print-docs" 
                            data-id="${doc.id}" 
                            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; display: block; width: 100%;">
                            Imprimir Docs
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Attach listeners to new buttons
            document.querySelectorAll('.btn-change-status').forEach(btn => {
                btn.addEventListener('click', (e) => openModal(e.target.dataset.id, e.target.dataset.estado));
            });
            document.querySelectorAll('.btn-print-docs').forEach(btn => {
                btn.addEventListener('click', (e) => openPrintModal(e.target.dataset.id));
            });

        } catch (error) {
            console.error("Error al cargar clientes: ", error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 2rem; color: red;">Error al cargar los datos.</td></tr>';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // ---- Modal Logic ----
    const modal = document.getElementById('status-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const statusForm = document.getElementById('status-form');
    const estadoSelect = document.getElementById('estado-select');
    const paymentFields = document.getElementById('payment-fields');
    const modalClientId = document.getElementById('modal-client-id');

    function openModal(id, currentStatus) {
        modalClientId.value = id;
        estadoSelect.value = currentStatus;
        togglePaymentFields(); // Check if fields should show based on current status
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        statusForm.reset();
        paymentFields.style.display = 'none';
    }

    closeModalBtn.addEventListener('click', closeModal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Show/Hide payment fields if 'Cancelado' is selected
    function togglePaymentFields() {
        if (estadoSelect.value === 'Cancelado') {
            paymentFields.style.display = 'block';
            document.getElementById('comprobante').required = true;
        } else {
            paymentFields.style.display = 'none';
            document.getElementById('comprobante').required = false;
        }
    }

    estadoSelect.addEventListener('change', togglePaymentFields);

    // Handle Form Submit
    statusForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = modalClientId.value;
        const newStatus = estadoSelect.value;
        const submitBtn = statusForm.querySelector('button[type="submit"]');

        if (!id) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        const updateData = {
            estado: newStatus
        };

        if (newStatus === 'Cancelado') {
            updateData.tipoPago = document.getElementById('tipo-pago').value;
            updateData.comprobante = document.getElementById('comprobante').value;
        }

        try {
            const docRef = doc(db, "clientes", id);
            await updateDoc(docRef, updateData);
            closeModal();
            loadClients(); // Reload table
        } catch (error) {
            console.error("Error updating document: ", error);
            alert("Error al actualizar el estado.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    });

    // ---- Print Modal & Logic ----
    const printModal = document.getElementById('print-modal');
    const closePrintModalBtn = document.getElementById('close-print-modal');
    const printClientId = document.getElementById('print-client-id');

    function openPrintModal(id) {
        printClientId.value = id;
        printModal.classList.add('active');
    }

    function closePrintModal() {
        printModal.classList.remove('active');
        printClientId.value = '';
    }

    closePrintModalBtn.addEventListener('click', closePrintModal);
    printModal.addEventListener('click', (e) => {
        if (e.target === printModal) closePrintModal();
    });

    // Handle Printing
    function executePrint(type) {
        const id = printClientId.value;
        if (!id || !clientsData[id]) return;

        const data = clientsData[id];
        const fechaTexto = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

        // Formulate presentation data from Firebase
        const printData = {
            nombre: data.cliente?.nombre || '_______________________',
            dni: data.cliente?.dni || '_______________________',
            direccion: data.cliente?.direccion || '_______________________',
            fecha: data.plan?.fecha || new Date().toLocaleDateString('es-PE'),
            plan: data.plan?.servicio || '_______________________',
            mascotaNombre: data.mascota?.nombre || '_______________________',
            especie: data.mascota?.especie || '_______________________',
            raza: data.mascota?.raza || '_______________________',
            precio: data.plan?.precio || '0.00',
            fechaTexto: fechaTexto
        };

        // Hide all templates first
        document.querySelectorAll('.print-template').forEach(el => el.classList.remove('active-print'));

        // Remove old view classes from body
        document.body.classList.remove('view-factura', 'view-contrato', 'view-certificado');

        let templateId = '';
        if (type === 'factura') {
            templateId = 'tpl-factura';
            document.body.classList.add('view-factura');
        } else if (type === 'contrato') {
            templateId = 'tpl-contrato';
            document.body.classList.add('view-contrato');
        } else if (type === 'certificado') {
            templateId = 'tpl-certificado';
            document.body.classList.add('view-certificado');
        }

        const template = document.getElementById(templateId);
        if (!template) return;

        // Populate Data manually
        if (type === 'factura') {
            template.querySelector('.f-cli-nombre').textContent = printData.nombre;
            template.querySelector('.f-cli-dni').textContent = printData.dni;
            template.querySelector('.f-cli-direccion').textContent = printData.direccion;
            template.querySelector('.f-fecha').textContent = printData.fecha;
            template.querySelector('.f-plan').textContent = printData.plan;
            template.querySelector('.f-pet-nombre').textContent = printData.mascotaNombre;
            template.querySelector('.f-precio').textContent = `S/ ${printData.precio}`;
            template.querySelector('.f-total').textContent = `S/ ${printData.precio}`;
        }
        else if (type === 'contrato') {
            template.querySelector('.c-fecha').textContent = printData.fecha;
            template.querySelector('.c-cli-nombre').textContent = printData.nombre;
            template.querySelector('.c-cli-dni').textContent = printData.dni;
            template.querySelector('.c-cli-direccion').textContent = printData.direccion;
            template.querySelector('.c-pet-nombre').textContent = printData.mascotaNombre;
            template.querySelector('.c-pet-especie').textContent = printData.especie;
            template.querySelector('.c-pet-raza').textContent = printData.raza;
            template.querySelector('.c-plan').textContent = printData.plan;
            template.querySelector('.c-precio').textContent = `S/ ${printData.precio}`;
        }
        else if (type === 'certificado') {
            template.querySelector('.cert-pet-nombre').textContent = printData.mascotaNombre;
            template.querySelector('.cert-fecha').textContent = `Lima, ${printData.fechaTexto}`;
        }

        template.classList.add('active-print');

        // Close modal and print
        closePrintModal();
        setTimeout(() => {
            window.print();
        }, 300);
    }

    document.getElementById('btn-print-factura').addEventListener('click', () => executePrint('factura'));
    document.getElementById('btn-print-contrato').addEventListener('click', () => executePrint('contrato'));
    document.getElementById('btn-print-certificado').addEventListener('click', () => executePrint('certificado'));

});
