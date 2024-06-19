// Variables globales
var g_id_tipo_gestion = "";

// Función para agregar una nueva gestión
function agregarGestion() {
    var id_usuario = document.getElementById("sel_id_usuario").value;
    var id_cliente = document.getElementById("sel_id_cliente").value;
    var id_tipo_gestion = document.getElementById("sel_id_tipo_gestion").value;
    var id_resultado = document.getElementById("sel_id_resultado").value;
    var comentarios = document.getElementById("txt_comentarios").value;

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var fechaHoraActual = obtenerFechaHora();

    const raw = JSON.stringify({
        "id_usuario": id_usuario,
        "id_cliente": id_cliente,
        "id_tipo_gestion": id_tipo_gestion,
        "id_resultado": id_resultado,
        "comentarios": comentarios,
        "fecha_registro": fechaHoraActual
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch("http://144.126.210.74:8080/api/gestion", requestOptions)
        .then((response) => {
            if (response.status == 200) {
                location.href = "listar.html";
            } else {
                alert("Error al crear gestión");
            }
        })
        .catch((error) => console.error(error));
}

// Función para listar las gestiones
function listarGestion() {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        "query": "select ges.id_gestion as id_gestion, cli.id_cliente, ges.comentarios as comentarios, CONCAT(cli.nombres, ' ', cli.apellidos) as cliente, CONCAT(usu.nombres, ' ', usu.apellidos) as usuario, tge.nombre_tipo_gestion as nombre_tipo_gestion, res.nombre_resultado as nombre_resultado, ges.fecha_registro as fecha_registro from gestion ges, usuario usu, cliente cli, tipo_gestion tge, resultado res where ges.id_usuario = usu.id_usuario and ges.id_cliente = cli.id_cliente and ges.id_tipo_gestion = tge.id_tipo_gestion and ges.id_resultado = res.id_resultado "
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("http://144.126.210.74:8080/dynamic", requestOptions)
        .then(response => response.json())
        .then((json) => {
            json.forEach(completarFila);
            $('#tbl_gestion').DataTable();
        })
        .catch(error => console.error('Error al listar gestiones:', error));
}

// Función para completar las filas de la tabla de gestiones
function completarFila(element, index, arr) {
    arr[index] = document.querySelector("#tbl_gestion tbody").innerHTML +=
        `<tr>
        <td>${element.id_gestion}</td>
        <td>${element.usuario}</td>
        <td>${element.cliente}</td>
        <td>${element.nombre_tipo_gestion}</td>
        <td>${element.nombre_resultado}</td>
        <td>${element.comentarios}</td>
        <td>${element.fecha_registro}</td>
        <td>
        <a href='actualizar.html?id=${element.id_tipo_gestion}' class='btn btn-warning btn-sm'>Actualizar</a>
        <a href='eliminar.html?id=${element.id_tipo_gestion}' class='btn btn-danger btn-sm'>Eliminar</a>
        </td>
        </tr>`;
}

// Función para obtener el ID a actualizar desde la URL
function obtenerIdActualizar() {
    const queryString = window.location.search;
    const parametros = new URLSearchParams(queryString);
    const p_id_tipo_gestion = parametros.get('id');
    g_id_tipo_gestion = p_id_tipo_gestion;
    obtenerDatosActualizar(p_id_tipo_gestion);
}

// Función para obtener el ID a eliminar desde la URL
function obtenerIdEliminar() {
    const queryString = window.location.search;
    const parametros = new URLSearchParams(queryString);
    const p_id_tipo_gestion = parametros.get('id');
    g_id_tipo_gestion = p_id_tipo_gestion;
    obtenerDatosEliminar(p_id_tipo_gestion);
}

// Función para obtener datos del tipo de gestión a eliminar
function obtenerDatosEliminar(p_id_tipo_gestion) {
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://144.126.210.74:8080/api/tipo_gestion/" + p_id_tipo_gestion, requestOptions)
        .then((response) => response.json())
        .then((json) => completarEtiqueta(json))
        .catch((error) => console.error('Error al obtener datos para eliminar:', error));
}

// Función para completar la etiqueta de confirmación de eliminación
function completarEtiqueta(json) {
    var nombre_tipo_gestion = json.nombre_tipo_gestion;
    document.getElementById('lbl_eliminar').innerHTML = "¿Desea eliminar este tipo de gestión? <b>" + nombre_tipo_gestion + "</b>";
}

// Función para eliminar el tipo de gestión
function eliminarTipoGestion() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
        method: "DELETE",
        headers: myHeaders,
        redirect: "follow"
    };

    fetch("http://144.126.210.74:8080/api/tipo_gestion/" + g_id_tipo_gestion, requestOptions)
        .then((response) => {
            if (response.status == 200) {
                location.href = "listar.html";
            } else {
                alert("Error al eliminar tipo de gestión");
            }
        })
        .catch((error) => console.error('Error en la solicitud DELETE:', error));
}

