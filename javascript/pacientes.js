document.addEventListener('DOMContentLoaded', function() {
    const formPaciente = document.getElementById('formPaciente');
    const pacientesDropdown = document.getElementById('pacientesDropdown');
    const btnCargar = document.getElementById('cargar'); // Obtener referencia al botón de cargar

    // Cargar pacientes al cargar la página
    cargarPacientes();

    // Función para cargar los pacientes desde la base de datos
    function cargarPacientes() {
        obtenerCitas()
            .then(citas => {
                actualizarDropdownPacientes(citas);
            })
            .catch(error => {
                console.error('Error al obtener pacientes:', error);
            });
    }

    // Obtener citas desde la base de datos
    function obtenerCitas() {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open('citasDB', 1);

            solicitud.onsuccess = function(evento) {
                const db = evento.target.result;
                const transaccion = db.transaction(['citas'], 'readonly');
                const almacenObjetos = transaccion.objectStore('citas');
                const solicitudCitas = almacenObjetos.getAll();

                solicitudCitas.onsuccess = function(evento) {
                    const citas = evento.target.result;
                    resolve(citas);
                };

                solicitudCitas.onerror = function(evento) {
                    reject(evento.target.error);
                };
            };

            solicitud.onerror = function(evento) {
                reject(evento.target.error);
            };
        });
    }

    // Actualizar opciones de pacientes en el dropdown
    function actualizarDropdownPacientes(citas) {
        pacientesDropdown.innerHTML = '';
        citas.forEach(cita => {
            const option = document.createElement('option');
            option.textContent = `${cita.nombre} ${cita.apellido}`;
            option.value = cita.id; // Almacenar el ID de la cita en el value
            pacientesDropdown.appendChild(option);
        });
    }

    formPaciente.addEventListener('submit', function(event) {
        event.preventDefault();
        cargarDatosPaciente(); // Llamar a la función para cargar los datos del paciente
    });

    // Función para cargar los datos del paciente seleccionado
    function cargarDatosPaciente() {
        const pacienteId = pacientesDropdown.value;
        const pacienteSeleccionado = pacientesDropdown.options[pacientesDropdown.selectedIndex].textContent;
    
        // Obtener la cita correspondiente al paciente seleccionado
        obtenerCitaPorId(pacienteId)
            .then(cita => {
                if (cita) {
                    // Autocompletar los campos del formulario con los datos de la cita
                    document.getElementById('nombre').value = cita.nombre || '';
                    document.getElementById('apellidos').value = cita.apellido || '';
                    document.getElementById('telefono').value = cita.telefono || '';
                    document.getElementById('peso').value = cita.peso || '';
                    document.getElementById('edad').value = cita.edad || '';
                    document.getElementById('altura').value = cita.altura || '';
                    document.getElementById('enfermedades').value = cita.enfermedades || '';
                    document.getElementById('tipoSangre').value = cita.tipoSangre || '';
                    document.getElementById('alergias').value = cita.alergias || '';
    
                    // Autocompletar los contactos de emergencia
                    const contactosEmergencia = document.getElementById('contactosEmergencia');
                    contactosEmergencia.innerHTML = ''; // Limpiar los contactos previos
                    cita.contactosEmergencia.forEach(contacto => {
                        const divContacto = document.createElement('div');
                        const labelNombre = document.createElement('label');
                        labelNombre.textContent = 'Nombre Completo:';
                        divContacto.appendChild(labelNombre);
                        const inputNombre = document.createElement('input');
                        inputNombre.type = 'text';
                        inputNombre.name = 'nombreContacto[]';
                        inputNombre.value = contacto.nombre || '';
                        divContacto.appendChild(inputNombre);
    
                        // Continuar con el resto de campos del contacto (relación, teléfono, dirección)
                        // ...
    
                        contactosEmergencia.appendChild(divContacto);
                    });
                } else {
                    alert('No se encontró información de la cita para el paciente seleccionado.');
                }
            })
            .catch(error => {
            });
    }
    
    // Obtener una cita por su ID desde la base de datos
    function obtenerCitaPorId(id) {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open('citasDB', 1);

            solicitud.onsuccess = function(evento) {
                const db = evento.target.result;
                const transaccion = db.transaction(['citas'], 'readonly');
                const almacenObjetos = transaccion.objectStore('citas');
                const solicitudCita = almacenObjetos.get(parseInt(id));

                solicitudCita.onsuccess = function(evento) {
                    const cita = evento.target.result;
                    resolve(cita);
                };

                solicitudCita.onerror = function(evento) {
                    reject(evento.target.error);
                };
            };

            solicitud.onerror = function(evento) {
                reject(evento.target.error);
            };
        });
    }

    // Agregar evento de clic al botón de cargar
    btnCargar.addEventListener('click', function() {
        cargarDatosPaciente(); // Llamar a la función para cargar los datos del paciente
    });
});
