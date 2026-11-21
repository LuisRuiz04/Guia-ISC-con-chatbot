import express from 'express';
import { protegerRuta, soloAdmin, soloInvitados } from '../middleware/authMiddleware.js';
import { registrarUsuario, iniciarSesion, cerrarSesion } from '../controllers/authController.js';
import { verDashboard } from '../controllers/dashboardController.js';
import { verMaterias, guardarProgreso } from '../controllers/materiaController.js';
import { verHabitos, verTiempo, verProyectos, verChat } from '../controllers/contenidoController.js';
import { chat } from '../controllers/chatController.js';
import { verAdmin, crear, editar, borrar, cambiarRol, borrarUsuario } from '../controllers/adminController.js';

const route = express.Router();

// --- AUTENTICACIÓN ---
route.get('/auth', soloInvitados, (req, res) => res.render('auth', { pagina: 'auth', titulo: 'Acceso' }));
route.post('/registro', registrarUsuario);
route.post('/login', iniciarSesion);
route.get('/cerrar-sesion', cerrarSesion);

// --- PÁGINAS (requieren sesión) ---
route.get('/', protegerRuta, verDashboard);
route.get('/materias', protegerRuta, verMaterias);
route.get('/habitos', protegerRuta, verHabitos);
route.get('/tiempo', protegerRuta, verTiempo);
route.get('/proyectos', protegerRuta, verProyectos);
route.get('/chat', protegerRuta, verChat);

// --- API ---
route.post('/api/progreso', protegerRuta, guardarProgreso);
route.post('/api/chat', protegerRuta, chat);

// --- ADMINISTRACIÓN (sesión + rol admin) ---
route.get('/admin', protegerRuta, soloAdmin, verAdmin);
route.put('/api/admin/usuarios/:id', protegerRuta, soloAdmin, cambiarRol);
route.delete('/api/admin/usuarios/:id', protegerRuta, soloAdmin, borrarUsuario);
route.post('/api/admin/:recurso', protegerRuta, soloAdmin, crear);
route.put('/api/admin/:recurso/:id', protegerRuta, soloAdmin, editar);
route.delete('/api/admin/:recurso/:id', protegerRuta, soloAdmin, borrar);

export default route;
