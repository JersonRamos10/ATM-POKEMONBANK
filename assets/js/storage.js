// storage.js

const USUARIO_KEY = "pkb_usuario";
const TRANS_KEY = "pkb_transacciones";

// Inicializa los datos si no existen
if (!localStorage.getItem(USUARIO_KEY)) {
    localStorage.setItem(USUARIO_KEY, JSON.stringify({
        nombre: "Ash Ketchum",
        pin: "1234", 
        cuenta: "0987654321",
        saldo: 500.00
    }));
    localStorage.setItem(TRANS_KEY, JSON.stringify([]));
}

/* Funciones de acceso a datos del usuario */
function obtenerUsuario() {
    return JSON.parse(localStorage.getItem(USUARIO_KEY));
}

function guardarUsuario(usuario) {
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

/* Funciones de acceso a transacciones */
function obtenerTransacciones() {
    return JSON.parse(localStorage.getItem(TRANS_KEY)) || []; // Devuelve array vacío si no hay nada
}

function guardarTransacciones(transacciones) {
    localStorage.setItem(TRANS_KEY, JSON.stringify(transacciones));
}


// Función para agregar transacciones
function agregarTransaccion(tipo, monto, servicio) {
    const transacciones = obtenerTransacciones();
    const usuario = obtenerUsuario();
    let nuevoSaldo = parseFloat(usuario.saldo); 

   
    const montoNumerico = parseFloat(monto);

    if (isNaN(montoNumerico) || montoNumerico <= 0 && tipo !== 'consulta') {
        console.error("Monto de transacción invalido:", monto);
       
        return false; 
    }

    if (tipo === 'deposito') {
        nuevoSaldo += montoNumerico;
    } else if (tipo === 'retiro' || tipo === 'pago') {
        if (montoNumerico > nuevoSaldo) { // Comparar con el nuevoSaldo
            console.error("Saldo insuficiente para la transacción.");
            
            return false; 
        }
        nuevoSaldo -= montoNumerico;
    }

    // objeto de transaccion
    const nuevaTransaccion = {
        id: Date.now(),
        tipo: tipo,
        monto: montoNumerico, // Guardar el monto 
        fecha: new Date().toLocaleString('es-SV', { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        }),
        saldoAnterior: usuario.saldo, 
        nuevoSaldo: nuevoSaldo
    };

    if (tipo === 'pago' && servicio) {
        nuevaTransaccion.servicio = servicio;
    }

    transacciones.push(nuevaTransaccion);
    guardarTransacciones(transacciones);

    usuario.saldo = nuevoSaldo; // Actualizar saldo del usuario
    guardarUsuario(usuario);
    return true; // Indica que la transaccion fue exitosa
}

function formatoFecha(isoString) {
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString('es-SV', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }) + ' ' + fecha.toLocaleTimeString('es-SV', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/* Formato de moneda */
function formatoUSD(n) {
    if (typeof n !== 'number') {
        n = parseFloat(n) || 0;
    }
    return n.toLocaleString("es-SV", { style: "currency", currency: "USD" });
}