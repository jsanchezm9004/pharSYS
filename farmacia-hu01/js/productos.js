// ===== Clases del diagrama UML para la HU-01 =====
const productos = [];        // aquí se guardan los objetos Producto
const inventario = [];       // aquí se guardan los objetos Inventario
const favoritos = new Set(); // ids marcados con el corazón (solo visual)

// Convierte un número a pesos colombianos
function formatoPrecio(n) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

// Dibuja la caja del producto (banda de color + símbolo), como en el diseño.
// Cuando haya fotos reales se cambia por <img src="...">
function empaque(color, simbolo) {
  return `<svg viewBox="0 0 120 130" aria-hidden="true"><ellipse cx="60" cy="120" rx="42" ry="7" fill="#003273" opacity=".08"/><g transform="rotate(-4 60 60)"><rect x="30" y="8" width="60" height="100" rx="10" fill="#FEFEFE" stroke="#E3E8EE"/><path d="M30 18a10 10 0 0 1 10-10h40a10 10 0 0 1 10 10v8H30z" fill="${color}"/><circle cx="76" cy="90" r="14" fill="#88BF78" opacity=".25"/><text x="60" y="66" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-weight="800" font-size="20" fill="${color}">${simbolo}</text></g></svg>`;
}

class Producto {
  // Producto(): recibe los datos y los guarda en el objeto
  // (precio, imagen, categoría, etiqueta y precioAnterior NO están en el UML, pero el diseño y la HU-01 los piden)
  constructor(datos = {}) { Object.assign(this, datos); }

  // registroProducto(): agrega el producto a la lista
  registroProducto() { productos.push(this); }

  // mostrarDatos(): dibuja la tarjeta del producto en la página
  mostrarDatos() {
    const inv = inventario.find(i => i.nombreProducto === this.nombre);
    inv.consulta();                                   // revisa si hay existencias
    const agotado = inv.estado === "Agotado";
    const bajo = !agotado && Number(inv.cantidad) <= 10;
    const fav = favoritos.has(this.id);
    const vence = this.fechaVencimiento.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    // Insignia: "Agotado" tiene prioridad sobre la etiqueta del producto
    const insignia = agotado ? '<span class="insignia agotada">Agotado</span>'
      : this.etiqueta ? `<span class="insignia ${this.etiqueta.includes("dto") ? "oferta" : ""}">${this.etiqueta}</span>` : "";
    document.getElementById("listaProductos").insertAdjacentHTML("beforeend", `
      <article class="tarjeta ${agotado ? "agotado" : ""}">
        <div class="imagen">
          ${this.imagen}${insignia}
          <button class="fav ${fav ? "activo" : ""}" data-fav="${this.id}" aria-pressed="${fav}" aria-label="Marcar ${this.nombre} como favorito"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z"/></svg></button>
        </div>
        <div class="cuerpo">
          <p class="categoria">${this.categoria}</p>
          <h3>${this.nombre}</h3>
          <p class="presentacion">${this.presentacion}</p>
          <p class="meta ${bajo ? "bajo" : ""}">${this.laboratorio} · ${agotado ? "Sin existencias" : inv.cantidad + " disponibles"}</p>
          <details><summary>Ver detalles</summary>
            <p>${this.descripcion}</p>
            <dl><dt>Lote</dt><dd>${this.lote}</dd><dt>Vence</dt><dd>${vence}</dd>
              <dt>Invima</dt><dd>${this.registroInvima}</dd><dt>Activo</dt><dd>${this.principioActivo} ${this.concentracion}</dd>
              <dt>Forma</dt><dd>${this.formaFarmaceutica}</dd><dt>Proveedor</dt><dd>${this.proveedor}</dd></dl>
          </details>
          <div class="fila">
            <div>${this.precioAnterior ? `<span class="anterior">${formatoPrecio(this.precioAnterior)}</span>` : ""}<span class="precio">${formatoPrecio(this.precio)}</span></div>
            <button class="agregar" data-agregar="${this.id}" aria-label="Agregar ${this.nombre} al carrito" ${agotado ? "disabled" : ""}>+</button>
          </div>
        </div>
      </article>`);
  }
}

class Inventario {
  // Inventario(): guarda nombre, proveedor y cantidad (la cantidad es String, como dice el UML)
  constructor(nombreProducto, nombreProveedor, cantidad) {
    this.nombreProducto = nombreProducto;
    this.nombreProveedor = nombreProveedor;
    this.cantidad = cantidad;
  }

  // consulta(): define si el producto está disponible o agotado
  consulta() { this.estado = Number(this.cantidad) > 0 ? "Disponible" : "Agotado"; }

  // modificarCantidad(valor): suma o resta existencias (la usará la venta/compra, no la HU-01)
  modificarCantidad(valor) { this.cantidad = String(Math.max(0, Number(this.cantidad) + valor)); }
}

