// Obtener referencia al formulario de registro
const formularioRegistro = document.getElementById('registro');

// Manejar el evento de envío del formulario
formularioRegistro.addEventListener('submit', function(evento) {
    evento.preventDefault(); // Evitar que el formulario se envíe de forma predeterminada

    // Obtener los valores de los campos del formulario
    const correo = formularioRegistro.elements.email1.value;
    const contraseña = formularioRegistro.elements.password1.value;

    // Definir el rol por defecto
    const rol = 'Público';

    // Verificar si el correo ya existe en la base de datos
    verificarCorreoExistente(correo)
        .then(existe => {
            if (!existe) {
                // Si el correo no existe, guardar los datos en IndexedDB
                guardarDatosUsuario(correo, contraseña, rol);
                // Limpiar los campos del formulario después de enviar
                formularioRegistro.reset();
            } else {
                // Si el correo ya existe, mostrar un mensaje de error o tomar otra acción adecuada
                console.log('El correo ya está registrado.');
            }
        })
        .catch(error => {
            console.error('Error al verificar el correo:', error);
        });
});

// Función para verificar si el correo ya existe en la base de datos
function verificarCorreoExistente(correo) {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open('usuariosDB', 1);

        solicitud.onupgradeneeded = function(evento) {
            const db = evento.target.result;
            // Crear un almacén de objetos (object store) para los usuarios
            db.createObjectStore('usuarios', { keyPath: 'correo' });
        };

        solicitud.onsuccess = function(evento) {
            const db = evento.target.result;
            const transaccion = db.transaction(['usuarios'], 'readonly');
            const almacenObjetos = transaccion.objectStore('usuarios');
            const solicitudCorreo = almacenObjetos.get(correo);

            solicitudCorreo.onsuccess = function(evento) {
                const resultado = evento.target.result;
                resolve(!!resultado); // Devolver true si el correo ya existe, false si no
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

// Función para guardar los datos en IndexedDB
function guardarDatosUsuario(correo, contraseña, rol) {
    const solicitud = indexedDB.open('usuariosDB', 1);

    solicitud.onupgradeneeded = function(evento) {
        const db = evento.target.result;
        // Crear un almacén de objetos (object store) para los usuarios
        db.createObjectStore('usuarios', { keyPath: 'correo' });
    };

    solicitud.onsuccess = function(evento) {
        const db = evento.target.result;
        const transaccion = db.transaction(['usuarios'], 'readwrite');
        const almacenObjetos = transaccion.objectStore('usuarios');
        almacenObjetos.add({ correo: correo, contraseña: contraseña, rol: rol });

        transaccion.oncomplete = function() {
            console.log('Datos guardados correctamente en IndexedDB.');
        };
    };

    solicitud.onerror = function(evento) {
        console.error('Error al abrir la base de datos:', evento.target.error);
    };
}
