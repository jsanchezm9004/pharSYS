document.querySelectorAll(".pharsys-menu-root").forEach((root, index) => {
  const base = root.dataset.base || "";
  const current = root.dataset.current;
  const panelId = `pharsys-menu-panel-${index + 1}`;
  const sections = [
    {
      label: "Tienda",
      links: [
        { page: "home", label: "Inicio / catálogo", icon: "⌂", href: `${base}index.html` },
        { page: "cart", label: "Carrito de compras", icon: "🛒", href: `${base}carrito.html` },
      ],
    },
    {
      label: "Cuenta",
      links: [
        { page: "register", label: "Registrar clientes", icon: "＋", href: `${base}registro/index.html` },
        { page: "login", label: "Iniciar sesión", icon: "↪", href: `${base}login/index.html` },
      ],
    },
    {
      label: "Pantallas alternativas",
      links: [
        { page: "cart-prototype", label: "Carrito (diseño alternativo)", icon: "🛍", href: `${base}../carritoCompras.html` },
        { page: "register-prototype", label: "Registro (formulario alternativo)", icon: "＋", href: `${base}../registro.html` },
        { page: "login-prototype", label: "Acceso (formulario alternativo)", icon: "↪", href: `${base}../login.html` },
      ],
    },
  ];

  root.innerHTML = `
    <button class="pharsys-menu-toggle" type="button" aria-expanded="false" aria-controls="${panelId}">
      <span class="pharsys-menu-icon" aria-hidden="true">☰</span>
      <span>Menú</span>
    </button>
    <nav class="pharsys-menu-panel" id="${panelId}" aria-label="Navegación principal" hidden>
      ${sections.map(section => `
        <section class="pharsys-menu-section" aria-label="${section.label}">
          <p class="pharsys-menu-heading">${section.label}</p>
          ${section.links.map(link => `
            <a class="pharsys-menu-link" href="${link.href}"${link.page === current ? ' aria-current="page"' : ""}>
              <span class="pharsys-menu-symbol" aria-hidden="true">${link.icon}</span>
              <span>${link.label}</span>
            </a>
          `).join("")}
        </section>
      `).join("")}
    </nav>
  `;

  const toggle = root.querySelector(".pharsys-menu-toggle");
  const panel = root.querySelector(".pharsys-menu-panel");

  function setMenuOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  }

  toggle.addEventListener("click", () => {
    setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("click", event => {
    if (!root.contains(event.target)) setMenuOpen(false);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) {
      setMenuOpen(false);
      toggle.focus();
    }
  });
});
