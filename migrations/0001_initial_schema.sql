-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  hospital TEXT,
  email TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Questionnaire sessions table
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
);

-- ODI responses table
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
);

-- VAS responses table
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
);

-- EQ5D responses table
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
);

-- Surgical consent table
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
);

-- IFC (Informed Financial Consent) table
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
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
