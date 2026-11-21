import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const { DB_HOST = 'localhost', DB_PORT = 3306, DB_NAME = 'guia_isc', DB_USER = 'root', DB_PASS = '' } = process.env;

// Crea la base de datos si todavía no existe (no hace falta abrir Workbench)
export const crearBaseDeDatos = async () => {
    const conexion = await mysql.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS });
    await conexion.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conexion.end();
};

const db = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    logging: false,
    define: { timestamps: true },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

export default db;
