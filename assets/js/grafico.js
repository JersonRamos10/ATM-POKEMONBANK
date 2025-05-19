// assets/js/grafico.js

// 
document.addEventListener("DOMContentLoaded", function () {
    var ctx = document.getElementById('graficoTransacciones').getContext('2d');

// Verifica si la funcion obtenerTransacciones esta disponible
    if (typeof obtenerTransacciones !== 'function') {
        console.error("La funcion obtenerTransacciones() de storage.js no esta disponible. Asegurate que storage.js este cargado antes que grafico.js.");
        
        const canvasContainer = document.getElementById('graficoTransacciones')?.parentElement;
        if (canvasContainer) {
            canvasContainer.innerHTML = '<p class="text-center text-danger fw-bold">No se pudieron cargar los datos para el grafico. Modulo de almacenamiento no encontrado.</p>';
        }
        return; // Detener la ejecucion si no se pueden cargar las transacciones
    }

    const transacciones = obtenerTransacciones(); // Desde storage.js

    // Contadores para cada tipo de transaccion
    let contadorDepositos = 0;
    let contadorRetiros = 0;
    let contadorPagos = 0;

    // Itera sobre las transacciones para contar cada tipo
    transacciones.forEach(transaccion => {
        switch (transaccion.tipo) {
            case 'deposito':
                contadorDepositos++;
                break;
            case 'retiro':
                contadorRetiros++;
                break;
            case 'pago':
                contadorPagos++;
                break;
        
        }
    });

    // Datos para el grafico basados en las transacciones 
    const datosReales = [contadorDepositos, contadorRetiros, contadorPagos];

    // Crea y muestra el grafico con Chart.js
    var transaccionesChart = new Chart(ctx, {
        type: 'bar', // Tipo de grafico
        data: {
            labels: ['Depositos', 'Retiros', 'Pagos de Servicio'],
            datasets: [{
                label: 'Numero de transacciones', 
                data: datosReales, 
                backgroundColor: [
                    'rgba(255, 206, 86, 0.7)',   // Amarillo - Depositos
                    'rgba(255, 99, 132, 0.7)',  // Rojo - Retiros
                    'rgba(54, 162, 235, 0.7)'   // Azul - Pagos
                ],
                borderColor: [
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#ffffff',
                        precision: 0 
                    }
                },
                x: {
                    ticks: {
                        color: '#ffffff' 
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff', 
                        font: {
                            size: 14
                        }
                    }
                },
                title: { 
                    display: true,
                    text: 'Distribucion de Transacciones por Tipo', 
                    color: '#ffffff',
                    font: {
                        size: 18
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        }
    });
});