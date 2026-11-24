/* ═══════════════════════════════════════════════════════════
   GUARIDA DRACONICA — torneo.js
   - Inscripción a un torneo desde su tarjeta (con mensaje de registro completado).
   - Ventana para elegir el apodo con el que serán reconocidos.
   - En el perfil del inicio: apodo (editable) y torneo en el que están inscritos.
   Es autosuficiente (lleva sus propios estilos). Lo carga script.js.
═══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const sb = window.sb;
    if (!sb) return;
    const $ = id => document.getElementById(id);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const aviso = msg => (window.Toast ? window.Toast(msg) : alert(msg));
    const APODO_OK = /^[\p{L}\p{N}_.\- ]{2,20}$/u;
    let estado = { uid: null, apodo: '', inscripciones: [] };

    const ESTILOS = `
.torneo-btn.inscrito { border-color: #00cc44 !important; color: #00cc44 !important; background: transparent !important; cursor: default; pointer-events: none; }
.perfil-torneo { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); display: grid; gap: 7px; }
.pt-fila { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13px; }
.pt-et { min-width: 58px; font: 700 10px "Orbitron", sans-serif; letter-spacing: 2px; color: var(--cian); }
.pt-val { color: #eee; font-weight: 600; overflow-wrap: anywhere; }
.pt-val em { color: #888; font-weight: 400; }
.pt-val a { color: var(--rojo); }
.pt-btn, .pt-x { padding: 3px 10px; border-radius: 10px; border: 1px solid var(--borde); background: transparent; color: #fff; font: 700 11px "Montserrat", sans-serif; cursor: pointer; }
.pt-btn:hover, .pt-x:hover { background: var(--rojo); }
.pt-x { padding: 1px 7px; margin-left: 6px; }
.pt-texto { color: #aaa; font-size: 13px; line-height: 1.5; margin-bottom: 12px; }
`;

    /* ---------- Datos del usuario ---------- */
    async function cargarEstado() {
        const { data } = await sb.auth.getSession();
        const u = data.session && data.session.user;
        if (!u) { estado = { uid: null, apodo: '', inscripciones: [] }; return estado; }
        const [per, ins] = await Promise.all([
            sb.from('perfiles').select('apodo').eq('id', u.id).maybeSingle(),
            sb.from('inscripciones').select('id, torneo_id, creado_en, contenido(titulo)').eq('usuario_id', u.id).order('creado_en', { ascending: false })
        ]);
        estado = { uid: u.id, apodo: (per.data && per.data.apodo) || '', inscripciones: ins.data || [] };
        return estado;
    }

    /* ---------- Tarjetas de torneo ---------- */
    function marcarInscritos() {
        const ids = new Set(estado.inscripciones.map(i => i.torneo_id));
        document.querySelectorAll('.torneo-card[data-torneo]').forEach(card => {
            const b = card.querySelector('.torneo-btn');
            if (!b || !ids.has(card.dataset.torneo) || b.dataset.inscrito) return;
            b.dataset.inscrito = '1'; b.classList.add('inscrito'); b.textContent = '✔ Ya estás inscrito';
            b.removeAttribute('href'); b.setAttribute('aria-disabled', 'true');
        });
    }

    function abrirLogin() {
        const m = $('modalOverlay');
        if (m) m.classList.add('abierto'); else window.location.href = 'login.html';
    }

    async function inscribir(torneoId, titulo) {
        await cargarEstado();
        if (!estado.uid) { aviso('Inicia sesión para inscribirte al torneo.'); abrirLogin(); return; }
        if (estado.inscripciones.some(i => i.torneo_id === torneoId)) { aviso('Ya estás inscrito en este torneo.'); return; }
        const { error } = await sb.from('inscripciones').insert({ torneo_id: torneoId });
        if (error) {
            console.error('Inscripción:', error);
            const m = String(error.message || '').toLowerCase();
            aviso(error.code === '23505' ? 'Ya estás inscrito en este torneo.'
                : m.includes('inscripciones') && (m.includes('does not exist') || m.includes('schema cache')) ? 'Falta ejecutar supabase-torneos.sql en Supabase.'
                : 'No se pudo completar el registro. Puede que las inscripciones ya estén cerradas.');
            return;
        }
        await refrescar(false);
        aviso('✔ Registro completado: ya estás inscrito en «' + titulo + '».');
        if (!estado.apodo) setTimeout(() => abrirApodo(), 1100);
    }

    function alClicTorneo(e) {
        const b = e.target.closest('.torneo-card .torneo-btn');
        if (!b || b.disabled || b.classList.contains('deshabilitado') || b.dataset.inscrito) return;
        const card = b.closest('.torneo-card');
        if (!card || !card.dataset.torneo) return;            // tarjeta original sin conectar: se queda el enlace normal
        e.preventDefault();
        const nombre = card.querySelector('.torneo-nombre');
        inscribir(card.dataset.torneo, nombre ? nombre.textContent.trim() : 'el torneo');
    }

    /* ---------- Ventana del apodo ---------- */
    function construirApodo() {
        const o = document.createElement('div');
        o.className = 'modal-overlay'; o.id = 'apodoOverlay';
        o.innerHTML = `<form class="modal-caja" id="apodoForm" novalidate>
            <button type="button" class="modal-cerrar" id="apodoCerrar" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
            <h3 class="modal-titulo">Tu <span>apodo</span> de competidor</h3>
            <p class="pt-texto">Elige con qué apodo quieres que te reconozcan en los torneos. Puedes cambiarlo cuando quieras desde tu perfil, en el inicio.</p>
            <div class="modal-campo"><label for="apodoInput">Apodo</label>
                <input type="text" id="apodoInput" maxlength="20" autocomplete="off" placeholder="Ej. Sombra Carmesí">
                <span class="modal-error" id="apodoError"></span></div>
            <button type="submit" class="modal-submit">Guardar apodo</button>
            <p class="modal-pie"><a href="#" id="apodoLuego">Ahora no</a></p></form>`;
        document.body.appendChild(o);
        $('apodoCerrar').addEventListener('click', cerrarApodo);
        $('apodoLuego').addEventListener('click', e => { e.preventDefault(); try { sessionStorage.setItem('guarida.apodo.pospuesto', '1'); } catch { /* nada */ } cerrarApodo(); });
        o.addEventListener('click', e => { if (e.target === o) cerrarApodo(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarApodo(); });
        $('apodoForm').addEventListener('submit', guardarApodo);
    }
    function abrirApodo() {
        if (!estado.uid) return;
        $('apodoInput').value = estado.apodo; $('apodoError').textContent = '';
        $('apodoOverlay').classList.add('abierto');
        setTimeout(() => $('apodoInput').focus(), 50);
    }
    function cerrarApodo() { const o = $('apodoOverlay'); if (o) o.classList.remove('abierto'); }

    async function guardarApodo(e) {
        e.preventDefault();
        const apodo = $('apodoInput').value.trim().replace(/\s+/g, ' ');
        if (!APODO_OK.test(apodo)) { $('apodoError').textContent = 'De 2 a 20 caracteres: letras, números, espacios, guion, guion bajo o punto.'; return; }
        const { data, error } = await sb.from('perfiles').update({ apodo }).eq('id', estado.uid).select();
        if (error || !data.length) {
            console.error('Apodo:', error);
            $('apodoError').textContent = error && error.code === '23505' ? 'Ese apodo ya está en uso. Elige otro.' : 'No se pudo guardar el apodo. Prueba de nuevo.';
            return;
        }
        estado.apodo = apodo; cerrarApodo(); pintarPerfilExtra();
        aviso('Apodo guardado: ' + apodo);
    }

    /* La tarjeta de perfil del inicio la dibuja auth.js; aquí se le añade el apodo y el torneo. */
    async function salirDelTorneo(id) {
        if (!confirm('¿Cancelar tu inscripción a este torneo?')) return;
        const { data, error } = await sb.from('inscripciones').delete().eq('id', id).select();
        if (error || !data.length) { aviso('No se pudo cancelar la inscripción.'); return; }
        aviso('Inscripción cancelada.'); await refrescar(false);
    }
    function pintarPerfilExtra() {
        const caja = $('perfil'), datos = caja && caja.querySelector('.perfil-datos');
        if (!datos || !estado.uid) return;
        let ex = datos.querySelector('.perfil-torneo');
        if (!ex) { ex = document.createElement('div'); ex.className = 'perfil-torneo'; datos.appendChild(ex); }
        const firma = JSON.stringify([estado.apodo, estado.inscripciones.map(i => i.id)]);
        if (ex.dataset.firma === firma) return;               // sin cambios: evita repintar en bucle
        ex.dataset.firma = firma;
        const torneos = estado.inscripciones.map(i => `🏆 ${esc((i.contenido && i.contenido.titulo) || 'Torneo')}<button type="button" class="pt-x" data-pt="salir" data-id="${esc(i.id)}" title="Cancelar inscripción" aria-label="Cancelar inscripción">✕</button>`).join('<br>');
        ex.innerHTML = `<div class="pt-fila"><span class="pt-et">APODO</span><span class="pt-val">${estado.apodo ? esc(estado.apodo) : '<em>Sin apodo</em>'}</span>
                <button type="button" class="pt-btn" data-pt="apodo">${estado.apodo ? '✎ Cambiar' : '+ Elegir apodo'}</button></div>
            <div class="pt-fila"><span class="pt-et">TORNEO</span><span class="pt-val">${torneos || '<em>Sin inscripción</em> · <a href="torneos.html">ver torneos</a>'}</span></div>`;
    }
    function alClicPerfil(e) {
        const b = e.target.closest('[data-pt]'); if (!b) return;
        if (b.dataset.pt === 'apodo') abrirApodo(); else if (b.dataset.pt === 'salir') salirDelTorneo(b.dataset.id);
    }

    /* Si ya están inscritos y todavía no tienen apodo, se les pregunta (una vez por visita). */
    function sugerirApodo() {
        if (!estado.uid || !estado.inscripciones.length || estado.apodo) return;
        try { if (sessionStorage.getItem('guarida.apodo.pospuesto')) return; } catch { /* nada */ }
        const login = $('modalOverlay');
        if (login && login.classList.contains('abierto')) return;
        setTimeout(abrirApodo, 1200);
    }

    async function refrescar(sugerir = true) {
        await cargarEstado();
        marcarInscritos(); pintarPerfilExtra();
        if (sugerir) sugerirApodo();
    }

    function init() {
        const st = document.createElement('style'); st.id = 'ptEstilos'; st.textContent = ESTILOS; document.head.appendChild(st);
        construirApodo();
        document.addEventListener('click', alClicTorneo);
        const caja = $('perfil');
        if (caja) { new MutationObserver(pintarPerfilExtra).observe(caja, { childList: true, subtree: true }); caja.addEventListener('click', alClicPerfil); }
        const grid = document.querySelector('.torneos-grid');
        if (grid) new MutationObserver(marcarInscritos).observe(grid, { childList: true });
        sb.auth.onAuthStateChange(() => setTimeout(() => refrescar(), 0));
        refrescar();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
