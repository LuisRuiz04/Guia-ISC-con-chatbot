// Carga todos los modelos y define sus relaciones
import Usuario from './usuarioModel.js';
import Materia from './materiaModel.js';
import Progreso from './progresoModel.js';
import Consejo from './consejoModel.js';
import Proyecto from './proyectoModel.js';

Usuario.hasMany(Progreso, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Progreso.belongsTo(Usuario, { foreignKey: 'usuarioId' });
Materia.hasMany(Progreso, { foreignKey: 'materiaId', onDelete: 'CASCADE' });
Progreso.belongsTo(Materia, { foreignKey: 'materiaId' });

export { Usuario, Materia, Progreso, Consejo, Proyecto };
