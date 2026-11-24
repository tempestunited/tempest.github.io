/* ═══════════════════════════════════════════════════════════
   AHORRO DE DATOS (núcleo)
   Va al principio para aplicarse ANTES de que la página termine de
   pintarse: así las imágenes grandes ni siquiera se piden.
   El botón y los avisos están en ahorro.js.
═══════════════════════════════════════════════════════════ */
(function () {
    var CSS = [
        'html.ahorro-datos:not(.ahorro-ver) .hero{background:linear-gradient(135deg,#1a0030,#050014)!important}',
        'html.ahorro-datos:not(.ahorro-ver) .card-noticia__img{background-image:none!important;background-color:#1a0030!important}',
        'html.ahorro-datos *,html.ahorro-datos *::before,html.ahorro-datos *::after{animation-duration:.001s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition:none!important;scroll-behavior:auto!important;box-shadow:none!important;text-shadow:none!important}',
        'html.ahorro-datos .ticker-texto{animation:none!important;transform:none!important;white-space:normal!important}',
        'html.ahorro-datos .fp-aurora::before,html.ahorro-datos .fp-neon::before{animation:none!important}',
        'html.ahorro-datos #fondoPersonal canvas,html.ahorro-datos #fondoPersonal video{display:none!important}',
        'html.ahorro-datos .navbar-gamer,html.ahorro-datos .modal-overlay{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
        'html.ahorro-datos #intro{display:none!important}'
    ].join('\n');

    window.AhorroDatos = {
        activo: function () { return document.documentElement.classList.contains('ahorro-datos'); },
        aplicar: function (si) {
            document.documentElement.classList.toggle('ahorro-datos', !!si);
            if (si && !document.getElementById('ahorroEstilos')) {
                var st = document.createElement('style');
                st.id = 'ahorroEstilos'; st.textContent = CSS; document.head.appendChild(st);
            }
            try { localStorage.setItem('guarida.ahorro', si ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
            document.dispatchEvent(new CustomEvent('ahorro-cambiado', { detail: !!si }));
        }
    };
    try { if (localStorage.getItem('guarida.ahorro') === '1') window.AhorroDatos.aplicar(true); } catch (e) { /* nada */ }
})();

/* ═══════════════════════════════════════════════════════════
   ZONA GAMER — script.js
   Funcionalidad compartida: navbar hamburguesa + modal login
═══════════════════════════════════════════════════════════ */
 
document.addEventListener('DOMContentLoaded', function () {
 
    // ── HAMBURGUESA ──────────────────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');
 
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            navLinks.classList.toggle('abierto');
        });
 
        // Cerrar menú al hacer click en un link
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('abierto');
            });
        });
 
        // Cerrar menú al hacer click fuera
        document.addEventListener('click', function (e) {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('abierto');
            }
        });
    }
 
    // ── MODAL LOGIN ──────────────────────────────────────────
    const modalOverlay = document.getElementById('modalOverlay');
    const modalForm    = document.getElementById('modalForm');
    const modalCerrar  = document.getElementById('modalCerrar');
    const btnEntrar    = document.getElementById('btnEntrar');
 
    // Abrir modal
    if (btnEntrar && modalOverlay) {
        btnEntrar.addEventListener('click', function () {
            modalOverlay.classList.add('abierto');
        });
    }
 
    // Cerrar modal con botón X
    if (modalCerrar && modalOverlay) {
        modalCerrar.addEventListener('click', function () {
            modalOverlay.classList.remove('abierto');
            limpiarModal();
        });
    }
 
    // Cerrar modal al hacer click fuera
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function (e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('abierto');
                limpiarModal();
            }
        });
    }
 
    // Cerrar modal con Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('abierto')) {
            modalOverlay.classList.remove('abierto');
            limpiarModal();
        }
    });
 
    function limpiarModal() {
        if (!modalForm) return;
        const inputs = modalForm.querySelectorAll('input');
        inputs.forEach(function (inp) {
            inp.classList.remove('invalido', 'valido');
            inp.value = '';
        });
        const errores = modalForm.querySelectorAll('.modal-error');
        errores.forEach(function (err) { err.textContent = ''; });
    }

});

/* Botones extra de la página: personalizar (fondo, música, foto) y ahorro de datos. */
(function () {
    ['personalizar.js', 'ahorro.js', 'torneo.js'].forEach(function (nombre) {
        if (document.querySelector('script[src*="' + nombre + '"]')) return;
        var p = document.createElement('script');
        p.src = nombre;
        document.head.appendChild(p);
    });
})();
