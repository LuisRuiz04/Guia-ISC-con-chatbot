import { cargarMaterias, calcularResumen, agruparPorSemestre } from './materiaController.js';

export const verDashboard = async (req, res) => {
    try {
        const materias = await cargarMaterias(req.usuario.id);
        const siguientes = materias.filter((m) => m.estado === 'pendiente').slice(0, 4);
        const cursando = materias.filter((m) => m.estado === 'cursando');
        res.render('dashboard', {
            pagina: 'inicio', titulo: 'Inicio',
            resumen: calcularResumen(materias), semestres: agruparPorSemestre(materias), siguientes, cursando
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { codigo: 500, titulo: 'Algo salió mal', mensaje: 'No pudimos cargar tu inicio.' });
    }
};