// ===== Datos de ejemplo (luego vendrán de la base de datos) =====
// id, nombre, invima, principio activo, concentración, forma, presentación, proveedor, laboratorio, descripción,
// lote, vence, precio, cantidad, categoría, símbolo, color, etiqueta, precio anterior
const AZ = "#003273", AZ2 = "#023E73", VE = "#429C29", VC = "#88BF78", NA = "#FF681C";
const AND = "Distribuciones Andina S.A.S.", MAY = "Droguería Mayorista Ltda.";
const MED = "Medicamentos", VIT = "Vitaminas", CUI = "Cuidado personal", PA = "Primeros auxilios";
[
  [1, "Acetaminofén 500 mg", "2019M-001037", "Acetaminofén", "500 mg", "Tableta", "Caja x 20 tabletas", AND, "Genfar", "Analgésico y antipirético para dolor leve a moderado y fiebre.", "AC2407", "2027-03-31", 12500, "120", MED, "Rx", AZ, "Más vendido"],
  [2, "Ibuprofeno 400 mg", "2019M-001074", "Ibuprofeno", "400 mg", "Tableta", "Caja x 10 tabletas", MAY, "MK", "Antiinflamatorio para dolor muscular, dental y de cabeza.", "IB2311", "2027-01-15", 9800, "64", MED, "Rx", AZ2],
  [3, "Loratadina 10 mg", "2019M-001111", "Loratadina", "10 mg", "Tableta", "Caja x 10 tabletas", AND, "La Santé", "Antihistamínico para síntomas de alergia y rinitis.", "LO2402", "2026-12-20", 18900, "8", MED, "Rx", VC],
  [4, "Amoxicilina 500 mg", "2019M-001148", "Amoxicilina", "500 mg", "Cápsula", "Caja x 12 cápsulas", MAY, "Tecnoquímicas", "Antibiótico de amplio espectro. Requiere fórmula médica.", "AM2310", "2026-11-30", 18500, "0", MED, "Rx", AZ],
  [5, "Omeprazol 20 mg", "2019M-001185", "Omeprazol", "20 mg", "Cápsula", "Caja x 14 cápsulas", AND, "Procaps", "Reduce la acidez estomacal y trata el reflujo.", "OM2408", "2027-06-30", 12400, "45", MED, "Rx", AZ2],
  [6, "Suero oral sabor limón", "2019M-001222", "Sales de rehidratación", "—", "Solución oral", "Botella 500 ml", MAY, "Pedialyte", "Rehidratación en casos de diarrea o deshidratación.", "SO2405", "2027-02-28", 8900, "30", PA, "+", VE],
  [7, "Vitamina C 500 mg", "2019M-001259", "Ácido ascórbico", "500 mg", "Tableta", "Frasco x 30 tabletas", AND, "Bayer", "Suplemento para reforzar las defensas.", "VC2406", "2027-09-30", 24600, "3", VIT, "C+", NA, "15% dto.", 28900],
  [8, "Alcohol antiséptico 70%", "2019M-001296", "Etanol", "70 %", "Solución tópica", "Frasco 350 ml", MAY, "Brinsa", "Desinfección de piel intacta y superficies.", "AL2403", "2028-01-31", 5400, "0", PA, "70%", VE],
  [9, "Omega 3 1000 mg", "2019M-001333", "Ácidos grasos omega 3", "1000 mg", "Cápsula blanda", "Frasco x 60 cápsulas", AND, "Bayer", "Suplemento para la salud del corazón.", "OM2409", "2027-11-30", 42900, "25", VIT, "Ω3", AZ2, "Recomendado"],
  [10, "Protector solar FPS 50+", "2019M-001370", "Filtros UVA/UVB", "FPS 50+", "Loción", "Uso facial · 50 ml", MAY, "Brinsa", "Protección solar de amplio espectro para el rostro.", "PS2410", "2027-08-31", 58900, "18", CUI, "50+", NA],
  [11, "Termómetro digital", "No aplica", "—", "—", "Dispositivo", "Unidad", AND, "Genfar", "Medición rápida de la temperatura corporal.", "TD2411", "2029-01-31", 21500, "12", PA, "°C", VE]
].forEach(d => {
  new Producto({
    id: d[0], nombre: d[1], registroInvima: d[2], principioActivo: d[3], concentracion: d[4],
    formaFarmaceutica: d[5], presentacion: d[6], proveedor: d[7], laboratorio: d[8],
    descripcion: d[9], lote: d[10], fechaVencimiento: new Date(d[11] + "T00:00"),
    precio: d[12], categoria: d[14], etiqueta: d[17], precioAnterior: d[18],
    imagen: empaque(d[16], d[15])
  }).registroProducto();
  inventario.push(new Inventario(d[1], d[7], d[13]));
});
