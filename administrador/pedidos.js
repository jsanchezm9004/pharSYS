document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('orderModal');
  const openButton = document.getElementById('open-order-modal');
  const closeButton = document.getElementById('close-order-modal');
  const cancelButton = document.getElementById('cancel-order');
  const confirmButton = document.getElementById('confirm-order');
  const clientIdInput = document.getElementById('order-client-id');
  const clientSearchButton = document.getElementById('search-order-client');
  const clientResult = document.getElementById('order-client-result');
  const registerClientLink = document.getElementById('register-order-client');
  const productSearchInput = document.getElementById('order-product-search');
  const productResults = document.getElementById('order-product-results');
  const orderSummary = document.getElementById('order-summary');
  const unitCount = document.getElementById('order-unit-count');
  const grandTotal = document.getElementById('order-grand-total');
  const formMessage = document.getElementById('order-form-message');
  const moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
  const seleccion = new Map();
  let clienteIdentificacion = '';
  let clienteCorreo = '';
  let clienteNombre = '';

  if (!modal || !openButton || !confirmButton) return;

  function leerLista(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const datos = JSON.parse(raw);
    if (!Array.isArray(datos)) {
      throw new Error(`Los datos de ${key} no tienen un formato válido.`);
    }
    return datos;
  }

  function normalizarTexto(valor) {
    return String(valor || '').trim().toLocaleLowerCase('es-CO')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function establecerMensaje(elemento, texto, clase) {
    elemento.textContent = texto;
    elemento.classList.toggle('is-error', clase === 'error');
    elemento.classList.toggle('is-found', clase === 'success');
  }

  function obtenerExistencias(producto, inventario) {
    const registro = inventario.find((item) =>
      normalizarTexto(item.nombreProducto) === normalizarTexto(producto.nombre)
    );
    const cantidad = Number(registro && registro.cantidad);
    return Number.isFinite(cantidad) ? Math.max(0, cantidad) : 0;
  }

  function crearElemento(tag, className, texto) {
    const elemento = document.createElement(tag);
    if (className) elemento.className = className;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  }

  function cargarProductosDisponibles() {
    const productos = leerLista('pharsysProductos');
    const inventario = leerLista('pharsysInventario');
    return productos
      .filter((producto) => producto && Number.isFinite(Number(producto.id)) && producto.nombre)
      .map((producto) => ({
        ...producto,
        id: Number(producto.id),
        precio: Number(producto.precio),
        stock: obtenerExistencias(producto, inventario)
      }))
      .filter((producto) => producto.stock > 0);
  }

  function renderizarProductos() {
    productResults.replaceChildren();
    let disponibles;

    try {
      disponibles = cargarProductosDisponibles();
    } catch (error) {
      productResults.append(crearElemento('p', 'order-empty', error.message));
      return;
    }

    const consulta = normalizarTexto(productSearchInput.value);
    const resultados = disponibles.filter((producto) =>
      normalizarTexto(producto.nombre).includes(consulta)
    );

    if (!resultados.length) {
      productResults.append(crearElemento(
        'p',
        'order-empty',
        disponibles.length ? 'No hay artículos disponibles que coincidan con la búsqueda.' : 'No hay productos con existencias disponibles.'
      ));
      return;
    }

    resultados.forEach((producto) => {
      const cantidadSeleccionada = seleccion.get(producto.id)?.cantidad || 0;
      const fila = crearElemento('article', 'order-product-row');
      const informacion = crearElemento('div', 'order-product-info');
      informacion.append(
        crearElemento('strong', '', producto.nombre),
        crearElemento('small', '', `${moneda.format(producto.precio)} · ${producto.stock} disponibles`),
        crearElemento('small', '', `En el pedido: ${cantidadSeleccionada}`)
      );

      const agregar = crearElemento('button', 'order-add-btn', 'Agregar');
      agregar.type = 'button';
      agregar.dataset.action = 'add';
      agregar.dataset.productId = String(producto.id);
      agregar.disabled = cantidadSeleccionada >= producto.stock;
      agregar.setAttribute('aria-label', `Agregar ${producto.nombre} al pedido`);
      fila.append(informacion, agregar);
      productResults.append(fila);
    });
  }

  function renderizarResumen() {
    orderSummary.replaceChildren();
    let unidades = 0;
    let total = 0;

    seleccion.forEach((item) => {
      unidades += item.cantidad;
      total += item.precio * item.cantidad;
      const fila = crearElemento('div', 'order-summary-row');
      const informacion = crearElemento('div', 'order-summary-info');
      informacion.append(
        crearElemento('strong', '', item.nombre),
        crearElemento('small', '', `${moneda.format(item.precio)} cada uno · ${item.stock} disponibles`)
      );

      const controles = crearElemento('div', 'order-quantity-controls');
      const quitar = crearElemento('button', 'order-quantity-btn', '−');
      quitar.type = 'button';
      quitar.dataset.action = 'decrease';
      quitar.dataset.productId = String(item.id);
      quitar.setAttribute('aria-label', `Quitar una unidad de ${item.nombre}`);

      const cantidad = crearElemento('span', 'order-quantity-value', String(item.cantidad));
      cantidad.setAttribute('aria-label', 'Cantidad');

      const agregar = crearElemento('button', 'order-quantity-btn', '+');
      agregar.type = 'button';
      agregar.dataset.action = 'increase';
      agregar.dataset.productId = String(item.id);
      agregar.disabled = item.cantidad >= item.stock;
      agregar.setAttribute('aria-label', `Agregar una unidad de ${item.nombre}`);
      controles.append(quitar, cantidad, agregar);
      fila.append(informacion, controles);
      orderSummary.append(fila);
    });

    if (!seleccion.size) {
      orderSummary.append(crearElemento('p', 'order-empty', 'Aún no has agregado productos.'));
    }

    unitCount.textContent = String(unidades);
    grandTotal.textContent = moneda.format(total);
    confirmButton.disabled = !clienteCorreo || seleccion.size === 0;
  }

  function actualizarVistaPedido() {
    renderizarProductos();
    renderizarResumen();
  }

  function reiniciarFormulario() {
    seleccion.clear();
    clienteIdentificacion = '';
    clienteCorreo = '';
    clienteNombre = '';
    clientIdInput.value = '';
    clientResult.textContent = '';
    clientResult.classList.remove('is-error', 'is-found');
    registerClientLink.hidden = true;
    productSearchInput.value = '';
    formMessage.textContent = '';
    actualizarVistaPedido();
  }

  function abrirModal() {
    reiniciarFormulario();
    modal.hidden = false;
    clientIdInput.focus();
  }

  function cerrarModal() {
    modal.hidden = true;
    reiniciarFormulario();
  }

  function buscarCliente() {
    const identificacion = clientIdInput.value.trim();
    clienteIdentificacion = '';
    clienteCorreo = '';
    clienteNombre = '';
    registerClientLink.hidden = true;
    formMessage.textContent = '';

    if (!identificacion) {
      establecerMensaje(clientResult, 'Escribe la identificación del cliente.', 'error');
      renderizarResumen();
      return;
    }

    try {
      const usuario = leerLista('pharsysUsuarios').find((item) => {
        const documento = String(item.numDoc || item.documento || '').trim();
        const esCliente = !item.perfil || normalizarTexto(item.perfil) === 'cliente';
        return documento === identificacion && esCliente;
      });

      if (!usuario) {
        establecerMensaje(clientResult, 'No se encontró un cliente registrado con esa identificación.', 'error');
        registerClientLink.hidden = false;
        renderizarResumen();
        return;
      }

      const correo = String(usuario.email || usuario.correo || '').trim();
      if (!correo) {
        establecerMensaje(clientResult, 'El cliente está registrado, pero no tiene un correo asociado.', 'error');
        renderizarResumen();
        return;
      }

      const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ').trim();
      clienteIdentificacion = identificacion;
      clienteCorreo = correo;
      clienteNombre = nombre || 'Cliente sin nombre';
      establecerMensaje(clientResult, `Cliente encontrado: ${clienteNombre}`, 'success');
      renderizarResumen();
    } catch (error) {
      establecerMensaje(clientResult, error.message || 'No se pudo consultar el registro de clientes.', 'error');
      renderizarResumen();
    }
  }

  function modificarCantidad(productId, movimiento) {
    const item = seleccion.get(productId);
    if (!item) return;

    try {
      const productoActual = cargarProductosDisponibles().find((producto) => producto.id === productId);
      const stockActual = productoActual ? productoActual.stock : 0;
      const nuevaCantidad = item.cantidad + movimiento;

      if (nuevaCantidad <= 0) {
        seleccion.delete(productId);
      } else if (movimiento < 0 || nuevaCantidad <= stockActual) {
        item.cantidad = nuevaCantidad;
        item.stock = stockActual;
        seleccion.set(productId, item);
      } else {
        formMessage.textContent = `Solo hay ${stockActual} unidades disponibles de ${item.nombre}.`;
      }
      actualizarVistaPedido();
    } catch (error) {
      formMessage.textContent = error.message || 'No se pudo consultar el inventario.';
    }
  }

  function agregarProducto(productId) {
    try {
      const producto = cargarProductosDisponibles().find((item) => item.id === productId);
      if (!producto) {
        formMessage.textContent = 'Este producto ya no tiene existencias disponibles.';
        actualizarVistaPedido();
        return;
      }

      const actual = seleccion.get(productId);
      if ((actual ? actual.cantidad : 0) >= producto.stock) {
        formMessage.textContent = `No puedes agregar más de las ${producto.stock} unidades disponibles.`;
        return;
      }

      seleccion.set(productId, {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        stock: producto.stock,
        cantidad: (actual ? actual.cantidad : 0) + 1
      });
      formMessage.textContent = '';
      actualizarVistaPedido();
    } catch (error) {
      formMessage.textContent = error.message || 'No se pudo consultar el inventario.';
    }
  }

  function restaurarClaves(originales) {
    originales.forEach(([key, valor]) => {
      try {
        if (valor === null) localStorage.removeItem(key);
        else localStorage.setItem(key, valor);
      } catch (error) {
        console.error(`No se pudo restaurar ${key} después de un error al guardar el pedido.`, error);
      }
    });
  }

  function confirmarPedido() {
    if (!clienteCorreo || !seleccion.size) {
      formMessage.textContent = 'Busca un cliente registrado y agrega al menos un producto.';
      return;
    }

    try {
      const usuarios = leerLista('pharsysUsuarios');
      const clienteActual = usuarios.find((usuario) =>
        String(usuario.numDoc || usuario.documento || '').trim() === clienteIdentificacion
        && String(usuario.email || usuario.correo || '').trim() === clienteCorreo
        && (!usuario.perfil || normalizarTexto(usuario.perfil) === 'cliente')
      );
      if (!clienteActual) {
        clienteCorreo = '';
        clienteNombre = '';
        establecerMensaje(clientResult, 'El cliente ya no está disponible. Busca nuevamente su identificación.', 'error');
        renderizarResumen();
        return;
      }

      const productos = leerLista('pharsysProductos');
      const inventario = leerLista('pharsysInventario');
      const items = Array.from(seleccion.values()).map((item) => {
        const producto = productos.find((registro) => Number(registro.id) === item.id);
        const stock = producto ? obtenerExistencias(producto, inventario) : 0;
        if (!producto || stock < item.cantidad) {
          throw new Error(`${item.nombre} ya no tiene existencias suficientes. Actualiza la cantidad antes de confirmar.`);
        }
        const precio = Number(producto.precio);
        if (!Number.isFinite(precio) || precio < 0) {
          throw new Error(`El precio de ${item.nombre} no es válido.`);
        }
        return {
          id: item.id,
          nombre: producto.nombre,
          cantidad: item.cantidad,
          valorUnitario: precio
        };
      });

      const subtotal = items.reduce((suma, item) => suma + item.valorUnitario * item.cantidad, 0);
      const pedidos = leerLista('pharsysHistorialPedidos');
      const consecutivoGuardado = Number(localStorage.getItem('pharsysPedidoConsecutivo') || 0);
      const consecutivoActual = Number.isFinite(consecutivoGuardado) ? consecutivoGuardado : 0;
      const numeroMayor = pedidos.reduce((mayor, pedido) => Math.max(mayor, Number(pedido.numeroPedido) || 0), 0);
      const numeroPedido = Math.max(consecutivoActual, numeroMayor) + 1;
      const fecha = new Date().toISOString();
      const pedido = {
        numeroPedido,
        valor: subtotal,
        fechaPedido: fecha,
        fechaConfirmacion: fecha,
        usuario: clienteCorreo,
        email: clienteCorreo,
        cliente: clienteNombre,
        estado: 'Pendiente',
        aprobado: false,
        despachado: false,
        items
      };

      const cantidadesPorNombre = new Map(items.map((item) => [normalizarTexto(item.nombre), item.cantidad]));
      const inventarioActualizado = inventario.map((registro) => {
        const nombre = normalizarTexto(registro.nombreProducto);
        if (!cantidadesPorNombre.has(nombre)) return registro;
        const cantidad = Number(registro.cantidad);
        const descontar = cantidadesPorNombre.get(nombre);
        cantidadesPorNombre.delete(nombre);
        return {
          ...registro,
          cantidad: String(cantidad - descontar)
        };
      });
      const claves = ['pharsysInventario', 'pharsysHistorialPedidos', 'pharsysPedidoConsecutivo'];
      const originales = claves.map((key) => [key, localStorage.getItem(key)]);

      try {
        localStorage.setItem('pharsysInventario', JSON.stringify(inventarioActualizado));
        localStorage.setItem('pharsysHistorialPedidos', JSON.stringify([...pedidos, pedido]));
        localStorage.setItem('pharsysPedidoConsecutivo', String(numeroPedido));
      } catch (error) {
        restaurarClaves(originales);
        throw new Error(`No se pudo guardar el pedido y actualizar el inventario: ${error.message}`);
      }

      window.dispatchEvent(new CustomEvent('pharsys:pedidos-updated', { detail: { numeroPedido } }));
      window.dispatchEvent(new CustomEvent('pharsys:catalogo-updated'));
      cerrarModal();

      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = `Pedido PH-${String(numeroPedido).padStart(5, '0')} registrado correctamente.`;
        toast.classList.add('is-visible');
        window.clearTimeout(confirmarPedido.toastTimer);
        confirmarPedido.toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
      }
    } catch (error) {
      formMessage.textContent = error.message || 'No fue posible registrar el pedido.';
    }
  }

  openButton.addEventListener('click', abrirModal);
  closeButton.addEventListener('click', cerrarModal);
  cancelButton.addEventListener('click', cerrarModal);
  clientSearchButton.addEventListener('click', buscarCliente);
  clientIdInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') buscarCliente();
  });
  clientIdInput.addEventListener('input', () => {
    if (clientIdInput.value.trim() !== clienteIdentificacion) {
      clienteIdentificacion = '';
      clienteCorreo = '';
      clienteNombre = '';
      registerClientLink.hidden = true;
      clientResult.textContent = '';
      clientResult.classList.remove('is-error', 'is-found');
      renderizarResumen();
    }
  });
  productSearchInput.addEventListener('input', renderizarProductos);
  productResults.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="add"]');
    if (button) agregarProducto(Number(button.dataset.productId));
  });
  orderSummary.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="increase"], [data-action="decrease"]');
    if (!button) return;
    modificarCantidad(
      Number(button.dataset.productId),
      button.dataset.action === 'increase' ? 1 : -1
    );
  });
  confirmButton.addEventListener('click', confirmarPedido);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) cerrarModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) cerrarModal();
  });
});
