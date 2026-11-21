import { Consejo, Proyecto } from '../models/index.js';
import { cargarMaterias, calcularResumen } from './materiaController.js';

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const ORDINALES = { primer: 1, primero: 1, segundo: 2, tercer: 3, tercero: 3, cuarto: 4, quinto: 5, sexto: 6, septimo: 7, octavo: 8, noveno: 9, decimo: 10 };
const VACIAS = new Set(['de', 'y', 'la', 'el', 'en', 'del', 'a', 'e', 'los', 'las', 'para']);
const ESTADO = { aprobada: '✅ Aprobada', cursando: '📖 Cursando', pendiente: '⏳ Pendiente' };

const semestreEn = (t) => {
    if (!t.includes('semestre')) return null;
    const m = t.match(/semestre\s*(\d{1,2})|(\d{1,2})\s*(?:o|er|ro|do|to|vo|mo|no)?\s*semestre/);
    if (m) return Number(m[1] || m[2]);
    for (const [palabra, n] of Object.entries(ORDINALES)) if (new RegExp(`\\b${palabra}\\b`).test(t)) return n;
    return null;
};

const aleatorios = (lista, n) => [...lista].sort(() => Math.random() - 0.5).slice(0, n);
const fichaMateria = (m) => `📘 ${m.nombre} (${m.clave})\nSemestre ${m.semestre} · ${m.creditos} créditos · Área: ${m.area}\nTu estado: ${ESTADO[m.estado]}${m.calificacion ? ` (${m.calificacion})` : ''}`;

const buscarMateria = (t, materias, estricto) => {
    const tokens = new Set(t.split(/[^a-z0-9]+/));
    let mejor = null, puntaje = 0;
    for (const m of materias) {
        const nombre = norm(m.nombre);
        if (t.includes(nombre) || tokens.has(norm(m.clave))) return m;
        if (estricto) continue;
        const palabras = nombre.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !VACIAS.has(w));
        const aciertos = palabras.filter((w) => tokens.has(w)).length;
        const p = palabras.length ? aciertos / palabras.length : 0;
        if (p > puntaje && p >= 0.6) { puntaje = p; mejor = m; }
    }
    return mejor;
};

const responder = async (texto, usuarioId) => {
    const t = norm(texto);
    const materias = await cargarMaterias(usuarioId);

    // 1. Materias de un semestre
    const sem = semestreEn(t);
    if (sem) {
        const lista = materias.filter((m) => m.semestre === sem);
        if (!lista.length) return 'Ese semestre no existe en la retícula. Hay del 1.º al 10.º.';
        return `📚 Materias del semestre ${sem}:\n\n` + lista.map((m) => `• ${m.nombre} (${m.creditos} cr.) — ${ESTADO[m.estado]}`).join('\n');
    }

    // 2. Una materia por nombre o clave exactos
    const exacta = buscarMateria(t, materias, true);
    if (exacta) return fichaMateria(exacta);

    // 3. Intenciones
    if (/(avance|progreso|promedio|credito|como voy|cuanto llevo)/.test(t)) {
        const r = calcularResumen(materias);
        return `📊 Tu avance\n\n• Materias aprobadas: ${r.aprobadas} de ${r.total} (${r.porcentaje}%)\n• Créditos: ${r.creditosAprobados} de ${r.creditosTotales}\n• Cursando ahora: ${r.cursando}\n• Promedio: ${r.promedio ?? 'aún sin calificaciones registradas'}`;
    }
    if (/(cursando|estoy llevando|que llevo)/.test(t)) {
        const lista = materias.filter((m) => m.estado === 'cursando');
        return lista.length ? '📖 Estás cursando:\n\n' + lista.map((m) => `• ${m.nombre}`).join('\n') : 'No tienes materias marcadas como cursando. Márcalas en la sección Materias.';
    }
    if (/(pendiente|falta|me faltan|por cursar)/.test(t)) {
        const lista = materias.filter((m) => m.estado === 'pendiente');
        return `⏳ Te faltan ${lista.length} materias. Las siguientes son:\n\n` + lista.slice(0, 5).map((m) => `• ${m.nombre} (sem. ${m.semestre})`).join('\n');
    }
    if (/(habito|estudiar|estudio|concentr|memoriz|aprender)/.test(t)) {
        const lista = aleatorios(await Consejo.findAll({ where: { tipo: 'habitos' }, raw: true }), 3);
        return '🧠 Hábitos de estudio que te recomiendo:\n\n' + lista.map((c) => `${c.icono} ${c.titulo}: ${c.contenido}`).join('\n\n');
    }
    if (/(organiz|tiempo|horario|planific|pomodoro|procrastin|agenda)/.test(t)) {
        const lista = aleatorios(await Consejo.findAll({ where: { tipo: 'tiempo' }, raw: true }), 3);
        return '⏰ Para organizar tu tiempo:\n\n' + lista.map((c) => `${c.icono} ${c.titulo}: ${c.contenido}`).join('\n\n');
    }
    if (/proyecto/.test(t)) {
        const lista = aleatorios(await Proyecto.findAll({ raw: true }), 4);
        return '🚀 Ideas de proyectos escolares:\n\n' + lista.map((p) => `• ${p.titulo} (sem. ${p.semestre}) — ${p.tecnologias}`).join('\n');
    }
    if (/(area|categoria|tipos de materia)/.test(t)) {
        const conteo = {};
        materias.forEach((m) => { conteo[m.area] = (conteo[m.area] || 0) + 1; });
        return '🗂️ Áreas de la carrera:\n\n' + Object.entries(conteo).sort((a, b) => b[1] - a[1]).map(([a, n]) => `• ${a}: ${n} materias`).join('\n');
    }

    // 4. Coincidencia aproximada de materia
    const aprox = buscarMateria(t, materias, false);
    if (aprox) return fichaMateria(aprox);

    if (/(hola|buenas|hey|buen dia|que tal)/.test(t)) return '¡Hola! 👋 Soy el asistente de Guía ISC. Pregúntame por una materia, un semestre, tu avance, hábitos de estudio o proyectos.';
    if (/(ayuda|que puedes|que haces|funciones|opciones)/.test(t)) return 'Puedo ayudarte con:\n\n• Información de cualquier materia\n• Materias de un semestre\n• Tu avance y promedio\n• Hábitos de estudio\n• Consejos para organizar tu tiempo\n• Ideas de proyectos';
    if (/(gracias|genial|perfecto)/.test(t)) return '¡De nada! Aquí estoy cuando me necesites. 😊';
    return 'No estoy seguro de haberte entendido. Prueba con "materias del semestre 4", "háblame de Redes de Computadoras" o "¿cómo voy?".';
};

export const chat = async (req, res) => {
    const mensaje = String(req.body.mensaje || '').trim().slice(0, 300);
    if (!mensaje) return res.status(400).json({ ok: false, mensaje: 'Escribe un mensaje.' });
    try {
        res.json({ ok: true, respuesta: await responder(mensaje, req.usuario.id) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, mensaje: 'Tuve un problema para responder.' });
    }
};
