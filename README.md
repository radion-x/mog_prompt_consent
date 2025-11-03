# Prof Aaron Buckland - Surgical Questionnaires Platform

A comprehensive web application for managing pre-surgical questionnaires for lumbar spine surgery patients. Built with Hono framework and Cloudflare Pages/Workers.

## Project Overview

This application provides a sequential workflow for patients to complete required questionnaires before lumbar spine surgery:

1. **ODI (Oswestry Disability Index)** - 10 sections assessing disability
2. **VAS (Visual Analogue Scale)** - Pain intensity ratings for 6 body areas
3. **EQ-5D-3L** - Health quality assessment
4. **Surgical Consent** - Detailed consent form with initial fields
5. **IFC (Informed Financial Consent)** - Financial acknowledgment and consent

## Features

### Completed Features

✅ **Patient Registration**
- Basic patient information capture
- Session token generation
- Unique patient tracking

✅ **ODI Questionnaire**
- All 10 sections with proper validation
- Radio button selection for each section
- Automatic score calculation
- Progress tracking

✅ **VAS Questionnaire** 
- Interactive sliders for 6 pain areas (Neck, Right Arm, Left Arm, Back, Right Leg, Left Leg)
- Visual feedback with gradient colors
- Decimal precision (0.1 increments)
- Real-time value display

✅ **EQ-5D-3L Questionnaire**
- 5 health dimensions assessment
- Health scale slider (0-100)
- Visual thermometer-style interface

✅ **Surgical Consent Form**
- 11 consent items with initial fields
- DocuSign-style initial collection
- Patient and witness signature fields
- Procedure name input

✅ **IFC Form**
- Pre-filled cost estimates
- Quote number generation
- Automatic gap calculation
- Financial acknowledgment checkboxes
- Digital signature capture

✅ **Sequential Workflow**
- Step-by-step progress indicator
- Auto-save after each questionnaire
- Prevention of skipping steps
- Visual progress tracking

✅ **Database Integration**
- Cloudflare D1 SQLite database
- Proper foreign key relationships
- Session management
- Data persistence for all questionnaires

## URLs

- **Local Development**: http://localhost:3000
- **Sandbox URL**: https://3000-i9m6xc6zlvaun9eeh4bzj-3844e1b6.sandbox.novita.ai
- **Production**: (To be deployed to Cloudflare Pages)
- **GitHub**: (To be added after repository setup)

## Data Architecture

### Database Schema

**Tables:**
- `patients` - Patient demographic information
- `sessions` - Questionnaire session tracking
- `odi_responses` - ODI questionnaire answers
- `vas_responses` - VAS pain scale ratings
- `eq5d_responses` - EQ-5D-3L health assessments
- `surgical_consent` - Consent form data with initials
- `ifc_responses` - Financial consent responses

**Storage Service:** Cloudflare D1 (SQLite)

**Data Flow:**
1. Patient creates session → `patients` + `sessions` tables
2. Each questionnaire saves to respective table with session_id
3. Progress tracked in `sessions.current_step` and `sessions.completed_steps`
4. Auto-save after each form submission
5. Status updated to 'completed' after final form

## Technology Stack

- **Backend**: Hono framework on Cloudflare Workers
- **Frontend**: Vanilla JavaScript with TailwindCSS
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages
- **Development**: PM2 for process management

## User Guide

### For Patients

1. **Start Session**
   - Navigate to the home page
   - Enter your personal information (Name, Date of Birth, Hospital, Email, Phone)
   - Click "Start Questionnaires"

2. **Complete ODI Questionnaire**
   - Read each section carefully
   - Select one option per section that best describes your current state
   - All 10 sections must be completed
   - Click "Save and Continue"

3. **Complete VAS Questionnaire**
   - Use sliders to indicate pain intensity for each body area
   - Adjust to the exact decimal value (0.0 to 10.0)
   - Complete all 6 pain areas
   - Click "Save and Continue"

4. **Complete EQ-5D-3L Questionnaire**
   - Select one option for each of the 5 health dimensions
   - Use the health scale slider to rate your overall health (0-100)
   - Click "Save and Continue"

