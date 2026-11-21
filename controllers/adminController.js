import { UniqueConstraintError } from 'sequelize';
import { Usuario, Materia, Consejo, Proyecto } from '../models/index.js';

// Validadores: devuelven el valor limpio o null si no es válido
const texto = (min, max) => (v) => { const s = String(v ?? '').trim(); return s.length >= min && s.length <= max ? s : null; };
const entero = (min, max) => (v) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : null; };
const opcion = (...o) => (v) => (o.includes(v) ? v : null);

const RECURSOS = {
    materias: { modelo: Materia, campos: { clave: texto(2, 20), nombre: texto(3, 120), semestre: entero(1, 10), creditos: entero(0, 12), area: texto(2, 40) } },
    consejos: { modelo: Consejo, campos: { tipo: opcion('habitos', 'tiempo'), icono: texto(1, 8), titulo: texto(3, 100), contenido: texto(10, 700) } },
    proyectos: { modelo: Proyecto, campos: { titulo: texto(3, 120), descripcion: texto(10, 700), semestre: entero(1, 10), tecnologias: texto(2, 120) } }
};

const definicion = (nombre) => (Object.hasOwn(RECURSOS, nombre) ? RECURSOS[nombre] : null);

const limpiar = (def, body) => {
    const datos = {}, errores = {};
    for (const [campo, validar] of Object.entries(def.campos)) {
        const v = validar(body[campo]);
        if (v === null) errores[campo] = 'Valor no válido'; else datos[campo] = v;
    }
    return { datos, errores };
};

const falla = (res, error) => {
    if (error instanceof UniqueConstraintError) return res.status(409).json({ ok: false, mensaje: 'Ya existe un registro con esa clave.' });
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'No pudimos completar la acción.' });
};

export const verAdmin = async (req, res) => {
    try {
        const [materias, consejos, proyectos, usuarios] = await Promise.all([
            Materia.findAll({ order: [['semestre', 'ASC'], ['id', 'ASC']], raw: true }),
            Consejo.findAll({ order: [['tipo', 'ASC'], ['id', 'ASC']], raw: true }),
            Proyecto.findAll({ order: [['semestre', 'ASC'], ['id', 'ASC']], raw: true }),
            Usuario.findAll({ attributes: ['id', 'nombre', 'email', 'rol', 'createdAt'], order: [['id', 'ASC']], raw: true })
        ]);
        res.render('admin', { pagina: 'admin', titulo: 'Administración', materias, consejos, proyectos, usuarios });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { codigo: 500, titulo: 'Algo salió mal', mensaje: 'No pudimos cargar el panel.' });
    }
};

export const crear = async (req, res) => {
    const def = definicion(req.params.recurso);
    if (!def) return res.status(404).json({ ok: false, mensaje: 'Recurso desconocido.' });
    const { datos, errores } = limpiar(def, req.body);
    if (Object.keys(errores).length) return res.status(400).json({ ok: false, errores, mensaje: 'Revisa los campos marcados.' });
    try { await def.modelo.create(datos); res.json({ ok: true, mensaje: 'Creado correctamente.' }); } catch (e) { falla(res, e); }
};

export const editar = async (req, res) => {
    const def = definicion(req.params.recurso);
    if (!def) return res.status(404).json({ ok: false, mensaje: 'Recurso desconocido.' });
    const { datos, errores } = limpiar(def, req.body);
    if (Object.keys(errores).length) return res.status(400).json({ ok: false, errores, mensaje: 'Revisa los campos marcados.' });
    try {
        const registro = await def.modelo.findByPk(Number(req.params.id));
        if (!registro) return res.status(404).json({ ok: false, mensaje: 'No encontrado.' });
        await registro.update(datos);
        res.json({ ok: true, mensaje: 'Cambios guardados.' });
    } catch (e) { falla(res, e); }
};

export const borrar = async (req, res) => {
    const def = definicion(req.params.recurso);
    if (!def) return res.status(404).json({ ok: false, mensaje: 'Recurso desconocido.' });
    try {
        const n = await def.modelo.destroy({ where: { id: Number(req.params.id) } });
        res.status(n ? 200 : 404).json({ ok: !!n, mensaje: n ? 'Eliminado.' : 'No encontrado.' });
    } catch (e) { falla(res, e); }
};

export const cambiarRol = async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.usuario.id) return res.status(400).json({ ok: false, mensaje: 'No puedes cambiar tu propio rol.' });
    if (!['usuario', 'admin'].includes(req.body.rol)) return res.status(400).json({ ok: false, mensaje: 'Rol no válido.' });
    try {
        const [n] = await Usuario.update({ rol: req.body.rol }, { where: { id } });
        res.status(n ? 200 : 404).json({ ok: !!n, mensaje: n ? 'Rol actualizado.' : 'Usuario no encontrado.' });
    } catch (e) { falla(res, e); }
};

export const borrarUsuario = async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.usuario.id) return res.status(400).json({ ok: false, mensaje: 'No puedes eliminar tu propia cuenta.' });
    try {
        const n = await Usuario.destroy({ where: { id } });
        res.status(n ? 200 : 404).json({ ok: !!n, mensaje: n ? 'Usuario eliminado.' : 'Usuario no encontrado.' });
    } catch (e) { falla(res, e); }
};
