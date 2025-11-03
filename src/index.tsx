import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings, Patient, Session, ODIResponse, VASResponse, EQ5DResponse, SurgicalConsent, IFCResponse } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== API Routes ====================

// Database initialization endpoint (for development only)
app.post('/api/init-db', async (c) => {
  const { DB } = c.env
  
  try {
    // Create tables one by one
    await DB.prepare(`
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
    `).run();

    await DB.prepare(`
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
    `).run();

    await DB.prepare(`
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
    `).run();

    await DB.prepare(`
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
    `).run();

    await DB.prepare(`
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
    `).run();

    await DB.prepare(`
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
    `).run();

    await DB.prepare(`
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
    `).run();

    await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`).run();
    await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id)`).run();
    await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email)`).run()
    
    return c.json({ success: true, message: 'Database initialized successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to initialize database', details: String(error) }, 500)
  }
})

// Create new patient session
app.post('/api/sessions/create', async (c) => {
  const { DB } = c.env
  const body = await c.req.json<Patient>()
  
  try {
    // Create patient
    const patientResult = await DB.prepare(`
      INSERT INTO patients (name, date_of_birth, hospital, email, phone)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.name,
      body.date_of_birth,
      body.hospital || null,
      body.email || null,
      body.phone || null
    ).run()
    
    const patient_id = patientResult.meta.last_row_id
    
    // Generate session token
    const session_token = crypto.randomUUID()
    
    // Create session
    await DB.prepare(`
      INSERT INTO sessions (patient_id, session_token, current_step, completed_steps, status)
      VALUES (?, ?, 1, '[]', 'in_progress')
    `).bind(patient_id, session_token).run()
    
    return c.json({ 
      success: true, 
      session_token,
      patient_id 
    })
  } catch (error) {
    return c.json({ error: 'Failed to create session' }, 500)
  }
})

