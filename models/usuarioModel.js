import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Usuario = db.define('usuarios', {
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(100), allowNull: false },
    rol: { type: DataTypes.ENUM('usuario', 'admin'), allowNull: false, defaultValue: 'usuario' }
});

export default Usuario;
