import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Proyecto = db.define('proyectos', {
    titulo: { type: DataTypes.STRING(120), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    semestre: { type: DataTypes.TINYINT, allowNull: false },
    tecnologias: { type: DataTypes.STRING(120), allowNull: false }
});

export default Proyecto;
