document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const especialidadDropdown = document.getElementById('especialidad');
    const medicoDropdown = document.getElementById('medico');
    const horaDropdown = document.getElementById('hora');

    // Cargar médicos al cargar la página
    cargarMedicos();

    // Función para cargar los médicos desde la base de datos
    function cargarMedicos() {
        obtenerMedicos()
            .then(medicos => {
                actualizarDropdownMedicos(medicos);
            })
            .catch(error => {
                console.error('Error al obtener médicos:', error);
            });
    }

    // Obtener médicos desde la base de datos
    function obtenerMedicos() {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open('usuariosDB', 1);

            solicitud.onsuccess = function(evento) {
                const db = evento.target.result;
                const transaccion = db.transaction(['usuarios'], 'readonly');
                const almacenObjetos = transaccion.objectStore('usuarios');
                const solicitudMedicos = almacenObjetos.getAll();

                solicitudMedicos.onsuccess = function(evento) {
                    const usuarios = evento.target.result;
                    // Filtrar los usuarios con rol de médico
                    const medicos = usuarios.filter(usuario => usuario.rol === 'Médico');
                    resolve(medicos);
                };

                solicitudMedicos.onerror = function(evento) {
                    reject(evento.target.error);
                };
            };

            solicitud.onerror = function(evento) {
                reject(evento.target.error);
            };
        });
    }

    // Actualizar opciones de médicos en el dropdown
    function actualizarDropdownMedicos(medicos) {
        medicoDropdown.innerHTML = '';
        medicos.forEach(medico => {
            const option = document.createElement('option');
            option.textContent = `${medico.nombre} ${medico.apellido}`;
            option.value = medico.correo; // Almacenar el correo del médico en el value
            medicoDropdown.appendChild(option);
        });
    }

    // Generar opciones de horas con intervalos de 30 minutos desde las 8:00 am hasta las 5:00 pm
    function generarHoras() {
        horaDropdown.innerHTML = '';
        const horaInicial = 8; // 8:00 am
        const horaFinal = 17; // 5:00 pm
        for (let hora = horaInicial; hora <= horaFinal; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const horaString = hora.toString().padStart(2, '0');
                const minutoString = minuto.toString().padStart(2, '0');
                const horaCompleta = `${horaString}:${minutoString}`;
                const option = document.createElement('option');
                option.textContent = horaCompleta;
                option.value = horaCompleta;
                horaDropdown.appendChild(option);
            }
        }
    }

    // Generar las opciones de horas al cargar la página
    generarHoras();

    form.addEventListener('submit', function(event) {
        event.preventDefault();
    
        const nombre = document.getElementById('name').value;
        const apellido = document.getElementById('Apellidos').value;
        const telefono = document.getElementById('telefono').value;
        const fecha = document.getElementById('dropdownFecha').value;
        const hora = document.getElementById('hora').value;
        const especialidad = especialidadDropdown.value;
        const medicoCorreo = medicoDropdown.value;
    
        // Verificar que todos los campos estén llenos
        if (nombre.trim() === '' || apellido.trim() === '' || telefono.trim() === '' || fecha.trim() === '' || hora.trim() === '') {
            alert('Por favor completa todos los campos antes de ingresar la cita.');
            return;
        }
    
        // Verificar si ya existe una cita con el mismo médico, fecha y hora
        verificarCitaExistente(medicoCorreo, fecha, hora)
            .then(citaExistente => {
                if (citaExistente) {
                    alert('Ya existe una cita agendada con el mismo médico a la misma hora el mismo día.');
                } else {
                    // Guardar la cita en la base de datos
                    guardarCita(nombre, apellido, telefono, fecha, hora, especialidad, medicoCorreo)
                        .then(() => {
                            alert('La cita se ha agendado correctamente.');
                            form.reset();
                        })
                        .catch(error => {
                            alert('Error al guardar la cita en la base de datos: ' + error);
                        });
                }
            })
            .catch(error => {
                alert('Error al verificar la existencia de la cita en la base de datos: ' + error);
            });
    });
    
    function verificarCitaExistente(medicoCorreo, fecha, hora) {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open('citasDB', 1);
    
            solicitud.onsuccess = function(evento) {
                const db = evento.target.result;
                const transaccion = db.transaction(['citas'], 'readonly');
                const almacenObjetos = transaccion.objectStore('citas');
                const indice = almacenObjetos.index('medicoFechaHora');
                const rango = IDBKeyRange.only([medicoCorreo, fecha, hora]);
                const solicitudCita = indice.get(rango);
    
                solicitudCita.onsuccess = function(evento) {
                    const citaExistente = evento.target.result;
                    resolve(!!citaExistente);
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
    

    // Función para verificar que todos los campos del formulario estén llenos
    function verificarCampos() {
        const inputs = form.querySelectorAll('input');
        for (const input of inputs) {
            if (input.value.trim() === '') {
                return false; // Al menos un campo está vacío
            }
        }
        // Verificar que la especialidad y la hora estén seleccionadas
        if (especialidadDropdown.value.trim() === '' || horaDropdown.value.trim() === '') {
            return false;
        }
        return true; // Todos los campos están llenos
    }

    // Función para guardar la cita en IndexedDB
    function guardarCita(nombre, apellido, telefono, fecha, hora, especialidad, medicoCorreo) {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open('citasDB', 1);
    
            solicitud.onupgradeneeded = function(evento) {
                const db = evento.target.result;
                const almacenObjetos = db.createObjectStore('citas', { keyPath: 'id', autoIncrement: true });
                // Definir un índice para buscar citas por médico, fecha y hora
                almacenObjetos.createIndex('medicoFechaHora', ['medicoCorreo', 'fecha', 'hora'], { unique: true });
            };
    
            solicitud.onsuccess = function(evento) {
                const db = evento.target.result;
                const transaccion = db.transaction(['citas'], 'readwrite');
                const almacenObjetos = transaccion.objectStore('citas');
    
                // Verificar si ya existe una cita con el mismo médico, fecha y hora
                const indice = almacenObjetos.index('medicoFechaHora');
                const rango = IDBKeyRange.only([medicoCorreo, fecha, hora]);
                const solicitudCita = indice.get(rango);
    
                solicitudCita.onsuccess = function(evento) {
                    const citaExistente = evento.target.result;
                    if (citaExistente) {
                        // Ya existe una cita con el mismo médico, fecha y hora
                        reject('Ya existe una cita agendada con el mismo médico a la misma hora el mismo día.');
                    } else {
                        // No existe una cita previa, guardar la nueva cita
                        const nuevaCita = {
                            nombre: nombre,
                            apellido: apellido,
                            telefono: telefono,
                            fecha: fecha,
                            hora: hora,
                            especialidad: especialidad,
                            medicoCorreo: medicoCorreo
                        };
                        const solicitudGuardar = almacenObjetos.add(nuevaCita);
    
                        solicitudGuardar.onsuccess = function(evento) {
                            resolve();
                        };
    
                        solicitudGuardar.onerror = function(evento) {
                            reject(evento.target.error);
                        };
                    }
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
    
});
