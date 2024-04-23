document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const especialidadDropdown = document.getElementById('especialidad');
    const medicoDropdown = document.getElementById('medico');
    const horaDropdown = document.getElementById('hora');


    cargarMedicos();


    function cargarMedicos() {
        obtenerMedicos()
            .then(medicos => {
                actualizarDropdownMedicos(medicos);
            })
            .catch(error => {
                console.error('Error al obtener médicos:', error);
            });
    }


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


    function actualizarDropdownMedicos(medicos) {
        medicoDropdown.innerHTML = '';
        medicos.forEach(medico => {
            const option = document.createElement('option');
            option.textContent = `${medico.nombre} ${medico.apellido}`;
            option.value = medico.correo; 
            medicoDropdown.appendChild(option);
        });
    }


    function generarHoras() {
        horaDropdown.innerHTML = '';
        const horaInicial = 8; 
        const horaFinal = 17; 
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

        if (nombre.trim() === '' || apellido.trim() === '' || telefono.trim() === '' || fecha.trim() === '' || hora.trim() === '') {
            alert('Por favor completa todos los campos antes de ingresar la cita.');
            return;
        }
    

        verificarCitaExistente(medicoCorreo, fecha, hora)
            .then(citaExistente => {
                if (citaExistente) {
                    alert('Ya existe una cita agendada con el mismo médico a la misma hora el mismo día.');
                } else {

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
    


    function verificarCampos() {
        const inputs = form.querySelectorAll('input');
        for (const input of inputs) {
            if (input.value.trim() === '') {
                return false; 
            }
        }

        if (especialidadDropdown.value.trim() === '' || horaDropdown.value.trim() === '') {
            return false;
        }
        return true; 
    }


    function guardarCita(nombre, apellido, telefono, fecha, hora, especialidad, medicoCorreo) {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open('citasDB', 1);
    
            solicitud.onupgradeneeded = function(evento) {
                const db = evento.target.result;
                const almacenObjetos = db.createObjectStore('citas', { keyPath: 'id', autoIncrement: true });

                almacenObjetos.createIndex('medicoFechaHora', ['medicoCorreo', 'fecha', 'hora'], { unique: true });
            };
    
            solicitud.onsuccess = function(evento) {
                const db = evento.target.result;
                const transaccion = db.transaction(['citas'], 'readwrite');
                const almacenObjetos = transaccion.objectStore('citas');
    

                const indice = almacenObjetos.index('medicoFechaHora');
                const rango = IDBKeyRange.only([medicoCorreo, fecha, hora]);
                const solicitudCita = indice.get(rango);
    
                solicitudCita.onsuccess = function(evento) {
                    const citaExistente = evento.target.result;
                    if (citaExistente) {
         
                        reject('Ya existe una cita agendada con el mismo médico a la misma hora el mismo día.');
                    } else {
                   
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
