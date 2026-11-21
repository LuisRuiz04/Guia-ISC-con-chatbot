import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from '../models/usuarioModel.js';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]{3,80}$/;
// 8 a 64 caracteres, con minúscula, mayúscula, número y símbolo
const REGEX_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,64}$/;

const COOKIE = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
};

const emitirSesion = (res, usuario) => {
    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' });
    res.cookie('_token', token, COOKIE);
};

export const registrarUsuario = async (req, res) => {
    const { nombre = '', email = '', password = '', confirmar = '', rol = 'usuario' } = req.body;
    const correo = String(email).trim().toLowerCase();
    const errores = {};

    if (!REGEX_NOMBRE.test(String(nombre).trim())) errores.nombre = 'Escribe tu nombre (solo letras, mínimo 3 caracteres).';
    if (!REGEX_EMAIL.test(correo) || correo.length > 120) errores.email = 'Escribe un correo válido.';
    if (!REGEX_PASSWORD.test(String(password))) errores.password = 'Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.';
    if (password !== confirmar) errores.confirmar = 'Las contraseñas no coinciden.';
    if (!['usuario', 'admin'].includes(rol)) errores.rol = 'Selecciona un tipo de cuenta válido.';

    if (Object.keys(errores).length) return res.status(400).json({ ok: false, errores });

    try {
        if (await Usuario.findOne({ where: { email: correo } })) {
            return res.status(409).json({ ok: false, errores: { email: 'Ya existe una cuenta con ese correo.' } });
        }
        const hash = await bcrypt.hash(String(password), 12);
        const usuario = await Usuario.create({ nombre: String(nombre).trim(), email: correo, password: hash, rol });
        emitirSesion(res, usuario);
        return res.json({ ok: true, mensaje: `¡Bienvenido, ${usuario.nombre.split(' ')[0]}!`, redirect: '/' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, mensaje: 'No pudimos crear tu cuenta. Inténtalo de nuevo.' });
    }
};

// Límite de intentos: 5 fallos por correo+IP bloquean 5 minutos
const intentos = new Map();
const HASH_FALSO = bcrypt.hashSync('contraseña-falsa', 12); // evita revelar si el correo existe por tiempo de respuesta

export const iniciarSesion = async (req, res) => {
    const correo = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const clave = `${req.ip}|${correo}`;
    const registro = intentos.get(clave) || { n: 0, hasta: 0 };

    if (registro.hasta > Date.now()) {
        const min = Math.ceil((registro.hasta - Date.now()) / 60000);
        return res.status(429).json({ ok: false, mensaje: `Demasiados intentos. Espera ${min} min e inténtalo de nuevo.` });
    }
    if (!REGEX_EMAIL.test(correo) || !password) {
        return res.status(400).json({ ok: false, errores: { email: 'Escribe tu correo y tu contraseña.' } });
    }

    try {
        const usuario = await Usuario.findOne({ where: { email: correo } });
        const valido = await bcrypt.compare(password, usuario ? usuario.password : HASH_FALSO);
        if (!usuario || !valido) {
            registro.n += 1;
            if (registro.n >= 5) { registro.n = 0; registro.hasta = Date.now() + 5 * 60000; }
            intentos.set(clave, registro);
            return res.status(401).json({ ok: false, mensaje: 'Correo o contraseña incorrectos.' });
        }
        intentos.delete(clave);
        emitirSesion(res, usuario);
        return res.json({ ok: true, mensaje: `Hola de nuevo, ${usuario.nombre.split(' ')[0]}.`, redirect: '/' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, mensaje: 'No pudimos iniciar tu sesión. Inténtalo de nuevo.' });
    }
};

export const cerrarSesion = (req, res) => {
    res.clearCookie('_token');
    res.redirect('/auth');
};
