// assets/js/historial.js

document.addEventListener('DOMContentLoaded', function () {
    const listaTransaccionesDiv = document.getElementById('listaTransacciones');
    const filtroTipoSelect = document.getElementById('filtroTipo');

    // Define las rutas a tus imagenes de Pokemon
    const iconosPokemon = {
        deposito: 'assets/img/Pikachu.png', 
        retiro: 'assets/img/charmander.png',
        pago: 'assets/img/squirtle.png',
        fallback: 'assets/img/Poke_Ball_icon.svg' 
    };

    // Funcion para verificar si las dependencias de storage.js estan cargadas
    function verificarDependenciasStorage() {
        if (typeof obtenerTransacciones !== 'function' ||
            typeof formatoUSD !== 'function' ||
            typeof formatoFecha !== 'function') {
            console.error("Funciones de storage.js (obtenerTransacciones, formatoUSD, formatoFecha) no encontradas. Asegurate que storage.js este cargado correctamente antes que historial.js y que las funciones sean globales.");
            return false;
        }
        return true;
    }

    function mostrarTransacciones(filtro = 'todas') {
        if (!listaTransaccionesDiv) {
            console.error("Elemento listaTransacciones no encontrado.");
            return;
        }

        if (!verificarDependenciasStorage()) {
            listaTransaccionesDiv.innerHTML = '<p class="text-center text-danger fw-bold">No se pudo cargar el historial. Falta el modulo de almacenamiento o sus funciones no son accesibles.</p>';
            return;
        }

        const transacciones = obtenerTransacciones(); // Llama a la funcion global
        listaTransaccionesDiv.innerHTML = ''; // Limpiar lista previa

        let transaccionesFiltradas = transacciones;

        if (filtro !== 'todas') {
            transaccionesFiltradas = transacciones.filter(transaccion => transaccion.tipo === filtro);
        }
        
        if (transaccionesFiltradas.length === 0) {
            listaTransaccionesDiv.innerHTML = '<p class="text-center text-warning">No hay transacciones para mostrar.</p>';
            return; // Salir si no hay nada que mostrar
        }

        // Para mostrar las mas recientes primero:
        transaccionesFiltradas.slice().reverse().forEach(transaccion => {
            const card = document.createElement('div');
           
            card.classList.add('transaccion-card', transaccion.tipo); 

            const iconoSrc = iconosPokemon[transaccion.tipo] || iconosPokemon.fallback;

            let tituloTransaccion = '';
            switch (transaccion.tipo) {
                case 'deposito':
                    tituloTransaccion = `Deposito Realizado`;
                    break;
                case 'retiro':
                    tituloTransaccion = `Retiro Efectuado`;
                    break;
                case 'pago':
                    tituloTransaccion = `Pago de Servicio: ${transaccion.servicio || 'N/A'}`;
                    break;
                default:
                    tituloTransaccion = `Transaccion Desconocida`;
            }

            //  la fecha de la transaccion
            const fechaFormateada = transaccion.fecha;// Llama a la funcion global

            const montoFormateado = formatoUSD(transaccion.monto); // Llama a la funcion global
            const saldoNuevoFormateado = formatoUSD(transaccion.nuevoSaldo); // Llama a la funcion global

            let detallesHTML = `
                <div class="d-flex align-items-center">
                    <img src="${iconoSrc}" alt="${transaccion.tipo}" class="transaccion-icon me-3">
                    <div >
                        <h5 class="mb-1">${tituloTransaccion}</h5>
                        <p class=" mb-0 small">${fechaFormateada}</p>
                    </div>
                </div>
                <div class="text-end">
                    <h5 class="mb-1 ${transaccion.tipo === 'deposito' ? 'text-success' : 'text-danger'}">
                        ${transaccion.tipo === 'deposito' ? '+' : '-'} ${montoFormateado}
                    </h5>
                    <p class="mb-0 text-muted small ">Saldo: ${saldoNuevoFormateado}</p>
                </div>
            `;

            card.innerHTML = detallesHTML;
            listaTransaccionesDiv.appendChild(card);
        });
    }

    // Event listener para el selector de filtro
    if (filtroTipoSelect) {
        filtroTipoSelect.addEventListener('change', function () {
            mostrarTransacciones(this.value);
        });
    }

    // Carga inicial de transacciones
    if (verificarDependenciasStorage()) {
        mostrarTransacciones();
    } else {
        
        console.warn("Dependencias de storage.js no disponibles en la carga inicial, reintentando...");
        setTimeout(() => {
            if (verificarDependenciasStorage()) {
                mostrarTransacciones();
            } else {
                // Mensaje final si aun no carga
                if(listaTransaccionesDiv) listaTransaccionesDiv.innerHTML = '<p class="text-center text-danger fw-bold">Error definitivo: No se pudo cargar el historial porque las funciones de almacenamiento no estan disponibles.</p>';
            }
        }, 500);
    }
});