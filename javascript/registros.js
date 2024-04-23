document.addEventListener('DOMContentLoaded', function() {
    const userTable = document.getElementById('userTable');
    const rolesDropdown = document.getElementById('rolesDropdown');
    const confirmButton = document.getElementById('confirmButton');
    const especialidadesDropdown = document.getElementById('especialidadesDropdown');
    const especialidadesDiv = document.getElementById('especialidades');
    const confirmEspecialidadButton = document.getElementById('confirmEspecialidadButton');

    let usuariosConRolMedico = new Set(); 
    let usuariosConEspecialidad = new Set(); 


    function cargarUsuarios() {
        obtenerUsuarios()
            .then(usuarios => {
                usuariosConRolMedico.clear();
                usuariosConEspecialidad.clear();
                const tbody = userTable.querySelector('tbody');
                tbody.innerHTML = '';
                usuarios.forEach(usuario => {
                    const row = document.createElement('tr');
                    row.dataset.email = usuario.correo;
                    row.innerHTML = `
                        <td>${usuario.nombre}</td>
                        <td>${usuario.apellido}</td>
                        <td>${usuario.correo}</td>
                        <td>${usuario.rol}</td>
                    `;
                    tbody.appendChild(row);
                    if (usuario.rol === 'Médico') {
                        usuariosConRolMedico.add(usuario.correo);
                        row.querySelector('td:nth-child(4)').setAttribute('disabled', 'disabled');
                    }
                    if (usuario.especialidad && usuario.especialidad.length > 0) {
                        usuariosConEspecialidad.add(usuario.correo);
                    }
                });
            })
            .catch(error => {
                console.error('Error al obtener usuarios:', error);
            });
    }


    cargarUsuarios();

    userTable.addEventListener('click', function(event) {
        const selectedRow = event.target.closest('tr');
        if (selectedRow) {
            const rows = userTable.querySelectorAll('tr');
            rows.forEach(row => row.classList.remove('selected'));
            selectedRow.classList.add('selected');
            const selectedRole = selectedRow.querySelector('td:nth-child(4)').textContent;
            if (selectedRole.trim() === 'Médico') {
                especialidadesDiv.style.display = 'block';
                const userEmail = selectedRow.dataset.email;
                if (usuariosConRolMedico.has(userEmail)) {
                    rolesDropdown.disabled = true;
                }
            } else {
                especialidadesDiv.style.display = 'none';
            }
        }
    });

    confirmButton.addEventListener('click', function() {
        const selectedRow = userTable.querySelector('tr.selected');
        if (selectedRow) {
            const userEmailCell = selectedRow.querySelector('td:nth-child(3)');
            const userEmail = userEmailCell.textContent.trim();
            if (!usuariosConRolMedico.has(userEmail)) {
                const selectedRole = rolesDropdown.options[rolesDropdown.selectedIndex].text;
                if (selectedRole === 'Médico') {
                    usuariosConRolMedico.add(userEmail);
                    rolesDropdown.disabled = true;
                    especialidadesDiv.style.display = 'block';
                } else {
                    rolesDropdown.disabled = false;
                    especialidadesDiv.style.display = 'none';
                }
                actualizarRolUsuario(userEmail, selectedRole)
                    .then(() => {
                        if (selectedRole !== 'Médico') {
                            confirmEspecialidadButton.disabled = true;
                        }
                        cargarUsuarios();
                    })
                    .catch(error => {
                        console.error('Error al actualizar el rol del usuario:', error);
                    });
            } else {
                console.log('Este usuario ya tiene asignado el rol de Médico.');
            }
        }
    });
    
    confirmEspecialidadButton.addEventListener('click', function() {
        const selectedRow = userTable.querySelector('tr.selected');
        if (selectedRow && selectedRow.querySelector('td:nth-child(4)').textContent.trim() === 'Médico') {
            const userEmailCell = selectedRow.querySelector('td:nth-child(3)'); 
            const userEmail = userEmailCell.textContent.trim(); 
            const selectedEspecialidad = especialidadesDropdown.options[especialidadesDropdown.selectedIndex].text;
            if (selectedEspecialidad) {
                if (!usuariosConEspecialidad.has(userEmail)) {
                    usuariosConEspecialidad.add(userEmail);
                    especialidadesDropdown.disabled = true;
                    agregarEspecialidadAMedico(userEmail, selectedEspecialidad)
                        .then(() => {
                            cargarUsuarios(); 
                            especialidadesDiv.style.display = 'none';
                        })
                        .catch(error => {
                            console.error('Error al agregar especialidad al médico:', error);
                        });
                } else {
                    console.log('El usuario ya tiene una especialidad asignada.');
                }
            }
        }
    });

    function obtenerUsuarios() {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open('usuariosDB', 1);

            solicitud.onsuccess = function(evento) {
                const db = evento.target.result;
                const transaccion = db.transaction(['usuarios'], 'readonly');
                const almacenObjetos = transaccion.objectStore('usuarios');
                const solicitudUsuarios = almacenObjetos.getAll();

                solicitudUsuarios.onsuccess = function(evento) {
                    const usuarios = evento.target.result;
                    resolve(usuarios);
                };

                solicitudUsuarios.onerror = function(evento) {
                    reject(evento.target.error);
                };
            };

            solicitud.onerror = function(evento) {
                reject(evento.target.error);
            };
        });
    }

    function actualizarRolUsuario(correo, nuevoRol) {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open('usuariosDB', 1);

            solicitud.onsuccess = function(evento) {
                const db = evento.target.result;
                const transaccion = db.transaction(['usuarios'], 'readwrite');
                const almacenObjetos = transaccion.objectStore('usuarios');
                const solicitudUsuario = almacenObjetos.get(correo);

                solicitudUsuario.onsuccess = function(evento) {
                    const usuario = evento.target.result;
                    if (usuario) {
                        usuario.rol = nuevoRol;
                        const actualizacion = almacenObjetos.put(usuario);
                        actualizacion.onsuccess = function() {
                            resolve();
                        };
                        actualizacion.onerror = function(evento) {
                            reject(evento.target.error);
                        };
                    } else {
                        reject('Usuario no encontrado');
                    }
                };

                solicitudUsuario.onerror = function(evento) {
                    reject(evento.target.error);
                };
            };

            solicitud.onerror = function(evento) {
                reject(evento.target.error);
            };
        });
    }

    function agregarEspecialidadAMedico(correo, especialidad) {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open('usuariosDB', 1);

            solicitud.onsuccess = function(evento) {
                const db = evento.target.result;
                const transaccion = db.transaction(['usuarios'], 'readwrite');
                const almacenObjetos = transaccion.objectStore('usuarios');
                const solicitudUsuario = almacenObjetos.get(correo);

                solicitudUsuario.onsuccess = function(evento) {
                    const usuario = evento.target.result;
                    if (usuario) {
                        if (!usuario.especialidad) {
                            usuario.especialidad = [];
                        }
                        usuario.especialidad.push(especialidad);
                        const actualizacion = almacenObjetos.put(usuario);
                        actualizacion.onsuccess = function() {
                            resolve();
                        };
                        actualizacion.onerror = function(evento) {
                            reject(evento.target.error);
                        };
                    } else {
                        reject('Usuario no encontrado');
                    }
                };

                solicitudUsuario.onerror = function(evento) {
                    reject(evento.target.error);
                };
            };

            solicitud.onerror = function(evento) {
                reject(evento.target.error);
            };
        });
    }
});
