/* ═══════════════════════════════════════════════════════════
   GUARIDA DRACONICA — ahorro.js
   Botón "Ahorro de datos" para quien tiene pocos megas o internet
   lento. La parte que realmente ahorra (ocultar imágenes grandes,
   apagar animaciones) vive en script.js para aplicarse ANTES de que
   la página termine de pintarse; este archivo pone el botón, mide
   cuánto pesó la página y avisa si la conexión parece lenta.
   Lo carga script.js.
═══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const A = window.AhorroDatos;
    if (!A) return;
    const $ = id => document.getElementById(id);
    const tamano = n => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB');

    const ESTILOS = `
.ad-boton { position: fixed; right: 76px; bottom: 14px; z-index: 880; width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--borde); background: var(--panel); color: #fff; font-size: 20px; cursor: pointer; box-shadow: 0 0 18px rgba(0,204,68,0.22); }
.ad-boton:hover, .ad-boton:focus-visible { outline: none; box-shadow: 0 0 26px rgba(0,204,68,0.55); }
.ad-boton.on { color: #00cc44; border-color: #00cc44; box-shadow: 0 0 18px rgba(0,204,68,0.55); }
.ad-punto { position: absolute; top: 8px; right: 8px; width: 9px; height: 9px; border-radius: 50%; background: #00cc44; display: none; }
.ad-boton.on .ad-punto { display: block; }
.ad-panel { position: fixed; right: 14px; bottom: 78px; z-index: 890; width: min(340px, calc(100vw - 28px)); padding: 14px; background: var(--panel); border: 1px solid var(--borde); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); font-size: 13px; }
.ad-panel[hidden] { display: none; }
.ad-cab { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font: 700 13px "Orbitron", sans-serif; }
.ad-sw { position: relative; width: 50px; height: 28px; padding: 0; border-radius: 14px; border: 1px solid var(--borde); background: #2a1a40; cursor: pointer; }
.ad-sw span { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: left 0.2s; }
.ad-sw[aria-checked="true"] { background: #00a838; }
.ad-sw[aria-checked="true"] span { left: 25px; }
.ad-nota, .ad-dato { color: #aaa; font-size: 12px; line-height: 1.5; }
.ad-lista { margin: 8px 0 10px 18px; color: #ddd; font-size: 12px; line-height: 1.55; }
.ad-btn { padding: 7px 14px; border-radius: 10px; border: 1px solid var(--borde); background: transparent; color: #fff; font: 700 12px "Montserrat", sans-serif; cursor: pointer; }
.ad-btn:hover { background: var(--rojo); }
.ad-dato { margin-top: 10px; }
.ad-aviso { position: fixed; left: 50%; bottom: 78px; transform: translateX(-50%); z-index: 900; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; width: max-content; max-width: min(520px, calc(100vw - 24px)); padding: 12px 16px; background: var(--panel); border: 1px solid #00cc44; border-radius: 14px; box-shadow: 0 0 20px rgba(0,204,68,0.3); font-size: 13px; }
`;

    /* ---------- Medición ---------- */
    function pesoPagina() {
        let total = 0;
        for (const r of performance.getEntriesByType('resource')) total += r.transferSize || r.encodedBodySize || 0;
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) total += nav.transferSize || nav.encodedBodySize || 0;
        return total;
    }
    function conexion() {
        const c = navigator.connection;
        if (!c) return '';
        const tipo = c.effectiveType ? c.effectiveType.toUpperCase().replace('SLOW-2G', '2G muy lenta') : '';
        return [tipo, c.downlink ? '~' + c.downlink + ' Mb/s' : '', c.saveData ? 'ahorro de datos del navegador activo' : ''].filter(Boolean).join(' · ');
    }

    /* ---------- Fotos pequeñas: se cargan solo al acercarte ---------- */
    function perezoso(raiz) {
        raiz.querySelectorAll('img:not([loading])').forEach(i => { i.loading = 'lazy'; i.decoding = 'async'; });
    }
    let observador = null;
    function vigilarImagenes() {
        if (A.activo()) {
            perezoso(document);
            if (!observador) {
                observador = new MutationObserver(() => { if (A.activo()) perezoso(document); });
                observador.observe(document.body, { childList: true, subtree: true });
            }
        }
    }

    /* ---------- Interfaz ---------- */
    function construir() {
        const st = document.createElement('style'); st.id = 'adEstilos'; st.textContent = ESTILOS; document.head.appendChild(st);
        const b = document.createElement('button');
        b.id = 'adBoton'; b.className = 'ad-boton'; b.type = 'button';
        b.setAttribute('aria-label', 'Ahorro de datos'); b.setAttribute('aria-expanded', 'false');
        b.innerHTML = '<i class="fa-solid fa-leaf"></i><span class="ad-punto"></span>';
        const p = document.createElement('div');
        p.id = 'adPanel'; p.className = 'ad-panel'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Ahorro de datos');
        p.innerHTML = `
            <div class="ad-cab"><span>Ahorro de datos</span>
                <button id="adInterruptor" class="ad-sw" type="button" role="switch" aria-checked="false" aria-label="Activar ahorro de datos"><span></span></button></div>
            <p class="ad-nota">Pensado para quien tiene pocos megas o internet lento. Al activarlo:</p>
            <ul class="ad-lista">
                <li>No descarga las imágenes grandes de las tarjetas ni el fondo del inicio.</li>
                <li>Apaga animaciones y efectos.</li>
                <li>Las fotos pequeñas se cargan solo cuando llegas a verlas.</li>
                <li>Se recuerda en este dispositivo.</li>
            </ul>
            <button id="adVer" class="ad-btn" type="button" hidden>Ver las imágenes de esta página</button>
            <p class="ad-dato" id="adDato"></p>`;
        document.body.append(b, p);
        return { b, p };
    }

    function actualizar() {
        const on = A.activo(), ver = document.documentElement.classList.contains('ahorro-ver');
        $('adBoton').classList.toggle('on', on);
        $('adInterruptor').setAttribute('aria-checked', String(on));
        $('adVer').hidden = !on;
        $('adVer').textContent = ver ? 'Volver a ocultar las imágenes' : 'Ver las imágenes de esta página';
        const kb = pesoPagina(), con = conexion();
        $('adDato').textContent = (kb ? 'Esta página descargó ~' + tamano(kb) + ' (archivos del sitio). ' : '') + (con ? 'Conexión: ' + con + '.' : '');
    }

    function sugerir() {
        const c = navigator.connection;
        if (!c || A.activo()) return;
        try { if (sessionStorage.getItem('guarida.ahorro.visto')) return; } catch { /* sin almacenamiento */ }
        if (!(c.saveData || ['slow-2g', '2g', '3g'].includes(c.effectiveType))) return;
        try { sessionStorage.setItem('guarida.ahorro.visto', '1'); } catch { /* nada */ }
        const d = document.createElement('div');
        d.className = 'ad-aviso'; d.setAttribute('role', 'alert');
        d.innerHTML = '<span>Tu conexión parece lenta. ¿Activar el ahorro de datos?</span><button class="ad-btn" type="button" data-v="si">Activar</button><button class="ad-btn" type="button" data-v="no">No, gracias</button>';
        d.addEventListener('click', e => {
            const b = e.target.closest('[data-v]'); if (!b) return;
            if (b.dataset.v === 'si') { A.aplicar(true); vigilarImagenes(); actualizar(); }
            d.remove();
        });
        document.body.appendChild(d);
    }

    function init() {
        const { b, p } = construir();
        const cerrar = () => { p.hidden = true; b.setAttribute('aria-expanded', 'false'); };
        b.addEventListener('click', () => {
            if (p.hidden) { if (window.Personalizar) window.Personalizar.cerrar(); actualizar(); p.hidden = false; b.setAttribute('aria-expanded', 'true'); }
            else cerrar();
        });
        $('adInterruptor').addEventListener('click', () => { A.aplicar(!A.activo()); vigilarImagenes(); actualizar(); });
        $('adVer').addEventListener('click', () => { document.documentElement.classList.toggle('ahorro-ver'); actualizar(); });
        document.addEventListener('click', e => { if (!p.hidden && !p.contains(e.target) && !b.contains(e.target)) cerrar(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !p.hidden) { cerrar(); b.focus(); } });
        vigilarImagenes(); actualizar(); sugerir();
        addEventListener('load', () => setTimeout(actualizar, 500));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
