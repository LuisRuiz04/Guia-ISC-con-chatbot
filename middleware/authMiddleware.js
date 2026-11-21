import jwt from 'jsonwebtoken';
import Usuario from '../models/usuarioModel.js';

const esApi = (req) => req.originalUrl.startsWith('/api');

// Devuelve el usuario dueño del token (o null si no hay sesión válida)
const identificar = async (req) => {
    const token = req.cookies ? req.cookies._token : null;
    if (!token) return null;
    try {
        const { id } = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        return await Usuario.findByPk(id, { attributes: ['id', 'nombre', 'email', 'rol'] });
    } catch (error) {
        return null;
    }
};

// Solo usuarios con sesión iniciada
export const protegerRuta = async (req, res, next) => {
    const usuario = await identificar(req);
    if (!usuario) {
        res.clearCookie('_token');
        return esApi(req)
            ? res.status(401).json({ ok: false, mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' })
            : res.redirect('/auth');
    }
    req.usuario = usuario;
    res.locals.usuario = usuario; // disponible en todas las vistas Pug
    next();
};

// Solo administradores (se usa después de protegerRuta)
export const soloAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'admin') return next();
    if (esApi(req)) return res.status(403).json({ ok: false, mensaje: 'Esta acción es solo para administradores.' });
    return res.status(403).render('error', {
        codigo: 403,
        titulo: 'Acceso restringido',
        mensaje: 'Esta sección es solo para administradores.'
    });
};

// Solo visitantes sin sesión (para /auth)
export const soloInvitados = async (req, res, next) => {
    const usuario = await identificar(req);
    return usuario ? res.redirect('/') : next();
};
