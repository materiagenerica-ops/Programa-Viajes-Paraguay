import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAzTWQRJ55YJkVtbJYgeB3G-FzK_p-yUAM",
    authDomain: "gastos-paraguay.firebaseapp.com",
    projectId: "gastos-paraguay",
    storageBucket: "gastos-paraguay.firebasestorage.app",
    messagingSenderId: "413127873268",
    appId: "1:413127873268:web:74c003ebf57fa009df84a1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias del DOM
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const balancePesosEfectivo = document.getElementById('balance-pesos-efectivo');
const balancePesosBelo = document.getElementById('balance-pesos-belo');
const balanceTotalPesos = document.getElementById('balance-total-pesos');
const balanceDolaresEfectivo = document.getElementById('balance-dolares-efectivo');

const configForm = document.getElementById('config-form');
const configPesosEfectivo = document.getElementById('config-pesos-efectivo');
const configPesosBelo = document.getElementById('config-pesos-belo');
const configDolaresEfectivo = document.getElementById('config-dolares-efectivo');

const expensePesosForm = document.getElementById('expense-pesos-form');
const pesosFecha = document.getElementById('pesos-fecha');
const pesosHora = document.getElementById('pesos-hora');
const pesosCuenta = document.getElementById('pesos-cuenta');
const pesosDetalle = document.getElementById('pesos-detalle');
const pesosMonto = document.getElementById('pesos-monto');

const expenseDolaresForm = document.getElementById('expense-dolares-form');
const dolaresFecha = document.getElementById('dolares-fecha');
const dolaresHora = document.getElementById('dolares-hora');
const dolaresDetalle = document.getElementById('dolares-detalle');
const dolaresMonto = document.getElementById('dolares-monto');

const expenseList = document.getElementById('expense-list');

const VALID_USER = "DRPEREYRA";
const VALID_PASS = "235689";

let inicialPesosEfectivo = 0;
let inicialPesosBelo = 0;
let inicialDolaresEfectivo = 0;

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        mostrarApp();
    }
    
    const ahora = new Date();
    const fechaIso = ahora.toISOString().split('T')[0];
    const horaActual = ahora.toTimeString().slice(0,5);

    if (pesosFecha) pesosFecha.value = fechaIso;
    if (pesosHora) pesosHora.value = horaActual;
    if (dolaresFecha) dolaresFecha.value = fechaIso;
    if (dolaresHora) dolaresHora.value = horaActual;
});

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user === VALID_USER && pass === VALID_PASS) {
        localStorage.setItem('isLoggedIn', 'true');
        loginError.classList.add('hidden');
        mostrarApp();
    } else {
        loginError.classList.remove('hidden');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginForm.reset();
});

function mostrarApp() {
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    sincronizarDatos();
}

// Guardar Configuración de Disponibles Iniciales
configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pEfectivo = parseFloat(configPesosEfectivo.value) || 0;
    const pBelo = parseFloat(configPesosBelo.value) || 0;
    const dEfectivo = parseFloat(configDolaresEfectivo.value) || 0;

    try {
        await setDoc(doc(db, "configuracion", "general"), {
            pesosEfectivo: pEfectivo,
            pesosBelo: pBelo,
            dolaresEfectivo: dEfectivo
        });
        alert("Montos iniciales actualizados correctamente.");
    } catch (error) {
        console.error("Error al guardar configuración:", error);
        alert("No se pudo guardar la configuración.");
    }
});

// Registrar Gasto en Pesos
expensePesosForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha = pesosFecha.value;
    const hora = pesosHora.value;
    const cuenta = pesosCuenta.value;
    const detalle = pesosDetalle.value.trim();
    const monto = parseFloat(pesosMonto.value);

    if (detalle && !isNaN(monto) && monto > 0) {
        try {
            await addDoc(collection(db, "gastos"), {
                tipo: 'pesos',
                cuenta: cuenta,
                fecha: fecha,
                hora: hora,
                detalle: detalle,
                monto: monto,
                timestamp: new Date()
            });
            expensePesosForm.reset();
            const ahora = new Date();
            pesosFecha.value = ahora.toISOString().split('T')[0];
            pesosHora.value = ahora.toTimeString().slice(0,5);
        } catch (error) {
            console.error("Error al registrar gasto en pesos:", error);
            alert("No se pudo registrar el gasto.");
        }
    }
});

// Registrar Gasto en Dólares
expenseDolaresForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha = dolaresFecha.value;
    const hora = dolaresHora.value;
    const detalle = dolaresDetalle.value.trim();
    const monto = parseFloat(dolaresMonto.value);

    if (detalle && !isNaN(monto) && monto > 0) {
        try {
            await addDoc(collection(db, "gastos"), {
                tipo: 'dolares',
                cuenta: 'efectivo',
                fecha: fecha,
                hora: hora,
                detalle: detalle,
                monto: monto,
                timestamp: new Date()
            });
            expenseDolaresForm.reset();
            const ahora = new Date();
            dolaresFecha.value = ahora.toISOString().split('T')[0];
            dolaresHora.value = ahora.toTimeString().slice(0,5);
        } catch (error) {
            console.error("Error al registrar gasto en dólares:", error);
            alert("No se pudo registrar el gasto.");
        }
    }
});

