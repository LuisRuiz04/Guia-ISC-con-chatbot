import { Materia, Progreso } from '../models/index.js';

// Materias + estado del usuario
export const cargarMaterias = async (usuarioId) => {
    const [materias, progresos] = await Promise.all([
        Materia.findAll({ order: [['semestre', 'ASC'], ['id', 'ASC']], raw: true }),
        Progreso.findAll({ where: { usuarioId }, raw: true })
    ]);
    const mapa = new Map(progresos.map((p) => [p.materiaId, p]));
    return materias.map((m) => {
        const p = mapa.get(m.id);
        return { ...m, estado: p ? p.estado : 'pendiente', calificacion: p ? p.calificacion : null };
    });
};

export const calcularResumen = (materias) => {
    const aprobadas = materias.filter((m) => m.estado === 'aprobada');
    const notas = aprobadas.map((m) => m.calificacion).filter((n) => n !== null && n !== undefined);
    const suma = (lista) => lista.reduce((s, m) => s + m.creditos, 0);
    return {
        total: materias.length,
        aprobadas: aprobadas.length,
        cursando: materias.filter((m) => m.estado === 'cursando').length,
        creditosTotales: suma(materias),
        creditosAprobados: suma(aprobadas),
        porcentaje: materias.length ? Math.round((aprobadas.length / materias.length) * 100) : 0,
        promedio: notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : null
    };
};

export const agruparPorSemestre = (materias) => {
    const mapa = new Map();
    materias.forEach((m) => {
        if (!mapa.has(m.semestre)) mapa.set(m.semestre, []);
        mapa.get(m.semestre).push(m);
    });
    return [...mapa.entries()].sort((a, b) => a[0] - b[0]).map(([n, lista]) => ({ n, materias: lista }));
};

export const verMaterias = async (req, res) => {
    try {
        const materias = await cargarMaterias(req.usuario.id);
        const areas = [...new Set(materias.map((m) => m.area))].sort((a, b) => a.localeCompare(b, 'es'));
        res.render('materias', {
            pagina: 'materias', titulo: 'Materias',
            semestres: agruparPorSemestre(materias), areas, resumen: calcularResumen(materias)
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { codigo: 500, titulo: 'Algo salió mal', mensaje: 'No pudimos cargar las materias.' });
    }
};

export const guardarProgreso = async (req, res) => {
    const materiaId = Number(req.body.materiaId);
    const estado = req.body.estado;
    let calificacion = req.body.calificacion;

    if (!Number.isInteger(materiaId) || !['pendiente', 'cursando', 'aprobada'].includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: 'Datos no válidos.' });
    }
    if (estado === 'aprobada' && calificacion !== null && calificacion !== undefined && calificacion !== '') {
        calificacion = Number(calificacion);
        if (!Number.isInteger(calificacion) || calificacion < 70 || calificacion > 100) {
            return res.status(400).json({ ok: false, mensaje: 'La calificación debe estar entre 70 y 100.' });
        }
    } else {
        calificacion = null;
    }

    try {
        if (!(await Materia.findByPk(materiaId))) return res.status(404).json({ ok: false, mensaje: 'La materia no existe.' });
        await Progreso.upsert({ usuarioId: req.usuario.id, materiaId, estado, calificacion });
        res.json({ ok: true, resumen: calcularResumen(await cargarMaterias(req.usuario.id)) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, mensaje: 'No pudimos guardar el cambio.' });
    }
};
