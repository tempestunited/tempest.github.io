/* ═══════════════════════════════════════════════════════════
   GUARIDA DRACONICA — personalizar.js
   Botón flotante para: fondo de pantalla (estático o animado),
   música propia mientras navegas y foto de perfil.
   El fondo y la música se guardan SOLO en el dispositivo de cada
   visitante (nada se sube al servidor). La foto de perfil sí se
   guarda en tu cuenta de Supabase.
   Es autosuficiente: lleva sus propios estilos y no modifica
   auth.js, style.css ni el HTML. Lo carga script.js.
═══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const $ = id => document.getElementById(id);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const aviso = msg => (window.Toast ? window.Toast(msg) : alert(msg));
    const REDUCIR = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const CLAVE = 'guarida.personal', CLAVE_MUSICA = 'guarida.musica';
    const MAX_IMAGEN = 8 * 1024 * 1024, MAX_VIDEO = 25 * 1024 * 1024, MAX_AUDIO = 25 * 1024 * 1024, MAX_PISTAS = 40;

    /* ---------- Estilos propios del botón y el panel ---------- */
    const ESTILOS = `
html.fondo-personal { background: #050014; }
html.fondo-personal body { background: transparent; }
html.fondo-personal .hero, html.fondo-personal .page-hero, html.fondo-personal .form-page { background: transparent !important; }
html.fondo-personal .ticker, html.fondo-personal .footer { background: rgba(3,0,16,0.88); }
#fondoPersonal { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
#fondoPersonal canvas, .fp-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.fp-velo { position: absolute; inset: 0; background: #020008; }
.fp-aurora { background: #050014; }
.fp-aurora::before { content: ''; position: absolute; inset: -30%; background: radial-gradient(40% 50% at 20% 30%, rgba(255,0,51,0.55), transparent 70%), radial-gradient(45% 55% at 80% 20%, rgba(123,0,255,0.55), transparent 70%), radial-gradient(50% 50% at 60% 85%, rgba(0,229,255,0.4), transparent 70%); filter: blur(40px); animation: fpAurora 18s ease-in-out infinite alternate; }
@keyframes fpAurora { from { transform: translate3d(-4%, -3%, 0) rotate(0deg) scale(1); } to { transform: translate3d(5%, 4%, 0) rotate(12deg) scale(1.15); } }
.fp-neon { background: radial-gradient(ellipse at 50% 0%, #2a0a4a, #050014 70%); }
.fp-neon::before { content: ''; position: absolute; inset: -48px 0 0; background-image: linear-gradient(rgba(0,229,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.16) 1px, transparent 1px); background-size: 48px 48px; animation: fpNeon 4s linear infinite; -webkit-mask-image: linear-gradient(transparent, #000 40%); mask-image: linear-gradient(transparent, #000 40%); }
@keyframes fpNeon { to { transform: translateY(48px); } }

.fp-boton { position: fixed; right: 14px; bottom: 14px; z-index: 880; width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--borde); background: var(--panel); color: #fff; font-size: 20px; cursor: pointer; box-shadow: 0 0 18px rgba(255,0,51,0.35); transition: transform 0.2s, box-shadow 0.2s; }
.fp-boton:hover, .fp-boton:focus-visible { transform: scale(1.08); box-shadow: 0 0 26px rgba(255,0,51,0.65); outline: none; }
.fp-panel { position: fixed; right: 14px; bottom: 78px; z-index: 890; width: min(380px, calc(100vw - 28px)); max-height: min(72vh, 620px); overflow: auto; background: var(--panel); border: 1px solid var(--borde); border-radius: 16px; padding: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
.fp-panel[hidden], .fp-pildora[hidden] { display: none; }
.fp-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.fp-tab { flex: 1; padding: 8px 4px; border-radius: 10px; border: 1px solid var(--borde); background: transparent; color: #ccc; font: 700 12px "Montserrat", sans-serif; cursor: pointer; }
.fp-tab.activa { background: var(--rojo); color: #fff; border-color: var(--rojo); }
.fp-h { font: 700 11px "Orbitron", sans-serif; letter-spacing: 2px; color: var(--cian); margin: 14px 0 8px; text-transform: uppercase; }
.fp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.fp-op { min-height: 44px; padding: 6px; border-radius: 10px; border: 2px solid transparent; background: #1a0030; color: #fff; font: 600 11px "Montserrat", sans-serif; cursor: pointer; }
.fp-op.activa { border-color: var(--cian); box-shadow: 0 0 10px rgba(0,229,255,0.4); }
.fp-btn { padding: 8px 14px; border-radius: 10px; border: 1px solid var(--borde); background: transparent; color: #fff; font: 700 12px "Montserrat", sans-serif; cursor: pointer; }
.fp-btn:hover { background: var(--rojo); }
.fp-nota { color: #999; font-size: 11px; line-height: 1.5; margin-top: 6px; }
.fp-panel input[type=file] { width: 100%; font-size: 12px; color: #ccc; margin-bottom: 6px; }
.fp-panel input[type=range] { width: 100%; accent-color: var(--rojo); }
.fp-fila { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.fp-pistas { list-style: none; display: grid; gap: 6px; margin-top: 8px; }
.fp-pista { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; background: rgba(255,255,255,0.05); font-size: 12px; }
.fp-pista.suena { background: rgba(255,0,51,0.18); }
.fp-pista span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fp-mini { width: 28px; height: 28px; flex: none; border-radius: 8px; border: 0; background: rgba(255,255,255,0.1); color: #fff; cursor: pointer; }
.fp-mini:hover, .fp-mini.on { background: var(--rojo); }
.fp-pildora { position: fixed; left: 14px; bottom: 14px; z-index: 880; display: flex; align-items: center; gap: 8px; max-width: min(300px, calc(100vw - 100px)); padding: 6px 8px; background: var(--panel); border: 1px solid var(--borde); border-radius: 30px; box-shadow: 0 0 16px rgba(255,0,51,0.3); }
.fp-pildora .nombre { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; color: #ddd; }
.fp-pildora.espera .fp-mini:first-child { animation: fpPulso 1.2s infinite; }
@keyframes fpPulso { 0% { box-shadow: 0 0 0 0 rgba(255,0,51,0.7); } 100% { box-shadow: 0 0 0 9px rgba(255,0,51,0); } }
.fp-avatar { width: 96px; height: 96px; margin-bottom: 10px; display: grid; place-items: center; overflow: hidden; border-radius: 50%; border: 2px solid var(--borde); background: #1a0030; font-size: 36px; }
.fp-avatar img, .perfil-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.perfil-avatar { overflow: hidden; }
@media (prefers-reduced-motion: reduce) {
    .fp-aurora::before, .fp-neon::before, .fp-pildora.espera .fp-mini:first-child { animation: none; }
}
`;
    function inyectarEstilos() {
        if ($('fpEstilos')) return;
        const st = document.createElement('style'); st.id = 'fpEstilos'; st.textContent = ESTILOS; document.head.appendChild(st);
    }

    /* ---------- Preferencias (localStorage) ---------- */
    const porDefecto = () => ({ fondo: { modo: 'predeterminado', valor: '', oscuridad: 35 }, musica: { vol: 0.6, aleatorio: false, repetir: 'todas' } });
    function leerPrefs() {
        const base = porDefecto();
        try {
            const p = JSON.parse(localStorage.getItem(CLAVE)) || {};
            return { fondo: { ...base.fondo, ...p.fondo }, musica: { ...base.musica, ...p.musica } };
        } catch { return base; }
    }
    function guardarPrefs() { try { localStorage.setItem(CLAVE, JSON.stringify(prefs)); } catch { /* sin espacio */ } }
    let prefs = leerPrefs();

    /* ---------- Archivos del visitante (IndexedDB) ---------- */
    let bdPromesa = null;
    function bd() {
        if (!bdPromesa) bdPromesa = new Promise((ok, mal) => {
            const r = indexedDB.open('guarida-personal', 1);
            r.onupgradeneeded = () => r.result.createObjectStore('archivos', { keyPath: 'id', autoIncrement: true });
            r.onsuccess = () => ok(r.result);
            r.onerror = () => mal(r.error);
        });
        return bdPromesa;
    }
    async function pedir(modo, fn) {
        const db = await bd();
        return new Promise((ok, mal) => {
            const t = db.transaction('archivos', modo), q = fn(t.objectStore('archivos'));
            t.oncomplete = () => ok(q ? q.result : undefined);
            t.onerror = t.onabort = () => mal(t.error);
        });
    }
    const guardarArchivo = reg => pedir('readwrite', s => s.put(reg));
    const leerArchivo = id => pedir('readonly', s => s.get(id));
    const borrarArchivo = id => pedir('readwrite', s => s.delete(id));
    const listarArchivos = tipo => pedir('readonly', s => s.getAll()).then(l => (l || []).filter(x => x.tipo === tipo));

    /* ═══════════════ FONDO ═══════════════ */
    const COLORES = [
        ['Carmesí', 'linear-gradient(135deg,#2a0010,#050014)'], ['Noche', 'linear-gradient(135deg,#050a24,#0b1a3a)'],
        ['Bosque', 'linear-gradient(135deg,#02150d,#07261a)'], ['Violeta', 'linear-gradient(135deg,#150033,#2a0a5e)'],
        ['Grafito', 'linear-gradient(135deg,#0c0c0f,#1c1c22)'], ['Amanecer', 'linear-gradient(135deg,#3a0a1a,#7a2a00)']
    ];
    const ANIMADOS = [['aurora', 'Aurora'], ['neon', 'Neón'], ['estrellas', 'Estrellas'], ['brasas', 'Brasas']];
    let capa = null, animId = 0, urlFondo = null, alRedimensionar = null, turnoFondo = 0;

    function limpiarFondo() {
        cancelAnimationFrame(animId); animId = 0;
        if (alRedimensionar) { removeEventListener('resize', alRedimensionar); alRedimensionar = null; }
        if (urlFondo) { URL.revokeObjectURL(urlFondo); urlFondo = null; }
        if (capa) { capa.innerHTML = ''; capa.className = ''; capa.style.background = ''; }
    }

    function particulas(tipo) {
        const c = document.createElement('canvas'); capa.appendChild(c);
        const g = c.getContext('2d'); let w = 0, h = 0; const ps = [];
        alRedimensionar = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
        alRedimensionar(); addEventListener('resize', alRedimensionar);
        const n = Math.round(Math.min(w * h / (tipo === 'estrellas' ? 9000 : 16000), 150));
        for (let i = 0; i < n; i++) ps.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + 0.5, v: Math.random() * 0.6 + 0.25, f: Math.random() * 6.28 });
        capa.style.background = tipo === 'estrellas' ? 'radial-gradient(ellipse at 50% 120%, #1b1040, #050014 70%)' : 'radial-gradient(ellipse at 50% 120%, #4a0a00, #0a0206 70%)';
        const pintar = t => {
            g.clearRect(0, 0, w, h);
            for (const p of ps) {
                if (tipo === 'estrellas') {
                    g.fillStyle = `rgba(190,220,255,${0.35 + 0.65 * Math.abs(Math.sin(t / 900 + p.f))})`;
                    g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
                } else {
                    p.y -= p.v * 1.3; p.x += Math.sin(t / 700 + p.f) * 0.4;
                    if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
                    const a = 0.3 + 0.5 * Math.abs(Math.sin(t / 500 + p.f));
                    g.fillStyle = `rgba(255,90,20,${a * 0.18})`; g.beginPath(); g.arc(p.x, p.y, p.r * 3.2, 0, 6.283); g.fill();
                    g.fillStyle = `rgba(255,${120 + Math.round(p.r * 40)},50,${a})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
                }
            }
        };
        if (REDUCIR) { pintar(0); return; }
        const bucle = t => { if (!document.hidden) pintar(t); animId = requestAnimationFrame(bucle); };
        animId = requestAnimationFrame(bucle);
    }

    async function aplicarFondo() {
        const f = prefs.fondo, turno = ++turnoFondo, activo = f.modo !== 'predeterminado';
        limpiarFondo();
        document.documentElement.classList.toggle('fondo-personal', activo);
        if (!capa) { capa = document.createElement('div'); capa.id = 'fondoPersonal'; capa.setAttribute('aria-hidden', 'true'); document.body.prepend(capa); }
        capa.style.display = activo ? '' : 'none';
        if (!activo) return;
        if (f.modo === 'color') capa.style.background = f.valor;
        else if (f.modo === 'animado') { if (f.valor === 'aurora' || f.valor === 'neon') capa.className = 'fp-' + f.valor; else particulas(f.valor); }
        else {
            const reg = await leerArchivo('fondo').catch(() => null);
            if (turno !== turnoFondo) return;
            if (!reg) { prefs.fondo = porDefecto().fondo; guardarPrefs(); return aplicarFondo(); }
            urlFondo = URL.createObjectURL(reg.blob);
            capa.insertAdjacentHTML('beforeend', f.modo === 'video'
                ? `<video class="fp-media" src="${urlFondo}" autoplay muted loop playsinline></video>` : `<img class="fp-media" src="${urlFondo}" alt="">`);
        }
        capa.insertAdjacentHTML('beforeend', `<div class="fp-velo" style="opacity:${f.oscuridad / 100}"></div>`);
    }

    function elegirFondo(v) {
        const [modo, valor] = v.split(':');
        if (modo === 'predeterminado') prefs.fondo = { ...prefs.fondo, modo, valor: '' };
        else if (modo === 'color') prefs.fondo = { ...prefs.fondo, modo, valor: COLORES[+valor][1] };
        else prefs.fondo = { ...prefs.fondo, modo: 'animado', valor };
        guardarPrefs(); aplicarFondo(); pintarFondoUI();
    }

    async function subirFondo(archivo) {
        if (!archivo) return;
        const esVideo = /^video\/(mp4|webm)$/.test(archivo.type), esImagen = /^image\/(png|jpeg|webp|gif)$/.test(archivo.type);
        if (!esVideo && !esImagen) { aviso('Usa una imagen (PNG, JPG, WEBP, GIF) o un video MP4/WebM.'); return; }
        if (archivo.size > (esVideo ? MAX_VIDEO : MAX_IMAGEN)) { aviso(esVideo ? 'El video debe pesar menos de 25 MB.' : 'La imagen debe pesar menos de 8 MB.'); return; }
        try {
            await guardarArchivo({ id: 'fondo', tipo: 'fondo', nombre: archivo.name, blob: archivo });
            prefs.fondo = { ...prefs.fondo, modo: esVideo ? 'video' : 'imagen', valor: archivo.name };
            guardarPrefs(); await aplicarFondo(); pintarFondoUI(); aviso('Fondo aplicado.');
        } catch { aviso('Tu navegador no pudo guardar el archivo (¿modo privado o sin espacio?).'); }
    }

    function pintarFondoUI() {
        const f = prefs.fondo, clave = f.modo === 'predeterminado' ? 'predeterminado' : f.modo === 'color' ? 'color:' + COLORES.findIndex(c => c[1] === f.valor) : f.modo === 'animado' ? 'animado:' + f.valor : '';
        document.querySelectorAll('#fpFondo [data-v]').forEach(b => b.classList.toggle('activa', b.dataset.v === clave));
        $('fpOscuridad').value = f.oscuridad; $('fpOscuridadN').textContent = f.oscuridad + '%';
        $('fpFondoActual').textContent = f.modo === 'imagen' || f.modo === 'video' ? 'Fondo actual: ' + f.valor : '';
    }

    /* ═══════════════ MÚSICA ═══════════════ */
    const audio = new Audio();
    audio.preload = 'auto'; audio.volume = prefs.musica.vol;
    let pistas = [], actual = -1, urlPista = null, esperando = false, ultimoGuardado = 0;

    const estadoGuardado = () => { try { return JSON.parse(localStorage.getItem(CLAVE_MUSICA)) || {}; } catch { return {}; } };
    function guardarEstado() {
        if (actual < 0 || !pistas[actual]) return;
        try { localStorage.setItem(CLAVE_MUSICA, JSON.stringify({ id: pistas[actual].id, t: audio.currentTime || 0, sonando: !audio.paused })); } catch { /* nada */ }
    }

    async function reproducir() {
        try { await audio.play(); esperando = false; } catch { esperando = true; }   // el navegador puede exigir un toque
        pintarMusica();
    }
    async function cargarPista(i, empezar, desde) {
        if (i < 0 || i >= pistas.length) return;
        const reg = await leerArchivo(pistas[i].id).catch(() => null);
        if (!reg) return;
        if (urlPista) URL.revokeObjectURL(urlPista);
        urlPista = URL.createObjectURL(reg.blob); audio.src = urlPista; actual = i;
        audio.onloadedmetadata = () => { if (desde > 0 && desde < audio.duration - 1) audio.currentTime = desde; audio.onloadedmetadata = null; };
        if (empezar) await reproducir(); else pintarMusica();
        guardarEstado();
    }
    function alternar() {
        if (actual < 0) { if (pistas.length) cargarPista(0, true); return; }
        if (audio.paused) reproducir(); else { audio.pause(); pintarMusica(); guardarEstado(); }
    }
    function siguiente(auto) {
        if (!pistas.length) return;
        let i;
        if (prefs.musica.aleatorio && pistas.length > 1) { do { i = Math.floor(Math.random() * pistas.length); } while (i === actual); }
        else {
            i = actual + 1;
            if (i >= pistas.length) { if (auto && prefs.musica.repetir === 'ninguna') { audio.pause(); pintarMusica(); return; } i = 0; }
        }
        cargarPista(i, true);
    }
    function anterior() { if (audio.currentTime > 4) audio.currentTime = 0; else cargarPista((actual - 1 + pistas.length) % pistas.length, true); }

    audio.addEventListener('ended', () => { if (prefs.musica.repetir === 'una') { audio.currentTime = 0; reproducir(); } else siguiente(true); });
    audio.addEventListener('play', pintarMusica); audio.addEventListener('pause', pintarMusica);
    audio.addEventListener('timeupdate', () => { if (Date.now() - ultimoGuardado > 2000) { ultimoGuardado = Date.now(); guardarEstado(); } });
    addEventListener('pagehide', guardarEstado);
    document.addEventListener('visibilitychange', () => { if (document.hidden) guardarEstado(); });

    async function cargarPistas() {
        pistas = (await listarArchivos('musica').catch(() => [])).sort((a, b) => a.id - b.id).map(p => ({ id: p.id, nombre: p.nombre }));
        pintarMusica();
    }
    async function subirMusica(archivos) {
        let ok = 0, mal = 0;
        for (const f of archivos) {
            if (!/^audio\//.test(f.type) || f.size > MAX_AUDIO || pistas.length + ok >= MAX_PISTAS) { mal++; continue; }
            try { await guardarArchivo({ tipo: 'musica', nombre: f.name.replace(/\.[^.]+$/, '').slice(0, 80), blob: f }); ok++; } catch { mal++; }
        }
        await cargarPistas();
        aviso(`${ok} canción(es) añadida(s)` + (mal ? `; ${mal} no se pudieron añadir (audio de hasta 25 MB, máximo ${MAX_PISTAS} canciones).` : '.'));
        if (ok && actual < 0) cargarPista(0, false);
    }
    async function quitarPista(i) {
        const era = i === actual;
        await borrarArchivo(pistas[i].id);
        if (era) { audio.pause(); audio.removeAttribute('src'); actual = -1; }
        else if (i < actual) actual--;
        await cargarPistas();
        if (era && pistas.length) cargarPista(Math.min(i, pistas.length - 1), false);
    }

    function pintarMusica() {
        const suena = !audio.paused, hay = pistas.length > 0;
        const lista = $('fpPistas');
        if (lista) lista.innerHTML = pistas.map((p, i) => `<li class="fp-pista${i === actual ? ' suena' : ''}"><button class="fp-mini${i === actual && suena ? ' on' : ''}" data-acc="pista" data-v="${i}" aria-label="Reproducir ${esc(p.nombre)}"><i class="fa-solid ${i === actual && suena ? 'fa-pause' : 'fa-play'}"></i></button><span title="${esc(p.nombre)}">${esc(p.nombre)}</span><button class="fp-mini" data-acc="quitar-pista" data-v="${i}" aria-label="Quitar ${esc(p.nombre)}"><i class="fa-solid fa-xmark"></i></button></li>`).join('') || '<li class="fp-nota">Aún no has añadido canciones.</li>';
        const pil = $('fpPildora');
        if (pil) {
            pil.hidden = !hay; pil.classList.toggle('espera', esperando && !suena);
            pil.querySelector('.nombre').textContent = actual >= 0 && pistas[actual] ? pistas[actual].nombre : 'Tu música';
            pil.querySelector('[data-acc="play"] i').className = 'fa-solid ' + (suena ? 'fa-pause' : 'fa-play');
        }
        if ($('fpAleatorio')) { $('fpAleatorio').classList.toggle('on', prefs.musica.aleatorio); $('fpRepetir').classList.toggle('on', prefs.musica.repetir !== 'ninguna'); $('fpRepetir').title = 'Repetir: ' + prefs.musica.repetir; }
    }

    /* ═══════════════ FOTO DE PERFIL ═══════════════ */
    async function usuario() {
        if (!window.sb) return null;
        const { data } = await window.sb.auth.getSession();
        return data.session ? data.session.user : null;
    }
    /* La tarjeta de perfil del inicio la dibuja auth.js; aquí solo se le pone la foto encima. */
    let avatarUrl = '';
    function aplicarAvatarEnPerfil() {
        const caja = $('perfil'), cont = caja && caja.querySelector('.perfil-avatar');
        if (!cont) return;
        const img = cont.querySelector('img');
        if (avatarUrl) {
            if (img && img.getAttribute('src') === avatarUrl) return;
            if (cont.dataset.inicial === undefined) cont.dataset.inicial = cont.textContent.trim();
            cont.innerHTML = `<img src="${esc(avatarUrl)}" alt="Tu foto de perfil">`;
        } else if (img && cont.dataset.inicial !== undefined) {
            cont.textContent = cont.dataset.inicial;
        }
    }
    async function cargarAvatarPerfil() {
        const u = await usuario();
        if (!u) { avatarUrl = ''; aplicarAvatarEnPerfil(); return; }
        const { data } = await window.sb.from('perfiles').select('avatar_url').eq('id', u.id).maybeSingle();
        avatarUrl = data && /^https:\/\//.test(data.avatar_url || '') ? data.avatar_url : '';
        aplicarAvatarEnPerfil();
    }

    async function pintarFoto() {
        const caja = $('fpFoto'), u = await usuario();
        if (!window.sb || !u) { caja.innerHTML = '<p class="fp-nota">Inicia sesión para poner tu foto de perfil.</p>'; return; }
        const { data } = await window.sb.from('perfiles').select('avatar_url').eq('id', u.id).maybeSingle();
        const url = data && /^https:\/\//.test(data.avatar_url || '') ? data.avatar_url : '';
        caja.innerHTML = `<div class="fp-avatar">${url ? `<img src="${esc(url)}" alt="Tu foto de perfil">` : '<i class="fa-solid fa-user"></i>'}</div>
            <input id="fpArchivoFoto" type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Elegir foto">
            <div class="fp-fila"><button class="fp-btn" data-acc="foto-guardar">Guardar foto</button>${url ? '<button class="fp-btn" data-acc="foto-quitar">Quitar foto</button>' : ''}</div>
            <p class="fp-nota">Se recorta en cuadrado y se reduce a 256 px. Usa una imagen apropiada para toda la comunidad.</p>`;
    }
    async function redimensionar(archivo) {
        const bmp = await createImageBitmap(archivo), lado = Math.min(bmp.width, bmp.height), c = document.createElement('canvas');
        c.width = c.height = 256;
        c.getContext('2d').drawImage(bmp, (bmp.width - lado) / 2, (bmp.height - lado) / 2, lado, lado, 0, 0, 256, 256);
        let blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.85));
        if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
        return blob;
    }
    async function guardarFoto() {
        const f = $('fpArchivoFoto') && $('fpArchivoFoto').files[0], u = await usuario();
        if (!u) { aviso('Inicia sesión primero.'); return; }
        if (!f) { aviso('Elige una imagen.'); return; }
        if (!/^image\//.test(f.type) || f.size > 10 * 1024 * 1024) { aviso('La imagen debe pesar menos de 10 MB.'); return; }
        try {
            const blob = await redimensionar(f), ext = blob.type === 'image/webp' ? 'webp' : 'jpg', ruta = `${u.id}/avatar.${ext}`;
            const up = await window.sb.storage.from('avatares').upload(ruta, blob, { upsert: true, contentType: blob.type, cacheControl: '60' });
            if (up.error) throw up.error;
            const url = window.sb.storage.from('avatares').getPublicUrl(ruta).data.publicUrl + '?v=' + Date.now();
            const r = await window.sb.from('perfiles').update({ avatar_url: url }).eq('id', u.id).select();
            if (r.error || !r.data.length) throw r.error || new Error('sin permiso');
            aviso('Foto de perfil actualizada.');
            cargarAvatarPerfil(); pintarFoto();
        } catch (err) { console.error(err); aviso('No se pudo guardar la foto.'); }
    }
    async function quitarFoto() {
        const u = await usuario(); if (!u) return;
        await window.sb.storage.from('avatares').remove([`${u.id}/avatar.webp`, `${u.id}/avatar.jpg`]);
        const r = await window.sb.from('perfiles').update({ avatar_url: null }).eq('id', u.id).select();
        if (r.error || !r.data.length) { aviso('No se pudo quitar la foto.'); return; }
        aviso('Foto quitada.'); cargarAvatarPerfil(); pintarFoto();
    }

    /* ═══════════════ PANEL ═══════════════ */
    let panel = null, boton = null;
    function construir() {
        boton = document.createElement('button');
        boton.className = 'fp-boton'; boton.id = 'fpBoton'; boton.type = 'button';
        boton.setAttribute('aria-label', 'Personalizar la página'); boton.setAttribute('aria-expanded', 'false');
        boton.innerHTML = '<i class="fa-solid fa-palette"></i>';
        panel = document.createElement('div');
        panel.className = 'fp-panel'; panel.id = 'fpPanel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Personalizar');
        panel.innerHTML = `
            <div class="fp-tabs" role="tablist">
                <button class="fp-tab activa" data-acc="tab" data-v="fondo">Fondo</button>
                <button class="fp-tab" data-acc="tab" data-v="musica">Música</button>
                <button class="fp-tab" data-acc="tab" data-v="foto">Mi foto</button>
            </div>
            <section id="fpFondo">
                <div class="fp-h">Estilo</div>
                <div class="fp-grid"><button class="fp-op" data-acc="fondo" data-v="predeterminado">Predeterminado</button>
                    ${COLORES.map((c, i) => `<button class="fp-op" data-acc="fondo" data-v="color:${i}" style="background:${c[1]}">${c[0]}</button>`).join('')}</div>
                <div class="fp-h">Animados</div>
                <div class="fp-grid">${ANIMADOS.map(a => `<button class="fp-op" data-acc="fondo" data-v="animado:${a[0]}">${a[1]}</button>`).join('')}</div>
                <div class="fp-h">Tu imagen, GIF o video</div>
                <input id="fpArchivoFondo" type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" aria-label="Subir fondo">
                <p class="fp-nota" id="fpFondoActual"></p>
                <p class="fp-nota">Imagen hasta 8 MB o video hasta 25 MB. Se guarda solo en este dispositivo.</p>
                <div class="fp-h">Oscurecer fondo <span id="fpOscuridadN"></span></div>
                <input id="fpOscuridad" type="range" min="0" max="85" step="5" aria-label="Oscurecer fondo">
            </section>
            <section id="fpMusica" hidden>
                <div class="fp-h">Tu música</div>
                <input id="fpArchivoMusica" type="file" accept="audio/*" multiple aria-label="Añadir canciones">
                <p class="fp-nota">Audio de hasta 25 MB por canción. Se guarda solo en este dispositivo y suena mientras navegas.</p>
                <div class="fp-fila" style="margin:10px 0">
                    <button class="fp-mini" data-acc="anterior" aria-label="Anterior"><i class="fa-solid fa-backward-step"></i></button>
                    <button class="fp-mini" data-acc="play" aria-label="Reproducir o pausar"><i class="fa-solid fa-play"></i></button>
                    <button class="fp-mini" data-acc="siguiente" aria-label="Siguiente"><i class="fa-solid fa-forward-step"></i></button>
                    <button class="fp-mini" id="fpAleatorio" data-acc="aleatorio" aria-label="Aleatorio"><i class="fa-solid fa-shuffle"></i></button>
                    <button class="fp-mini" id="fpRepetir" data-acc="repetir" aria-label="Repetir"><i class="fa-solid fa-repeat"></i></button>
                    <i class="fa-solid fa-volume-low" aria-hidden="true"></i><input id="fpVolumen" type="range" min="0" max="1" step="0.05" style="flex:1;min-width:80px" aria-label="Volumen">
                </div>
                <ul class="fp-pistas" id="fpPistas"></ul>
            </section>
            <section id="fpFotoSec" hidden><div id="fpFoto"></div></section>
            <p class="fp-nota" style="margin-top:12px"><button class="fp-btn" data-acc="reset">Restablecer todo</button></p>`;
        const pil = document.createElement('div');
        pil.className = 'fp-pildora'; pil.id = 'fpPildora'; pil.hidden = true;
        pil.innerHTML = `<button class="fp-mini" data-acc="play" aria-label="Reproducir o pausar"><i class="fa-solid fa-play"></i></button><span class="nombre">Tu música</span><button class="fp-mini" data-acc="siguiente" aria-label="Siguiente"><i class="fa-solid fa-forward-step"></i></button>`;
        document.body.append(boton, panel, pil);
    }

    function abrirTab(v) {
        document.querySelectorAll('.fp-tab').forEach(t => t.classList.toggle('activa', t.dataset.v === v));
        $('fpFondo').hidden = v !== 'fondo'; $('fpMusica').hidden = v !== 'musica'; $('fpFotoSec').hidden = v !== 'foto';
        if (v === 'foto') pintarFoto();
    }
    function abrir(tab) { panel.hidden = false; boton.setAttribute('aria-expanded', 'true'); abrirTab(tab || 'fondo'); }
    function cerrar() { panel.hidden = true; boton.setAttribute('aria-expanded', 'false'); }

    async function restablecer() {
        if (!confirm('¿Restablecer el fondo y la música de este dispositivo? Se borrarán tus canciones guardadas.')) return;
        audio.pause(); audio.removeAttribute('src'); actual = -1;
        for (const p of pistas) await borrarArchivo(p.id).catch(() => {});
        await borrarArchivo('fondo').catch(() => {});
        prefs = porDefecto(); guardarPrefs(); localStorage.removeItem(CLAVE_MUSICA);
        audio.volume = prefs.musica.vol; $('fpVolumen').value = prefs.musica.vol;
        await aplicarFondo(); pintarFondoUI(); await cargarPistas(); aviso('Todo restablecido.');
    }

    function alClic(e) {
        const b = e.target.closest('[data-acc]'); if (!b) return;
        const v = b.dataset.v;
        switch (b.dataset.acc) {
            case 'tab': return abrirTab(v);
            case 'fondo': return elegirFondo(v);
            case 'play': return alternar();
            case 'siguiente': return siguiente(false);
            case 'anterior': return pistas.length && anterior();
            case 'pista': return +v === actual ? alternar() : cargarPista(+v, true);
            case 'quitar-pista': return quitarPista(+v);
            case 'aleatorio': prefs.musica.aleatorio = !prefs.musica.aleatorio; guardarPrefs(); return pintarMusica();
            case 'repetir': prefs.musica.repetir = { todas: 'una', una: 'ninguna', ninguna: 'todas' }[prefs.musica.repetir]; guardarPrefs(); return pintarMusica();
            case 'foto-guardar': return guardarFoto();
            case 'foto-quitar': return quitarFoto();
            case 'reset': return restablecer();
        }
    }

    async function init() {
        inyectarEstilos(); construir();
        boton.addEventListener('click', () => (panel.hidden ? abrir('fondo') : cerrar()));
        panel.addEventListener('click', alClic); $('fpPildora').addEventListener('click', alClic);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { cerrar(); boton.focus(); } });
        $('fpArchivoFondo').addEventListener('change', e => { subirFondo(e.target.files[0]); e.target.value = ''; });
        $('fpArchivoMusica').addEventListener('change', e => { subirMusica([...e.target.files]); e.target.value = ''; });
        $('fpOscuridad').addEventListener('input', e => {
            prefs.fondo.oscuridad = +e.target.value; guardarPrefs(); $('fpOscuridadN').textContent = e.target.value + '%';
            const velo = capa && capa.querySelector('.fp-velo'); if (velo) velo.style.opacity = e.target.value / 100;
        });
        $('fpVolumen').value = prefs.musica.vol;
        $('fpVolumen').addEventListener('input', e => { prefs.musica.vol = +e.target.value; audio.volume = prefs.musica.vol; guardarPrefs(); });
        window.Personalizar = { abrir, cerrar };
        if ($('perfil')) new MutationObserver(aplicarAvatarEnPerfil).observe($('perfil'), { childList: true, subtree: true });
        if (window.sb) { cargarAvatarPerfil(); window.sb.auth.onAuthStateChange(() => setTimeout(cargarAvatarPerfil, 0)); }
        pintarFondoUI(); aplicarFondo();
        await cargarPistas();
        if (pistas.length) {   // retoma la canción donde iba al cambiar de página
            const st = estadoGuardado(), i = Math.max(0, pistas.findIndex(p => p.id === st.id));
            await cargarPista(i, !!st.sonando, st.t || 0);
        }
    }

    if (!window.indexedDB) return;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
