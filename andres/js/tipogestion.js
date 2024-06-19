// Variables globales
let g_id_tipo_gestion = "";

async function agregarTipoGestion() {
  const nombre_tipo_gestion = document.getElementById("txt_nombre_tipo_gestion").value;

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const requestBody = JSON.stringify({
    nombre_tipo_gestion,
    fecha_registro: new Date().toISOString()
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: requestBody
  };

  try {
    const response = await fetch("http://144.126.210.74:8080/api/tipo_gestion", requestOptions);
    if (response.ok) {
      location.href = "listar.html";
    } else {
      console.error("Error al agregar el tipo de gestión:", response.statusText);
    }
  } catch (error) {
    console.error("Error de red:", error);
  }
}

async function listarTipoGestion() {
  const requestOptions = {
    method: "GET"
  };

  try {
    const response = await fetch("http://144.126.210.74:8080/api/tipo_gestion?_size=200", requestOptions);
    const data = await response.json();
    data.forEach(completarFila);
    $('#tbl_tipo_gestion').DataTable();
  } catch (error) {
    console.error("Error al listar los tipos de gestión:", error);
  }
}

function completarFila(element, index, arr) {
  arr[index] = document.querySelector("#tbl_tipo_gestion tbody").innerHTML +=
    `<tr>
      <td>${element.id_tipo_gestion}</td>
      <td>${element.nombre_tipo_gestion}</td>
      <td>${element.fecha_registro}</td>
      <td>
        <a href='actualizar.html?id=${element.id_tipo_gestion}' class='btn btn-warning btn-sm'>Actualizar</a>
        <a href='eliminar.html?id=${element.id_tipo_gestion}' class='btn btn-danger btn-sm'>Eliminar</a>
      </td>
    </tr>`;
}

function obtenerIdActualizar() {
  const queryString = window.location.search;
  const parametros = new URLSearchParams(queryString);
  g_id_tipo_gestion = parametros.get('id');
  obtenerDatosActualizar(g_id_tipo_gestion);
}

function obtenerIdEliminar() {
  const queryString = window.location.search;
  const parametros = new URLSearchParams(queryString);
  g_id_tipo_gestion = parametros.get('id');
  obtenerDatosEliminar(g_id_tipo_gestion);
}

async function obtenerDatosEliminar(p_id_tipo_gestion) {
  const requestOptions = {
    method: "GET"
  };

  try {
    const response = await fetch(`http://144.126.210.74:8080/api/tipo_gestion/${p_id_tipo_gestion}`, requestOptions);
    const data = await response.json();
    data.forEach(completarEtiqueta);
  } catch (error) {
    console.error("Error al obtener datos para eliminar:", error);
  }
}

async function obtenerDatosActualizar(p_id_tipo_gestion) {
  const requestOptions = {
    method: "GET"
  };

  try {
    const response = await fetch(`http://144.126.210.74:8080/api/tipo_gestion/${p_id_tipo_gestion}`, requestOptions);
    const data = await response.json();
    data.forEach(completarFormulario);
  } catch (error) {
    console.error("Error al obtener datos para actualizar:", error);
  }
}

function completarEtiqueta(element, index, arr) {
  document.getElementById('lbl_eliminar').innerHTML = `¿Desea eliminar este tipo de gestión? <b>${element.nombre_tipo_gestion}</b>`;
}

function completarFormulario(element, index, arr) {
  document.getElementById('txt_nombre_tipo_gestion').value = element.nombre_tipo_gestion;
}

async function actualizarTipoGestion() {
  const nombre_tipo_gestion = document.getElementById("txt_nombre_tipo_gestion").value;

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const requestBody = JSON.stringify({
    nombre_tipo_gestion
  });

  const requestOptions = {
    method: "PATCH",
    headers: myHeaders,
    body: requestBody
  };

  try {
    const response = await fetch(`http://144.126.210.74:8080/api/tipo_gestion/${g_id_tipo_gestion}`, requestOptions);
    if (response.ok) {
      location.href = "listar.html";
    } else {
      console.error("Error al actualizar el tipo de gestión:", response.statusText);
    }
  } catch (error) {
    console.error("Error de red:", error);
  }
}

async function eliminarTipoGestion() {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "DELETE",
    headers: myHeaders
  };

  try {
    const response = await fetch(`http://144.126.210.74:8080/api/tipo_gestion/${g_id_tipo_gestion}`, requestOptions);
    if (response.ok) {
      location.href = "listar.html";
    } else {
      console.error("Error al eliminar el tipo de gestión:", response.statusText);
    }
  } catch (error) {
    console.error("Error de red:", error);
  }
}
