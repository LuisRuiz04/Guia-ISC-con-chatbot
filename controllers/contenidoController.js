import { Consejo, Proyecto } from '../models/index.js';

const vistaConsejos = (tipo, pagina, titulo, intro) => async (req, res) => {
    try {
        const consejos = await Consejo.findAll({ where: { tipo }, order: [['id', 'ASC']], raw: true });
        res.render('consejos', { pagina, titulo, intro, tipo, consejos });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { codigo: 500, titulo: 'Algo salió mal', mensaje: 'No pudimos cargar el contenido.' });
    }
};

export const verHabitos = vistaConsejos('habitos', 'habitos', 'Hábitos de estudio',
    'Técnicas que funcionan para aprender más en menos tiempo y sin llegar agotado a los exámenes.');
export const verTiempo = vistaConsejos('tiempo', 'tiempo', 'Organización del tiempo',
    'Ideas para repartir tu semana, cumplir entregas y todavía tener vida fuera de la escuela.');

export const verProyectos = async (req, res) => {
    try {
        const proyectos = await Proyecto.findAll({ order: [['semestre', 'ASC'], ['id', 'ASC']], raw: true });
        const semestres = [...new Set(proyectos.map((p) => p.semestre))].sort((a, b) => a - b);
        res.render('proyectos', { pagina: 'proyectos', titulo: 'Proyectos escolares', proyectos, semestres });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { codigo: 500, titulo: 'Algo salió mal', mensaje: 'No pudimos cargar los proyectos.' });
    }
};

export const verChat = (req, res) => res.render('chat', { pagina: 'chat', titulo: 'Chatbot' });
