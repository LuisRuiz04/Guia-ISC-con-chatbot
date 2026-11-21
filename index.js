import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { crearBaseDeDatos } from './config/dbconfig.js';
import './models/index.js';
import { sembrar } from './config/seed.js';
import rutas from './routes/index.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 20) {
    console.error('✖ Define un JWT_SECRET de al menos 20 caracteres en el archivo .env');
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

// Cabeceras de seguridad
app.use((req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'same-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'"
    });
    next();
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

// Las páginas dinámicas no se guardan en caché: al cerrar sesión, "atrás" no muestra contenido privado
app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

app.use('/', rutas);

app.use((req, res) => {
    res.status(404).render('error', { codigo: 404, titulo: 'Página no encontrada', mensaje: 'La página que buscas no existe o cambió de lugar.' });
});

app.use((error, req, res, next) => {
    console.error(error);
    if (req.originalUrl.startsWith('/api') || req.method !== 'GET') return res.status(error.status || 500).json({ ok: false, mensaje: 'Solicitud no válida.' });
    res.status(500).render('error', { codigo: 500, titulo: 'Algo salió mal', mensaje: 'Ocurrió un error inesperado.' });
});

const PORT = process.env.PORT || 3000;

try {
    await crearBaseDeDatos();
    await db.authenticate();
    await db.sync();
    await sembrar();
    app.listen(PORT, () => console.log(`✔ Guía ISC lista en http://localhost:${PORT}`));
} catch (error) {
    console.error('✖ No se pudo conectar a MySQL. Revisa DB_USER y DB_PASS en .env y que el servidor esté encendido.\n', error.message);
    process.exit(1);
}
