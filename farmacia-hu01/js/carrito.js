// ===== Carrito básico (solo agregar, ver y eliminar) =====
// Los productos agregados se guardan en el navegador para que se vean en carrito.html
const CLAVE_CARRITO = "carritoPharSYS";

// Lee la lista de ids guardada (si no hay nada, devuelve una lista vacía)
function leerCarrito() {
  try { return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || []; } catch (e) { return []; }
}
function guardarCarrito(lista) {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lista)); } catch (e) {}
}

// Agrega un producto; devuelve false si ya estaba en el carrito
function agregarAlCarrito(id) {
  const lista = leerCarrito();
  if (lista.includes(id)) return false;
  lista.push(id);
  guardarCarrito(lista);
  return true;
}

// Quita un producto del carrito
function quitarDelCarrito(id) {
  guardarCarrito(leerCarrito().filter(x => x !== id));
}

// Dibuja los productos agregados en carrito.html
function pintarCarrito() {
  const lista = document.getElementById("listaCarrito");
  const items = leerCarrito().map(id => productos.find(p => p.id === id)).filter(Boolean);
  if (items.length === 0) {
    lista.innerHTML = '<p class="vacio">Tu carrito está vacío. <a href="index.html">Ver productos</a></p>';
    return;
  }
  lista.innerHTML = items.map(p => `
    <article class="item">
      <div><h3>${p.nombre}</h3><p class="lab">${p.laboratorio}</p><span class="etiqueta">Agregado al carrito</span></div>
      <span class="precio">${formatoPrecio(p.precio)}</span>
      <button class="eliminar" data-quitar="${p.id}">Eliminar</button>
    </article>`).join("");
}

// Solo en carrito.html: dibuja la lista y atiende el botón "Eliminar"
const listaCarrito = document.getElementById("listaCarrito");
if (listaCarrito) {
  pintarCarrito();
  listaCarrito.addEventListener("click", e => {
    const b = e.target.closest("[data-quitar]");
    if (!b) return;
    quitarDelCarrito(Number(b.dataset.quitar));
    pintarCarrito();
  });
}