// Sincronización en tiempo real
function sincronizarDatos() {
    onSnapshot(doc(db, "configuracion", "general"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            inicialPesosEfectivo = Number(data.pesosEfectivo) || 0;
            inicialPesosBelo = Number(data.pesosBelo) || 0;
            inicialDolaresEfectivo = Number(data.dolaresEfectivo) || 0;

            if (configPesosEfectivo) configPesosEfectivo.value = inicialPesosEfectivo;
            if (configPesosBelo) configPesosBelo.value = inicialPesosBelo;
            if (configDolaresEfectivo) configDolaresEfectivo.value = inicialDolaresEfectivo;
        }
        verificarYRecalcular();
    });

    onSnapshot(collection(db, "gastos"), (snapshot) => {
        let gastos = [];
        snapshot.forEach((docItem) => {
            gastos.push({ id: docItem.id, ...docItem.data() });
        });

        gastos.sort((a, b) => new Date(`${b.fecha}T${b.hora || '00:00'}`) - new Date(`${a.fecha}T${a.hora || '00:00'}`));

        actualizarPantalla(gastos);
    });
}

// Variable global temporal para mantener la última snapshot de gastos y recalcular al vuelo
let cacheGastos = [];

function actualizarPantalla(gastos) {
    cacheGastos = gastos;
    verificarYRecalcular();
}

function verificarYRecalcular() {
    expenseList.innerHTML = "";
    let gastadoPesosEfectivo = 0;
    let gastadoPesosBelo = 0;
    let gastadoDolaresEfectivo = 0;

    if (cacheGastos.length === 0) {
        expenseList.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400">No hay gastos registrados todavía.</td></tr>`;
    }

    cacheGastos.forEach((g) => {
        const monto = Number(g.monto) || 0;
        let etiquetaMoneda = "";
        let badgeColor = "";

        if (g.tipo === 'pesos') {
            if (g.cuenta === 'belo') {
                gastadoPesosBelo += monto;
                etiquetaMoneda = '<span class="inline-flex items-center gap-1"><img src="ar.jpg" class="w-5 h-3 object-cover rounded"> Pesos (Belo)</span>';
                badgeColor = "text-cyan-300";
            } else {
                gastadoPesosEfectivo += monto;
                etiquetaMoneda = '<span class="inline-flex items-center gap-1"><img src="ar.jpg" class="w-5 h-3 object-cover rounded"> Pesos (Efectivo)</span>';
                badgeColor = "text-sky-300";
            }
        } else if (g.tipo === 'dolares') {
            gastadoDolaresEfectivo += monto;
            etiquetaMoneda = '<span class="inline-flex items-center gap-1"><img src="py.jpg" class="w-5 h-3 object-cover rounded"> Dólares (Efectivo)</span>';
            badgeColor = "text-emerald-300";
        }

        const montoFormateado = g.tipo === 'pesos' 
            ? `$ ${monto.toLocaleString('es-AR', {minimumFractionDigits: 2})} ARS`
            : `U$D ${monto.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;

        const fila = document.createElement('tr');
        fila.className = "border-b border-slate-800 hover:bg-slate-800/40 transition";
        fila.innerHTML = `
            <td class="py-3 px-4 text-slate-300 text-sm">${g.fecha || '-'} ${g.hora ? '• ' + g.hora : ''}</td>
            <td class="py-3 px-4 font-medium">${etiquetaMoneda}</td>
            <td class="py-3 px-4 text-slate-200">${g.detalle}</td>
            <td class="py-3 px-4 font-semibold ${badgeColor}">${montoFormateado}</td>
            <td class="py-3 px-4 text-center">
                <button data-id="${g.id}" class="btn-eliminar px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold rounded transition">
                    Eliminar
                </button>
            </td>
        `;
        expenseList.appendChild(fila);
    });

    // Cálculos limpios con Number()
    const disponiblePesosEfectivo = Number(inicialPesosEfectivo) - Number(gastadoPesosEfectivo);
    const disponiblePesosBelo = Number(inicialPesosBelo) - Number(gastadoPesosBelo);
    const totalFinalPesos = Number(disponiblePesosEfectivo) + Number(disponiblePesosBelo);
    const disponibleDolaresEfectivo = Number(inicialDolaresEfectivo) - Number(gastadoDolaresEfectivo);

    // Renderizar en cabecera
    balancePesosEfectivo.textContent = `$ ${disponiblePesosEfectivo.toLocaleString('es-AR', {minimumFractionDigits: 2})} ARS`;
    balancePesosBelo.textContent = `$ ${disponiblePesosBelo.toLocaleString('es-AR', {minimumFractionDigits: 2})} ARS`;
    balanceTotalPesos.textContent = `$ ${totalFinalPesos.toLocaleString('es-AR', {minimumFractionDigits: 2})} ARS`;
    balanceDolaresEfectivo.textContent = `U$D ${disponibleDolaresEfectivo.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;

    // Estilos de alerta para saldos negativos
    balancePesosEfectivo.className = disponiblePesosEfectivo < 0 ? "text-lg font-bold text-rose-400" : "text-lg font-bold text-sky-300";
    balancePesosBelo.className = disponiblePesosBelo < 0 ? "text-lg font-bold text-rose-400" : "text-lg font-bold text-cyan-300";
    balanceTotalPesos.className = totalFinalPesos < 0 ? "text-xl font-extrabold text-rose-400" : "text-xl font-extrabold text-teal-300";
    balanceDolaresEfectivo.className = disponibleDolaresEfectivo < 0 ? "text-lg font-bold text-rose-400" : "text-lg font-bold text-emerald-300";

    // Eventos eliminar
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', async (e) => {
            const idGasto = e.target.getAttribute('data-id');
            if (confirm("¿Estás seguro de que deseas eliminar este gasto?")) {
                try {
                    await deleteDoc(doc(db, "gastos", idGasto));
                } catch (error) {
                    console.error("Error al eliminar:", error);
                    alert("No se pudo eliminar el gasto.");
                }
            }
        });
    });
}
