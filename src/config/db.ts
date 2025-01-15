import * as dotenv from 'dotenv';
dotenv.config();

import { createPool, Pool } from 'mysql2/promise';

const pool: Pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT || 3306),
});

(async () => {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('Conexão com o banco de dados foi bem-sucedida!');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  }
})();

export default pool;
