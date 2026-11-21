import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Consejo = db.define('consejos', {
    tipo: { type: DataTypes.ENUM('habitos', 'tiempo'), allowNull: false },
    icono: { type: DataTypes.STRING(8), allowNull: false, defaultValue: '💡' },
    titulo: { type: DataTypes.STRING(100), allowNull: false },
    contenido: { type: DataTypes.TEXT, allowNull: false }
});

export default Consejo;
