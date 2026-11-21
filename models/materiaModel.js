import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Materia = db.define('materias', {
    clave: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(120), allowNull: false },
    semestre: { type: DataTypes.TINYINT, allowNull: false },
    creditos: { type: DataTypes.TINYINT, allowNull: false },
    area: { type: DataTypes.STRING(40), allowNull: false }
});

export default Materia;
