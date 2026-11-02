/* ═══════════════════════════════════════════════════════════
   GUARIDA DRACONICA — auth.js
   Cuentas con Supabase por usuario y contraseña (sin correo):
   registro, login (página y ventana "Entrar")
   y estado de la sesión en la barra superior.
   Se carga DESPUÉS de supabase-js y ANTES de script.js.
═══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ===== Datos de tu proyecto de Supabase ===== */
    const SUPABASE_URL = 'https://ubfqqdezisytigqwcqai.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_4nCR-6CGgw0I0dDv7A2Oag_aMKcyhxE';
    /* ============================================ */

    const sb = (window.supabase && !SUPABASE_URL.includes('TU-PROYECTO'))
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
    window.sb = sb;   // el ranking usa este mismo cliente

    const $ = id => document.getElementById(id);

    /* ---------- Aviso flotante ---------- */
    function Toast(msg) {
        let t = $('toastGamer');
        if (!t) {
            t = document.createElement('div');
            t.id = 'toastGamer'; t.className = 'toast-gamer'; t.setAttribute('role', 'status');
            document.body.appendChild(t);
        }
        t.textContent = msg; t.classList.add('on');
        clearTimeout(Toast.t); Toast.t = setTimeout(() => t.classList.remove('on'), 3500);
    }
    window.Toast = Toast;

    /* ---------- Validaciones (las mismas del sitio) ---------- */
    /* Sin correo: el usuario se convierte en una dirección interna que el visitante nunca ve.
       Supabase rechaza dominios sin servidor de correo (como example.com), por eso se usa uno real.
       No lo cambies después de que se registre gente: las cuentas quedan ligadas a este dominio. */
    const DOMINIO = 'gmail.com';
    const correoDe = usuario => usuario.toLowerCase() + '@' + DOMINIO;
    window.correoDe = correoDe;   // lo usa el centro de mando

    const RE = {
        usuario: /^[a-zA-Z0-9_]{4,20}$/,
        pass:    /^(?=.*[A-Z])(?=.*[0-9]).{6,}$/
    };

    function marcar(input, span, msg) {
        if (!input) return;
        input.classList.toggle('invalido', !!msg);
        input.classList.toggle('valido', !msg);
        if (span) span.textContent = msg || '';
    }

    function msgError(err) {
        const m = ((err && err.message) || '').toLowerCase();
        if (m.includes('invalid login'))      return 'Usuario o contraseña incorrectos.';
        if (m.includes('already registered')) return 'Ese usuario ya existe. Elige otro.';
        if (m.includes('database error'))     return 'Ese nombre de usuario ya está en uso o no es válido.';
        if (m.includes('not confirmed'))      return 'Supabase aún exige confirmar el correo. Desactiva esa opción.';
        if (m.includes('invalid') && m.includes('email')) return 'Supabase rechazó la dirección interna. Revisa DOMINIO en auth.js.';
        if (m.includes('rate limit'))         return 'Demasiados intentos. Espera unos minutos.';
        if (m.includes('failed to fetch'))    return 'No se pudo conectar con Supabase.';
        return 'Error: ' + ((err && err.message) || 'desconocido');
    }

    /* ---------- Sesión en la barra superior ---------- */
    function nombreDe(user) {
        return (user.user_metadata && user.user_metadata.usuario) || (user.email || '').split('@')[0];
    }

    async function salir() {
        await sb.auth.signOut();
        Toast('Sesión cerrada.');
    }

    function pintarSesion(user) {
        if ($('adminForm')) return;   // el centro de mando maneja su propia barra
        const bar = document.querySelector('.nav-actions');
        if (!bar) return;
        bar.querySelectorAll('#btnEntrar, .btn-login, .btn-register, a[href="login.html"], a[href="registro.html"]')
            .forEach(el => { el.style.display = user ? 'none' : ''; });

        let info = $('navUser');
        if (user) {
            if (!info) {
                info = document.createElement('span');
                info.id = 'navUser'; info.className = 'nav-user';
                const out = document.createElement('button');
                out.id = 'btnSalir'; out.className = 'btn-gamer'; out.textContent = 'Salir';
                out.addEventListener('click', salir);
                bar.appendChild(info); bar.appendChild(out);
            }
            info.textContent = 'Hola, ' + nombreDe(user);
        } else if (info) {
            info.remove(); $('btnSalir').remove();
        }
        setTimeout(() => revisarAdmin(user), 0);
    }

    /* Si la cuenta es de administrador, aparece el botón "Centro de mando" en la barra */
    let revision = 0;   // solo cuenta la última comprobación (se llama varias veces al cargar)
    async function revisarAdmin(user) {
        const turno = ++revision;
        if (!user || !sb) { document.querySelectorAll('#btnCentro').forEach(el => el.remove()); return; }
        const { data } = await sb.from('admins').select('rol').eq('user_id', user.id).maybeSingle();
        if (turno !== revision) return;   // llegó una comprobación más nueva: esta se descarta
        const bar = document.querySelector('.nav-actions');
        document.querySelectorAll('#btnCentro').forEach(el => el.remove());
        if (!data || !bar) return;
        const a = document.createElement('a');
        a.id = 'btnCentro'; a.className = 'btn-gamer'; a.href = 'admin.html'; a.textContent = 'Centro de mando';
        bar.insertBefore(a, $('navUser') || bar.firstChild);
    }

    /* ---------- Login (ventana "Entrar" y página login.html) ---------- */
    async function enviarLogin(idUser, idErrUser, idPass, idErrPass, alExito) {
        const inU = $(idUser), inP = $(idPass);
        const usuario = inU.value.trim(), pass = inP.value;
        const okU = RE.usuario.test(usuario);
        const okP = pass.length >= 6;

        marcar(inU, $(idErrUser), okU ? '' : 'Usuario inválido (letras, números y _, de 4 a 20 caracteres).');
        marcar(inP, $(idErrPass), okP ? '' : 'La contraseña debe tener al menos 6 caracteres.');
        if (!okU || !okP) return;
        if (!sb) { Toast('Falta conectar Supabase en auth.js.'); return; }

        const { data, error } = await sb.auth.signInWithPassword({ email: correoDe(usuario), password: pass });
        if (error) {
            marcar(inU, $(idErrUser), '');
            marcar(inP, $(idErrPass), msgError(error));
            inU.classList.add('invalido'); inU.classList.remove('valido');
            return;
        }
        Toast('¡Bienvenido de vuelta, ' + nombreDe(data.user) + '!');
        alExito();
    }

    function ligarVentanaLogin() {
        const form = $('modalForm');
        if (!form) return;
        form.addEventListener('submit', e => {
            e.preventDefault();
            enviarLogin('loginUsuario', 'errorUsuario', 'loginPassword', 'errorPassword', () => {
                const overlay = $('modalOverlay');
                if (overlay) overlay.classList.remove('abierto');
                form.reset();
                form.querySelectorAll('input').forEach(i => i.classList.remove('valido', 'invalido'));
            });
        });
    }

    function ligarPaginaLogin() {
        const form = $('formLogin');
        if (!form) return;
        form.addEventListener('submit', e => {
            e.preventDefault();
            enviarLogin('loginUsuario', 'errUsuario', 'loginPassword', 'errPassword',
                () => setTimeout(() => { window.location.href = 'index.html'; }, 900));
        });
    }

    /* ---------- Registro (registro.html) ---------- */
    async function enviarRegistro(e) {
        e.preventDefault();
        const usuario = $('inputUsuario').value.trim(), pass = $('inputPassword').value;
        const okU = RE.usuario.test(usuario), okP = RE.pass.test(pass);

        marcar($('inputUsuario'), $('errUsuario'), okU ? '' : 'Usa letras, números y _ (de 4 a 20 caracteres).');
        marcar($('inputPassword'), $('errPassword'), okP ? '' : 'Mínimo 6 caracteres, una mayúscula y un número.');
        if (!okU || !okP) return;
        if (!sb) { Toast('Falta conectar Supabase en auth.js.'); return; }

        const form = e.target, btn = form.querySelector('.form-submit');
        btn.disabled = true;
        try {
            const { data, error } = await sb.auth.signUp({
                email: correoDe(usuario), password: pass,
                options: { data: { usuario } }
            });
            if (error) { console.error('signUp', error); Toast(msgError(error)); return; }
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                marcar($('inputUsuario'), $('errUsuario'), 'Ese usuario ya existe. Elige otro.');
                return;
            }
            if (!data.session) { Toast('Cuenta creada, pero Supabase exige confirmar un correo. Desactiva esa opción.'); return; }
            Toast('¡Registro exitoso! Bienvenido a la Guarida, ' + usuario + '.');
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        } catch (err) {
            Toast(msgError(err));
        } finally {
            btn.disabled = false;
        }
    }

    function ligarPaginaRegistro() {
        const form = $('formRegistro');
        if (form) form.addEventListener('submit', enviarRegistro);
    }

    /* ---------- Arranque ---------- */
    function init() {
        ligarVentanaLogin();
        ligarPaginaLogin();
        ligarPaginaRegistro();
        if (!sb) return;
        sb.auth.getSession().then(({ data }) => pintarSesion(data.session && data.session.user));
        sb.auth.onAuthStateChange((_evento, sesion) => pintarSesion(sesion && sesion.user));
    }

    document.addEventListener('DOMContentLoaded', init);
})();
