import * as mariadb from 'mariadb';
import sqlite3 from 'sqlite3';
import { open, type Database as SqliteDatabase } from 'sqlite';
import { config } from '../config/env';

type QueryParams = (string | number | null)[];

export interface WriteResult {
  insertId?: number;
  affectedRows: number;
}

interface DatabaseClient {
  init(): Promise<void>;
  query<T>(sql: string, params?: QueryParams): Promise<T[]>;
  execute(sql: string, params?: QueryParams): Promise<WriteResult>;
}

class MariaDbClient implements DatabaseClient {
  private pool = mariadb.createPool({
    host: config.mariadb.host,
    port: config.mariadb.port,
    user: config.mariadb.user,
    password: config.mariadb.password,
    database: config.mariadb.database,
    connectionLimit: config.mariadb.connectionLimit,
  });

  async init(): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS restaurants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          owner_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          address VARCHAR(255) NOT NULL,
          opening_time VARCHAR(255) NOT NULL,
          main_picture TEXT NOT NULL,
          deals TEXT NOT NULL,
          reviews TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
    } finally {
      conn.release();
    }
  }

  async query<T>(sql: string, params: QueryParams = []): Promise<T[]> {
    const conn = await this.pool.getConnection();
    try {
      const rows = await conn.query(sql, params);
      return rows as T[];
    } finally {
      conn.release();
    }
  }

  async execute(sql: string, params: QueryParams = []): Promise<WriteResult> {
    const conn = await this.pool.getConnection();
    try {
      const result = await conn.query(sql, params);
      return {
        insertId: result.insertId,
        affectedRows: result.affectedRows ?? 0,
      };
    } finally {
      conn.release();
    }
  }
}

class SqliteClient implements DatabaseClient {
  private db: SqliteDatabase | null = null;

  private async getDb(): Promise<SqliteDatabase> {
    if (!this.db) {
      this.db = await open({
        filename: config.sqliteFile,
        driver: sqlite3.Database,
      });

      await this.db.exec('PRAGMA foreign_keys = ON');
    }

    return this.db;
  }

  async init(): Promise<void> {
    const db = await this.getDb();

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        opening_time TEXT NOT NULL,
        main_picture TEXT NOT NULL,
        deals TEXT NOT NULL,
        reviews TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  async query<T>(sql: string, params: QueryParams = []): Promise<T[]> {
    const db = await this.getDb();
    return db.all<T[]>(sql, params);
  }

  async execute(sql: string, params: QueryParams = []): Promise<WriteResult> {
    const db = await this.getDb();
    const result = await db.run(sql, params);

    return {
      insertId: result.lastID,
      affectedRows: result.changes ?? 0,
    };
  }
}

const client: DatabaseClient = config.isProdLike ? new MariaDbClient() : new SqliteClient();

export const database = {
  init: () => client.init(),
  query: <T>(sql: string, params?: QueryParams) => client.query<T>(sql, params),
  execute: (sql: string, params?: QueryParams) => client.execute(sql, params),
};