5. **Complete Surgical Consent**
   - Read each consent item carefully
   - Enter your initials in the box next to each item
   - Enter the procedure name
   - Provide patient signature (type full name)
   - Optional: Witness signature
   - Click "Save and Continue"

6. **Complete IFC Form**
   - Review the cost estimate details
   - Enter procedure item number and description
   - Enter fee and rebate amounts (gap calculated automatically)
   - Check all acknowledgment boxes
   - Sign by typing your full name
   - Click "Complete All Questionnaires"

7. **Completion**
   - View confirmation message
   - Prof Buckland's office will review your responses

### For Staff/Admins

**Database Initialization** (Already done in development):
```bash
curl -X POST http://localhost:3000/api/init-db
```

**Pre-filling IFC Data**:
- Currently, patients enter IFC details manually
- Future enhancement: Admin interface to pre-populate IFC data per patient

## Development

### Local Setup

```bash
# Install dependencies
npm install

# Build project
npm run build

# Initialize database
curl -X POST http://localhost:3000/api/init-db

# Start development server
npm run dev:sandbox
# or with PM2
pm2 start ecosystem.config.cjs

# Test
curl http://localhost:3000
```

### Project Structure

```
webapp/
├── src/
│   ├── index.tsx          # Main Hono application
│   └── types.ts           # TypeScript type definitions
├── public/
│   └── static/
│       └── app.js         # Frontend JavaScript (all forms)
├── migrations/
│   └── 0001_initial_schema.sql  # Database schema
├── .wrangler/             # Local D1 database (auto-generated)
├── ecosystem.config.cjs   # PM2 configuration
├── wrangler.json          # Cloudflare configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

### API Endpoints

**Session Management:**
- `POST /api/sessions/create` - Create new patient session
- `GET /api/sessions/:token` - Get session status

**Questionnaires:**
- `POST /api/questionnaires/odi` - Submit ODI responses
- `POST /api/questionnaires/vas` - Submit VAS responses
- `POST /api/questionnaires/eq5d` - Submit EQ-5D-3L responses
- `POST /api/questionnaires/consent` - Submit surgical consent
- `POST /api/questionnaires/ifc` - Submit IFC responses

**Admin:**
- `POST /api/init-db` - Initialize database (development)
- `GET /api/admin/ifc/:session_token` - Get IFC template data

## Features Not Yet Implemented

### Medium Priority
- [ ] Admin dashboard to view all patient submissions
- [ ] Admin interface to pre-fill IFC data per patient
- [ ] Email notifications after completion
- [ ] PDF generation of completed forms
- [ ] Patient data export functionality

### Low Priority
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] Patient portal to view past submissions
- [ ] Digital signature with drawing canvas
- [ ] Progress save without completing full form

## Recommended Next Steps

1. **Deploy to Cloudflare Pages**
   - Set up Cloudflare account
   - Create production D1 database
   - Deploy application
   - Configure custom domain

2. **Add Admin Dashboard**
   - View all patient sessions
   - Review completed questionnaires
   - Export data to PDF/Excel
   - Pre-fill IFC data

3. **Enhance Security**
   - Add authentication for admin routes
   - Implement rate limiting
   - Add data encryption for sensitive fields

4. **Improve User Experience**
   - Add form field validation hints
   - Save partial progress
   - Add "Back" navigation between forms
   - Mobile responsive improvements

5. **Testing & QA**
   - End-to-end testing with real workflow
   - Browser compatibility testing
   - Mobile device testing
   - Load testing for concurrent users

## Deployment Status

- **Development**: ✅ Active (PM2 on sandbox)
- **Production**: ❌ Not yet deployed
- **Database**: ✅ Initialized and ready
- **Last Updated**: 2025-11-03

## Support

For technical issues or questions:
- Contact: Prof Aaron Buckland's office
- Email: admin.buckland@mog.com.au
- Phone: +61 3 9124 7950
- Address: 33 The Avenue, Windsor, Vic 3181 Australia

## License

Proprietary - Prof Aaron Buckland Medical Practice
