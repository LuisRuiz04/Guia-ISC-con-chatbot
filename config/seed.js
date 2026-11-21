import { Materia, Consejo, Proyecto } from '../models/index.js';

// [semestre, clave, nombre, créditos, área]  — Retícula ISC, Plan 103
const MATERIAS = [
    [1, 'ACF0901', 'Cálculo Diferencial', 5, 'Matemáticas'],
    [1, 'ACC0906', 'Fundamentos de Investigación', 4, 'Investigación'],
    [1, 'AED1285', 'Fundamentos de Programación', 5, 'Programación'],
    [1, 'AEF1041', 'Matemáticas Discretas', 5, 'Matemáticas'],
    [1, 'SCH1024', 'Taller de Administración', 4, 'Administración'],
    [1, 'ACA0907', 'Taller de Ética', 4, 'Humanidades'],
    [2, 'ACF0903', 'Álgebra Lineal', 5, 'Matemáticas'],
    [2, 'ACF0902', 'Cálculo Integral', 5, 'Matemáticas'],
    [2, 'AEC1008', 'Contabilidad Financiera', 4, 'Administración'],
    [2, 'AEF1052', 'Probabilidad y Estadística', 5, 'Matemáticas'],
    [2, 'AED1286', 'Programación Orientada a Objetos', 5, 'Programación'],
    [2, 'AEC1058', 'Química', 4, 'Ciencias básicas'],
    [3, 'ACF0904', 'Cálculo Vectorial', 5, 'Matemáticas'],
    [3, 'SCC1005', 'Cultura Empresarial', 4, 'Administración'],
    [3, 'AED1026', 'Estructura de Datos', 5, 'Programación'],
    [3, 'SCF1006', 'Física General', 5, 'Ciencias básicas'],
    [3, 'SCC1013', 'Investigación de Operaciones', 4, 'Matemáticas'],
    [3, 'AEC1061', 'Sistemas Operativos', 4, 'Sistemas'],
    [4, 'ACF0905', 'Ecuaciones Diferenciales', 5, 'Matemáticas'],
    [4, 'AEF1031', 'Fundamentos de Base de Datos', 5, 'Bases de datos'],
    [4, 'SCC1017', 'Métodos Numéricos', 4, 'Matemáticas'],
    [4, 'SCD1018', 'Principios Eléctricos y Aplicaciones Digitales', 5, 'Hardware'],
    [4, 'SCA1026', 'Taller de Sistemas Operativos', 4, 'Sistemas'],
    [4, 'SCD1027', 'Tópicos Avanzados de Programación', 5, 'Programación'],
    [5, 'SCD1003', 'Arquitectura de Computadoras', 5, 'Hardware'],
    [5, 'ACD0908', 'Desarrollo Sustentable', 5, 'Humanidades'],
    [5, 'SCC1007', 'Fundamentos de Ingeniería de Software', 4, 'Ingeniería de software'],
    [5, 'AEC1034', 'Fundamentos de Telecomunicaciones', 4, 'Redes'],
    [5, 'SCD1022', 'Simulación', 5, 'Matemáticas'],
    [5, 'SCA1025', 'Taller de Bases de Datos', 4, 'Bases de datos'],
    [6, 'SCB1001', 'Administración de Bases de Datos', 5, 'Bases de datos'],
    [6, 'SCC1010', 'Graficación', 4, 'Programación'],
    [6, 'SCD1011', 'Ingeniería de Software', 5, 'Ingeniería de software'],
    [6, 'SCC1014', 'Lenguajes de Interfaz', 4, 'Hardware'],
    [6, 'SCD1015', 'Lenguajes y Autómatas I', 5, 'Programación'],
    [6, 'SCD1021', 'Redes de Computadoras', 5, 'Redes'],
    [7, 'SCD1004', 'Conmutación y Enrutamiento en Redes de Datos', 5, 'Redes'],
    [7, 'SCG1009', 'Gestión de Proyectos de Software', 6, 'Ingeniería de software'],
    [7, 'SCD1016', 'Lenguajes y Autómatas II', 5, 'Programación'],
    [7, 'SCC1023', 'Sistemas Programables', 4, 'Hardware'],
    [7, 'ACA0909', 'Taller de Investigación I', 4, 'Investigación'],
    [7, 'SERVSOC', 'Servicio Social', 10, 'Vinculación'],
    [8, 'SCA1002', 'Administración de Redes', 4, 'Redes'],
    [8, 'SCC1012', 'Inteligencia Artificial', 4, 'Inteligencia artificial'],
    [8, 'IOH2401', 'Nuevas Tecnologías de Bases de Datos', 4, 'Bases de datos'],
    [8, 'SCC1019', 'Programación Lógica y Funcional', 4, 'Programación'],
    [8, 'AEB1055', 'Programación Web', 5, 'Programación'],
    [8, 'ACA0910', 'Taller de Investigación II', 4, 'Investigación'],
    [9, 'IOB2406', 'Diseño de Soluciones Móviles', 5, 'Programación'],
    [9, 'IOC2405', 'Procesos y Modelos Arquitectónicos de Software', 4, 'Ingeniería de software'],
    [9, 'IOH2402', 'Seguridad Informática', 4, 'Redes'],
    [9, 'IOH2403', 'Administración y Configuración de Redes WLAN y LAN', 4, 'Redes'],
    [9, 'IOH2404', 'Sistemas Distribuidos', 4, 'Sistemas'],
    // El PDF solo muestra 9 semestres; el 10.º lleva la residencia (el admin puede editarla)
    [10, 'RESPROF', 'Residencia Profesional', 10, 'Vinculación']
];

