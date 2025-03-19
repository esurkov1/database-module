const mysql = require('mysql2/promise');

class Database {
    constructor(config) {
        this.config = {
            ...config,
            connectTimeout: 10000
        };
        this.pool = mysql.createPool(this.config);
    }

    // Выполнение запроса
    async query(sql, params = []) {
        const start = Date.now();
        try {
            const result = await this.pool.execute(sql, params);
            console.info(`[DB] Query executed in ${Date.now() - start}ms`, { sql, params });
            return result;
        } catch (error) {
            console.error(`[DB] Query failed`, { sql, params, error: error.message });
            throw error;
        }
    }

    // Закрытие пула соединений
    async close() {
        try {
            await this.pool.end();
            console.info('[DB] Connection pool closed successfully');
        } catch (error) {
            console.error(`[DB] Failed to close connection pool`, { error: error.message });
            throw error;
        }
    }

    // Получение соединения
    async getConnection() {
        try {

            // noinspection JSVoidFunctionReturnValueUsed
            const connection = await this.pool.getConnection();
            console.debug('[DB] Connection obtained');
            return connection;
        } catch (error) {
            console.error(`[DB] Failed to obtain connection`, { error: error.message });
            throw error.message;
        }
    }

    // Выполнение транзакции
    async transaction(callback) {
        const connection = await this.getConnection();

        try {
            await connection.beginTransaction();
            console.debug('[DB] Transaction started');
            const result = await callback(connection);
            await connection.commit();
            console.info('[DB] Transaction committed successfully');
            return result;
        } catch (error) {
            await connection.rollback();
            console.error(`[DB] Transaction failed`, { error: error.message });
            throw error;
        } finally {
            connection.release();
            console.debug('[DB] Connection released');
        }
    }
}

module.exports = Database;