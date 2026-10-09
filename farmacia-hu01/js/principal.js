// ===== Página principal (HU-01) =====
let categoriaActiva = "Todos";

// Dibuja los productos de la categoría elegida
function pintarProductos() {
  document.getElementById("listaProductos").innerHTML = "";
  productos
    .filter(p => (categoriaActiva === "Todos" || p.categoria === categoriaActiva)
      && (!document.getElementById("buscarProducto").value.trim()
        || `${p.nombre} ${p.categoria} ${p.laboratorio} ${p.descripcion}`.toLowerCase()
          .includes(document.getElementById("buscarProducto").value.trim().toLowerCase())))
    .forEach(p => p.mostrarDatos());
}
pintarProductos();
document.getElementById("totalProductos").textContent = productos.length;

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

function seleccionarCategoria(categoria) {
  categoriaActiva = categoria;
  document.querySelectorAll(".filtro").forEach(boton => {
    boton.classList.toggle("activo", boton.textContent === categoria);
  });
  document.getElementById("tituloCatalogo").textContent =
    categoria === "Todos" ? "Nuestros productos" : categoria;
  pintarProductos();
  document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
}

document.querySelectorAll("[data-categoria]").forEach(enlace => {
  enlace.addEventListener("click", () => seleccionarCategoria(enlace.dataset.categoria));
});

document.getElementById("buscarProducto").addEventListener("input", pintarProductos);

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
