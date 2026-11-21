# Guía ISC

Plataforma web (Node.js + Express + Pug + MySQL) para estudiantes de Ingeniería en Sistemas Computacionales.
Arquitectura **MVC**: `models/` (Sequelize), `views/` (Pug), `controllers/` y `routes/`.

## Puesta en marcha
1. Instala dependencias: `npm install`
2. Abre `.env` y escribe en `DB_PASS` la contraseña de root de MySQL Workbench (y cambia `JWT_SECRET`).
3. Inicia: `npm run dev` (o `npm start`)
4. Abre http://localhost:3000

Al arrancar crea la base `guia_isc`, las tablas y carga las materias (semestres 1 a 10), consejos y proyectos.
Para tener un administrador, regístrate eligiendo "Administrador".

## Qué incluye
- Registro e inicio de sesión (JWT en cookie httpOnly, bcrypt, límite de intentos).
- Contraseña: 8+ caracteres con mayúscula, minúscula, número y símbolo (cliente y servidor).
- Rutas protegidas (`protegerRuta`) y exclusivas de admin (`soloAdmin`).
- Navegación sin recarga con View Transitions, precarga al pasar el mouse y botón fijo de modo claro/oscuro.
- Retícula por semestre con estado y calificación por usuario, avance y promedio.
- Hábitos, organización del tiempo (con temporizador), proyectos (solo lectura) y chatbot por reglas.
- Panel admin: CRUD de materias, consejos y proyectos; gestión de usuarios.
