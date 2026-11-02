/* ═══════════════════════════════════════════════════════════
   GUARIDA DRACONICA — contenido.js
   Carga desde Supabase las noticias, clanes, torneos, eventos y
   descripciones que los admins editan en el centro de mando.
   Si no hay datos (o falla la conexión), la página conserva su
   contenido original. Va después de auth.js.
═══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const nl = t => esc(t).replace(/\n/g, '<br>');
    const https = u => (/^https:\/\//.test(u || '') ? u : '');
    const clase = c => String(c || '').replace(/[^\w -]/g, '');

    const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const MESES_LARGO = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const TIPOS = { showcase: 'Showcase', expo: 'Expo', lanzamiento: 'Lanzamiento', esports: 'eSports' };
    const ESTADOS_EVENTO = { proximo: 'Próximo', esperado: 'Esperado', hype: '🔥 Muy esperado' };
    const ESTADOS_TORNEO = {
        abierto: ['✔ Inscripciones abiertas', 'Registrarse para competir'],
        lleno:   ['⚠ Cupos llenos', 'Sin cupos disponibles'],
        proximo: ['⏳ Abre pronto', 'Inscripciones próximamente']
    };
    const ICONOS_TORNEO = ['fa-solid fa-gamepad', 'fa-regular fa-calendar', 'fa-regular fa-clock', 'fa-solid fa-users'];

    /* ---------- Plantillas (usan las mismas clases de style.css) ---------- */
    /* Enlace de "Leer más": una página del sitio o una dirección http(s). Cualquier otra cosa se ignora. */
    const ENLACE_OK = /^(https?:\/\/\S+|[a-z0-9_\/-]+\.html(#[a-z0-9_-]*)?)$/i;
    function enlaceHTML(r) {
        const url = ENLACE_OK.test(r.enlace_url || '') ? r.enlace_url : '#';
        const externo = /^https?:/i.test(url);
        return `<a class="card-link" href="${esc(url)}"${externo ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(r.enlace_texto || 'Leer más')} <i class="fa-solid fa-arrow-right"></i></a>`;
    }

    function fichaHTML(r) {
        const img = https(r.imagen_url);
        const estilo = img ? ` style="background-image:url('${esc(img)}');background-size:cover;background-position:center"` : '';
        const e = (r.etiqueta || '').toUpperCase();
        const variante = e.includes('HOT') ? ' card-badge--hot' : e.includes('DESTACADO') ? ' card-badge--nuevo' : '';
        const badge = r.etiqueta ? `<span class="card-badge${variante}">${esc(r.etiqueta)}</span>` : '';
        return `<article class="card-noticia"><div class="card-noticia__img ${img ? '' : clase(r.img_clase)}"${estilo}>${badge}</div>
            <div class="card-noticia__body"><span class="card-categoria">${esc(r.categoria)}</span>
            <h3 class="card-titulo">${esc(r.titulo)}</h3><p class="card-texto">${nl(r.texto)}</p>
            ${enlaceHTML(r)}</div></article>`;
    }

    function torneoHTML(r) {
        const estado = ESTADOS_TORNEO[r.estado] ? r.estado : 'proximo';
        const [textoEstado, textoBoton] = ESTADOS_TORNEO[estado];
        const lineas = (r.texto || '').split('\n').map(l => l.trim()).filter(Boolean)
            .map((l, i) => `<span><i class="${ICONOS_TORNEO[i] || 'fa-solid fa-circle-info'}"></i> ${esc(l)}</span>`).join('');
        const boton = estado === 'abierto' ? `<a href="registro.html" class="torneo-btn">${textoBoton}</a>`
            : `<button class="torneo-btn deshabilitado" disabled>${textoBoton}</button>`;
        return `<div class="torneo-card"><div class="torneo-header">
            <div class="torneo-icono"><i class="fa-solid ${clase(r.img_clase) || 'fa-trophy'}"></i></div><span class="torneo-prize">${esc(r.premio)}</span></div>
            <h3 class="torneo-nombre">${esc(r.titulo)}</h3><div class="torneo-meta">${lineas}</div>
            <span class="torneo-estado estado-${estado}">${textoEstado}</span>${boton}</div>`;
    }

    function eventosHTML(filas) {
        const meses = {};
        filas.filter(r => r.fecha).forEach(r => { (meses[r.fecha.slice(0, 7)] = meses[r.fecha.slice(0, 7)] || []).push(r); });
        return Object.keys(meses).sort().map(k => {
            const [anio, mes] = k.split('-');
            const tarjetas = meses[k].map(r => {
                const tipo = TIPOS[r.tipo] ? r.tipo : 'showcase', estado = ESTADOS_EVENTO[r.estado] ? r.estado : 'proximo';
                const icono = /\d{1,2}:\d{2}/.test(r.hora || '') ? 'fa-regular fa-clock' : 'fa-solid fa-location-dot';
                return `<article class="evento-card${r.destacado ? ' evento-card--destacado' : ''}" data-tipo="${tipo}">
                    <div class="evento-fecha"><span class="evento-dia">${r.fecha.slice(8, 10)}</span><span class="evento-mes">${MESES[+mes - 1]}</span></div>
                    <div class="evento-body"><div class="evento-header"><span class="evento-tag tag-${tipo}">${TIPOS[tipo]}</span>
                    <span class="evento-horario"><i class="${icono}"></i> ${esc(r.hora)}</span></div>
                    <h3 class="evento-titulo">${esc(r.titulo)}</h3><p class="evento-desc">${nl(r.texto)}</p>
                    <div class="evento-footer"><span class="evento-plataforma"><i class="fa-solid fa-gamepad"></i> ${esc(r.plataforma)}</span>
                    <span class="estado-${estado}">${esc(r.etiqueta || ESTADOS_EVENTO[estado])}</span></div></div></article>`;
            }).join('');
            return `<div class="timeline-mes"><p class="timeline-mes__label">${MESES_LARGO[+mes - 1]} ${anio}</p>${tarjetas}</div>`;
        }).join('');
    }

    /* seccion, dónde se pinta, cómo se pinta. El orden importa: la portada tiene #noticias */
    const PAGINAS = [
        ['torneos',  '.torneos-grid',           f => f.map(torneoHTML).join('')],
        ['eventos',  '.timeline-contenedor',    eventosHTML],
        ['noticias', '#noticias .grid-noticias', f => f.map(fichaHTML).join('')],
        ['clanes',   '.grid-noticias',          f => f.map(fichaHTML).join('')]
    ];
    const TEXTO_EN = { inicio: '.hero-content > p', clanes: '.page-hero p', torneos: '.page-hero p', eventos: '.page-hero p' };

    async function cargarFichas(seccion, contenedor, pintar) {
        let q = window.sb.from('contenido').select('*').eq('seccion', seccion).eq('publicado', true);
        q = seccion === 'eventos' ? q.order('fecha', { ascending: true }) : q.order('orden', { ascending: true });
        const { data, error } = await q;
        if (error || !data || !data.length) return;          // se queda el contenido original
        contenedor.innerHTML = pintar(data);
    }

    async function cargarTexto(clave) {
        const { data } = await window.sb.from('textos').select('valor').eq('clave', clave).maybeSingle();
        const el = document.querySelector(TEXTO_EN[clave]);
        if (data && el) el.textContent = data.valor;
    }

    function init() {
        if (!window.sb) return;
        const pagina = PAGINAS.find(([, selector]) => document.querySelector(selector));
        if (!pagina) return;
        const [seccion, selector, pintar] = pagina;
        cargarFichas(seccion, document.querySelector(selector), pintar);
        cargarTexto(seccion === 'noticias' ? 'inicio' : seccion);
    }

    document.addEventListener('DOMContentLoaded', init);
})();