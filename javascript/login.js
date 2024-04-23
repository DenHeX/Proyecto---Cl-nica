const formularioRegistro = document.getElementById('registro');
const formularioInicioSesion = document.getElementById('sesion');

formularioRegistro.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const correo = formularioRegistro.elements.email1.value;
    const nombre = formularioRegistro.elements.nombre.value;
    const apellido = formularioRegistro.elements.apellido.value;
    const contraseña = formularioRegistro.elements.password1.value;

    const rol = 'Público';

    verificarCorreoExistente(correo)
        .then(existe => {
            if (!existe) {
                guardarDatosUsuario(nombre, apellido, correo, contraseña, rol);
                formularioRegistro.reset();
            } else {
                console.log('El correo ya está registrado.');
            }
        })
        .catch(error => {
            console.error('Error al verificar el correo:', error);
        });
});

formularioInicioSesion.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const correo = formularioInicioSesion.elements.email2.value;
    const contraseña = formularioInicioSesion.elements.password2.value;

    verificarCredencialesUsuario(correo, contraseña)
        .then(credencialesCorrectas => {
            if (credencialesCorrectas) {
                window.location.href = 'registros.html'; // Redirigir si las credenciales son correctas
            } else {
                console.log('Correo o contraseña incorrectos.');
            }
        })
        .catch(error => {
            console.error('Error al verificar las credenciales:', error);
        });
});

function verificarCorreoExistente(correo) {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open('usuariosDB', 1);

        solicitud.onupgradeneeded = function(evento) {
            const db = evento.target.result;
            db.createObjectStore('usuarios', { keyPath: 'correo' });
        };

        solicitud.onsuccess = function(evento) {
            const db = evento.target.result;
            const transaccion = db.transaction(['usuarios'], 'readonly');
            const almacenObjetos = transaccion.objectStore('usuarios');
            const solicitudCorreo = almacenObjetos.get(correo);

            solicitudCorreo.onsuccess = function(evento) {
                const resultado = evento.target.result;
                resolve(!!resultado);
            };

            solicitudCorreo.onerror = function(evento) {
                reject(evento.target.error);
            };
        };

        solicitud.onerror = function(evento) {
            reject(evento.target.error);
        };
    });
}

function guardarDatosUsuario(nombre, apellido, correo, contraseña, rol) {
    const solicitud = indexedDB.open('usuariosDB', 1);

    solicitud.onupgradeneeded = function(evento) {
        const db = evento.target.result;
        db.createObjectStore('usuarios', { keyPath: 'correo' });
    };

    solicitud.onsuccess = function(evento) {
        const db = evento.target.result;
        const transaccion = db.transaction(['usuarios'], 'readwrite');
        const almacenObjetos = transaccion.objectStore('usuarios');
        almacenObjetos.add({ nombre: nombre, apellido: apellido, correo: correo, contraseña: contraseña, rol: rol });

        transaccion.oncomplete = function() {
            console.log('Datos guardados correctamente en IndexedDB.');
        };
    };

    solicitud.onerror = function(evento) {
        console.error('Error al abrir la base de datos:', evento.target.error);
    };
}

function verificarCredencialesUsuario(correo, contraseña) {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open('usuariosDB', 1);

        solicitud.onsuccess = function(evento) {
            const db = evento.target.result;
            const transaccion = db.transaction(['usuarios'], 'readonly');
            const almacenObjetos = transaccion.objectStore('usuarios');
            const solicitudUsuario = almacenObjetos.get(correo.toLowerCase()); // Convertimos el correo a minúsculas

            solicitudUsuario.onsuccess = function(evento) {
                const usuario = evento.target.result;
                console.log('Usuario encontrado:', usuario);
                if (usuario && usuario.contraseña === contraseña && usuario.rol.toLowerCase() === 'administrator') { // Convertimos el rol a minúsculas y comparamos con 'administrator'
                    console.log('Credenciales correctas y rol de administrador.');
                    resolve(true); // Las credenciales son correctas y el rol es Administrador
                } else {
                    console.log('Credenciales incorrectas o rol incorrecto.');
                    resolve(false); // Las credenciales son incorrectas o el rol no es Administrador
                }
            };

            solicitudUsuario.onerror = function(evento) {
                console.error('Error al buscar usuario:', evento.target.error);
                reject(evento.target.error);
            };
        };

        solicitud.onerror = function(evento) {
            console.error('Error al abrir la base de datos:', evento.target.error);
            reject(evento.target.error);
        };
    });
}


