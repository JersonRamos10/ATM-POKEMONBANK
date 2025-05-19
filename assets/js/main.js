// assets/js/main.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM cargado. Pokemon Bank ATM listo.");

    // --- FUNCION PARA GENERAR COMPROBANTE PDF ---
    function generarComprobantePDF(transaccion) {
        if (!transaccion) {
            console.error("No hay datos de transaccion para generar el PDF.");
            Swal.fire("Error", "Faltan datos para generar el comprobante.", "error");
            return;
        }
        //uso de try catch para manejar los errores
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                Swal.fire("Error", "La libreria jsPDF no esta cargada.", "error");
                return;
            }
            const doc = new jsPDF();
            const usuario = obtenerUsuario();

            let yPos = 20;
            const lineHeight = 7;
            const margin = 20;

            doc.setFontSize(18);
            doc.text("Comprobante de Transaccion - Pokemon Bank", doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
            yPos += lineHeight * 2;

            doc.setLineWidth(0.5);
            doc.line(margin, yPos, doc.internal.pageSize.getWidth() - margin, yPos);
            yPos += lineHeight;

            doc.setFontSize(12);
            doc.text(`Fecha y Hora: ${transaccion.fecha || 'N/A'}`, margin, yPos);
            yPos += lineHeight;
            doc.text(`ID Transaccion: ${transaccion.id}`, margin, yPos);
            yPos += lineHeight;

            let tipoTransaccionTexto = "";
            switch (transaccion.tipo) {
                case 'deposito': tipoTransaccionTexto = "Deposito en Cuenta"; break;
                case 'retiro': tipoTransaccionTexto = "Retiro de Cuenta"; break;
                case 'pago': tipoTransaccionTexto = `Pago de Servicio: ${transaccion.servicio || 'N/A'}`; break;
                default: tipoTransaccionTexto = "Transaccion Desconocida";
            }
            doc.text(`Tipo: ${tipoTransaccionTexto}`, margin, yPos);
            yPos += lineHeight;

            doc.text(`Monto: ${formatoUSD(transaccion.monto)}`, margin, yPos);
            yPos += lineHeight;

            if (usuario) {
                doc.text(`Cuenta: ${usuario.cuenta}`, margin, yPos);
                yPos += lineHeight;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`Nuevo Saldo: ${formatoUSD(transaccion.nuevoSaldo)}`, margin, yPos);
            doc.setFont(undefined, 'normal');
            yPos += lineHeight * 2;
            
            doc.setFontSize(10);
            doc.text("Gracias por usar Pokemon Bank!", doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });

            doc.save(`comprobante_pokemon_bank_${transaccion.id}.pdf`);

            Swal.fire({
                title: "Comprobante Generado",
                text: "El comprobante PDF se ha descargado.",
                icon: "success",
                confirmButtonColor: "#ffc107"
            });

        } catch (error) {
            console.error("Error al generar PDF:", error);
            Swal.fire("Error", "Ocurrio un problema al generar el comprobante PDF.", "error");
        }
    }

    // --- FUNCIONES DE LOGICA DE TRANSACCION ---
    function realizarDeposito() {
        console.log("realizarDeposito llamada");
        const montoInput = document.getElementById("montoDeposito");
        const montoString = montoInput.value;

        const constraints = {
            monto: {
                presence: { message: "Por favor, ingrese un monto." },
                numericality: { greaterThan: 0, message: "El monto debe ser un numero positivo." }
            }
        };
        const validationResult = validate({ monto: montoString }, constraints);

        if (validationResult) {
            const errorMessage = validationResult.monto[0];
            Swal.fire("Error en el Monto", errorMessage, "error", { color: "#6EA8FE", background: "#212529", confirmButtonColor: "#ff4d4d" });
        } else {
            const montoNumerico = parseFloat(montoString);
            const transaccionExitosa = agregarTransaccion('deposito', montoNumerico, null);

            if (transaccionExitosa) {
                const todasLasTransacciones = obtenerTransacciones();
                const ultimaTransaccion = todasLasTransacciones.length > 0 ? todasLasTransacciones[todasLasTransacciones.length - 1] : null;

                Swal.fire({
                    title: "Deposito Exitoso!",
                    text: `Se ha depositado ${formatoUSD(montoNumerico)} correctamente.`,
                    icon: "success",
                    color: "#6EA8FE", background: "#212529",
                    showCancelButton: true,
                    confirmButtonColor: "#ffc107", confirmButtonText: "Aceptar",
                    cancelButtonText: "Generar Comprobante", cancelButtonColor: "#3085d6",
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.cancel) {
                        if (ultimaTransaccion) {
                            generarComprobantePDF(ultimaTransaccion);
                        } else {
                            Swal.fire("Error", "No se pudo obtener la ultima transaccion para el comprobante.", "error");
                        }
                    }
                    actualizarSaldosUI();
                    montoInput.value = "";
                    bootstrap.Modal.getInstance(document.getElementById("modalDeposito"))?.hide();
                });
            } else {
                Swal.fire("Error en la Transaccion", "No se pudo completar el deposito. Intente mas tarde.", "error", { color: "#6EA8FE", background: "#212529", confirmButtonColor: "#ff4d4d" });
            }
        }
    }
    // --- FUNCION PARA REALIZAR RETIROS ---
    function realizarRetiro() {
        console.log("realizarRetiro llamada");
        const montoInput = document.getElementById("montoRetiro");
        const montoString = montoInput.value;
        const usuario = obtenerUsuario();

        const constraints = {
            monto: {
                presence: { message: "Por favor, ingrese un monto." },
                numericality: { greaterThan: 0, message: "El monto debe ser un numero positivo." }
            }
        };
        // Validar el monto ingresado
        const validationResult = validate({ monto: montoString }, constraints);

        if (validationResult) {
            const errorMessage = validationResult.monto[0];
            Swal.fire("Error en el Monto", errorMessage, "error", { color: "#6EA8FE", background: "#212529", confirmButtonColor: "#ff4d4d" });
        } else {
            const montoNumerico = parseFloat(montoString);
            if (!usuario || montoNumerico > usuario.saldo) {
                Swal.fire("Saldo Insuficiente", `No puedes retirar ${formatoUSD(montoNumerico)} porque tu saldo actual es de ${formatoUSD(usuario ? usuario.saldo : 0)}.`, "warning", { color: "#6EA8FE", background: "#212529", confirmButtonColor: "#ffc107" });
                return;
            }
            // Verificar si el monto es un número válido
            const transaccionExitosa = agregarTransaccion('retiro', montoNumerico, null); 

            if (transaccionExitosa) {
                const todasLasTransacciones = obtenerTransacciones();
                const ultimaTransaccion = todasLasTransacciones.length > 0 ? todasLasTransacciones[todasLasTransacciones.length - 1] : null;

                Swal.fire({
                    title: "Retiro Exitoso!", 
                    text: `Se ha retirado ${formatoUSD(montoNumerico)} correctamente.`, 
                    icon: "success",
                    color: "#6EA8FE", background: "#212529",
                    showCancelButton: true,
                    confirmButtonColor: "#ffc107", confirmButtonText: "Aceptar",
                    cancelButtonText: "Generar Comprobante", cancelButtonColor: "#3085d6",
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.cancel) {
                        if (ultimaTransaccion) {
                            generarComprobantePDF(ultimaTransaccion);
                        } else {
                            Swal.fire("Error", "No se pudo obtener la ultima transaccion para el comprobante.", "error");
                        }
                    }
                    actualizarSaldosUI();
                    montoInput.value = "";
                    bootstrap.Modal.getInstance(document.getElementById("modalRetiro"))?.hide(); 
                });
            } else {
                Swal.fire("Error en la Transaccion", "No se pudo completar el retiro. Verifica tu saldo o intentalo mas tarde.", "error", { color: "#6EA8FE", background: "#212529", confirmButtonColor: "#ff4d4d" });
            }
        }
    }
    // --- FUNCION PARA REALIZAR PAGOS ---
    // Esta funcion se encarga de realizar el pago de servicios
    function realizarPago() {
        console.log("realizarPago llamada");
        const montoInput = document.getElementById("montoPago");
        const servicioSelect = document.getElementById("tipoServicio");
        const montoString = montoInput.value;
        const servicioSeleccionado = servicioSelect.value;
        const nombreServicio = servicioSelect.options[servicioSelect.selectedIndex].text;
        const usuario = obtenerUsuario();

        const constraints = {
            monto: {
                presence: { message: "Por favor, ingrese un monto." },
                numericality: { greaterThan: 0, message: "El monto debe ser un numero positivo." }
            },
            servicio: { presence: { message: "Por favor, seleccione un servicio." } }
        };
        const validationResult = validate({ monto: montoString, servicio: servicioSeleccionado }, constraints);

        if (validationResult) {
            const errorField = Object.keys(validationResult)[0];
            const errorMessage = validationResult[errorField][0];
            Swal.fire("Error en los Datos", errorMessage, "error", { color: "#6EA8FE", background: "#212529", confirmButtonColor: "#ff4d4d" });
        } else {
            const montoNumerico = parseFloat(montoString);
            if (!usuario || montoNumerico > usuario.saldo) {
                Swal.fire("Saldo Insuficiente", `No puedes pagar ${formatoUSD(montoNumerico)} por ${nombreServicio}, tu saldo es de ${formatoUSD(usuario ? usuario.saldo : 0)}.`, "warning", { color: "#6EA8FE", background: "#212529", confirmButtonColor: "#ffc107" });
                return;
            }

            const transaccionExitosa = agregarTransaccion('pago', montoNumerico, nombreServicio);

            if (transaccionExitosa) {
                const todasLasTransacciones = obtenerTransacciones();
                const ultimaTransaccion = todasLasTransacciones.length > 0 ? todasLasTransacciones[todasLasTransacciones.length - 1] : null;

                Swal.fire({
                    title: "Pago Exitoso!",
                    text: `Has pagado ${formatoUSD(montoNumerico)} por el servicio de ${nombreServicio}.`,
                    icon: "success",
                    color: "#6EA8FE", background: "#212529",
                    showCancelButton: true,
                    confirmButtonColor: "#ffc107", confirmButtonText: "Aceptar",
                    cancelButtonText: "Generar Comprobante", cancelButtonColor: "#3085d6",
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.cancel) {
                        if (ultimaTransaccion) {
                            generarComprobantePDF(ultimaTransaccion);
                        } else {
                            Swal.fire("Error", "No se pudo obtener la ultima transaccion para el comprobante.", "error");
                        }
                    }
                    actualizarSaldosUI();
                    montoInput.value = "";
                    bootstrap.Modal.getInstance(document.getElementById("modalPagos"))?.hide();
                });
            } else {
                Swal.fire("Error en la Transaccion", "No se pudo completar el pago. Verifica tu saldo o intentalo mas tarde.", "error", { color: "#6EA8FE", background: "#212529", confirmButtonColor: "#ff4d4d" });
            }
        }
    }

    

    function actualizarSaldosUI() {
        const usuarioActualizado = obtenerUsuario();
        if (usuarioActualizado) {
            const userBalanceElement = document.getElementById("userBalance");
            const consultarSaldoModalInfo = document.getElementById("saldoModalInfo");
            if (userBalanceElement) userBalanceElement.textContent = formatoUSD(usuarioActualizado.saldo);
            if (consultarSaldoModalInfo) consultarSaldoModalInfo.textContent = formatoUSD(usuarioActualizado.saldo);
        }
    }

    // --- LOGICA DE INICIALIZACION Y EVENT LISTENERS ---
    //validacion de login 
    const loginButton = document.getElementById("loginButton");
    if (loginButton) {
        loginButton.addEventListener("click", function () {
            let pinIngresado = document.getElementById("pin").value;
            const usuario = obtenerUsuario();
            if (pinIngresado && pinIngresado.length === 4 && !isNaN(pinIngresado)) {
                if (usuario && pinIngresado === usuario.pin) {
                    Swal.fire({
                         title: "Acceso Concedido!", 
                         text: `Bienvenido a Pokemon Bank, 
                         ${usuario.nombre}.`,
                          icon: "success",
                           background: '#212529', 
                           color: "#6EA8FE",
                            toast: true,
                            position: "center",
                            showConfirmButton: 
                            false,
                            timer: 2000,
                            timerProgressBar: true 
                        })
                        .then(() => { window.location.href = "index.html"; });
                }else // PIN INCORRECTO 
                    Swal.fire({
                        icon: 'error',
                        title: 'PIN Incorrecto', 
                        text: 'El PIN ingresado no es valido. Intentalo de nuevo.',
                        toast: true,
                        position: 'center', 
                        showConfirmButton: false,
                        timer: 3000, 
                        timerProgressBar: true,
                        background: '#212529', 
                        color: "#6EA8FE",
                        
                    });
                    document.getElementById("pin").focus(); 
                
            } else {
                // FORMATO DE PIN INVALIDO 
                Swal.fire({
                    icon: 'error',
                    title: 'PIN Invalido', 
                    text: 'Ingresa un PIN valido de 4 digitos numericos.', 
                    toast: true,
                    position: 'center',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    background: '#212529',
                    color: "#6EA8FE",
                });
                document.getElementById("pin").value = ""; // Limpiar el PIN si el formato es incorrecto
                document.getElementById("pin").focus(); 
            }
        });
    }

    if (window.location.pathname.includes("index.html")) {
        const usuario = obtenerUsuario();
        if (usuario) {
            document.getElementById("userName").textContent = usuario.nombre;
            document.getElementById("userPin").textContent = "****";
            document.getElementById("userAccount").textContent = usuario.cuenta;
            actualizarSaldosUI();
        } else {
            Swal.fire({ title: "Error de Sesion", text: "No se encontraron datos de usuario. Seras redirigido al login.", icon: "error", confirmButtonText: "OK" })
                .then(() => { window.location.href = "login.html"; });
        }

        document.getElementById("btnModalDeposito")?.addEventListener("click", realizarDeposito);
        document.getElementById("btnModalRetiro")?.addEventListener("click", realizarRetiro);
        document.getElementById("btnModalPagoServicios")?.addEventListener("click", realizarPago);
    }
});