// Get session status
app.get('/api/sessions/:token', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')
  
  try {
    const session = await DB.prepare(`
      SELECT s.*, p.name, p.date_of_birth, p.hospital
      FROM sessions s
      JOIN patients p ON s.patient_id = p.id
      WHERE s.session_token = ?
    `).bind(token).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    return c.json({
      ...session,
      completed_steps: JSON.parse(session.completed_steps as string)
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch session' }, 500)
  }
})

// Submit ODI questionnaire
app.post('/api/questionnaires/odi', async (c) => {
  const { DB } = c.env
  const body = await c.req.json<ODIResponse & { session_token: string }>()
  
  try {
    // Get session
    const session = await DB.prepare(`
      SELECT id, completed_steps FROM sessions WHERE session_token = ?
    `).bind(body.session_token).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    // Save ODI response
    await DB.prepare(`
      INSERT INTO odi_responses (
        session_id, pain_intensity, personal_care, lifting, walking,
        sitting, standing, sleeping, sex_life, social_life, travelling, total_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      body.pain_intensity,
      body.personal_care,
      body.lifting,
      body.walking,
      body.sitting,
      body.standing,
      body.sleeping,
      body.sex_life,
      body.social_life,
      body.travelling,
      body.total_score
    ).run()
    
    // Update session
    const completed = JSON.parse(session.completed_steps as string) as number[]
    if (!completed.includes(1)) completed.push(1)
    
    await DB.prepare(`
      UPDATE sessions 
      SET current_step = 2, completed_steps = ?, updated_at = CURRENT_TIMESTAMP
      WHERE session_token = ?
    `).bind(JSON.stringify(completed), body.session_token).run()
    
    return c.json({ success: true, next_step: 2 })
  } catch (error) {
    return c.json({ error: 'Failed to save ODI response' }, 500)
  }
})

// Submit VAS questionnaire
app.post('/api/questionnaires/vas', async (c) => {
  const { DB } = c.env
  const body = await c.req.json<VASResponse & { session_token: string }>()
  
  try {
    const session = await DB.prepare(`
      SELECT id, completed_steps FROM sessions WHERE session_token = ?
    `).bind(body.session_token).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    await DB.prepare(`
      INSERT INTO vas_responses (
        session_id, neck_pain, right_arm, left_arm, back_pain, right_leg, left_leg
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      body.neck_pain,
      body.right_arm,
      body.left_arm,
      body.back_pain,
      body.right_leg,
      body.left_leg
    ).run()
    
    const completed = JSON.parse(session.completed_steps as string) as number[]
    if (!completed.includes(2)) completed.push(2)
    
    await DB.prepare(`
      UPDATE sessions 
      SET current_step = 3, completed_steps = ?, updated_at = CURRENT_TIMESTAMP
      WHERE session_token = ?
    `).bind(JSON.stringify(completed), body.session_token).run()
    
    return c.json({ success: true, next_step: 3 })
  } catch (error) {
    return c.json({ error: 'Failed to save VAS response' }, 500)
  }
})

// Submit EQ5D questionnaire
app.post('/api/questionnaires/eq5d', async (c) => {
  const { DB } = c.env
  const body = await c.req.json<EQ5DResponse & { session_token: string }>()
  
  try {
    const session = await DB.prepare(`
      SELECT id, completed_steps FROM sessions WHERE session_token = ?
    `).bind(body.session_token).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    await DB.prepare(`
      INSERT INTO eq5d_responses (
        session_id, mobility, personal_care, usual_activities, pain_discomfort, anxiety_depression, health_scale
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      body.mobility,
      body.personal_care,
      body.usual_activities,
      body.pain_discomfort,
      body.anxiety_depression,
      body.health_scale
    ).run()
    
    const completed = JSON.parse(session.completed_steps as string) as number[]
    if (!completed.includes(3)) completed.push(3)
    
    await DB.prepare(`
      UPDATE sessions 
      SET current_step = 4, completed_steps = ?, updated_at = CURRENT_TIMESTAMP
      WHERE session_token = ?
    `).bind(JSON.stringify(completed), body.session_token).run()
    
    return c.json({ success: true, next_step: 4 })
  } catch (error) {
    return c.json({ error: 'Failed to save EQ5D response' }, 500)
  }
})

// Submit Surgical Consent
app.post('/api/questionnaires/consent', async (c) => {
  const { DB } = c.env
  const body = await c.req.json<SurgicalConsent & { session_token: string }>()
  
  try {
    const session = await DB.prepare(`
      SELECT id, completed_steps FROM sessions WHERE session_token = ?
    `).bind(body.session_token).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    await DB.prepare(`
      INSERT INTO surgical_consent (
        session_id, procedure_name, consent_items, patient_signature, witness_signature, signed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      body.procedure_name,
      JSON.stringify(body.consent_items),
      body.patient_signature || null,
      body.witness_signature || null,
      body.signed_at || new Date().toISOString()
    ).run()
    
    const completed = JSON.parse(session.completed_steps as string) as number[]
    if (!completed.includes(4)) completed.push(4)
    
    await DB.prepare(`
      UPDATE sessions 
      SET current_step = 5, completed_steps = ?, updated_at = CURRENT_TIMESTAMP
      WHERE session_token = ?
    `).bind(JSON.stringify(completed), body.session_token).run()
    
    return c.json({ success: true, next_step: 5 })
  } catch (error) {
    return c.json({ error: 'Failed to save consent' }, 500)
  }
})

// Submit IFC
app.post('/api/questionnaires/ifc', async (c) => {
  const { DB } = c.env
  const body = await c.req.json<IFCResponse & { session_token: string }>()
  
  try {
    const session = await DB.prepare(`
      SELECT id, completed_steps FROM sessions WHERE session_token = ?
    `).bind(body.session_token).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    await DB.prepare(`
      INSERT INTO ifc_responses (
        session_id, quote_number, item_number, description, fee, rebate, gap, patient_signature, signed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      body.quote_number,
      body.item_number,
      body.description,
      body.fee,
      body.rebate,
      body.gap,
      body.patient_signature || null,
      body.signed_at || new Date().toISOString()
    ).run()
    
    const completed = JSON.parse(session.completed_steps as string) as number[]
    if (!completed.includes(5)) completed.push(5)
    
    await DB.prepare(`
      UPDATE sessions 
      SET current_step = 5, completed_steps = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE session_token = ?
    `).bind(JSON.stringify(completed), body.session_token).run()
    
    return c.json({ success: true, completed: true })
  } catch (error) {
    return c.json({ error: 'Failed to save IFC' }, 500)
  }
})

// Admin: Get IFC template
app.get('/api/admin/ifc/:session_token', async (c) => {
  const { DB } = c.env
  const session_token = c.req.param('session_token')
  
  try {
    const session = await DB.prepare(`
      SELECT s.*, p.name, p.date_of_birth
      FROM sessions s
      JOIN patients p ON s.patient_id = p.id
      WHERE s.session_token = ?
    `).bind(session_token).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    return c.json({
      patient_name: session.name,
      date_of_birth: session.date_of_birth,
      session_token
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch IFC template' }, 500)
  }
})

// ==================== Frontend Routes ====================

// Home page - Start new session
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prof Aaron Buckland - Surgical Questionnaires</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-mog-gray">
        <!-- Header Banner -->
        <div class="header-banner">
            <span>Start Your Path to a Healthier Spine Today  |  <a href="/admin">Staff Login</a></span>
        </div>
        
        <div class="min-h-screen flex items-center justify-center p-4 py-12">
            <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div class="text-center mb-8">
                    <div class="bg-mog-maroon text-white w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-hospital text-4xl"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-mog-maroon mb-2">Prof Aaron Buckland</h1>
                    <p class="text-mog-dark-gray">Melbourne Orthopaedic Group</p>
                    <p class="text-sm text-gray-600 mt-2">Lumbar Spine Surgery Questionnaires</p>
                </div>

                <form id="patientForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input type="text" name="name" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                        <input type="date" name="date_of_birth" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                        <input type="text" name="hospital"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="tel" name="phone"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <button type="submit" class="w-full btn-mog-primary">
                        <i class="fas fa-clipboard-list mr-2"></i>Start Questionnaires
                    </button>
                </form>

                <div id="error" class="mt-4 hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"></div>
                
                <div class="mt-6 pt-6 border-t text-center text-sm text-gray-600">
                    <p class="mb-2">Need assistance?</p>
                    <p>Phone: <a href="tel:+61391247950" class="text-mog-gold hover:text-mog-light-gold font-semibold">+61 3 9124 7950</a></p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('patientForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData);

                try {
                    const response = await axios.post('/api/sessions/create', data);
                    if (response.data.success) {
                        window.location.href = '/questionnaire/' + response.data.session_token;
                    }
                } catch (error) {
                    document.getElementById('error').textContent = 'Error creating session. Please try again.';
                    document.getElementById('error').classList.remove('hidden');
                }
            });
        </script>
    </body>
    </html>
  `)
})

// Questionnaire workflow page
app.get('/questionnaire/:token', (c) => {
  const token = c.req.param('token')
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Questionnaires - Prof Aaron Buckland</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-mog-gray">
        <!-- Header Banner -->
        <div class="header-banner">
            <span>Prof Aaron Buckland - Lumbar Spine Surgery Questionnaires</span>
        </div>
        
        <div class="min-h-screen py-8">
            <!-- Progress Bar -->
            <div class="max-w-4xl mx-auto px-4 mb-8">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="mb-4 text-center">
                        <h2 class="text-lg font-semibold text-mog-maroon">Questionnaire Progress</h2>
                        <p class="text-sm text-mog-dark-gray">Complete all 5 sections</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <div id="step1" class="flex-1 text-center step-indicator">
                            <div class="w-10 h-10 mx-auto rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">1</div>
                            <p class="text-xs mt-2 text-gray-600">ODI</p>
                        </div>
                        <div class="flex-1 h-1 bg-gray-300"></div>
                        <div id="step2" class="flex-1 text-center step-indicator">
                            <div class="w-10 h-10 mx-auto rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">2</div>
                            <p class="text-xs mt-2 text-gray-600">VAS</p>
                        </div>
                        <div class="flex-1 h-1 bg-gray-300"></div>
                        <div id="step3" class="flex-1 text-center step-indicator">
                            <div class="w-10 h-10 mx-auto rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">3</div>
                            <p class="text-xs mt-2 text-gray-600">EQ-5D-3L</p>
                        </div>
                        <div class="flex-1 h-1 bg-gray-300"></div>
                        <div id="step4" class="flex-1 text-center step-indicator">
                            <div class="w-10 h-10 mx-auto rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">4</div>
                            <p class="text-xs mt-2 text-gray-600">Consent</p>
                        </div>
                        <div class="flex-1 h-1 bg-gray-300"></div>
                        <div id="step5" class="flex-1 text-center step-indicator">
                            <div class="w-10 h-10 mx-auto rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">5</div>
                            <p class="text-xs mt-2 text-gray-600">IFC</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Questionnaire Container -->
            <div class="max-w-4xl mx-auto px-4">
                <div id="questionnaireContainer" class="bg-white rounded-lg shadow-lg p-8">
                    <div class="text-center py-12">
                        <div class="spinner mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading questionnaire...</p>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script>
            const sessionToken = '${token}';
            window.addEventListener('DOMContentLoaded', () => {
                initQuestionnaire(sessionToken);
            });
        </script>
    </body>
    </html>
  `)
})

// ==================== Admin API Routes ====================

// Get all patients with their session status
app.get('/api/admin/patients', async (c) => {
  const { DB } = c.env
  
  try {
    const result = await DB.prepare(`
      SELECT 
        p.*,
        s.session_token,
        s.current_step,
        s.completed_steps,
        s.status,
        s.created_at as session_created_at
      FROM patients p
      LEFT JOIN sessions s ON p.id = s.patient_id
      ORDER BY p.created_at DESC
    `).all()
    
    return c.json(result.results || [])
  } catch (error) {
    return c.json({ error: 'Failed to fetch patients' }, 500)
  }
})

// Get single patient with all questionnaire data
app.get('/api/admin/patients/:id', async (c) => {
  const { DB } = c.env
  const patientId = c.req.param('id')
  
  try {
    // Get patient and session info
    const patient = await DB.prepare(`
      SELECT 
        p.*,
        s.id as session_id,
        s.session_token,
        s.current_step,
        s.completed_steps,
        s.status,
        s.created_at as session_created_at
      FROM patients p
      LEFT JOIN sessions s ON p.id = s.patient_id
      WHERE p.id = ?
    `).bind(patientId).first()
    
    if (!patient) {
      return c.json({ error: 'Patient not found' }, 404)
    }
    
    // Get ODI responses
    const odi = await DB.prepare(`
      SELECT * FROM odi_responses WHERE session_id = ?
    `).bind(patient.session_id).first()
    
    // Get VAS responses
    const vas = await DB.prepare(`
      SELECT * FROM vas_responses WHERE session_id = ?
    `).bind(patient.session_id).first()
    
    // Get EQ5D responses
    const eq5d = await DB.prepare(`
      SELECT * FROM eq5d_responses WHERE session_id = ?
    `).bind(patient.session_id).first()
    
    // Get Surgical Consent
    const consent = await DB.prepare(`
      SELECT * FROM surgical_consent WHERE session_id = ?
    `).bind(patient.session_id).first()
    
    // Get IFC
    const ifc = await DB.prepare(`
      SELECT * FROM ifc_responses WHERE session_id = ?
    `).bind(patient.session_id).first()
    
    return c.json({
      patient,
      odi,
      vas,
      eq5d,
      consent: consent ? {
        ...consent,
        consent_items: JSON.parse(consent.consent_items as string)
      } : null,
      ifc
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch patient data' }, 500)
  }
})

// Get dashboard statistics
app.get('/api/admin/stats', async (c) => {
  const { DB } = c.env
  
  try {
    const totalPatients = await DB.prepare(`SELECT COUNT(*) as count FROM patients`).first()
    const completedSessions = await DB.prepare(`SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'`).first()
    const inProgressSessions = await DB.prepare(`SELECT COUNT(*) as count FROM sessions WHERE status = 'in_progress'`).first()
    const todayPatients = await DB.prepare(`SELECT COUNT(*) as count FROM patients WHERE DATE(created_at) = DATE('now')`).first()
    
    return c.json({
      total_patients: totalPatients?.count || 0,
      completed_sessions: completedSessions?.count || 0,
      in_progress_sessions: inProgressSessions?.count || 0,
      today_patients: todayPatients?.count || 0
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch statistics' }, 500)
  }
})

// Update IFC data for a patient
app.put('/api/admin/ifc/:session_token', async (c) => {
  const { DB } = c.env
  const session_token = c.req.param('session_token')
  const body = await c.req.json<{
    quote_number: string
    item_number: string
    description: string
    fee: number
    rebate: number
    gap: number
  }>()
  
  try {
    // Check if session exists
    const session = await DB.prepare(`
      SELECT id FROM sessions WHERE session_token = ?
    `).bind(session_token).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    // Check if IFC already exists
    const existing = await DB.prepare(`
      SELECT id FROM ifc_responses WHERE session_id = ?
    `).bind(session.id).first()
    
    if (existing) {
      // Update existing
      await DB.prepare(`
        UPDATE ifc_responses 
        SET quote_number = ?, item_number = ?, description = ?, fee = ?, rebate = ?, gap = ?
        WHERE session_id = ?
      `).bind(
        body.quote_number,
        body.item_number,
        body.description,
        body.fee,
        body.rebate,
        body.gap,
        session.id
      ).run()
    } else {
      // Create new
      await DB.prepare(`
        INSERT INTO ifc_responses (session_id, quote_number, item_number, description, fee, rebate, gap)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        session.id,
        body.quote_number,
        body.item_number,
        body.description,
        body.fee,
        body.rebate,
        body.gap
      ).run()
    }
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update IFC data' }, 500)
  }
})

// ==================== Admin Dashboard Pages ====================

// Admin dashboard home
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard - Prof Aaron Buckland</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-mog-gray">
        <!-- Header Banner -->
        <div class="header-banner">
            <span>Melbourne Orthopaedic Group - Admin Dashboard</span>
        </div>

        <div class="flex">
            <!-- Sidebar -->
            <div class="admin-sidebar w-64 flex-shrink-0">
                <div class="p-6">
                    <h2 class="text-xl font-bold mb-1">MOG Admin</h2>
                    <p class="text-sm opacity-75">Prof Aaron Buckland</p>
                </div>
                
                <nav>
                    <a href="/admin" class="admin-sidebar-item active flex items-center">
                        <i class="fas fa-chart-line w-6"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="/admin/patients" class="admin-sidebar-item flex items-center">
                        <i class="fas fa-users w-6"></i>
                        <span>Patients</span>
                    </a>
                    <a href="/" class="admin-sidebar-item flex items-center">
                        <i class="fas fa-home w-6"></i>
                        <span>Public Site</span>
                    </a>
                </nav>
            </div>

            <!-- Main Content -->
            <div class="flex-1 p-8">
                <h1 class="text-3xl font-bold text-mog-maroon mb-8">Dashboard Overview</h1>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="statsContainer">
                    <div class="stat-card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-mog-dark-gray text-sm font-medium">Total Patients</p>
                                <p class="text-3xl font-bold text-mog-maroon mt-2" id="totalPatients">-</p>
                            </div>
                            <div class="bg-mog-maroon bg-opacity-10 rounded-full p-3">
                                <i class="fas fa-users text-2xl text-mog-maroon"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-mog-dark-gray text-sm font-medium">Completed</p>
                                <p class="text-3xl font-bold text-green-600 mt-2" id="completedSessions">-</p>
                            </div>
                            <div class="bg-green-100 rounded-full p-3">
                                <i class="fas fa-check-circle text-2xl text-green-600"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-mog-dark-gray text-sm font-medium">In Progress</p>
                                <p class="text-3xl font-bold text-mog-gold mt-2" id="inProgressSessions">-</p>
                            </div>
                            <div class="bg-yellow-100 rounded-full p-3">
                                <i class="fas fa-clock text-2xl text-mog-gold"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-mog-dark-gray text-sm font-medium">Today</p>
                                <p class="text-3xl font-bold text-blue-600 mt-2" id="todayPatients">-</p>
                            </div>
                            <div class="bg-blue-100 rounded-full p-3">
                                <i class="fas fa-calendar-day text-2xl text-blue-600"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Patients -->
                <div class="card fade-in">
                    <div class="card-header flex justify-between items-center">
                        <h2 class="text-lg">Recent Patients</h2>
                        <a href="/admin/patients" class="text-mog-gold hover:text-mog-light-gold text-sm">
                            View All <i class="fas fa-arrow-right ml-1"></i>
                        </a>
                    </div>
                    <div class="card-body">
                        <div id="recentPatientsTable">
                            <div class="flex justify-center py-8">
                                <div class="spinner"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/admin.js"></script>
    </body>
    </html>
  `)
})

// Admin patients list page
app.get('/admin/patients', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Patients - Admin Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-mog-gray">
        <!-- Header Banner -->
        <div class="header-banner">
            <span>Melbourne Orthopaedic Group - Admin Dashboard</span>
        </div>

        <div class="flex">
            <!-- Sidebar -->
            <div class="admin-sidebar w-64 flex-shrink-0">
                <div class="p-6">
                    <h2 class="text-xl font-bold mb-1">MOG Admin</h2>
                    <p class="text-sm opacity-75">Prof Aaron Buckland</p>
                </div>
                
                <nav>
                    <a href="/admin" class="admin-sidebar-item flex items-center">
                        <i class="fas fa-chart-line w-6"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="/admin/patients" class="admin-sidebar-item active flex items-center">
                        <i class="fas fa-users w-6"></i>
                        <span>Patients</span>
                    </a>
                    <a href="/" class="admin-sidebar-item flex items-center">
                        <i class="fas fa-home w-6"></i>
                        <span>Public Site</span>
                    </a>
                </nav>
            </div>

            <!-- Main Content -->
            <div class="flex-1 p-8">
                <div class="flex justify-between items-center mb-8">
                    <h1 class="text-3xl font-bold text-mog-maroon">All Patients</h1>
                    <div class="flex gap-4">
                        <input type="text" id="searchInput" placeholder="Search patients..."
                            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mog-maroon focus:border-transparent">
                        <select id="statusFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mog-maroon focus:border-transparent">
                            <option value="">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="in_progress">In Progress</option>
                        </select>
                    </div>
                </div>

                <div class="card">
                    <div class="overflow-x-auto">
                        <table class="w-full table-striped table-hover">
                            <thead class="bg-mog-maroon text-white">
                                <tr>
                                    <th class="px-6 py-3 text-left text-sm font-semibold">Patient Name</th>
                                    <th class="px-6 py-3 text-left text-sm font-semibold">DOB</th>
                                    <th class="px-6 py-3 text-left text-sm font-semibold">Hospital</th>
                                    <th class="px-6 py-3 text-left text-sm font-semibold">Email</th>
                                    <th class="px-6 py-3 text-left text-sm font-semibold">Status</th>
                                    <th class="px-6 py-3 text-left text-sm font-semibold">Progress</th>
                                    <th class="px-6 py-3 text-left text-sm font-semibold">Created</th>
                                    <th class="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="patientsTableBody">
                                <tr>
                                    <td colspan="8" class="px-6 py-12 text-center">
                                        <div class="flex justify-center">
                                            <div class="spinner"></div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/admin.js"></script>
        <script>
            loadPatientsPage();
        </script>
    </body>
    </html>
  `)
})

// Admin patient detail page
app.get('/admin/patients/:id', (c) => {
  const patientId = c.req.param('id')
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Patient Details - Admin Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-mog-gray">
        <!-- Header Banner -->
        <div class="header-banner">
            <span>Melbourne Orthopaedic Group - Admin Dashboard</span>
        </div>

        <div class="flex">
            <!-- Sidebar -->
            <div class="admin-sidebar w-64 flex-shrink-0">
                <div class="p-6">
                    <h2 class="text-xl font-bold mb-1">MOG Admin</h2>
                    <p class="text-sm opacity-75">Prof Aaron Buckland</p>
                </div>
                
                <nav>
                    <a href="/admin" class="admin-sidebar-item flex items-center">
                        <i class="fas fa-chart-line w-6"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="/admin/patients" class="admin-sidebar-item active flex items-center">
                        <i class="fas fa-users w-6"></i>
                        <span>Patients</span>
                    </a>
                    <a href="/" class="admin-sidebar-item flex items-center">
                        <i class="fas fa-home w-6"></i>
                        <span>Public Site</span>
                    </a>
                </nav>
            </div>

            <!-- Main Content -->
            <div class="flex-1 p-8">
                <div class="mb-6">
                    <a href="/admin/patients" class="text-mog-gold hover:text-mog-light-gold">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Patients
                    </a>
                </div>

                <div id="patientDetailContainer">
                    <div class="flex justify-center py-12">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/admin.js"></script>
        <script>
            loadPatientDetail('${patientId}');
        </script>
    </body>
    </html>
  `)
})

// Completion page
app.get('/complete', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete - Prof Aaron Buckland</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-mog-gray">
        <!-- Header Banner -->
        <div class="header-banner">
            <span>Prof Aaron Buckland - Melbourne Orthopaedic Group</span>
        </div>
        
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div class="bg-green-100 w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6">
                    <i class="fas fa-check-circle text-green-500 text-5xl"></i>
                </div>
                <h1 class="text-3xl font-bold text-mog-maroon mb-4">All Questionnaires Complete!</h1>
                <p class="text-mog-dark-gray mb-6">
                    Thank you for completing all the required questionnaires. 
                    Your responses have been saved successfully.
                </p>
                <div class="bg-mog-gray p-6 rounded-lg mb-6">
                    <p class="text-sm text-gray-700 mb-4">
                        <i class="fas fa-info-circle text-mog-gold mr-2"></i>
                        Prof Aaron Buckland's office will review your responses and contact you regarding next steps.
                    </p>
                    <div class="text-sm text-gray-600">
                        <p class="font-semibold text-mog-maroon mb-2">Contact Information:</p>
                        <p><i class="fas fa-phone mr-2"></i>+61 3 9124 7950</p>
                        <p><i class="fas fa-envelope mr-2"></i>admin.buckland@mog.com.au</p>
                    </div>
                </div>
                <a href="/" class="btn-mog-primary inline-block">
                    <i class="fas fa-home mr-2"></i>Return to Home
                </a>
            </div>
        </div>
    </body>
    </html>
  `)
})

export default app
