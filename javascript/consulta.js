document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("consultaForm");

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const nombre = form.elements["nombre"].value;
        const presion = form.elements["presion"].value;
        const peso = parseFloat(form.elements["peso"].value);
        const altura = parseFloat(form.elements["altura"].value);
        const sintomas = form.elements["sintomas"].value;

        const consulta = {
            nombre: nombre,
            presion: presion,
            peso: peso,
            altura: altura,
            sintomas: sintomas
        };

        guardarConsulta(consulta);
    });

    function guardarConsulta(consulta) {
        const dbNombre = "consultasDB";
        const request = window.indexedDB.open(dbNombre, 1);

        request.onerror = function(event) {
            console.error("Error al abrir la base de datos:", event.target.errorCode);
        };

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            const objectStore = db.createObjectStore("consultas", { keyPath: "id", autoIncrement: true });
            objectStore.createIndex("nombre", "nombre", { unique: false });
            objectStore.createIndex("presion", "presion", { unique: false });
            objectStore.createIndex("peso", "peso", { unique: false });
            objectStore.createIndex("altura", "altura", { unique: false });
            objectStore.createIndex("sintomas", "sintomas", { unique: false });
        };

        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(["consultas"], "readwrite");
            const objectStore = transaction.objectStore("consultas");

            const addRequest = objectStore.add(consulta);

            addRequest.onsuccess = function(event) {
                console.log("Consulta guardada exitosamente.");
                form.reset(); // Resetear el formulario después de guardar la consulta
            };

            addRequest.onerror = function(event) {
                console.error("Error al guardar la consulta:", event.target.errorCode);
            };
        };
    }
});

