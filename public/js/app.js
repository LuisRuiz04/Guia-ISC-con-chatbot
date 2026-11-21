(() => {
    'use strict';
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const raiz = document.documentElement;
    const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cache = new Map();

    /* ---------- Avisos ---------- */
    function toast(mensaje, tipo = 'info') {
        const t = document.createElement('div');
        t.className = 'toast ' + tipo;
        t.textContent = mensaje;
        $('#toasts').append(t);
        requestAnimationFrame(() => t.classList.add('on'));
        setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 400); }, 3200);
    }

    /* ---------- Peticiones JSON ---------- */
    async function api(url, metodo = 'GET', cuerpo) {
        const r = await fetch(url, {
            method: metodo, credentials: 'same-origin',
            headers: cuerpo ? { 'Content-Type': 'application/json' } : {},
            body: cuerpo ? JSON.stringify(cuerpo) : undefined
        });
        if (r.status === 401 && document.body.dataset.shell === 'app') { location.href = '/auth'; throw new Error('Sesión expirada'); }
        let d = {};
        try { d = await r.json(); } catch (e) { /* respuesta sin JSON */ }
        if (metodo !== 'GET') cache.clear();
        return { ...d, ok: r.ok && d.ok !== false, status: r.status };
    }

    /* ---------- Modo claro / oscuro ---------- */
    function aplicarTema(t) {
        raiz.dataset.tema = t;
        try { localStorage.setItem('tema', t); } catch (e) { /* sin almacenamiento */ }
    }
    $('#tema').addEventListener('click', (e) => {
        const nuevo = raiz.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
        if (!document.startViewTransition || reducir) {
            raiz.classList.add('cambiando'); aplicarTema(nuevo);
            setTimeout(() => raiz.classList.remove('cambiando'), 450);
            return;
        }
        const r = e.currentTarget.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        const t = document.startViewTransition(() => aplicarTema(nuevo));
        t.ready.then(() => raiz.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
            { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
        ));
    });

    /* ---------- Navegación fluida (sin recargar) ---------- */
    let contador = 0;
    function traer(url) {
        const c = cache.get(url);
        if (c && Date.now() - c.t < 30000) return c.p;
        const p = fetch(url, { credentials: 'same-origin' }).then(async (r) => ({ html: await r.text(), url: r.url }));
        cache.set(url, { t: Date.now(), p });
        p.catch(() => cache.delete(url));
        return p;
    }
    function marcarNav() {
        $$('.nav-item').forEach((a) => a.classList.toggle('activo', a.dataset.pagina === document.body.dataset.pagina));
    }
    async function ir(url, { push = true } = {}) {
        const id = ++contador;
        document.body.classList.add('cargando');
        let datos;
        try { datos = await traer(url); } catch (e) { location.href = url; return; }
        if (id !== contador) return;
        document.body.classList.remove('cargando');
        const doc = new DOMParser().parseFromString(datos.html, 'text/html');
        const nuevo = $('#contenido', doc);
        // Si cambia de "shell" (por ejemplo, sesión expirada) se hace una navegación normal
        if (!nuevo || doc.body.dataset.shell !== document.body.dataset.shell) { location.href = datos.url; return; }
        const cambiar = () => {
            $('#contenido').replaceWith(document.adoptNode(nuevo));
            document.title = doc.title;
            document.body.dataset.pagina = doc.body.dataset.pagina || '';
            marcarNav();
            if (push) history.pushState(null, '', datos.url);
            scrollTo(0, 0);
            iniciar();
        };
        if (!document.startViewTransition || reducir) { cambiar(); return; }
        raiz.dataset.vt = '1';
        const t = document.startViewTransition(cambiar);
        t.finished.finally(() => { delete raiz.dataset.vt; });
    }
    document.addEventListener('click', (e) => {
        if (document.body.dataset.shell !== 'app') return;
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest('a[href]');
        if (!a || a.target || a.hasAttribute('download') || a.hasAttribute('data-hard')) return;
        const u = new URL(a.href, location.href);
        if (u.origin !== location.origin) return;
        e.preventDefault();
        if (u.pathname + u.search !== location.pathname + location.search) ir(u.href);
    });
    // Precarga al pasar el mouse o tocar: la página ya está lista al hacer clic
    const precargar = (e) => {
        const a = e.target.closest && e.target.closest('a[href]');
        if (a && !a.hasAttribute('data-hard') && a.origin === location.origin && document.body.dataset.shell === 'app') traer(a.href);
    };
    document.addEventListener('pointerover', precargar, { passive: true });
    document.addEventListener('touchstart', precargar, { passive: true });
    addEventListener('popstate', () => ir(location.href, { push: false }));

    /* ---------- Utilidades ---------- */
    function contar(el) {
        const meta = Number(el.dataset.cuenta), suf = el.dataset.sufijo || '';
        if (reducir || !Number.isFinite(meta)) { el.textContent = meta + suf; return; }
        const t0 = performance.now(), dur = 900;
        const paso = (t) => {
            const p = Math.min((t - t0) / dur, 1);
            el.textContent = Math.round(meta * (1 - Math.pow(1 - p, 3))) + suf;
            if (p < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
    }
    function confirmar(mensaje) {
        return new Promise((resolve) => {
            const d = $('#confirmar');
            $('#confirmar-txt').textContent = mensaje;
            const fin = (v) => { d.close(); resolve(v); };
            $('[data-si]', d).onclick = () => fin(true);
            $('[data-no]', d).onclick = () => fin(false);
            d.onclick = (e) => { if (e.target === d) fin(false); };
            d.showModal();
        });
    }

    /* ---------- Acceso ---------- */
    const REGLAS = { largo: (v) => v.length >= 8, mayus: (v) => /[A-Z]/.test(v), minus: (v) => /[a-z]/.test(v), num: (v) => /\d/.test(v), simbolo: (v) => /[^A-Za-z0-9\s]/.test(v) };
    const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function initAuth() {
        const tarjeta = $('.auth-card'), tabs = $$('.tab'), forms = $$('.form'), ind = $('.tab-ind');
        const mostrar = (n) => {
            tabs.forEach((t) => t.classList.toggle('activa', t.dataset.tab === n));
            forms.forEach((f) => f.classList.toggle('activo', f.id === 'form-' + n));
            ind.style.transform = `translateX(${n === 'registro' ? 100 : 0}%)`;
            tarjeta.dataset.vista = n;
        };
        tabs.forEach((t) => t.addEventListener('click', () => mostrar(t.dataset.tab)));
        $$('.ojo').forEach((b) => b.addEventListener('click', () => {
            const i = b.previousElementSibling;
            i.type = i.type === 'password' ? 'text' : 'password';
            b.classList.toggle('on');
        }));

        const pass = $('#reg-password');
        pass.addEventListener('input', () => {
            let ok = 0;
            for (const [k, f] of Object.entries(REGLAS)) { const c = f(pass.value); $(`[data-r=${k}]`).classList.toggle('ok', c); ok += c; }
            $('.fuerza').dataset.nivel = pass.value ? ok : 0;
        });

        const limpiar = (f) => $$('.campo.err', f).forEach((c) => { c.classList.remove('err'); $('.error-txt', c).textContent = ''; });
        const marcar = (f, errores) => {
            let primero = null;
            for (const [campo, msg] of Object.entries(errores)) {
                const input = f.elements[campo];
                const c = input && (input.closest ? input.closest('.campo') : input[0].closest('.campo'));
                if (!c) continue;
                c.classList.add('err'); $('.error-txt', c).textContent = msg;
                primero = primero || input;
            }
            f.classList.remove('sacudir'); void f.offsetWidth; f.classList.add('sacudir');
            if (primero && primero.focus) primero.focus();
        };
        const validar = (f, d) => {
            const e = {};
            if (!REGEX_EMAIL.test(d.email.trim())) e.email = 'Escribe un correo válido.';
            if (f.id === 'form-login') { if (!d.password) e.password = 'Escribe tu contraseña.'; return e; }
            if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]{3,80}$/.test(d.nombre.trim())) e.nombre = 'Escribe tu nombre (solo letras, mínimo 3).';
            if (!Object.values(REGLAS).every((fn) => fn(d.password)) || d.password.length > 64) e.password = 'Cumple todos los requisitos de la contraseña.';
            if (d.password !== d.confirmar) e.confirmar = 'Las contraseñas no coinciden.';
            return e;
        };

        forms.forEach((f) => f.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            limpiar(f);
            const datos = Object.fromEntries(new FormData(f));
            const errores = validar(f, datos);
            if (Object.keys(errores).length) return marcar(f, errores);
            const btn = $('button[type=submit]', f);
            btn.classList.add('cargando'); btn.disabled = true;
            try {
                const r = await api(f.dataset.url, 'POST', datos);
                if (r.ok) {
                    btn.classList.remove('cargando'); btn.classList.add('exito'); btn.textContent = '¡Listo!';
                    toast(r.mensaje || '¡Listo!', 'ok');
                    setTimeout(() => { location.href = r.redirect || '/'; }, 500);
                    return;
                }
                if (r.errores) marcar(f, r.errores); else toast(r.mensaje || 'No se pudo completar la acción.', 'error');
            } catch (e) { toast('No hay conexión con el servidor.', 'error'); }
            btn.classList.remove('cargando'); btn.disabled = false;
        }));
    }

    /* ---------- Materias ---------- */
    function initMaterias() {
        const cont = $('#contenido');
        let area = '', q = '';
        const filtrar = () => {
            $$('.materia').forEach((m) => { m.hidden = !((!area || m.dataset.area === area) && (!q || m.dataset.texto.includes(q))); });
            $$('.semestre').forEach((s) => { s.hidden = !$$('.materia:not([hidden])', s).length; });
        };
        $$('.chip').forEach((c) => c.addEventListener('click', () => {
            $$('.chip').forEach((x) => x.classList.toggle('activa', x === c));
            area = c.dataset.v; filtrar();
        }));
        $('#buscar').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); filtrar(); });

        const poner = (card, estado) => {
            card.dataset.estado = estado;
            $$('.est', card).forEach((b) => b.classList.toggle('on', b.dataset.estado === estado));
            $('.cal', card).classList.toggle('oculto', estado !== 'aprobada');
            if (estado !== 'aprobada') $('.cal-input', card).value = '';
            const celda = $(`.celda[data-id="${card.dataset.id}"]`);
            if (celda) celda.dataset.estado = estado;
        };
        const recalcular = () => {
            const ms = $$('.materia'), apr = ms.filter((m) => m.dataset.estado === 'aprobada');
            const suma = (l) => l.reduce((s, m) => s + Number(m.dataset.creditos), 0);
            const notas = apr.map((m) => parseFloat($('.cal-input', m).value)).filter((n) => !isNaN(n));
            $('#r-aprobadas').textContent = apr.length;
            $('#r-creditos').textContent = suma(apr);
            $('#r-cursando').textContent = ms.filter((m) => m.dataset.estado === 'cursando').length;
            $('#r-promedio').textContent = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '—';
            $('#r-barra').style.width = (ms.length ? Math.round(apr.length / ms.length * 100) : 0) + '%';
            $$('.semestre').forEach((s) => {
                const lista = $$('.materia', s), a = lista.filter((m) => m.dataset.estado === 'aprobada').length;
                $('.sem-cont', s).textContent = `${a} de ${lista.length} aprobadas`;
                $('.sem-barra span', s).style.width = (lista.length ? a / lista.length * 100 : 0) + '%';
            });
        };
        recalcular();

        cont.addEventListener('click', async (e) => {
            const b = e.target.closest('.est');
            if (!b) return;
            const card = b.closest('.materia'), previo = card.dataset.estado, nuevo = b.dataset.estado;
            if (previo === nuevo) return;
            poner(card, nuevo); recalcular();
            try {
                const r = await api('/api/progreso', 'POST', { materiaId: Number(card.dataset.id), estado: nuevo, calificacion: null });
                if (!r.ok) throw new Error(r.mensaje);
            } catch (err) { poner(card, previo); recalcular(); toast('No se pudo guardar el cambio.', 'error'); }
        });
        cont.addEventListener('change', async (e) => {
            const i = e.target.closest('.cal-input');
            if (!i) return;
            let v = i.value === '' ? null : Number(i.value);
            if (v !== null && (!Number.isInteger(v) || v < 70 || v > 100)) { toast('La calificación debe estar entre 70 y 100.', 'error'); i.value = ''; v = null; }
            const card = i.closest('.materia');
            const r = await api('/api/progreso', 'POST', { materiaId: Number(card.dataset.id), estado: 'aprobada', calificacion: v });
            r.ok ? toast('Calificación guardada.', 'ok') : toast(r.mensaje || 'No se pudo guardar.', 'error');
            recalcular();
        });
    }

    /* ---------- Proyectos ---------- */
    function initProyectos() {
        const chips = $$('.chip');
        chips.forEach((c) => c.addEventListener('click', () => {
            chips.forEach((x) => x.classList.toggle('activa', x === c));
            $$('[data-f]').forEach((el) => { el.hidden = !!c.dataset.v && el.dataset.f !== c.dataset.v; });
        }));
    }

    /* ---------- Chat ---------- */
    function initChat() {
        const caja = $('#mensajes'), input = $('#chat-input');
        const burbuja = (txt, quien) => {
            const d = document.createElement('div');
            d.className = 'burbuja ' + quien; d.textContent = txt;
            caja.append(d); caja.scrollTop = caja.scrollHeight;
            return d;
        };
        const escribiendo = () => {
            const d = document.createElement('div');
            d.className = 'burbuja bot escribiendo'; d.innerHTML = '<i></i><i></i><i></i>';
            caja.append(d); caja.scrollTop = caja.scrollHeight;
            return d;
        };
        let ocupado = false;
        async function enviar(txt) {
            if (ocupado || !txt.trim()) return;
            ocupado = true;
            burbuja(txt, 'yo');
            const t = escribiendo();
            const [r] = await Promise.all([api('/api/chat', 'POST', { mensaje: txt }).catch(() => ({})), new Promise((ok) => setTimeout(ok, 550))]);
            t.remove();
            burbuja(r.respuesta || r.mensaje || 'Tuve un problema para responder. Inténtalo otra vez.', 'bot');
            ocupado = false;
        }
        burbuja('¡Hola! 👋 Soy el asistente de Guía ISC. Pregúntame por una materia, un semestre, tu avance, hábitos de estudio o proyectos.', 'bot');
        $('#chat-form').addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; enviar(v); });
        $$('.sug').forEach((b) => b.addEventListener('click', () => enviar(b.textContent)));
    }

    /* ---------- Temporizador ---------- */
    function initTiempo() {
        const pomo = $('.pomo');
        if (!pomo) return;
        const reloj = $('#pomo-tiempo'), anillo = $('.pa-valor'), btn = $('#pomo-iniciar');
        let total = 25 * 60, restante = total;
        const pintar = () => {
            const m = String(Math.floor(restante / 60)).padStart(2, '0'), s = String(restante % 60).padStart(2, '0');
            reloj.textContent = `${m}:${s}`;
            anillo.style.strokeDashoffset = 326.7 * (1 - restante / total);
            document.title = window.__pomo ? `${m}:${s} | Guía ISC` : document.title.replace(/^\d\d:\d\d \| /, '');
        };
        const parar = () => { clearInterval(window.__pomo); window.__pomo = null; btn.textContent = 'Iniciar'; };
        const reiniciar = () => { parar(); restante = total; pintar(); };
        $$('.pomo-modo').forEach((b) => b.addEventListener('click', () => {
            $$('.pomo-modo').forEach((x) => x.classList.toggle('on', x === b));
            total = Number(b.dataset.min) * 60;
            pomo.dataset.modo = b.dataset.min === '25' ? 'foco' : 'descanso';
            reiniciar();
        }));
        btn.addEventListener('click', () => {
            if (window.__pomo) { parar(); pintar(); return; }
            btn.textContent = 'Pausar';
            window.__pomo = setInterval(() => {
                restante -= 1; pintar();
                if (restante <= 0) { parar(); restante = total; pintar(); toast('¡Tiempo terminado! Toma un respiro o continúa con el siguiente bloque.', 'ok'); }
            }, 1000);
        });
        $('#pomo-reiniciar').addEventListener('click', reiniciar);
        pintar();
    }

    /* ---------- Administración ---------- */
    const CAMPOS = {
        materias: { nombre: 'materia', campos: [['clave', 'Clave'], ['nombre', 'Nombre'], ['semestre', 'Semestre (1 a 10)', 'number'], ['creditos', 'Créditos', 'number'], ['area', 'Área']] },
        consejos: { nombre: 'consejo', campos: [['tipo', 'Sección', 'select', [['habitos', 'Hábitos de estudio'], ['tiempo', 'Organización del tiempo']]], ['icono', 'Ícono (un emoji)'], ['titulo', 'Título'], ['contenido', 'Contenido', 'textarea']] },
        proyectos: { nombre: 'proyecto', campos: [['titulo', 'Título'], ['descripcion', 'Descripción', 'textarea'], ['semestre', 'Semestre (1 a 10)', 'number'], ['tecnologias', 'Tecnologías (separadas por coma)']] }
    };
    let panelAdmin = 'materias';

    function initAdmin() {
        const modal = $('#modal'), form = $('#form-admin'), cont = $('#contenido');
        let ctx = null;
        const panel = (n) => {
            panelAdmin = n;
            $$('.tab-a').forEach((t) => t.classList.toggle('on', t.dataset.panel === n));
            $$('.panel-a').forEach((p) => p.classList.toggle('on', p.dataset.panel === n));
        };
        panel(panelAdmin);
        $$('.tab-a').forEach((t) => t.addEventListener('click', () => panel(t.dataset.panel)));

        const abrir = (recurso, item) => {
            ctx = { recurso, id: item ? item.id : null };
            $('#modal-titulo').textContent = (item ? 'Editar ' : 'Nuevo ') + CAMPOS[recurso].nombre;
            $('#campos').innerHTML = '';
            CAMPOS[recurso].campos.forEach(([n, etiqueta, tipo = 'text', ops]) => {
                const c = document.createElement('div'); c.className = 'campo';
                const l = document.createElement('label'); l.textContent = etiqueta; l.htmlFor = 'f-' + n;
                let inp;
                if (tipo === 'select') {
                    inp = document.createElement('select');
                    ops.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; inp.append(o); });
                } else if (tipo === 'textarea') inp = document.createElement('textarea');
                else { inp = document.createElement('input'); inp.type = tipo; if (tipo === 'number') { inp.min = 0; inp.max = 12; } }
                inp.id = 'f-' + n; inp.name = n;
                if (item) inp.value = item[n]; else if (tipo === 'select') inp.value = ops[0][0];
                const er = document.createElement('span'); er.className = 'error-txt';
                c.append(l, inp, er); $('#campos').append(c);
            });
            modal.showModal();
        };
        $$('[data-nuevo]').forEach((b) => b.addEventListener('click', () => abrir(b.dataset.nuevo)));
        $('[data-cerrar]', modal).addEventListener('click', () => modal.close());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            $$('.campo', form).forEach((c) => { c.classList.remove('err'); $('.error-txt', c).textContent = ''; });
            const r = await api(`/api/admin/${ctx.recurso}${ctx.id ? '/' + ctx.id : ''}`, ctx.id ? 'PUT' : 'POST', Object.fromEntries(new FormData(form)));
            if (r.ok) { modal.close(); toast(r.mensaje, 'ok'); ir(location.href, { push: false }); return; }
            Object.keys(r.errores || {}).forEach((k) => { const c = form.elements[k] && form.elements[k].closest('.campo'); if (c) { c.classList.add('err'); $('.error-txt', c).textContent = r.errores[k]; } });
            toast(r.mensaje || 'No se pudo guardar.', 'error');
        });

        cont.addEventListener('click', async (e) => {
            const ed = e.target.closest('[data-editar]'), del = e.target.closest('[data-borrar]');
            if (ed) abrir(ed.dataset.editar, JSON.parse(ed.closest('tr').dataset.item));
            if (del && await confirmar(`¿Eliminar "${del.dataset.nombre}"? Esta acción no se puede deshacer.`)) {
                const r = await api(`/api/admin/${del.dataset.borrar}/${del.dataset.id}`, 'DELETE');
                toast(r.mensaje || 'Listo.', r.ok ? 'ok' : 'error');
                if (r.ok) {
                    const fila = del.closest('tr');
                    fila.style.transition = 'opacity .25s'; fila.style.opacity = '0';
                    setTimeout(() => ir(location.href, { push: false }), 260);
                }
            }
        });
        cont.addEventListener('change', async (e) => {
            const s = e.target.closest('[data-rol]');
            if (!s) return;
            const r = await api(`/api/admin/usuarios/${s.dataset.rol}`, 'PUT', { rol: s.value });
            toast(r.mensaje || 'Listo.', r.ok ? 'ok' : 'error');
        });
    }

    /* ---------- Inicio de cada página ---------- */
    function iniciar() {
        clearInterval(window.__pomo); window.__pomo = null;
        $$('.aparece').forEach((e, i) => e.style.setProperty('--i', Math.min(i, 12)));
        $$('[data-cuenta]').forEach(contar);
        const paginas = { auth: initAuth, materias: initMaterias, proyectos: initProyectos, chat: initChat, tiempo: initTiempo, admin: initAdmin };
        const fn = paginas[document.body.dataset.pagina];
        if (fn) fn();
    }
    iniciar();
})();
