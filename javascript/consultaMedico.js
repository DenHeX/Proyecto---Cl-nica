document.addEventListener("DOMContentLoaded", function() {
    const pacientesSelect = document.getElementById("pacientes");
    const consultaForm1 = document.getElementById("consultaForm1");
    const consultaForm2 = document.getElementById("consultaForm2");
    const tableBody = document.querySelector("#tableDatos tbody");


    cargarConsultas();

    cargarDatosDesdeLocalStorage();

    pacientesSelect.addEventListener("change", function() {
        const selectedConsultaId = pacientesSelect.value;
        if (selectedConsultaId !== "") {
            cargarDatosConsulta(selectedConsultaId);
        }
    });

    consultaForm1.addEventListener("submit", function(event) {
        event.preventDefault();
        const selectedConsultaId = pacientesSelect.value;
        if (selectedConsultaId !== "") {
            actualizarConsulta(selectedConsultaId, consultaForm1);
        }
    });

    consultaForm2.addEventListener("submit", function(event) {
        event.preventDefault();
        const consulta = obtenerDatosFormulario(consultaForm2);
        if (consulta) {
            guardarConsulta(consulta);
        }
    });

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
          
                    consultaForm1.elements["presion"].value = consulta.presion;
                    consultaForm1.elements["peso"].value = consulta.peso;
                    consultaForm1.elements["altura"].value = consulta.altura;
                    consultaForm1.elements["sintomas"].value = consulta.sintomas;
                    consultaForm1.elements["diagnostico"].value = consulta.diagnostico;
                    consultaForm1.elements["medicamentos"].value = consulta.medicamentos;
                    consultaForm1.elements["examenes"].value = consulta.examenes;
              
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

             
                    tableBody.innerHTML = "";

            
                    tableBody.innerHTML += `
                        <tr>
                            <td>${consulta.presion}</td>
                            <td>${consulta.peso}</td>
                            <td>${consulta.altura}</td>
                            <td>${consulta.sintomas}</td>
                        </tr>
                    `;

                    localStorage.setItem("lastConsultaId", consultaId);
                } else {
                    console.error("No se encontró la consulta con ID:", consultaId);
                }
            };
        };
    }


    function obtenerDatosFormulario(formulario) {
        const consulta = {};
        const inputs = formulario.querySelectorAll("input, textarea, select");
        inputs.forEach(input => {
            consulta[input.name] = input.value;
        });
        return consulta;
    }


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
     
        };

        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(["consultas"], "readwrite");
            const objectStore = transaction.objectStore("consultas");

            const addRequest = objectStore.add(consulta);

            addRequest.onsuccess = function(event) {
                console.log("Consulta guardada exitosamente.");
                pacientesSelect.innerHTML = "<option value=''>Selecciona un paciente</option>";
                cargarConsultas(); 
                pacientesSelect.value = ""; 
                consultaForm2.reset(); 
            };

            addRequest.onerror = function(event) {
                console.error("Error al guardar la consulta:", event.target.errorCode);
            };
        };
    }

    function cargarDatosDesdeLocalStorage() {
        const lastConsultaId = localStorage.getItem("lastConsultaId");
        if (lastConsultaId) {
            pacientesSelect.value = lastConsultaId;
            cargarDatosConsulta(lastConsultaId);
        }
    }
});
