document.addEventListener('DOMContentLoaded', () => {
  const sesion = leerSesion();
  if (!sesion || sesion.perfil !== 'Administrador') {
    window.location.replace('../farmacia-hu01/login/index.html');
    return;
  }

  const sidebar = document.getElementById('adminSidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarLinks = document.querySelectorAll('.sidebar__nav a');
  const toast = document.getElementById('toast');
  const logoutBtn = document.getElementById('logout-admin');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      const open = sidebar.classList.toggle('is-open');
      sidebarToggle.setAttribute('aria-expanded', String(open));
    });
  }

  sidebarLinks.forEach((link) => {
    link.addEventListener('click', () => {
      sidebarLinks.forEach((item) => item.classList.remove('is-active'));
      link.classList.add('is-active');

      if (window.innerWidth <= 860 && sidebar && sidebar.classList.contains('is-open')) {
        sidebar.classList.remove('is-open');
        if (sidebarToggle) {
          sidebarToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      cerrarSesion();
      localStorage.removeItem('usuarioRecordado');
      window.location.replace('../farmacia-hu01/login/index.html');
    });
  }

  const leerJSON = (key, fallback = []) => {
    try {
      const datos = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(datos) ? datos : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const obtenerEstadoProveedor = (proveedor) => {
    const estado = String(proveedor && proveedor.estado || 'Activo').trim().toLowerCase();
    if (estado === 'inactivo') return 'Inactivo';
    if (estado === 'desactivado') return 'Desactivado';
    return 'Activo';
  };

  const proveedorEstaActivo = (proveedor) => Boolean(proveedor && obtenerEstadoProveedor(proveedor) === 'Activo');

  const formatearMoneda = (valor) => {
    const numero = Number(valor || 0);
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(numero);
  };

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  };

  const setStatusText = (message) => {
    const statusElement = document.getElementById('sidebar-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  };

  const CLAVE_MOVIMIENTOS_INVENTARIO = 'pharsysMovimientosInventario';

  const leerMovimientosInventario = () => {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_MOVIMIENTOS_INVENTARIO) || '[]');
      return Array.isArray(datos) ? datos : [];
    } catch (error) {
      return [];
    }
  };

  const guardarMovimientosInventario = (movimientos) => {
    localStorage.setItem(CLAVE_MOVIMIENTOS_INVENTARIO, JSON.stringify(movimientos));
  };

  function obtenerEstadoInventario(item) {
    const cantidad = Number(item.cantidad || 0);
    if (cantidad === 0) return 'Agotado';
    if (cantidad <= 10) return 'Bajo';
    return 'Normal';
  }

  function obtenerDatosDashboard() {
    const pedidos = leerJSON('pharsysHistorialPedidos');
    const inventario = leerJSON('pharsysInventario');
    const empleados = leerJSON('pharsysEmpleados');

    const pendientes = pedidos.filter((pedido) => {
      const estado = String(pedido.estado || '').toLowerCase();
      return estado !== 'aprobado' && estado !== 'cancelado';
    });

    const bajo = inventario.filter((item) => Number(item.cantidad || 0) > 0 && Number(item.cantidad) <= 10);
    const agotados = inventario.filter((item) => Number(item.cantidad || 0) === 0);
    const ventas = pedidos.reduce((total, pedido) => total + Number(pedido.valor || 0), 0);

    return {
      pedidos,
      pendientes,
      inventario,
      bajo,
      agotados,
      empleados,
      ventas
    };
  }

  function renderIndicadores() {
    const { pedidos, ventas, pendientes, bajo, agotados, empleados, inventario } = obtenerDatosDashboard();
    const aprobados = pedidos.filter((pedido) => {
      const estado = String(pedido.estado || '').toLowerCase();
      return estado === 'aprobado' || estado === 'despachado';
    });

    const productos = leerJSON('pharsysProductos');
    const proveedores = leerJSON('pharsysProveedores');
    const totalInventarioProblema = inventario.filter((item) => Number(item.cantidad || 0) <= 10).length;
    const porVencer = inventario.filter((item) =>
      obtenerEstadoVencimiento(obtenerFechaVencimientoInventario(item, productos)).texto === 'Por vencer'
    ).length;
    const pendientesAprobacion = pedidos.filter((pedido) => {
      const estado = String(pedido.estado || '').toLowerCase();
      return estado !== 'aprobado' && estado !== 'despachado' && estado !== 'cancelado';
    }).reduce((total, pedido) => total + Number(pedido.valor || 0), 0);
    const pendientesDespacho = pedidos.filter((pedido) => {
      const estado = String(pedido.estado || '').toLowerCase();
      return estado === 'aprobado' && !pedido.despachado;
    }).reduce((total, pedido) => total + Number(pedido.valor || 0), 0);
    const despachados = pedidos.filter((pedido) => {
      const estado = String(pedido.estado || '').toLowerCase();
      return estado === 'despachado' || pedido.despachado === true;
    }).reduce((total, pedido) => total + Number(pedido.valor || 0), 0);

    const indicadorVentas = ventas > 0 ? formatearMoneda(ventas) : 'Sin datos';
    const indicadorPendientes = pendientes.length ? String(pendientes.length) : 'Sin datos';
    const indicadorBajo = bajo.length ? String(bajo.length) : 'Sin datos';
    const indicadorAgotados = agotados.length ? String(agotados.length) : 'Sin datos';

    setText('kpi-ventas', indicadorVentas);
    setText('kpi-pedidos', indicadorPendientes);
    setText('kpi-bajo', indicadorBajo);
    setText('kpi-agotados', indicadorAgotados);

    setText('pending-total', indicadorPendientes === 'Sin datos' ? 'Sin datos' : String(pendientes.length));
    setText('pedidos-aprobados-total', String(aprobados.length));
    setText('pedidos-pendientes-total', String(pendientes.length));
    setText('inventario-resumen-total', String(totalInventarioProblema));
    setText('inventario-proximos-vencer-total', String(porVencer));
    setText('empleados-resumen-total', String(empleados.length));
    setText('productos-resumen-total', String(productos.length));
    setText('proveedores-resumen-total', String(proveedores.length));
    setText('caja-pendiente-aprobar', formatearMoneda(pendientesAprobacion));
    setText('caja-pendiente-despachar', formatearMoneda(pendientesDespacho));
    setText('caja-despachados', formatearMoneda(despachados));
    setText(
      'inventory-alerts',
      indicadorBajo === 'Sin datos' && indicadorAgotados === 'Sin datos' && porVencer === 0
        ? 'Sin datos'
        : `${bajo.length || 0} bajo / ${agotados.length || 0} agotados / ${porVencer} por vencer`
    );

    const trendVentas = ventas > 0 ? 'Datos reales' : 'Sin historial';
    const trendPendientes = pendientes.length ? 'Requiere revisión' : 'Sin pendientes';
    const trendBajo = bajo.length ? 'Reponer pronto' : 'Sin conflictos';
    const trendAgotados = agotados.length ? 'Revisión urgente' : 'Sin agotados';

    const tres = document.getElementById('trend-ventas');
    if (tres) tres.textContent = trendVentas;
    const tp = document.getElementById('trend-pedidos');
    if (tp) tp.textContent = trendPendientes;
    const tb = document.getElementById('trend-bajo');
    if (tb) tb.textContent = trendBajo;
    const ta = document.getElementById('trend-agotados');
    if (ta) ta.textContent = trendAgotados;

    const textoSidebar = ventas > 0 || pendientes.length || bajo.length || agotados.length || empleados.length
      ? `Ventas: ${ventas > 0 ? formatearMoneda(ventas) : 'sin datos'} · Pendientes: ${pendientes.length || 0} · Bajas: ${bajo.length || 0} · Agotados: ${agotados.length || 0}`
      : 'Sin historial para mostrar por el momento.';
    setStatusText(textoSidebar);
  }

  function obtenerEstadoGeneralPedido(pedido) {
    const estado = String(pedido.estado || 'Pendiente').trim();
    if (estado.toLowerCase() === 'despachado') return 'Despachado';
    if (estado.toLowerCase() === 'cancelado') return 'Cancelado';
    if (estado.toLowerCase() === 'aprobado') return 'Aprobado';
    return 'Pendiente';
  }

  function formatearFechaPedido(pedido) {
    const fecha = pedido.fechaPedido || pedido.fechaConfirmacion || pedido.fecha || pedido.createdAt;
    if (!fecha) return 'Sin fecha';
    const fechaDate = new Date(fecha);
    if (Number.isNaN(fechaDate.getTime())) return 'Sin fecha';
    return fechaDate.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function obtenerFiltrosColumna() {
    return [...document.querySelectorAll('.column-filter')].reduce((resultado, input) => {
      const key = input.dataset.filterKey;
      if (!key) return resultado;
      resultado[key] = (input.value || '').trim().toLowerCase();
      return resultado;
    }, {});
  }

  function obtenerFechaVencimientoInventario(item, productosCatalogo) {
    const producto = productosCatalogo.find((registro) =>
      String(registro.nombre || '').toLowerCase() === String(item.nombreProducto || '').toLowerCase()
    );
    return String(item.fechaVencimiento || producto?.fechaVencimiento || '').slice(0, 10);
  }

  function obtenerEstadoVencimiento(fecha) {
    if (!fecha) return { texto: 'Sin fecha', clase: 'status-badge--info' };
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaVencimiento = new Date(year, month - 1, day);
    if (!year || Number.isNaN(fechaVencimiento.getTime())) {
      return { texto: 'Sin fecha', clase: 'status-badge--info' };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil((fechaVencimiento - hoy) / 86400000);
    if (diasRestantes < 0) return { texto: 'Vencido', clase: 'status-badge--danger' };
    if (diasRestantes <= 30) return { texto: 'Por vencer', clase: 'status-badge--warning' };
    return { texto: 'Vigente', clase: 'status-badge--success' };
  }

  function renderPedidos() {
    const tbody = document.querySelector('.orders-table tbody');
    if (!tbody) return;

    const esVistaPedidos = document.body.dataset.page === 'pedidos' || window.location.pathname.endsWith('/pedidos.html');

    if (esVistaPedidos) {
      const pedidos = leerJSON('pharsysHistorialPedidos');
      const filtros = obtenerFiltrosColumna();
      const pedidosFiltrados = pedidos.filter((pedido) => {
        const numeroPedido = String(pedido.numeroPedido || '').toLowerCase();
        const fechaPedido = formatearFechaPedido(pedido).toLowerCase();
        const cliente = String(pedido.cliente || pedido.usuario || '').toLowerCase();
        const total = formatearMoneda(Number(pedido.valor || 0)).toLowerCase();
        const estado = obtenerEstadoGeneralPedido(pedido).toLowerCase();
        const aprobado = (pedido.aprobado === true || String(pedido.estado || '').toLowerCase() === 'aprobado') ? 'si' : 'no';
        const despachado = Boolean(pedido.despachado || String(pedido.estado || '').toLowerCase() === 'despachado') ? 'si' : 'no';

        return Object.entries(filtros).every(([key, value]) => {
          if (!value) return true;
          const valor = {
            numero: numeroPedido,
            fecha: fechaPedido,
            cliente,
            total,
            estado,
            aprobado,
            despachado
          }[key] || '';
          return String(valor).includes(value);
        });
      }).slice().reverse();

      const totalPedidos = pedidos.length ? String(pedidos.length) : 'Sin datos';
      setText('pending-total', totalPedidos);

      if (!pedidosFiltrados.length) {
        tbody.innerHTML = '<tr><td colspan="8">Sin datos por el momento.</td></tr>';
        return;
      }

      tbody.innerHTML = pedidosFiltrados.map((pedido) => {
        const cliente = pedido.cliente || pedido.usuario || 'Cliente';
        const importe = Number(pedido.valor || 0);
        const estado = obtenerEstadoGeneralPedido(pedido);
        const aprobado = pedido.aprobado === true || String(pedido.estado || '').toLowerCase() === 'aprobado';
        const despachado = Boolean(pedido.despachado || String(pedido.estado || '').toLowerCase() === 'despachado');
        const badgeClass = estado === 'Aprobado' ? 'status-badge--success' : estado === 'Cancelado' ? 'status-badge--danger' : estado === 'Despachado' ? 'status-badge--info' : 'status-badge--warning';

        return `
          <tr>
            <td>#${pedido.numeroPedido || 'N/A'}</td>
            <td>${formatearFechaPedido(pedido)}</td>
            <td>${cliente}</td>
            <td>${formatearMoneda(importe)}</td>
            <td data-status><span class="status-badge ${badgeClass}">${estado}</span></td>
            <td class="order-check-cell">
              <input class="order-check" type="checkbox" data-action="toggle-approved" data-id="${pedido.numeroPedido || 0}" ${aprobado ? 'checked' : ''} aria-label="Marcar pedido ${pedido.numeroPedido || ''} como aprobado" />
            </td>
            <td class="order-check-cell">
              <input class="order-check" type="checkbox" data-action="toggle-despachado" data-id="${pedido.numeroPedido || 0}" ${despachado ? 'checked' : ''} aria-label="Marcar pedido ${pedido.numeroPedido || ''} como despachado" />
            </td>
            <td>
              <div class="table-actions">
                <button class="table-btn table-btn--danger" type="button" data-action="delete-order" data-id="${pedido.numeroPedido || 0}">Eliminar</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      return;
    }

    const { pendientes } = obtenerDatosDashboard();

    if (!pendientes.length) {
      tbody.innerHTML = '<tr><td colspan="5">Sin datos por el momento.</td></tr>';
      return;
    }

    tbody.innerHTML = pendientes.map((pedido) => {
      const cliente = pedido.cliente || pedido.usuario || 'Cliente';
      const importe = Number(pedido.valor || 0);
      const estado = String(pedido.estado || 'Pendiente');
      return `
        <tr>
          <td>#${pedido.numeroPedido || 'N/A'}</td>
          <td>${cliente}</td>
          <td>${formatearMoneda(importe)}</td>
          <td data-status><span class="status-badge status-badge--warning">${estado === 'Aprobado' ? 'Aprobado' : 'Pendiente'}</span></td>
          <td>
            <div class="table-actions">
              <button class="table-btn table-btn--approve" type="button" data-action="approve-order" data-id="${pedido.numeroPedido || 0}">Aprobar</button>
              <button class="table-btn table-btn--review" type="button">Revisar</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderInventario() {
    const tbody = document.querySelector('.inventory-table tbody');
    if (!tbody) return;

    const { inventario } = obtenerDatosDashboard();
    const esVistaInventario = document.body.dataset.page === 'inventario' || window.location.pathname.endsWith('/inventario.html');
    const filtros = obtenerFiltrosColumna();
    const productosCatalogo = leerJSON('pharsysProductos');

    const productos = esVistaInventario
      ? inventario.filter((item) => {
          const producto = String(item.nombreProducto || '').toLowerCase();
          const proveedor = String(item.nombreProveedor || '').toLowerCase();
          const cantidad = String(item.cantidad || '').toLowerCase();
          const vencimiento = obtenerFechaVencimientoInventario(item, productosCatalogo);
          const estado = obtenerEstadoInventario(item).toLowerCase();

          return Object.entries(filtros).every(([key, value]) => {
            if (!value) return true;
            const valor = { producto, proveedor, cantidad, vencimiento, estado }[key] || '';
            return valor.includes(value);
          });
        })
      : inventario.filter((item) => Number(item.cantidad || 0) <= 10);

    if (!productos.length) {
      tbody.innerHTML = `<tr><td colspan="${esVistaInventario ? 6 : 5}">Sin datos por el momento.</td></tr>`;
      return;
    }

    if (esVistaInventario) {
      tbody.innerHTML = productos.map((item) => {
        const cantidad = Number(item.cantidad || 0);
        const estado = obtenerEstadoInventario(item);
        const clase = cantidad === 0 ? 'status-badge--danger' : cantidad <= 10 ? 'status-badge--warning' : 'status-badge--success';
        const nombreProducto = encodeURIComponent(item.nombreProducto || 'Producto sin nombre');
        const fechaVencimiento = obtenerFechaVencimientoInventario(item, productosCatalogo);
        const estadoVencimiento = obtenerEstadoVencimiento(fechaVencimiento);
        const claseFecha = estadoVencimiento.texto === 'Vencido'
          ? 'inventory-expiration--expired'
          : estadoVencimiento.texto === 'Por vencer' ? 'inventory-expiration--soon' : '';
        return `
          <tr>
            <td><span class="status-badge ${clase}">${estado}</span></td>
            <td>${item.nombreProducto || 'Producto sin nombre'}</td>
            <td>${item.nombreProveedor || 'Proveedor'}</td>
            <td>${cantidad} unidades</td>
            <td>
              <div class="inventory-adjust">
                <button class="table-btn table-btn--danger" type="button" data-action="stock-down" data-product="${nombreProducto}">-</button>
                <input class="stock-quantity" type="number" min="1" value="1" data-product="${nombreProducto}" aria-label="Cantidad para ${item.nombreProducto || 'producto'}" />
                <button class="table-btn table-btn--approve" type="button" data-action="stock-up" data-product="${nombreProducto}">+</button>
              </div>
            </td>
            <td>
              <div class="inventory-expiration ${claseFecha}">
                <input class="column-filter" type="date" value="${fechaVencimiento}" data-action="update-expiration" data-product="${nombreProducto}" aria-label="Fecha de vencimiento de ${item.nombreProducto || 'producto'}" />
                <span class="status-badge ${estadoVencimiento.clase}">${estadoVencimiento.texto}</span>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      return;
    }

    tbody.innerHTML = productos.map((item) => {
      const cantidad = Number(item.cantidad || 0);
      const estado = cantidad === 0 ? 'Agotado' : 'Bajo';
      const clase = cantidad === 0 ? 'status-badge--danger' : 'status-badge--warning';
      return `
        <tr>
          <td>${item.nombreProducto || 'Producto sin nombre'}</td>
          <td>${cantidad} unidades</td>
          <td>${item.nombreProveedor || 'Proveedor'}</td>
          <td><span class="status-badge ${clase}">${estado}</span></td>
          <td><button class="table-btn table-btn--review" type="button" data-action="review-stock">Revisar</button></td>
        </tr>
      `;
    }).join('');
  }

  function obtenerNombreEmpleado(empleado) {
    const nombre = empleado?.nombre || empleado?.nombreEmpleado || '';
    const apellido = empleado?.apellido || empleado?.apellidoEmpleado || '';
    return `${nombre} ${apellido}`.trim() || 'Empleado sin nombre';
  }

  function obtenerDocumentoEmpleado(empleado) {
    return empleado?.numeroDocumento || empleado?.numDoc || empleado?.documento || 'Sin documento';
  }

  function obtenerCorreoEmpleado(empleado) {
    return empleado?.email || empleado?.correo || 'Sin correo';
  }

  function obtenerEstadoEmpleado(empleado) {
    const valor = String(empleado?.estado || '').trim();
    if (valor) {
      return valor.toLowerCase() === 'inactivo' ? 'Inactivo' : 'Activo';
    }
    return empleado?.activo === false ? 'Inactivo' : 'Activo';
  }

  function renderResumenEmpleados() {
    const empleados = leerJSON('pharsysEmpleados') || [];
    const total = document.getElementById('employee-total-summary');
    const list = document.getElementById('employee-summary-list');

    if (total) {
      total.textContent = String(empleados.length);
    }

    if (!list) return;

    const filtroNombre = (document.getElementById('employee-filter-name')?.value || '').trim().toLowerCase();
    const filtroDocumento = (document.getElementById('employee-filter-document')?.value || '').trim().toLowerCase();
    const filtroEstado = (document.getElementById('employee-filter-status')?.value || 'Todos').toLowerCase();

    const empleadosFiltrados = empleados.filter((empleado) => {
      const nombre = obtenerNombreEmpleado(empleado).toLowerCase();
      const documento = String(obtenerDocumentoEmpleado(empleado)).toLowerCase();
      const estado = obtenerEstadoEmpleado(empleado).toLowerCase();

      const coincideNombre = !filtroNombre || nombre.includes(filtroNombre);
      const coincideDocumento = !filtroDocumento || documento.includes(filtroDocumento);
      const coincideEstado = filtroEstado === 'todos' || estado === filtroEstado;

      return coincideNombre && coincideDocumento && coincideEstado;
    });

    if (!empleados.length) {
      list.innerHTML = '<div class="employee-summary-empty">Sin empleados registrados.</div>';
      return;
    }

    list.innerHTML = `
      <div class="employee-summary-filters">
        <div class="employee-summary-filter">
          <label>Nombre</label>
          <input id="employee-filter-name" class="column-filter" type="text" value="${filtroNombre || ''}" placeholder="Buscar nombre" />
        </div>
        <div class="employee-summary-filter">
          <label>Documento</label>
          <input id="employee-filter-document" class="column-filter" type="text" value="${filtroDocumento || ''}" placeholder="Buscar documento" />
        </div>
        <div class="employee-summary-filter">
          <label>Estado</label>
          <select id="employee-filter-status" class="column-filter">
            <option value="Todos" ${filtroEstado === 'todos' ? 'selected' : ''}>Todos</option>
            <option value="Activo" ${filtroEstado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="Inactivo" ${filtroEstado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table class="employee-summary-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Correo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${empleadosFiltrados.length ? empleadosFiltrados.map((empleado) => {
              const nombre = obtenerNombreEmpleado(empleado);
              const documento = obtenerDocumentoEmpleado(empleado);
              const email = obtenerCorreoEmpleado(empleado);
              const activo = obtenerEstadoEmpleado(empleado) === 'Activo';
              const estadoClass = activo ? 'status-badge--success' : 'status-badge--danger';
              return `
                <tr>
                  <td>${nombre}</td>
                  <td>${documento}</td>
                  <td>${email}</td>
                  <td>
                    <div class="employee-status-cell">
                      <span class="status-badge ${estadoClass}">${activo ? 'Activo' : 'Inactivo'}</span>
                      <button class="table-btn ${activo ? 'table-btn--danger' : 'table-btn--approve'}" type="button" data-toggle-employee-status data-email="${email}" data-document="${documento}" data-active="${String(activo)}">
                        ${activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="4" class="employee-summary-empty-row">No hay empleados que coincidan con los filtros.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('employee-filter-name')?.addEventListener('input', renderResumenEmpleados);
    document.getElementById('employee-filter-document')?.addEventListener('input', renderResumenEmpleados);
    document.getElementById('employee-filter-status')?.addEventListener('change', renderResumenEmpleados);
  }

  function renderEmpleados() {
    const empleados = leerJSON('pharsysEmpleados');
    const tbody = document.getElementById('employee-table-body');
    renderResumenEmpleados();
    if (!tbody) return;

    if (!empleados.length) {
      tbody.innerHTML = '<tr><td colspan="5">Sin empleados registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = empleados.map((empleado) => `
      <tr>
        <td>${empleado.nombre || 'Empleado'}</td>
        <td>${empleado.cargo || 'Sin cargo'}</td>
        <td>${empleado.departamento || 'Sin departamento'}</td>
        <td>${empleado.turno || 'Sin turno'}</td>
        <td>${empleado.email || 'Sin correo'}</td>
      </tr>
    `).join('');
  }

  document.getElementById('employee-summary-list')?.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-toggle-employee-status]');
    if (!trigger) return;

    const email = (trigger.dataset.email || '').trim();
    const documento = (trigger.dataset.document || '').trim();
    const activoActual = trigger.dataset.active === 'true';
    const nuevoEstado = !activoActual;

    const usuarios = JSON.parse(localStorage.getItem('pharsysUsuarios') || '[]');
    const empleados = leerJSON('pharsysEmpleados') || [];

    usuarios.forEach((usuario) => {
      const coincideEmail = String(usuario.email || usuario.usuario || '').toLowerCase() === email.toLowerCase();
      const coincideDocumento = String(usuario.numDoc || usuario.documento || '').toLowerCase() === documento.toLowerCase();
      if (coincideEmail || coincideDocumento) {
        usuario.activo = nuevoEstado;
        usuario.estado = nuevoEstado ? 'Activo' : 'Inactivo';
      }
    });

    empleados.forEach((empleado) => {
      const coincideEmail = String(empleado.email || empleado.correo || '').toLowerCase() === email.toLowerCase();
      const coincideDocumento = String(empleado.numeroDocumento || empleado.numDoc || '').toLowerCase() === documento.toLowerCase();
      if (coincideEmail || coincideDocumento) {
        empleado.activo = nuevoEstado;
        empleado.estado = nuevoEstado ? 'Activo' : 'Inactivo';
      }
    });

    localStorage.setItem('pharsysUsuarios', JSON.stringify(usuarios));
    localStorage.setItem('pharsysEmpleados', JSON.stringify(empleados));
    renderResumenEmpleados();
    showToast(`Empleado ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
  });

  function renderOrdenesCompra() {
    const ordenes = leerJSON('pharsysOrdenesCompra');
    const body = document.getElementById('orders-body');
    if (!body) return;

    if (!ordenes.length) {
      body.innerHTML = '<tr><td colspan="3">Sin datos por el momento.</td></tr>';
      return;
    }

    body.innerHTML = ordenes.map((orden) => `
      <tr>
        <td>${orden.proveedor || 'Proveedor'}</td>
        <td>${formatearMoneda(orden.monto || 0)}</td>
        <td><span class="status-badge status-badge--info">${orden.estado || 'Enviado'}</span></td>
      </tr>
    `).join('');
  }

  function renderMovimientosInventario() {
    const contenedor = document.getElementById('movimientosInventario');
    const tbody = contenedor?.querySelector('tbody');
    if (!contenedor || !tbody) return;

    const historial = leerMovimientosInventario();
    if (!historial.length) {
      tbody.innerHTML = '<tr><td colspan="5">Sin movimientos registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = historial.slice().reverse().map((movimiento) => `
      <tr>
        <td>${movimiento.usuario || 'Sistema'}</td>
        <td>${new Date(movimiento.fecha || Date.now()).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</td>
        <td>${movimiento.producto || 'Producto'}</td>
        <td>${Math.abs(Number(movimiento.cantidad || 0))} und.</td>
        <td>${movimiento.tipo || 'Ajuste'}</td>
      </tr>
    `).join('');
  }

  function renderCashData() {
    const pedidos = leerJSON('pharsysHistorialPedidos');
    const ventas = pedidos.reduce((total, pedido) => total + Number(pedido.valor || 0), 0);
    const proveedores = leerJSON('pharsysOrdenesCompra');
    const pagosProveedores = proveedores.reduce((total, orden) => total + Number(orden.monto || 0), 0);

    const cashIn = document.getElementById('cash-in');
    const cashOut = document.getElementById('cash-out');
    const cashBalance = document.getElementById('cash-balance');
    const cashTransactions = document.getElementById('cash-transactions');

    if (cashIn) cashIn.textContent = ventas > 0 ? formatearMoneda(ventas) : 'Sin datos';
    if (cashOut) cashOut.textContent = pagosProveedores > 0 ? formatearMoneda(pagosProveedores) : 'Sin datos';
    if (cashBalance) cashBalance.textContent = ventas > 0 || pagosProveedores > 0 ? formatearMoneda(Math.max(0, ventas - pagosProveedores)) : 'Sin datos';

    if (cashTransactions) {
      if (!pedidos.length && !proveedores.length) {
        cashTransactions.innerHTML = '<li><div><strong>Sin información historica</strong><br /><small>Por el momento no hay movimientos registrados.</small></div></li>';
      } else {
        const transacciones = [];
        pedidos.slice(-3).forEach((pedido) => {
          transacciones.push(`<li><div><strong>Pedido #${pedido.numeroPedido || 'N/A'}</strong><br /><small>${pedido.cliente || pedido.usuario || 'Cliente'}</small></div><span class="currency currency--positive">+${formatearMoneda(pedido.valor || 0)}</span></li>`);
        });
        proveedores.slice(-2).forEach((orden) => {
          transacciones.push(`<li><div><strong>Orden a proveedor</strong><br /><small>${orden.proveedor || 'Proveedor'}</small></div><span class="currency currency--negative">-${formatearMoneda(orden.monto || 0)}</span></li>`);
        });
        cashTransactions.innerHTML = transacciones.join('');
      }
    }
  }

  function actualizarCatalogoYInventario() {
    renderIndicadores();
    renderPedidos();
    renderInventario();
    renderMovimientosInventario();
    renderEmpleados();
    renderOrdenesCompra();
    renderCashData();
  }

  function registrarProductoEnSistema(datos) {
    const nombreProveedor = String(datos.proveedor || '').trim();
    if (nombreProveedor) {
      const proveedor = leerJSON('pharsysProveedores').find((item) =>
        String(item.nombre || '').trim().toLowerCase() === nombreProveedor.toLowerCase()
      );
      if (!proveedor || !proveedorEstaActivo(proveedor)) {
        showToast('No se pueden agregar productos con un proveedor inactivo o desactivado.');
        return false;
      }
    }

    const productosActuales = leerJSON('pharsysProductos');
    const productoId = datos.id || datos.codigo || `PRO-${Date.now()}`;
    const productoExistenteIndex = productosActuales.findIndex((producto) => String(producto.id) === String(productoId) || (producto.nombre || '').toLowerCase() === String(datos.nombre || '').toLowerCase());
    const precioAnterior = productoExistenteIndex >= 0 ? Number(productosActuales[productoExistenteIndex].precio || 0) : null;

    const producto = {
      id: productoId,
      nombre: datos.nombre || 'Producto sin nombre',
      categoria: datos.categoria || 'Medicamentos',
      descripcion: datos.descripcion || 'Producto registrado desde el panel administrativo.',
      presentacion: datos.presentacion || 'Caja',
      laboratorio: datos.laboratorio || 'Fabricante',
      proveedor: datos.proveedor || 'Proveedor',
      precio: Number(datos.precio || 0),
      precioAnterior,
      etiqueta: datos.etiqueta || 'Nuevo',
      principioActivo: datos.principioActivo || 'Principal',
      concentracion: datos.concentracion || '',
      formaFarmaceutica: datos.formaFarmaceutica || 'Tableta',
      registroInvima: datos.registroInvima || 'Sin registro',
      lote: datos.lote || `ADM-${Date.now()}`,
      fechaVencimiento: datos.fechaVencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      imagen: datos.imagen || ''
    };

    if (productoExistenteIndex >= 0) {
      productosActuales[productoExistenteIndex] = { ...productosActuales[productoExistenteIndex], ...producto };
    } else {
      productosActuales.push(producto);
    }

    localStorage.setItem('pharsysProductos', JSON.stringify(productosActuales));

    const inventarioActual = leerJSON('pharsysInventario');
    const stockActual = inventarioActual.find((item) => item.nombreProducto === producto.nombre);

    if (stockActual) {
      stockActual.cantidad = String(Number(stockActual.cantidad || 0) + Number(datos.stock || 0));
      stockActual.nombreProveedor = producto.proveedor;
      stockActual.fechaVencimiento = String(producto.fechaVencimiento || '').slice(0, 10);
    } else {
      inventarioActual.push({
        nombreProducto: producto.nombre,
        nombreProveedor: producto.proveedor,
        cantidad: String(Number(datos.stock || 0)),
        fechaVencimiento: String(producto.fechaVencimiento || '').slice(0, 10)
      });
    }

    localStorage.setItem('pharsysInventario', JSON.stringify(inventarioActual));
    window.dispatchEvent(new CustomEvent('pharsys:catalogo-updated'));
    actualizarCatalogoYInventario();
    return true;
  }

  document.body.addEventListener('click', (event) => {
    const editSupplierButton = event.target.closest('[data-action="edit-supplier"]');
    if (editSupplierButton) {
      const tbody = document.getElementById('supplier-summary-body');
      if (tbody) {
        tbody.dataset.editingIndex = editSupplierButton.dataset.index;
        renderProveedores();
      }
      return;
    }

    const cancelSupplierButton = event.target.closest('[data-action="cancel-supplier-edit"]');
    if (cancelSupplierButton) {
      const tbody = document.getElementById('supplier-summary-body');
      if (tbody) {
        delete tbody.dataset.editingIndex;
        renderProveedores();
      }
      return;
    }

    const saveSupplierButton = event.target.closest('[data-action="save-supplier"]');
    if (saveSupplierButton) {
      const tbody = document.getElementById('supplier-summary-body');
      const row = saveSupplierButton.closest('tr');
      const nombreInput = row?.querySelector('[data-supplier-field="nombre"]');
      const nitInput = row?.querySelector('[data-supplier-field="nit"]');
      const encargadoInput = row?.querySelector('[data-supplier-field="encargado"]');
      const telefonoInput = row?.querySelector('[data-supplier-field="telefono"]');
      const correoInput = row?.querySelector('[data-supplier-field="correo"]');
      if (!nombreInput?.checkValidity() || !correoInput?.checkValidity()) {
        nombreInput?.reportValidity();
        correoInput?.reportValidity();
        return;
      }

      const proveedores = leerJSON('pharsysProveedores');
      const proveedor = proveedores[Number(saveSupplierButton.dataset.index)];
      if (!proveedor) {
        showToast('No se encontró el proveedor seleccionado.');
        return;
      }

      proveedor.nombre = nombreInput.value.trim();
      proveedor.nit = nitInput.value.trim();
      proveedor.encargado = encargadoInput.value.trim();
      proveedor.telefono = telefonoInput.value.trim();
      proveedor.correo = correoInput.value.trim();
      localStorage.setItem('pharsysProveedores', JSON.stringify(proveedores));
      if (tbody) delete tbody.dataset.editingIndex;
      renderProveedores();
      poblarSelectorProveedoresProducto();
      showToast(`Información de ${proveedor.nombre} actualizada.`);
      return;
    }

    const supplierStatusButton = event.target.closest('[data-action="toggle-supplier-status"]');
    if (supplierStatusButton) {
      const supplierIndex = Number(supplierStatusButton.dataset.index);
      const proveedores = leerJSON('pharsysProveedores');
      const proveedor = proveedores[supplierIndex];
      if (!proveedor) {
        showToast('No se encontró el proveedor seleccionado.');
        return;
      }

      const estados = ['Activo', 'Inactivo', 'Desactivado'];
      const estadoActual = obtenerEstadoProveedor(proveedor);
      proveedor.estado = estados[(estados.indexOf(estadoActual) + 1) % estados.length];
      localStorage.setItem('pharsysProveedores', JSON.stringify(proveedores));
      renderProveedores();
      poblarSelectorProveedoresProducto();
      showToast(`Estado de ${proveedor.nombre || 'proveedor'} actualizado: ${proveedor.estado}.`);
      return;
    }

    const stockAction = event.target.closest('[data-action="stock-up"]') || event.target.closest('[data-action="stock-down"]');
    if (stockAction) {
      const accion = stockAction.dataset.action;
      const nombreProducto = decodeURIComponent(stockAction.dataset.product || '');
      const inventario = leerJSON('pharsysInventario');
      const producto = inventario.find((item) => (item.nombreProducto || '').toLowerCase() === nombreProducto.toLowerCase());

      if (!producto) {
        showToast('No se encontró el producto del inventario.');
        return;
      }

      const input = document.querySelector(`.stock-quantity[data-product="${stockAction.dataset.product}"]`);
      const cantidad = Number(input?.value || 0);
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        showToast('Ingresa una cantidad válida para ajustar el stock.');
        return;
      }

      const actual = Number(producto.cantidad || 0);
      const nuevoValor = accion === 'stock-up' ? actual + cantidad : actual - cantidad;

      if (nuevoValor < 0) {
        showToast('No puedes quitar más unidades de las disponibles.');
        return;
      }

      producto.cantidad = String(nuevoValor);
      localStorage.setItem('pharsysInventario', JSON.stringify(inventario));

      const sesionActual = leerSesion();
      const movimiento = {
        usuario: sesionActual ? (sesionActual.usuario || sesionActual.email || 'Sistema') : 'Sistema',
        fecha: new Date().toISOString(),
        producto: producto.nombreProducto,
        cantidad: accion === 'stock-up' ? cantidad : -cantidad,
        tipo: accion === 'stock-up' ? 'Añadida' : 'Quitada'
      };

      const historial = leerMovimientosInventario();
      historial.push(movimiento);
      guardarMovimientosInventario(historial);

      actualizarCatalogoYInventario();
      showToast(accion === 'stock-up'
        ? `Se añadieron ${cantidad} unidades a ${producto.nombreProducto}.`
        : `Se quitaron ${cantidad} unidades de ${producto.nombreProducto}.`);
      return;
    }

    const deleteButton = event.target.closest('[data-action="delete-order"]');
    if (deleteButton) {
      const pedidoId = Number(deleteButton.dataset.id || 0);
      const pedidos = leerJSON('pharsysHistorialPedidos');
      const filtrados = pedidos.filter((pedido) => Number(pedido.numeroPedido || 0) !== pedidoId);
      localStorage.setItem('pharsysHistorialPedidos', JSON.stringify(filtrados));
      actualizarCatalogoYInventario();
      showToast('Pedido eliminado del historial.');
      return;
    }

    const approveButton = event.target.closest('[data-action="approve-order"]');
    if (!approveButton) {
      const stockButton = event.target.closest('[data-action="review-stock"]');
      if (stockButton) {
        showToast('Inventario revisado y actualizado.');
      }
      return;
    }

    const pedidoId = Number(approveButton.dataset.id || 0);
    const pedidos = leerJSON('pharsysHistorialPedidos');
    const actualizado = pedidos.map((pedido) => {
      if (Number(pedido.numeroPedido || 0) === pedidoId) {
        return { ...pedido, estado: 'Aprobado' };
      }
      return pedido;
    });

    localStorage.setItem('pharsysHistorialPedidos', JSON.stringify(actualizado));
    actualizarCatalogoYInventario();
    showToast('Pedido aprobado y notificado al almacén.');
  });

  document.body.addEventListener('change', (event) => {
    const expirationInput = event.target.closest('[data-action="update-expiration"]');
    if (expirationInput) {
      const nombreProducto = decodeURIComponent(expirationInput.dataset.product || '');
      const fechaVencimiento = expirationInput.value;
      const inventario = leerJSON('pharsysInventario');
      const itemInventario = inventario.find((item) =>
        String(item.nombreProducto || '').toLowerCase() === nombreProducto.toLowerCase()
      );
      if (!itemInventario) {
        showToast('No se encontró el producto del inventario.');
        return;
      }

      itemInventario.fechaVencimiento = fechaVencimiento;
      localStorage.setItem('pharsysInventario', JSON.stringify(inventario));

      const productos = leerJSON('pharsysProductos');
      const producto = productos.find((item) =>
        String(item.nombre || '').toLowerCase() === nombreProducto.toLowerCase()
      );
      if (producto) {
        producto.fechaVencimiento = fechaVencimiento;
        localStorage.setItem('pharsysProductos', JSON.stringify(productos));
      }

      renderInventario();
      showToast(fechaVencimiento ? 'Fecha de vencimiento actualizada.' : 'Fecha de vencimiento eliminada.');
      return;
    }

    const approvedCheck = event.target.closest('[data-action="toggle-approved"]');
    if (approvedCheck) {
      const pedidoId = Number(approvedCheck.dataset.id || 0);
      const pedidos = leerJSON('pharsysHistorialPedidos');
      const actualizado = pedidos.map((pedido) => {
        if (Number(pedido.numeroPedido || 0) === pedidoId) {
          const aprobado = approvedCheck.checked;
          const despachado = Boolean(pedido.despachado);
          const nuevoEstado = despachado ? 'Despachado' : (aprobado ? 'Aprobado' : 'Pendiente');
          return {
            ...pedido,
            aprobado,
            estado: nuevoEstado,
            despachado
          };
        }
        return pedido;
      });

      localStorage.setItem('pharsysHistorialPedidos', JSON.stringify(actualizado));
      actualizarCatalogoYInventario();
      showToast(approvedCheck.checked ? 'Pedido marcado como aprobado.' : 'Pedido desmarcado como aprobado.');
      return;
    }

    const despachoCheck = event.target.closest('[data-action="toggle-despachado"]');
    if (!despachoCheck) return;

    const pedidoId = Number(despachoCheck.dataset.id || 0);
    const pedidos = leerJSON('pharsysHistorialPedidos');
    const actualizado = pedidos.map((pedido) => {
      if (Number(pedido.numeroPedido || 0) === pedidoId) {
        const despachado = despachoCheck.checked;
        const aprobado = Boolean(pedido.aprobado || String(pedido.estado || '').toLowerCase() === 'aprobado');
        const nuevoEstado = despachado ? 'Despachado' : (aprobado ? 'Aprobado' : 'Pendiente');
        return {
          ...pedido,
          despachado,
          aprobado: despachado ? true : aprobado,
          estado: nuevoEstado
        };
      }
      return pedido;
    });

    localStorage.setItem('pharsysHistorialPedidos', JSON.stringify(actualizado));
    actualizarCatalogoYInventario();
    showToast(despachoCheck.checked ? 'Pedido marcado como despachado.' : 'Pedido marcado como no despachado.');
  });

  function poblarSelectorProveedoresProducto() {
    const select = document.getElementById('product-supplier');
    if (!select) return;

    const proveedores = leerJSON('pharsysProveedores').filter(proveedorEstaActivo);
    const opciones = proveedores.length
      ? proveedores.map((proveedor) => `
        <option value="${(proveedor.nombre || '').trim()}">${proveedor.nombre || 'Proveedor sin nombre'}</option>
      `).join('')
      : '<option value="">Sin proveedores activos</option>';

    select.innerHTML = `<option value="">Selecciona un proveedor</option>${opciones}<option value="__crear_proveedor__">＋ Crear nuevo proveedor...</option>`;
  }

  function renderProveedores() {
    const tbody = document.getElementById('supplier-summary-body');
    if (!tbody) return;

    const proveedores = leerJSON('pharsysProveedores');
    const count = document.getElementById('supplier-summary-count');
    if (count) {
      count.textContent = `${proveedores.length} ${proveedores.length === 1 ? 'proveedor' : 'proveedores'}`;
    }

    tbody.replaceChildren();
    if (!proveedores.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 8;
      cell.textContent = 'Aún no hay proveedores registrados.';
      row.appendChild(cell);
      tbody.appendChild(row);
      actualizarSeleccionProveedores();
      return;
    }

    proveedores.forEach((proveedor, index) => {
      const row = document.createElement('tr');
      const selectionCell = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.action = 'select-supplier';
      checkbox.dataset.index = String(index);
      checkbox.setAttribute('aria-label', `Seleccionar ${proveedor.nombre || 'proveedor'}`);
      selectionCell.appendChild(checkbox);
      row.appendChild(selectionCell);

      const editingIndex = Number(tbody.dataset.editingIndex);
      const isEditing = editingIndex === index;
      [
        ['nombre', proveedor.nombre, 'Nombre del proveedor', 'text'],
        ['nit', proveedor.nit || proveedor.rfc, 'NIT', 'text'],
        ['encargado', proveedor.encargado || proveedor.contacto, 'Encargado', 'text'],
        ['telefono', proveedor.telefono, 'Teléfono / celular', 'tel'],
        ['correo', proveedor.correo, 'Correo electrónico', 'email']
      ].forEach(([field, value, label, type]) => {
        const cell = document.createElement('td');
        if (isEditing) {
          const input = document.createElement('input');
          input.type = type;
          input.value = value || '';
          input.className = 'column-filter';
          input.dataset.supplierField = field;
          input.setAttribute('aria-label', label);
          if (field === 'nombre') input.required = true;
          cell.appendChild(input);
        } else {
          cell.textContent = value || '—';
        }
        row.appendChild(cell);
      });

      const statusCell = document.createElement('td');
      const statusButton = document.createElement('button');
      const estado = obtenerEstadoProveedor(proveedor);
      statusButton.type = 'button';
      statusButton.className = `supplier-status-button supplier-status-button--${estado.toLowerCase()}`;
      statusButton.dataset.action = 'toggle-supplier-status';
      statusButton.dataset.index = String(index);
      statusButton.textContent = estado;
      statusButton.setAttribute('aria-label', `Cambiar estado de ${proveedor.nombre || 'proveedor'}; estado actual: ${estado}`);
      statusCell.appendChild(statusButton);
      row.appendChild(statusCell);

      const actionsCell = document.createElement('td');
      if (isEditing) {
        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.className = 'table-btn table-btn--approve';
        saveButton.dataset.action = 'save-supplier';
        saveButton.dataset.index = String(index);
        saveButton.textContent = 'Guardar';
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'table-btn table-btn--review';
        cancelButton.dataset.action = 'cancel-supplier-edit';
        cancelButton.textContent = 'Cancelar';
        actionsCell.append(saveButton, cancelButton);
      } else {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'table-btn table-btn--review';
        editButton.dataset.action = 'edit-supplier';
        editButton.dataset.index = String(index);
        editButton.textContent = 'Modificar';
        actionsCell.appendChild(editButton);
      }
      actionsCell.className = 'table-actions';
      row.appendChild(actionsCell);
      tbody.appendChild(row);
    });
    actualizarSeleccionProveedores();
  }

  function actualizarSeleccionProveedores() {
    const tbody = document.getElementById('supplier-summary-body');
    const selectAll = document.getElementById('supplier-select-all');
    const deleteButton = document.getElementById('delete-selected-suppliers');
    if (!tbody || !selectAll || !deleteButton) return;

    const checkboxes = Array.from(tbody.querySelectorAll('[data-action="select-supplier"]'));
    const seleccionados = checkboxes.filter((checkbox) => checkbox.checked).length;
    selectAll.checked = checkboxes.length > 0 && seleccionados === checkboxes.length;
    selectAll.indeterminate = seleccionados > 0 && seleccionados < checkboxes.length;
    selectAll.disabled = checkboxes.length === 0;
    deleteButton.disabled = seleccionados === 0;
    deleteButton.textContent = seleccionados
      ? `Eliminar seleccionados (${seleccionados})`
      : 'Eliminar seleccionados';
  }

  document.getElementById('supplier-select-all')?.addEventListener('change', (event) => {
    const tbody = document.getElementById('supplier-summary-body');
    tbody?.querySelectorAll('[data-action="select-supplier"]').forEach((checkbox) => {
      checkbox.checked = event.currentTarget.checked;
    });
    actualizarSeleccionProveedores();
  });

  document.getElementById('supplier-summary-body')?.addEventListener('change', (event) => {
    if (event.target.matches('[data-action="select-supplier"]')) {
      actualizarSeleccionProveedores();
    }
  });

  document.getElementById('delete-selected-suppliers')?.addEventListener('click', () => {
    const seleccionados = Array.from(document.querySelectorAll('#supplier-summary-body [data-action="select-supplier"]:checked'))
      .map((checkbox) => Number(checkbox.dataset.index));
    if (!seleccionados.length) return;

    const proveedores = leerJSON('pharsysProveedores');
    const cantidad = seleccionados.length;
    if (!window.confirm(`¿Eliminar ${cantidad} ${cantidad === 1 ? 'proveedor seleccionado' : 'proveedores seleccionados'}?`)) return;

    const indices = new Set(seleccionados);
    const restantes = proveedores.filter((proveedor, index) => !indices.has(index));
    localStorage.setItem('pharsysProveedores', JSON.stringify(restantes));
    renderProveedores();
    poblarSelectorProveedoresProducto();
    showToast(`${cantidad} ${cantidad === 1 ? 'proveedor eliminado' : 'proveedores eliminados'}.`);
  });

  function actualizarVistaPreviaProducto() {
    const previewName = document.getElementById('preview-name');
    const previewCategory = document.getElementById('preview-category');
    const previewSupplier = document.getElementById('preview-supplier');
    const previewStock = document.getElementById('preview-stock');
    const previewDescription = document.getElementById('preview-description');
    const previewPrice = document.getElementById('preview-price');

    if (!previewName || !previewCategory || !previewSupplier || !previewStock || !previewDescription || !previewPrice) {
      return;
    }

    const nombre = document.getElementById('product-name')?.value.trim() || 'Nombre del producto';
    const categoria = document.getElementById('product-category')?.value || 'Medicamentos';
    const proveedor = document.getElementById('product-supplier')?.value || 'Proveedor';
    const stock = Number(document.getElementById('product-stock')?.value || 0);
    const descripcion = document.getElementById('product-notes')?.value.trim() || 'La descripción del producto aparecerá aquí.';
    const precio = Number(document.getElementById('product-price')?.value || 0);

    previewName.textContent = nombre;
    previewCategory.textContent = categoria;
    previewSupplier.textContent = proveedor || 'Proveedor';
    previewStock.textContent = `Stock: ${stock}`;
    previewDescription.textContent = descripcion;
    previewPrice.textContent = formatearMoneda(precio);
  }

  function poblarSelectorProductosPrecio() {
    const select = document.getElementById('price-product-select');
    const currentPriceInput = document.getElementById('current-product-price');
    if (!select) return;

    const productosDisponibles = leerJSON('pharsysProductos');
    if (!productosDisponibles.length) {
      select.innerHTML = '<option value="">No hay productos registrados</option>';
      if (currentPriceInput) currentPriceInput.value = '$0';
      return;
    }

    select.innerHTML = '<option value="">Selecciona un producto</option>' + productosDisponibles.map((producto) => `
      <option value="${producto.id}">${producto.nombre || 'Producto sin nombre'}</option>
    `).join('');

    if (currentPriceInput) currentPriceInput.value = '$0';
  }

  document.getElementById('price-product-select')?.addEventListener('change', (event) => {
    const currentPriceInput = document.getElementById('current-product-price');
    if (!currentPriceInput) return;

    const productosDisponibles = leerJSON('pharsysProductos');
    const producto = productosDisponibles.find((item) => String(item.id) === String(event.target.value));
    currentPriceInput.value = producto ? formatearMoneda(Number(producto.precio || 0)) : '$0';
  });

  document.getElementById('product-form')?.addEventListener('input', actualizarVistaPreviaProducto);
  document.getElementById('product-form')?.addEventListener('change', (event) => {
    if (event.target.id === 'product-supplier' && event.target.value === '__crear_proveedor__') {
      window.location.href = 'proveedores.html';
      return;
    }
    actualizarVistaPreviaProducto();
  });

  document.getElementById('product-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const productName = document.getElementById('product-name').value.trim();
    const productCategory = document.getElementById('product-category').value;
    const productSupplier = document.getElementById('product-supplier').value.trim();
    const productPrice = Number(document.getElementById('product-price').value || 0);
    const productStock = Number(document.getElementById('product-stock').value || 0);
    const productId = document.getElementById('product-id').value.trim();
    const productPrincipioActivo = document.getElementById('product-principio-activo').value.trim();
    const productConcentracion = document.getElementById('product-concentracion').value.trim();
    const productFormaFarmaceutica = document.getElementById('product-forma-farmaceutica').value.trim();
    const productPresentacion = document.getElementById('product-presentacion').value.trim();
    const productLaboratorio = document.getElementById('product-laboratorio').value.trim();
    const productLote = document.getElementById('product-lote').value.trim();
    const productFechaVencimiento = document.getElementById('product-fecha-vencimiento').value;
    const productRegistroInvima = document.getElementById('product-registro-invima').value.trim();
    const productEtiqueta = document.getElementById('product-etiqueta').value;
    const productDescripcion = document.getElementById('product-notes').value.trim() || 'Producto creado desde el panel administrativo.';

    if (!productName) {
      showToast('Completa el nombre del producto.');
      return;
    }

    const guardado = registrarProductoEnSistema({
      id: productId || `PRO-${Date.now()}`,
      nombre: productName,
      categoria: productCategory,
      proveedor: productSupplier,
      precio: productPrice,
      stock: productStock,
      descripcion: productDescripcion,
      presentacion: productPresentacion,
      laboratorio: productLaboratorio,
      principioActivo: productPrincipioActivo,
      concentracion: productConcentracion,
      formaFarmaceutica: productFormaFarmaceutica,
      registroInvima: productRegistroInvima,
      lote: productLote,
      fechaVencimiento: productFechaVencimiento ? new Date(`${productFechaVencimiento}T00:00:00`).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      etiqueta: productEtiqueta === 'Sin etiqueta' ? '' : productEtiqueta,
      imagen: ''
    });

    if (!guardado) return;

    showToast(`Producto registrado: ${productName}`);
    event.currentTarget.reset();
    poblarSelectorProveedoresProducto();
    poblarSelectorProductosPrecio();
    actualizarVistaPreviaProducto();
  });

  document.getElementById('update-price-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const select = document.getElementById('price-product-select');
    const nuevoPrecio = Number(document.getElementById('new-product-price').value || 0);

    if (!select || !select.value) {
      showToast('Selecciona un producto para actualizar el precio.');
      return;
    }

    if (!Number.isFinite(nuevoPrecio) || nuevoPrecio <= 0) {
      showToast('Ingresa un precio válido.');
      return;
    }

    const productosDisponibles = leerJSON('pharsysProductos');
    const producto = productosDisponibles.find((item) => String(item.id) === String(select.value));
    if (!producto) {
      showToast('No se encontró el producto seleccionado.');
      return;
    }

    const precioAnterior = Number(producto.precio || 0);
    producto.precioAnterior = precioAnterior;
    producto.precio = nuevoPrecio;

    localStorage.setItem('pharsysProductos', JSON.stringify(productosDisponibles));
    window.dispatchEvent(new CustomEvent('pharsys:catalogo-updated'));
    actualizarCatalogoYInventario();
    showToast(`Precio actualizado para ${producto.nombre}: ${formatearMoneda(nuevoPrecio)}`);
    document.getElementById('new-product-price').value = '';
    document.getElementById('current-product-price').value = formatearMoneda(nuevoPrecio);
    poblarSelectorProductosPrecio();
  });

  document.getElementById('supplier-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const supplierName = document.getElementById('supplier-name').value.trim();
    if (!supplierName) {
      showToast('Completa el nombre del proveedor.');
      return;
    }

    const proveedores = leerJSON('pharsysProveedores');
    proveedores.push({
      nombre: supplierName,
      nit: document.getElementById('supplier-nit').value.trim(),
      encargado: document.getElementById('supplier-manager').value.trim(),
      telefono: document.getElementById('supplier-phone').value.trim(),
      correo: document.getElementById('supplier-email').value.trim(),
      estado: 'Activo'
    });

    localStorage.setItem('pharsysProveedores', JSON.stringify(proveedores));
    renderProveedores();
    poblarSelectorProveedoresProducto();
    showToast(`Proveedor registrado: ${supplierName}`);
    event.currentTarget.reset();
  });

  function limpiarFormularioEmpleado() {
    const form = document.getElementById('employee-form');
    if (form) {
      form.reset();
    }
    const modal = document.getElementById('employee-summary-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function obtenerResumenEmpleado() {
    const nombre = document.getElementById('employee-name')?.value.trim() || '';
    const apellido = document.getElementById('employee-last-name')?.value.trim() || '';
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    const tipoDocumento = document.getElementById('employee-document-type')?.value || '';
    const numeroDocumento = document.getElementById('employee-document-number')?.value.trim() || '';
    const celular = document.getElementById('employee-phone')?.value.trim() || '';
    const direccion = document.getElementById('employee-address')?.value.trim() || '';
    const ciudad = document.getElementById('employee-city')?.value.trim() || '';
    const correo = document.getElementById('employee-email')?.value.trim() || '';
    const password = document.getElementById('employee-password')?.value || '';
    const estadoEmpleado = document.getElementById('employee-status')?.value || 'Activo';

    return {
      nombre,
      apellido,
      nombreCompleto,
      tipoDocumento,
      numeroDocumento,
      celular,
      direccion,
      ciudad,
      correo,
      password,
      estadoEmpleado,
      activo: estadoEmpleado !== 'Inactivo'
    };
  }

  function registrarEmpleadoEnSistema(datos) {
    const usuarios = JSON.parse(localStorage.getItem('pharsysUsuarios') || '[]');
    const empleados = leerJSON('pharsysEmpleados');
    const email = (datos.correo || '').trim();
    const nombre = (datos.nombre || '').trim();
    const apellido = (datos.apellido || '').trim();
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    const activo = datos.activo !== false && String(datos.estadoEmpleado || 'Activo') !== 'Inactivo';

    const usuarioDuplicado = usuarios.some((usuario) => String(usuario.email || '').toLowerCase() === String(email || '').toLowerCase());
    if (usuarioDuplicado) {
      showToast('Ya existe un usuario con este correo.');
      return false;
    }

    const usuario = {
      usuario: email,
      email,
      nombre,
      apellido,
      tipoDoc: datos.tipoDocumento || '',
      numDoc: datos.numeroDocumento || '',
      telefono: datos.celular || '',
      direccion: datos.direccion || '',
      ciudad: datos.ciudad || '',
      clave: datos.password || '',
      perfil: 'Empleado',
      activo,
      fechaRegistro: new Date().toISOString()
    };

    usuarios.push(usuario);
    localStorage.setItem('pharsysUsuarios', JSON.stringify(usuarios));

    empleados.push({
      nombre: nombreCompleto,
      nombreEmpleado: nombre,
      apellidoEmpleado: apellido,
      tipoDocumento: datos.tipoDocumento || '',
      numeroDocumento: datos.numeroDocumento || '',
      celular: datos.celular || '',
      direccion: datos.direccion || '',
      ciudad: datos.ciudad || '',
      email,
      password: datos.password || '',
      perfil: 'Empleado',
      activo,
      estado: activo ? 'Activo' : 'Inactivo'
    });

    localStorage.setItem('pharsysEmpleados', JSON.stringify(empleados));
    actualizarCatalogoYInventario();
    return true;
  }

  document.getElementById('clear-employee-form')?.addEventListener('click', limpiarFormularioEmpleado);

  document.getElementById('employee-register-btn')?.addEventListener('click', () => {
    const { nombre, apellido, nombreCompleto, tipoDocumento, numeroDocumento, celular, direccion, ciudad, correo, password } = obtenerResumenEmpleado();

    if (!nombre || !apellido || !tipoDocumento || !numeroDocumento || !celular || !direccion || !ciudad || !correo || !password) {
      showToast('Completa todos los campos para registrar el empleado.');
      return;
    }

    if (password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const contenidoResumen = `
      <div><strong>Nombres:</strong> ${nombre}</div>
      <div><strong>Apellidos:</strong> ${apellido}</div>
      <div><strong>Tipo de documento:</strong> ${tipoDocumento}</div>
      <div><strong>Número de documento:</strong> ${numeroDocumento}</div>
      <div><strong>Celular:</strong> ${celular}</div>
      <div><strong>Dirección:</strong> ${direccion}</div>
      <div><strong>Ciudad:</strong> ${ciudad}</div>
      <div><strong>Correo:</strong> ${correo}</div>
      <div><strong>Estado:</strong> ${document.getElementById('employee-status')?.value || 'Activo'}</div>
      <div><strong>Perfil:</strong> Empleado</div>
    `;

    const modal = document.getElementById('employee-summary-modal');
    const summaryContent = document.getElementById('employee-summary-content');
    if (modal && summaryContent) {
      summaryContent.innerHTML = contenidoResumen;
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    } else {
      const confirmado = window.confirm(`Confirma el registro del empleado:\n\n${contenidoResumen.replace(/<[^>]+>/g, '')}`);
      if (!confirmado) return;

      const registrado = registrarEmpleadoEnSistema({
        nombre,
        apellido,
        nombreCompleto,
        tipoDocumento,
        numeroDocumento,
        celular,
        direccion,
        ciudad,
        correo,
        password
      });

      if (registrado) {
        showToast(`Empleado registrado: ${nombreCompleto}`);
        limpiarFormularioEmpleado();
      }
    }
  });

  document.getElementById('close-employee-summary')?.addEventListener('click', () => {
    const modal = document.getElementById('employee-summary-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  });

  document.getElementById('confirm-employee-register')?.addEventListener('click', () => {
    const { nombre, apellido, nombreCompleto, tipoDocumento, numeroDocumento, celular, direccion, ciudad, correo, password } = obtenerResumenEmpleado();
    const registrado = registrarEmpleadoEnSistema({
      nombre,
      apellido,
      nombreCompleto,
      tipoDocumento,
      numeroDocumento,
      celular,
      direccion,
      ciudad,
      correo,
      password
    });

    if (registrado) {
      showToast(`Empleado registrado: ${nombreCompleto}`);
      limpiarFormularioEmpleado();
    }
  });

  document.getElementById('employee-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    document.getElementById('employee-register-btn')?.click();
  });

  document.getElementById('purchase-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const proveedor = document.getElementById('purchase-provider').value;
    const monto = Number(document.getElementById('purchase-total').value || 0);
    const ordenes = leerJSON('pharsysOrdenesCompra');
    ordenes.push({
      id: Date.now(),
      proveedor,
      monto,
      fecha: new Date().toISOString(),
      estado: 'Enviado'
    });
    localStorage.setItem('pharsysOrdenesCompra', JSON.stringify(ordenes));
    renderOrdenesCompra();
    showToast('Orden de compra enviada al proveedor.');
    event.currentTarget.reset();
  });

  document.querySelectorAll('.pill-group button').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.pill-group button').forEach((item) => item.classList.remove('is-selected'));
      button.classList.add('is-selected');
    });
  });

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  document.querySelectorAll('.column-filter').forEach((input) => {
    input.addEventListener('input', () => {
      renderPedidos();
      renderInventario();
    });
  });

  const toggleMovimientos = document.getElementById('toggle-movimientos');
  const modalMovimientos = document.getElementById('movimientosModal');
  const closeMovimientos = document.getElementById('close-movimientos');

  const actualizarEstadoMovimientos = () => {
    if (!toggleMovimientos || !modalMovimientos) return;
    toggleMovimientos.textContent = modalMovimientos.hidden ? 'Mostrar movimientos' : 'Ocultar movimientos';
  };

  if (toggleMovimientos && modalMovimientos) {
    toggleMovimientos.addEventListener('click', () => {
      modalMovimientos.hidden = !modalMovimientos.hidden;
      actualizarEstadoMovimientos();
    });
  }

  if (closeMovimientos && modalMovimientos) {
    closeMovimientos.addEventListener('click', () => {
      modalMovimientos.hidden = true;
      actualizarEstadoMovimientos();
    });
  }

  if (modalMovimientos) {
    modalMovimientos.addEventListener('click', (event) => {
      if (event.target === modalMovimientos) {
        modalMovimientos.hidden = true;
        actualizarEstadoMovimientos();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalMovimientos && !modalMovimientos.hidden) {
      modalMovimientos.hidden = true;
      actualizarEstadoMovimientos();
    }
  });

  window.addEventListener('storage', (event) => {
    if (['pharsysInventario', 'pharsysHistorialPedidos', 'pharsysProductos', 'pharsysEmpleados', 'pharsysOrdenesCompra', CLAVE_MOVIMIENTOS_INVENTARIO, 'pharsysProveedores'].includes(event.key)) {
      actualizarCatalogoYInventario();
      poblarSelectorProductosPrecio();
      poblarSelectorProveedoresProducto();
      renderProveedores();
      actualizarVistaPreviaProducto();
    }
  });

  renderProveedores();
  poblarSelectorProveedoresProducto();
  poblarSelectorProductosPrecio();
  actualizarVistaPreviaProducto();
  actualizarCatalogoYInventario();
});
