// Función para agregar cliente
function agregarCliente() {
  var txt_id_cliente = document.getElementById("txt_id_cliente").value;
  var txt_dv = document.getElementById("txt_dv").value;
  var txt_nombres = document.getElementById("txt_nombres").value;
  var txt_apellidos = document.getElementById("txt_apellidos").value;
  var txt_email = document.getElementById("txt_email").value;
  var txt_celular = document.getElementById("txt_celular").value;

  // Validar campos obligatorios
  if (!txt_id_cliente || !txt_nombres || !txt_apellidos || !txt_email || !txt_celular) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
  }

  // Construir objeto cliente
  const cliente = {
      id_cliente: txt_id_cliente,
      dv: txt_dv,
      nombres: txt_nombres,
      apellidos: txt_apellidos,
      email: txt_email,
      celular: txt_celular,
      fecha_registro: new Date().toISOString()  // Fecha actual
  };

  // Configurar solicitud HTTP
  const requestOptions = {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(cliente)
  };

  // Enviar solicitud al servidor
  fetch('http://144.126.210.74:8080/api/cliente', requestOptions)
      .then(response => response.json())
      .then(data => {
          console.log('Cliente agregado:', data);
          alert('Cliente agregado exitosamente.');
          // Limpiar formulario después de éxito
          document.getElementById('crearClienteForm').reset();
          // Cerrar modal de creación de cliente
          var modal = bootstrap.Modal.getInstance(document.getElementById('crearClienteModal'));
          modal.hide();
          // Actualizar lista de clientes (opcional)
          listarClientes(); // Implementar función listarClientes() para actualizar la tabla
      })
      .catch(error => {
          console.error('Error al agregar cliente:', error);
          alert('Hubo un error al agregar el cliente. Por favor, inténtelo nuevamente.');
      });
}

// Función para listar clientes (por implementar)
function listarClientes() {

}
