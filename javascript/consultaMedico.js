document.addEventListener("DOMContentLoaded", function() {
    const pacientesSelect = document.getElementById("pacientes");
    const consultaForm1 = document.getElementById("consultaForm1");
    const consultaForm2 = document.getElementById("consultaForm2");
    const tableBody = document.querySelector("#tableDatos tbody");

    // Cargar las consultas en el select al cargar la página
    cargarConsultas();

    // Cargar datos de la última consulta seleccionada, si existe
    cargarDatosDesdeLocalStorage();

    // Evento al cambiar el paciente seleccionado en el select
    pacientesSelect.addEventListener("change", function() {
        const selectedConsultaId = pacientesSelect.value;
        if (selectedConsultaId !== "") {
            cargarDatosConsulta(selectedConsultaId);
        }
    });

    // Evento de envío del formulario 1 (Actualizar)
    consultaForm1.addEventListener("submit", function(event) {
        event.preventDefault();
        const selectedConsultaId = pacientesSelect.value;
        if (selectedConsultaId !== "") {
            actualizarConsulta(selectedConsultaId, consultaForm1);
        }
    });

    // Evento de envío del formulario 2 (Guardar Consulta)
    consultaForm2.addEventListener("submit", function(event) {
        event.preventDefault();
        const consulta = obtenerDatosFormulario(consultaForm2);
        if (consulta) {
            guardarConsulta(consulta);
        }
    });

    // Función para cargar las consultas en el select
    function cargarConsultas() {
        const dbNombre = "consultasDB";
        const request = window.indexedDB.open(dbNombre, 1);
    
        request.onerror = function(event) {
            console.error("Error al abrir la base de datos:", event.target.errorCode);
        };
    
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("consultas")) {
                const objectStore = db.createObjectStore("consultas", { keyPath: "id", autoIncrement: true });
                objectStore.createIndex("nombre", "nombre", { unique: false });
                // Añadir aquí los índices necesarios para otros campos si es necesario
            }
        };
    
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(["consultas"], "readonly");
            const objectStore = transaction.objectStore("consultas");
            const cursorRequest = objectStore.openCursor();
    
            pacientesSelect.innerHTML = "<option value=''>Selecciona un paciente</option>";
    
            cursorRequest.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    pacientesSelect.innerHTML += `<option value="${cursor.value.id}">${cursor.value.nombre}</option>`;
                    cursor.continue();
                }
            };
        };
    }
    

    // Función para cargar los datos de la consulta seleccionada en los formularios y la tabla
    function cargarDatosConsulta(consultaId) {
        const dbNombre = "consultasDB";
        const request = window.indexedDB.open(dbNombre, 1);

        request.onerror = function(event) {
            console.error("Error al abrir la base de datos:", event.target.errorCode);
        };

        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(["consultas"], "readonly");
            const objectStore = transaction.objectStore("consultas");
            const getRequest = objectStore.get(parseInt(consultaId));

            getRequest.onsuccess = function(event) {
                const consulta = event.target.result;
                if (consulta) {
                    // Autocompletar los campos del formulario 1
                    consultaForm1.elements["presion"].value = consulta.presion;
                    consultaForm1.elements["peso"].value = consulta.peso;
                    consultaForm1.elements["altura"].value = consulta.altura;
                    consultaForm1.elements["sintomas"].value = consulta.sintomas;
                    consultaForm1.elements["diagnostico"].value = consulta.diagnostico;
                    consultaForm1.elements["medicamentos"].value = consulta.medicamentos;
                    consultaForm1.elements["examenes"].value = consulta.examenes;
                    // Autocompletar los campos del formulario 2
                    consultaForm2.elements["Hemoglobina"].value = consulta.hemoglobina || "";
                    consultaForm2.elements["Hematocrito"].value = consulta.hematocrito || "";
                    consultaForm2.elements["Triglicéridoss"].value = consulta.trigliceridoss || "";
                    consultaForm2.elements["Colesteroltotal"].value = consulta.colesteroltotal || "";
                    consultaForm2.elements["AcidoUrico"].value = consulta.acidourico || "";
                    consultaForm2.elements["Creatinina"].value = consulta.creatinina || "";
                    consultaForm2.elements["Glucosa"].value = consulta.glucosa || "";
                    consultaForm2.elements["Eritrocitos"].value = consulta.eritrocitos || "";
                    consultaForm2.elements["Color"].value = consulta.color || "";
                    consultaForm2.elements["Leucocitos"].value = consulta.leucocitos || "";

                    // Limpiar la tabla antes de cargar nuevos datos
                    tableBody.innerHTML = "";

                    // Insertar los datos de la consulta en la tabla
                    tableBody.innerHTML += `
                        <tr>
                            <td>${consulta.presion}</td>
                            <td>${consulta.peso}</td>
                            <td>${consulta.altura}</td>
                            <td>${consulta.sintomas}</td>
                        </tr>
                    `;

                    // Guardar la ID de la consulta seleccionada en localStorage
                    localStorage.setItem("lastConsultaId", consultaId);
                } else {
                    console.error("No se encontró la consulta con ID:", consultaId);
                }
            };
        };
    }

    // Función para obtener los datos del formulario
    function obtenerDatosFormulario(formulario) {
        const consulta = {};
        const inputs = formulario.querySelectorAll("input, textarea, select");
        inputs.forEach(input => {
            consulta[input.name] = input.value;
        });
        return consulta;
    }

    // Función para actualizar la consulta en la base de datos
    function actualizarConsulta(consultaId, formulario) {
        const dbNombre = "consultasDB";
        const request = window.indexedDB.open(dbNombre, 1);

        request.onerror = function(event) {
            console.error("Error al abrir la base de datos:", event.target.errorCode);
        };

        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(["consultas"], "readwrite");
            const objectStore = transaction.objectStore("consultas");
            const getRequest = objectStore.get(parseInt(consultaId));

            getRequest.onsuccess = function(event) {
                const consulta = event.target.result;
                if (consulta) {
                    const nuevosDatos = obtenerDatosFormulario(formulario);
                    // Actualizar los datos de la consulta con los nuevos datos del formulario
                    Object.assign(consulta, nuevosDatos);
                    const updateRequest = objectStore.put(consulta);
                    updateRequest.onsuccess = function(event) {
                        console.log("Consulta actualizada exitosamente.");
                    };
                    updateRequest.onerror = function(event) {
                        console.error("Error al actualizar la consulta:", event.target.errorCode);
                    };
                } else {
                    console.error("No se encontró la consulta con ID:", consultaId);
                }
            };
        };
    }

    // Función para guardar una nueva consulta en la base de datos
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
            // Añadir aquí los índices necesarios para otros campos si es necesario
        };

        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(["consultas"], "readwrite");
            const objectStore = transaction.objectStore("consultas");

            const addRequest = objectStore.add(consulta);

            addRequest.onsuccess = function(event) {
                console.log("Consulta guardada exitosamente.");
                pacientesSelect.innerHTML = "<option value=''>Selecciona un paciente</option>";
                cargarConsultas(); // Actualizar la lista de pacientes en el select
                pacientesSelect.value = ""; // Limpiar la selección después de guardar
                consultaForm2.reset(); // Limpiar el formulario después de guardar
            };

            addRequest.onerror = function(event) {
                console.error("Error al guardar la consulta:", event.target.errorCode);
            };
        };
    }

    // Función para cargar los datos de la última consulta seleccionada desde localStorage
    function cargarDatosDesdeLocalStorage() {
        const lastConsultaId = localStorage.getItem("lastConsultaId");
        if (lastConsultaId) {
            pacientesSelect.value = lastConsultaId;
            cargarDatosConsulta(lastConsultaId);
        }
    }
});