const HABITOS = [
    ['🍅', 'Técnica Pomodoro', 'Estudia 25 minutos sin distracciones y descansa 5. Cada cuatro ciclos toma un descanso largo de 15 a 30 minutos.'],
    ['🔁', 'Repaso espaciado', 'Repasa un tema al día siguiente, a la semana y al mes. Recordarás mucho más que estudiando todo la noche anterior.'],
    ['🧠', 'Recuperación activa', 'Cierra el cuaderno e intenta explicar el tema con tus palabras o resolver ejercicios sin ver la solución.'],
    ['🗣️', 'Método Feynman', 'Explica un concepto como si se lo enseñaras a alguien que no sabe nada. Donde te trabes, ahí debes reforzar.'],
    ['💻', 'Practica programando', 'En las materias de código no basta con leer: escribe, rompe y arregla programas. Un ejercicio resuelto vale más que una hora de lectura.'],
    ['😴', 'Duerme bien', 'Dormir de 7 a 8 horas consolida lo aprendido. Una mala noche te cuesta más que una hora extra de estudio.'],
    ['📵', 'Cuida tu atención', 'Pon el celular en modo no molestar y fuera de tu vista mientras estudias. Cada interrupción te cuesta minutos de reenfoque.'],
    ['👥', 'Estudia en equipo', 'Un grupo pequeño sirve para resolver dudas y explicar temas, pero llega con el tema ya intentado por tu cuenta.']
];

const TIEMPO = [
    ['🗓️', 'Planea tu semana', 'Dedica 15 minutos cada domingo a revisar entregas, exámenes y prácticas, y reparte el trabajo en los días disponibles.'],
    ['🎯', 'Regla de las 3 prioridades', 'Cada día elige solo tres tareas importantes. Si las terminas, lo demás es un extra.'],
    ['⏰', 'Bloques de tiempo', 'Asigna horarios fijos a cada materia en tu calendario, como si fueran clases. Lo que tiene hora, se hace.'],
    ['🐸', 'Lo difícil primero', 'Empieza por la tarea que más pereza te da, cuando tienes más energía. El resto del día se sentirá ligero.'],
    ['📋', 'Divide los proyectos', 'Parte un proyecto grande en entregables pequeños con fecha propia: diseño, base de datos, interfaz, pruebas.'],
    ['🚦', 'Urgente vs. importante', 'Separa lo urgente de lo importante. Lo importante que no es urgente (estudiar con tiempo) es lo que evita las desveladas.'],
    ['📆', 'Calendario de entregas', 'En la primera semana del semestre anota todos los exámenes y entregas. Así detectas las semanas pesadas desde antes.'],
    ['🌿', 'Agenda tus descansos', 'Programa tiempo libre igual que programas tareas. Descansar con intención evita el agotamiento a mitad de semestre.']
];

const PROYECTOS = [
    ['Calculadora científica en consola', 'Programa que lee expresiones matemáticas, respeta la jerarquía de operaciones y maneja errores de entrada.', 1, 'C, Python'],
    ['Sistema de biblioteca con POO', 'Gestión de libros, socios y préstamos aplicando clases, herencia y polimorfismo.', 2, 'Java, POO'],
    ['Visualizador de estructuras de datos', 'Animación paso a paso de pilas, colas, listas y árboles para entender cómo funcionan.', 3, 'JavaScript, Canvas'],
    ['Control escolar con base de datos', 'Modelo entidad-relación, consultas SQL y reportes de alumnos, grupos y calificaciones.', 4, 'MySQL, SQL'],
    ['Simulador de red local', 'Diseño de una red con VLANs, enrutamiento y direccionamiento IP para un edificio de oficinas.', 6, 'Packet Tracer, Redes'],
    ['Analizador léxico y sintáctico', 'Reconoce tokens y valida la sintaxis de un lenguaje sencillo definido por ti.', 7, 'Autómatas, Python'],
    ['Plataforma web con arquitectura MVC', 'Aplicación con registro, inicio de sesión, roles y panel administrativo usando el patrón MVC.', 8, 'Node.js, Express, MySQL'],
    ['Chatbot académico', 'Asistente que responde dudas frecuentes de la carrera con reglas o modelos de lenguaje.', 8, 'IA, JavaScript'],
    ['App móvil de horarios y tareas', 'Aplicación para organizar clases, entregas y recordatorios con notificaciones.', 9, 'Android, Flutter'],
    ['Sistema distribuido de mensajería', 'Servicio de chat con varios nodos, balanceo de carga y tolerancia a fallos.', 9, 'Sockets, Docker']
];

export const sembrar = async () => {
    if (await Materia.count() === 0) {
        await Materia.bulkCreate(MATERIAS.map(([semestre, clave, nombre, creditos, area]) => ({ semestre, clave, nombre, creditos, area })));
    }
    if (await Consejo.count() === 0) {
        await Consejo.bulkCreate([
            ...HABITOS.map(([icono, titulo, contenido]) => ({ tipo: 'habitos', icono, titulo, contenido })),
            ...TIEMPO.map(([icono, titulo, contenido]) => ({ tipo: 'tiempo', icono, titulo, contenido }))
        ]);
    }
    if (await Proyecto.count() === 0) {
        await Proyecto.bulkCreate(PROYECTOS.map(([titulo, descripcion, semestre, tecnologias]) => ({ titulo, descripcion, semestre, tecnologias })));
    }
};
