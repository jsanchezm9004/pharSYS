const moneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const CLAVE_CONSECUTIVO_PEDIDOS = "pharsysPedidoConsecutivo";
const CLAVE_HISTORIAL_PEDIDOS = "pharsysHistorialPedidos";

function requiereSesionActiva() {
  const loginRedirect = window.location.pathname.includes("/farmacia-hu01/")
    ? "../login/index.html"
    : "farmacia-hu01/login/index.html";

  try {
    const sesion = JSON.parse(localStorage.getItem("pharsysSesion") || "null");
    if (!sesion) {
      window.location.replace(loginRedirect);
      return false;
    }
    return true;
  } catch (error) {
    window.location.replace(loginRedirect);
    return false;
  }
}

function leerCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem("carritoPharSYS") || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch (e) {
    return [];
  }
}

function leerPedidos() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL_PEDIDOS) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch (e) {
    return [];
  }
}

function obtenerConsecutivoPedido() {
  const actual = Number(localStorage.getItem(CLAVE_CONSECUTIVO_PEDIDOS) || "0");
  const siguiente = actual + 1;
  localStorage.setItem(CLAVE_CONSECUTIVO_PEDIDOS, String(siguiente));
  return siguiente;
}

function mostrarNumeroPedido(numeroPedido) {
  const numeroEl = document.getElementById("numeroPedido");
  if (numeroEl) numeroEl.textContent = `PH-${String(numeroPedido).padStart(5, "0")}`;
}

function guardarPedidoConfirmado(items, total) {
  const historial = leerPedidos();
  const numeroPedido = obtenerConsecutivoPedido();
  const pedido = {
    numeroPedido,
    valor: Number(total),
    fechaConfirmacion: new Date().toISOString(),
    usuario: localStorage.getItem("usuarioRecordado") || "Cliente invitado",
    items: items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      valorUnitario: Number(item.precio || 0)
    }))
  };

  historial.push(pedido);
  localStorage.setItem(CLAVE_HISTORIAL_PEDIDOS, JSON.stringify(historial));
  mostrarNumeroPedido(numeroPedido);
  return numeroPedido;
}

function descontarInventario(items) {
  const stockActualizado = (Array.isArray(inventario) ? inventario : []).map(itemInventario => ({
    nombreProducto: itemInventario.nombreProducto,
    nombreProveedor: itemInventario.nombreProveedor,
    cantidad: Number(itemInventario.cantidad || 0)
  }));

  items.forEach(item => {
    const stock = stockActualizado.find(producto => producto.nombreProducto === item.nombre);
    if (!stock) return;
    stock.cantidad = Math.max(0, stock.cantidad - Number(item.cantidad || 1));
  });

  const inventarioPersistido = stockActualizado.map(item => ({
    nombreProducto: item.nombreProducto,
    nombreProveedor: item.nombreProveedor || "",
    cantidad: String(item.cantidad)
  }));

  if (Array.isArray(inventario)) {
    inventario.length = 0;
    inventarioPersistido.forEach(item => {
      inventario.push(new Inventario(item.nombreProducto, item.nombreProveedor, item.cantidad));
    });
  }

  localStorage.setItem("pharsysInventario", JSON.stringify(inventarioPersistido));
}

function renderCheckout() {
  const carrito = leerCarrito();
  const items = carrito
    .map(item => {
      const producto = productos.find(p => p.id === Number(item.id));
      if (!producto) return null;
      return { ...producto, cantidad: Number(item.cantidad || 1) };
    })
    .filter(Boolean);

  const conteiner = document.getElementById("checkoutProductos");

  if (!items.length) {
    conteiner.innerHTML = '<div class="checkout-empty">Tu carrito está vacío. Agrega productos antes de finalizar la compra.</div>';
    document.getElementById("confirmarCompra").disabled = true;
    document.getElementById("checkoutSubtotal").textContent = "$0";
    document.getElementById("checkoutEnvio").textContent = "$0";
    document.getElementById("checkoutDescuento").textContent = "-$0";
    document.getElementById("checkoutTotal").textContent = "$0";
    return;
  }

  const subtotal = items.reduce((total, item) => total + Number(item.precio || 0) * item.cantidad, 0);
  const envio = 12000;
  const descuento = subtotal > 200000 ? subtotal * 0.1 : 0;
  const total = subtotal + envio - descuento;

  conteiner.innerHTML = items.map(item => `
    <div class="checkout-item">
      <div>
        <strong>${item.nombre}</strong>
        <small>${item.cantidad} x ${item.presentacion}</small>
      </div>
      <span>${moneda.format(Number(item.precio || 0) * item.cantidad)}</span>
    </div>
  `).join("");

  document.getElementById("checkoutSubtotal").textContent = moneda.format(subtotal);
  document.getElementById("checkoutEnvio").textContent = moneda.format(envio);
  document.getElementById("checkoutDescuento").textContent = `-${moneda.format(descuento)}`;
  document.getElementById("checkoutTotal").textContent = moneda.format(total);
  document.getElementById("confirmarCompra").disabled = false;
}

document.getElementById("confirmarCompra").addEventListener("click", () => {
  if (!requiereSesionActiva()) return;

  const estado = document.getElementById("checkoutStatus");
  const carrito = leerCarrito();
  const items = carrito
    .map(item => {
      const producto = productos.find(p => p.id === Number(item.id));
      if (!producto) return null;
      return { ...producto, cantidad: Number(item.cantidad || 1) };
    })
    .filter(Boolean);

  if (!items.length) {
    return;
  }

  const subtotal = items.reduce((total, item) => total + Number(item.precio || 0) * item.cantidad, 0);
  const envio = 12000;
  const descuento = subtotal > 200000 ? subtotal * 0.1 : 0;
  const total = subtotal + envio - descuento;

  const numeroPedido = guardarPedidoConfirmado(items, total);
  descontarInventario(items);
  localStorage.removeItem("carritoPharSYS");
  window.dispatchEvent(new CustomEvent("pharsys:cart-updated"));

  estado.hidden = false;
  estado.textContent = `¡Pedido confirmado! Número de pedido PH-${String(numeroPedido).padStart(5, "0")}. Gracias por comprar en PharSYS. REALIZA el pago a la cuenta AHORROS BANCOLOMBIA 12312300444 y envía el comprobante al correo electronico: tu-email@pharsys.com`;

  renderCheckout();
});

const ultimoPedido = leerPedidos().at(-1);
if (ultimoPedido) {
  mostrarNumeroPedido(ultimoPedido.numeroPedido);
}

if (requiereSesionActiva()) {
  renderCheckout();
}