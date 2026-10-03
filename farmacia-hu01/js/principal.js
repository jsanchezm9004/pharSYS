// ===== Página principal (HU-01) =====
let categoriaActiva = "Todos";

// Dibuja los productos de la categoría elegida
function pintarProductos() {
  document.getElementById("listaProductos").innerHTML = "";
  productos
    .filter(p => categoriaActiva === "Todos" || p.categoria === categoriaActiva)
    .forEach(p => p.mostrarDatos());
}
pintarProductos();

// Muestra un mensaje corto abajo de la pantalla
function mostrarMensaje(texto) {
  const m = document.getElementById("mensaje");
  m.textContent = texto;
  m.classList.add("visible");
  clearTimeout(m.temporizador);
  m.temporizador = setTimeout(() => m.classList.remove("visible"), 2500);
}

// Pestañas de categorías (Todos, Medicamentos, Vitaminas...)
document.querySelector(".filtros").addEventListener("click", e => {
  const boton = e.target.closest(".filtro");
  if (!boton) return;
  document.querySelectorAll(".filtro").forEach(b => b.classList.toggle("activo", b === boton));
  categoriaActiva = boton.textContent;
  pintarProductos();
});

// Clics dentro de la lista de productos
document.getElementById("listaProductos").addEventListener("click", e => {
  // Corazón: marca o desmarca como favorito
  const fav = e.target.closest("[data-fav]");
  if (fav) {
    const id = Number(fav.dataset.fav);
    favoritos.has(id) ? favoritos.delete(id) : favoritos.add(id);
    fav.classList.toggle("activo", favoritos.has(id));
    fav.setAttribute("aria-pressed", favoritos.has(id));
    return;
  }
  // Botón verde "+": agrega el producto al carrito
  const boton = e.target.closest("[data-agregar]");
  if (!boton) return;
  const id = Number(boton.dataset.agregar);
  const p = productos.find(x => x.id === id);
  mostrarMensaje(agregarAlCarrito(id) ? p.nombre + " se agregó al carrito." : p.nombre + " ya está en el carrito.");
});
