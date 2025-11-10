import Database from 'better-sqlite3';
import path from 'path';

// Database path - can be configured via environment variable
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.sqlite');

// Ensure data directory exists
import { existsSync, mkdirSync } from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better concurrency

// Database initialization
export function initializeDatabase() {
  try {
    // Check if tables exist
    const tableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'`).get();
    
    if (!tableCheck) {
      console.log('Initializing database tables...');
      
      // Create patients table
      db.exec(`
        CREATE TABLE IF NOT EXISTS patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          date_of_birth TEXT NOT NULL,
          hospital TEXT,
          email TEXT,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create sessions table
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER NOT NULL,
          session_token TEXT UNIQUE NOT NULL,
          current_step INTEGER DEFAULT 1,
          completed_steps TEXT DEFAULT '[]',
          status TEXT DEFAULT 'in_progress',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
      `);

      // Create ODI responses table
      db.exec(`
        CREATE TABLE IF NOT EXISTS odi_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          pain_intensity INTEGER,
          personal_care INTEGER,
          lifting INTEGER,
          walking INTEGER,
          sitting INTEGER,
          standing INTEGER,
          sleeping INTEGER,
          sex_life INTEGER,
          social_life INTEGER,
          travelling INTEGER,
          total_score INTEGER,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
      `);

      // Create VAS responses table
      db.exec(`
        CREATE TABLE IF NOT EXISTS vas_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          neck_pain REAL,
          right_arm REAL,
          left_arm REAL,
          back_pain REAL,
          right_leg REAL,
          left_leg REAL,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
      `);

      // Create EQ5D responses table
      db.exec(`
        CREATE TABLE IF NOT EXISTS eq5d_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          mobility INTEGER,
          personal_care INTEGER,
          usual_activities INTEGER,
          pain_discomfort INTEGER,
          anxiety_depression INTEGER,
          health_scale INTEGER,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
      `);

      // Create surgical consent table
      db.exec(`
        CREATE TABLE IF NOT EXISTS surgical_consent (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          procedure_name TEXT,
          consent_items TEXT,
          patient_signature TEXT,
          witness_signature TEXT,
          signed_at DATETIME,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
      `);

      // Create IFC responses table
      db.exec(`
        CREATE TABLE IF NOT EXISTS ifc_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          quote_number TEXT,
          item_number TEXT,
          description TEXT,
          fee REAL,
          rebate REAL,
          gap REAL,
          patient_signature TEXT,
          signed_at DATETIME,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
      `);

      // Create indexes
      db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email)`);
      
      console.log('Database initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Database adapter to match Cloudflare D1 API
export const dbAdapter = {
  prepare: (query: string) => {
    return {
      bind: (...params: any[]) => {
        return {
          run: () => {
            const stmt = db.prepare(query);
            const result = stmt.run(...params);
            return {
              success: true,
              meta: {
                last_row_id: result.lastInsertRowid,
                changes: result.changes
              }
            };
          },
          first: () => {
            const stmt = db.prepare(query);
            return stmt.get(...params);
          },
          all: () => {
            const stmt = db.prepare(query);
            const results = stmt.all(...params);
            return { results };
          }
        };
      },
      run: () => {
        const result = db.prepare(query).run();
        return {
          success: true,
          meta: {
            last_row_id: result.lastInsertRowid,
            changes: result.changes
          }
        };
      },
      first: () => {
        return db.prepare(query).get();
      },
      all: () => {
        const results = db.prepare(query).all();
        return { results };
      }
    };
  }
};

// Initialize on module load
initializeDatabase();

export default dbAdapter;