// Función para cargar opciones de resultados en un select
function cargarSelectResultado() {
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://144.126.210.74:8080/api/resultado?_size=200", requestOptions)
        .then((response) => response.json())
        .then((json) => {
            json.forEach(completarOpcionesResultado);
        })
        .catch((error) => console.error('Error al cargar select de resultados:', error));
}

// Función para completar las opciones del select de resultados
function completarOpcionesResultado(element, index, arr) {
    arr[index] = document.querySelector("#sel_id_resultado").innerHTML +=
        `<option value='${element.id_resultado}'>${element.nombre_resultado}</option>`;
}

// Función para cargar listas desplegables al cargar la página
function cargarListasDesplegables() {
    cargarSelectResultado();
    cargarSelectCliente();
    cargarSelectUsuario();
    cargarSelectTipoGestion();
    obtenerFechaHora();
}

// Función para cargar opciones de tipos de gestión en un select
function cargarSelectTipoGestion() {
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://144.126.210.74:8080/api/tipo_gestion?_size=200", requestOptions)
        .then((response) => response.json())
        .then((json) => {
            json.forEach(completarOpcionesTipoGestion);
        })
        .catch((error) => console.error('Error al cargar select de tipos de gestión:', error));
}

// Función para completar las opciones del select de tipos de gestión
function completarOpcionesTipoGestion(element, index, arr) {
    arr[index] = document.querySelector("#sel_id_tipo_gestion").innerHTML +=
        `<option value='${element.id_tipo_gestion}'>${element.nombre_tipo_gestion}</option>`;
}

// Función para cargar opciones de usuarios en un select
function cargarSelectUsuario() {
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://144.126.210.74:8080/api/usuario?_size=200", requestOptions)
        .then((response) => response.json())
        .then((json) => {
            json.forEach(completarOpcionesUsuario);
        })
        .catch((error) => console.error('Error al cargar select de usuarios:', error));
}

// Función para completar las opciones del select de usuarios
function completarOpcionesUsuario(element, index, arr) {
    arr[index] = document.querySelector("#sel_id_usuario").innerHTML +=
        `<option value='${element.id_usuario}'>${element.apellidos} ${element.nombres}</option>`;
}

// Función para cargar opciones de clientes en un select
function cargarSelectCliente() {
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://144.126.210.74:8080/api/cliente?_size=200", requestOptions)
        .then((response) => response.json())
        .then((json) => {
            json.forEach(completarOpcionesCliente);
        })
        .catch((error) => console.error('Error al cargar select de clientes:', error));
}

// Función para completar las opcionesde clientes en el select
function completarOpcionesCliente(element,index,arr) {
arr[index] = document.querySelector("#sel_id_cliente").innerHTML +=
<option value='${element.id_cliente}'>${element.apellidos} ${element.nombres}</option>;
}

// Función para obtener la fecha y hora actual formateada
function obtenerFechaHora() {
  var fechaActual = new Date();
  var fechaFormateada = fechaActual.toLocaleString('es-ES', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/(\d+)\/(\d+)\/(\d+)\,\s*(\d+):(\d+):(\d+)/, '$3-$2-$1 $4:$5:$6');
  return fechaFormateada;
}

// Función para actualizar el tipo de gestión
function actualizarTipoGestion() {
var nombre_tipo_gestion = document.getElementById("txt_nombre_tipo_gestion").value;

const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

const raw = JSON.stringify({
"nombre_tipo_gestion": nombre_tipo_gestion
});

const requestOptions = {
method: "PATCH",
headers: myHeaders,
body: raw, 
redirect: "follow"
};

fetch("http://144.126.210.74:8080/api/tipo_gestion/" + g_id_tipo_gestion, requestOptions)
.then((response) => {
if (response.status == 200) {
location.href = "listar.html";
} else {
alert("Error al actualizar tipo de gestión");
}
})
.catch((error) => console.error('Error en la solicitud PATCH:', error));
}

// Función para cargar las listas desplegables al cargar la página
document.addEventListener("DOMContentLoaded", function() {
cargarListasDesplegables();
});
