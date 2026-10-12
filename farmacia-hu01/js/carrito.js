// ===== Carrito principal (agregar, ver, eliminar y cambiar cantidad) =====
const CLAVE_CARRITO = "carritoPharSYS";

function normalizarCarrito(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .map(item => {
      if (typeof item === "object" && item !== null && "id" in item) {
        const id = Number(item.id);
        const cantidad = Math.max(1, Number(item.cantidad || 1));
        return Number.isFinite(id) ? { id, cantidad } : null;
      }
      const id = Number(item);
      return Number.isFinite(id) ? { id, cantidad: 1 } : null;
    })
    .filter(Boolean);
}

function leerCarrito() {
  try {
    return normalizarCarrito(JSON.parse(localStorage.getItem(CLAVE_CARRITO) || "[]"));
  } catch (e) {
    return [];
  }
}

function guardarCarrito(lista) {
  const normalizado = normalizarCarrito(lista);
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(normalizado)); } catch (e) {}
  window.dispatchEvent(new CustomEvent("pharsys:cart-updated"));
}

function actualizarContadorCarrito() {
  const total = leerCarrito().reduce((suma, item) => suma + item.cantidad, 0);
  document.querySelectorAll(".cart-count, .cart-count-badge").forEach(el => {
    el.textContent = String(total);
  });
}

window.addEventListener("pharsys:cart-updated", actualizarContadorCarrito);
window.addEventListener("DOMContentLoaded", actualizarContadorCarrito);

function agregarAlCarrito(id, cantidad = 1) {
  const lista = leerCarrito();
  const idNumero = Number(id);
  const cantidadNumero = Math.max(1, Number(cantidad) || 1);
  const itemExistente = lista.find(item => item.id === idNumero);

  if (itemExistente) {
    itemExistente.cantidad += cantidadNumero;
  } else {
    lista.push({ id: idNumero, cantidad: cantidadNumero });
  }

  guardarCarrito(lista);
  return true;
}

function cambiarCantidad(id, delta) {
  const lista = leerCarrito();
  const item = lista.find(producto => producto.id === Number(id));
  if (!item) return false;

  item.cantidad = Math.max(1, item.cantidad + Number(delta));
  guardarCarrito(lista);
  return item.cantidad;
}

function quitarDelCarrito(id) {
  guardarCarrito(leerCarrito().filter(item => item.id !== Number(id)));
}

function pintarCarrito() {
  const lista = document.getElementById("listaCarrito");
  if (!lista) return;

  const items = leerCarrito()
    .map(item => {
      const producto = productos.find(p => p.id === item.id);
      if (!producto) return null;
      return { ...producto, cantidad: item.cantidad };
    })
    .filter(Boolean);

  if (items.length === 0) {
    lista.innerHTML = '<div class="cart-empty"><p>Tu carrito está vacío.</p><a href="farmacia-hu01/index.html">Ver productos</a></div>';
    return;
  }

  lista.innerHTML = items.map(producto => {
    const claseThumb = producto.categoria === "Vitaminas"
      ? "thumb-mint"
      : producto.categoria === "Primeros auxilios"
        ? "thumb-green"
        : "thumb-azure";

    return `
      <article class="cart-item product-cart-card">
        <div class="product-thumb ${claseThumb}" aria-hidden="true">
          <span class="pill pill-large"></span>
          <span class="pill pill-small"></span>
        </div>

        <div class="product-info">
          <div class="item-head">
            <div>
              <h2>${producto.nombre}</h2>
              <p>${producto.presentacion} · ${producto.laboratorio}</p>
            </div>
            <button class="text-button remove-item" data-quitar="${producto.id}">Eliminar</button>
          </div>

          <div class="item-meta">
            <span class="stock-badge"><span class="dot"></span>En stock</span>
            <div class="price-wrap">
              <span class="unit-price">${formatoPrecio(producto.precio * producto.cantidad)}</span>
              <div class="qty-control" aria-label="Cantidad del producto">
                <button class="qty-btn decrement" data-cantidad="${producto.id}" data-movimiento="-1" aria-label="Disminuir cantidad">−</button>
                <span class="qty-value">${producto.cantidad}</span>
                <button class="qty-btn increment" data-cantidad="${producto.id}" data-movimiento="1" aria-label="Aumentar cantidad">+</button>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

const listaCarrito = document.getElementById("listaCarrito");
if (listaCarrito) {
  pintarCarrito();
  listaCarrito.addEventListener("click", e => {
    const botonEliminar = e.target.closest("[data-quitar]");
    if (botonEliminar) {
      quitarDelCarrito(Number(botonEliminar.dataset.quitar));
      pintarCarrito();
      return;
    }

    const botonCantidad = e.target.closest("[data-cantidad]");
    if (!botonCantidad) return;

    const id = Number(botonCantidad.dataset.cantidad);
    const movimiento = Number(botonCantidad.dataset.movimiento || 0);
    cambiarCantidad(id, movimiento);
    pintarCarrito();
  });
}
