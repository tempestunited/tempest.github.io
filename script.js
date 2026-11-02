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
