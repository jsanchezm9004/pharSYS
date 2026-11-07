const CLAVE_USUARIOS = "pharsysUsuarios";
const CLAVE_SESION = "pharsysSesion";
const CLAVE_PRODUCTOS = "pharsysProductos";
const CLAVE_INVENTARIO = "pharsysInventario";

const PERMISOS = {
  "Cliente": [
    "Ver el catálogo de medicamentos",
    "Consultar sus pedidos",
    "Editar datos"
  ],
  "Empleado": [
    "Registrar ventas",
    "Consultar y actualizar el inventario",
    "Atender pedidos de clientes"
  ],
  "Administrador": [
    "Supervisar ventas y empleados",
    "Gestionar usuarios y perfiles",
    "Ver reportes generales"
  ]
};

function inicializarUsuariosDemo() {
  const usuarios = leerUsuarios();

  if (usuarios.length > 0) return usuarios;

  const demo = [
    {
      usuario: "cliente01",
      email: "cliente01@pharsys.com",
      nombre: "Laura",
      apellido: "García",
      clave: "Cliente123",
      perfil: "Cliente",
      activo: true,
      fechaRegistro: new Date().toISOString()
    },
    {
      usuario: "empleado01",
      email: "empleado01@pharsys.com",
      nombre: "Carlos",
      apellido: "López",
      clave: "Empleado123",
      perfil: "Empleado",
      activo: true,
      fechaRegistro: new Date().toISOString()
    },
    {
      usuario: "admin01",
      email: "admin01@pharsys.com",
      nombre: "Marta",
      apellido: "Pérez",
      clave: "Admin123",
      perfil: "Administrador",
      activo: true,
      fechaRegistro: new Date().toISOString()
    }
  ];

  guardarUsuarios(demo);
  return demo;
}

function leerUsuarios() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_USUARIOS) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

function leerSesion() {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");
    return sesion || null;
  } catch (error) {
    return null;
  }
}

function leerProductosGuardados() {
  try {
    const productos = JSON.parse(localStorage.getItem(CLAVE_PRODUCTOS) || "[]");
    return Array.isArray(productos) ? productos : [];
  } catch (error) {
    return [];
  }
}

function guardarProductosGuardados(productos) {
  localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
  window.dispatchEvent(new CustomEvent("pharsys:catalogo-updated"));
}

function leerInventarioPersistido() {
  try {
    const inventario = JSON.parse(localStorage.getItem(CLAVE_INVENTARIO) || "[]");
    return Array.isArray(inventario) ? inventario : [];
  } catch (error) {
    return [];
  }
}

function guardarInventarioPersistido(inventario) {
  localStorage.setItem(CLAVE_INVENTARIO, JSON.stringify(inventario));
  window.dispatchEvent(new CustomEvent("pharsys:catalogo-updated"));
}

function obtenerNombreUsuarioSesion() {
  const sesion = leerSesion();
  if (!sesion) return "Mi cuenta";

  const nombreCompleto = [sesion.nombre, sesion.apellido].filter(Boolean).join(" ").trim();
  return nombreCompleto || sesion.usuario || "Mi cuenta";
}

function guardarSesion(usuario) {
  const identidad = usuario || {};
  localStorage.setItem(CLAVE_SESION, JSON.stringify({
    usuario: identidad.usuario || identidad.email || "",
    email: identidad.email || identidad.usuario || "",
    nombre: identidad.nombre || "",
    apellido: identidad.apellido || "",
    perfil: identidad.perfil || "Cliente",
    telefono: identidad.telefono || "",
    direccion: identidad.direccion || "",
    ciudad: identidad.ciudad || ""
  }));
  window.dispatchEvent(new CustomEvent("pharsys:session-updated"));
}

function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
  window.dispatchEvent(new CustomEvent("pharsys:session-updated"));
}

function haySesionActiva() {
  return Boolean(leerSesion());
}

function usuarioExiste(email) {
  return leerUsuarios().some(usuario => usuario.email === email);
}

function validarCredenciales(email, password) {
  const usuarios = inicializarUsuariosDemo();
  const usuario = usuarios.find(item => item.email === email || item.usuario === email);

  if (!usuario) {
    return { ok: false, mensaje: "Este usuario no está registrado. Revisa el dato o crea una cuenta." };
  }

  if (usuario.activo === false || String(usuario.activo || '').toLowerCase() === 'inactivo') {
    return { ok: false, mensaje: "Este usuario está inactivo. Contacta al administrador para reactivarlo." };
  }

  if (usuario.clave !== password) {
    return { ok: false, mensaje: "La contraseña es incorrecta. Inténtalo de nuevo." };
  }

  return { ok: true, usuario };
}

function registrarUsuario(datos) {
  const usuarios = inicializarUsuariosDemo();
  const email = (datos.email || "").trim();
  const clave = (datos.clave || "").trim();

  if (!email) {
    return { ok: false, mensaje: "El correo es obligatorio." };
  }

  if (!clave) {
    return { ok: false, mensaje: "La contraseña es obligatoria." };
  }

  if (usuarios.some(usuario => usuario.email === email)) {
    return { ok: false, mensaje: "Ya existe un usuario con este correo." };
  }

  const documento = datos.numDoc || datos.documento || "";

  const nuevoUsuario = {
    usuario: datos.usuario || email,
    email,
    nombre: datos.nombre || "",
    apellido: datos.apellido || "",
    documento,
    numDoc: documento,
    tipoDoc: datos.tipoDoc || "",
    telefono: datos.telefono || "",
    direccion: datos.direccion || "",
    ciudad: datos.ciudad || "",
    tipoCliente: datos.tipoCliente || "",
    clave,
    perfil: "Cliente",
    activo: true,
    fechaRegistro: new Date().toISOString()
  };

  usuarios.push(nuevoUsuario);
  guardarUsuarios(usuarios);

  return { ok: true, usuario: nuevoUsuario };
}

function requiereSesionActiva() {
  const sesion = leerSesion();
  const loginRedirect = window.location.pathname.includes("/farmacia-hu01/")
    ? "../login/index.html"
    : "farmacia-hu01/login/index.html";

  if (!sesion) {
    window.location.replace(loginRedirect);
    return false;
  }

  return true;
}

inicializarUsuariosDemo();