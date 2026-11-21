import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

// Estado de cada materia por usuario
const Progreso = db.define('progresos', {
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    materiaId: { type: DataTypes.INTEGER, allowNull: false },
    estado: { type: DataTypes.ENUM('pendiente', 'cursando', 'aprobada'), allowNull: false, defaultValue: 'pendiente' },
    calificacion: { type: DataTypes.TINYINT, allowNull: true }
}, {
    indexes: [{ unique: true, fields: ['usuarioId', 'materiaId'] }]
});

export default Progreso;
