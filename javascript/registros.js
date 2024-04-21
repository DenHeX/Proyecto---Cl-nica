document.addEventListener('DOMContentLoaded', function() {
    const userTable = document.getElementById('userTable');
    const rolesDropdown = document.getElementById('rolesDropdown');
    const confirmButton = document.getElementById('confirmButton');

    // Evento al hacer clic en una fila de la tabla
    userTable.addEventListener('click', function(event) {
        const selectedRow = event.target.closest('tr');
        if (selectedRow) {
            // Remover la clase 'selected' de todas las filas
            const rows = userTable.querySelectorAll('tr');
            rows.forEach(row => row.classList.remove('selected'));
            // Agregar la clase 'selected' a la fila seleccionada
            selectedRow.classList.add('selected');
        }
    });

    // Evento al hacer clic en el botón "Confirmar"
    confirmButton.addEventListener('click', function() {
        const selectedRole = rolesDropdown.options[rolesDropdown.selectedIndex].text; // Obtener texto del option seleccionado
        const selectedRow = userTable.querySelector('tr.selected');
        if (selectedRow) {
            const userEmail = selectedRow.dataset.email;
            actualizarRolUsuario(userEmail, selectedRole)
                .then(() => {
                    actualizarListaUsuarios();
                })
                .catch(error => {
                    console.error('Error al actualizar el rol del usuario:', error);
                });
        }
    });

    // Cargar usuarios al iniciar la página
    actualizarListaUsuarios();

    // Función para actualizar la lista de usuarios en la tabla
    function actualizarListaUsuarios() {
        obtenerUsuarios()
            .then(usuarios => {
                const tbody = userTable.querySelector('tbody');
                tbody.innerHTML = ''; // Limpiar el contenido del tbody
                usuarios.forEach(usuario => {
                    const row = document.createElement('tr');
                    row.dataset.email = usuario.correo;
                    row.innerHTML = `
                        <td>${usuario.correo}</td>
                        <td>${usuario.rol}</td>
                    `;
                    tbody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error al obtener usuarios:', error);
            });
    }

    // Función para obtener usuarios de la base de datos
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

    // Función para actualizar el rol de un usuario en la base de datos
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
});
