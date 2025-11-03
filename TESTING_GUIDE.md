# Testing Guide for Surgical Questionnaires Platform

## Quick Start Testing

### 1. Access the Application

**Local Development:**
```
http://localhost:3000
```

**Sandbox URL:**
```
https://3000-i9m6xc6zlvaun9eeh4bzj-3844e1b6.sandbox.novita.ai
```

### 2. Complete Test Workflow

#### Step 1: Patient Registration
1. Navigate to the home page
2. Fill in test data:
   - Name: `John Doe`
   - Date of Birth: `1980-01-15`
   - Hospital: `Epworth Richmond`
   - Email: `john.doe@example.com`
   - Phone: `0412345678`
3. Click "Start Questionnaires"
4. You'll be redirected to `/questionnaire/{token}`

#### Step 2: ODI Questionnaire
1. Select one option for each of the 10 sections:
   - Pain intensity
   - Personal care
   - Lifting
   - Walking
   - Sitting
   - Standing
   - Sleeping
   - Sex life
   - Social life
   - Travelling
2. All sections are required
3. Click "Save and Continue"
4. Progress indicator shows step 1 complete (green checkmark)

#### Step 3: VAS Questionnaire
1. Adjust sliders for 6 pain areas:
   - Neck Pain: `3.5`
   - Right Arm: `4.2`
   - Left Arm: `2.1`
   - Back Pain: `7.8`
   - Right Leg: `5.5`
   - Left Leg: `4.0`
2. Watch the value display update in real-time
3. Click "Save and Continue"
4. Progress indicator shows step 2 complete

#### Step 4: EQ-5D-3L Questionnaire
1. Select one option for each of 5 dimensions:
   - Mobility: Select appropriate level
   - Personal Care: Select appropriate level
   - Usual Activities: Select appropriate level
   - Pain / Discomfort: Select appropriate level
   - Anxiety / Depression: Select appropriate level
2. Adjust health scale slider (0-100)
3. Click "Save and Continue"
4. Progress indicator shows step 3 complete

#### Step 5: Surgical Consent
1. Enter procedure name: `Lumbar Spinal Decompression`
2. Enter initials in all 11 consent item boxes (e.g., `JD`)
3. Enter patient signature: `John Doe`
4. Optional: Enter witness signature
5. Click "Save and Continue"
6. Progress indicator shows step 4 complete

#### Step 6: IFC (Informed Financial Consent)
1. Auto-filled quote number will be displayed
2. Enter financial details:
   - Item Number: `51011`
   - Description: `Direct spinal decompression or exposure`
   - Fee: `7160.00`
   - Rebate: `1674.60`
   - Gap will be calculated automatically: `5485.40`
3. Check all 5 acknowledgment checkboxes
4. Enter patient signature: `John Doe`
5. Click "Complete All Questionnaires"
6. You'll be redirected to `/complete`

#### Step 7: Completion Page
- View success message
- Confirmation that all questionnaires are complete
- Patient data is saved in database

## Database Verification

### Check Session Data
```bash
# Access local database
cd /home/user/webapp
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM sessions ORDER BY created_at DESC LIMIT 1"
```

### Check Patient Data
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM patients ORDER BY created_at DESC LIMIT 1"
```

### Check ODI Responses
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM odi_responses ORDER BY completed_at DESC LIMIT 1"
```

### Check VAS Responses
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM vas_responses ORDER BY completed_at DESC LIMIT 1"
```

### Check EQ5D Responses
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM eq5d_responses ORDER BY completed_at DESC LIMIT 1"
```

### Check Surgical Consent
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM surgical_consent ORDER BY completed_at DESC LIMIT 1"
```

### Check IFC Responses
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM ifc_responses ORDER BY completed_at DESC LIMIT 1"
```

## API Testing

### Test Session Creation
```bash
curl -X POST http://localhost:3000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "date_of_birth": "1990-05-20",
    "hospital": "Test Hospital",
    "email": "test@example.com",
    "phone": "0400000000"
  }'
```

Expected response:
```json
{
  "success": true,
  "session_token": "uuid-here",
  "patient_id": 1
}
```

### Test Get Session
```bash
curl http://localhost:3000/api/sessions/{session_token}
```

### Test ODI Submission
```bash
curl -X POST http://localhost:3000/api/questionnaires/odi \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your-token-here",
    "pain_intensity": 3,
    "personal_care": 2,
    "lifting": 4,
    "walking": 3,
    "sitting": 3,
    "standing": 2,
    "sleeping": 1,
    "sex_life": 2,
    "social_life": 2,
    "travelling": 3,
    "total_score": 25
  }'
```

## Browser Testing Checklist

### Functional Testing
- [ ] Home page loads correctly
- [ ] Patient registration form validation works
- [ ] Session token is generated
- [ ] Progress indicator displays correctly
- [ ] ODI form shows all 10 sections
- [ ] Radio buttons work in ODI
- [ ] VAS sliders are interactive
- [ ] VAS value displays update
- [ ] EQ-5D-3L radio buttons work
- [ ] EQ-5D-3L health scale slider works
- [ ] Surgical consent initials fields accept input
- [ ] Surgical consent validates all initials
- [ ] IFC gap calculation works automatically
- [ ] IFC checkboxes must all be checked
- [ ] Form submission shows success
- [ ] Completion page displays
- [ ] Cannot skip steps (try navigating manually)
- [ ] Auto-save prevents data loss

### UI/UX Testing
- [ ] Layout is responsive on mobile
- [ ] Colors and fonts are consistent
- [ ] Icons display correctly (FontAwesome)
- [ ] Buttons have hover states
- [ ] Form fields have focus states
- [ ] Error messages are clear
- [ ] Success messages are visible
- [ ] Progress bar updates correctly
- [ ] Smooth scrolling after form submission

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Performance Testing

### Load Time
```bash
# Test page load time
time curl -s http://localhost:3000 > /dev/null
```

### Database Query Speed
```bash
# Test query performance
time npx wrangler d1 execute webapp-production --local \
  --command="SELECT COUNT(*) FROM patients"
```

### Concurrent Users
Use Apache Bench or similar tool:
```bash
# Test 100 requests with 10 concurrent
ab -n 100 -c 10 http://localhost:3000/
```

## Common Issues and Solutions

### Issue: Database Not Initialized
**Solution:**
```bash
curl -X POST http://localhost:3000/api/init-db
```

### Issue: Port 3000 Already in Use
**Solution:**
```bash
fuser -k 3000/tcp
pm2 restart webapp
```

### Issue: PM2 Service Not Running
**Solution:**
```bash
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs
```

### Issue: Form Submission Fails
**Solution:**
1. Check browser console for errors
2. Verify session token is valid
3. Check PM2 logs: `pm2 logs webapp --nostream`
4. Verify database is initialized

### Issue: Static Files Not Loading
**Solution:**
1. Check if `/static/app.js` exists in `public/static/`
2. Rebuild: `npm run build`
3. Restart: `pm2 restart webapp`

## Test Data Examples

### Valid Test Patients
```javascript
// Patient 1 - Young adult
{
  name: "Emma Wilson",
  date_of_birth: "1995-03-12",
  hospital: "Epworth Richmond",
  email: "emma.wilson@example.com",
  phone: "0411222333"
}

// Patient 2 - Middle aged
{
  name: "David Chen",
  date_of_birth: "1975-08-25",
  hospital: "St Vincent's",
  email: "david.chen@example.com",
  phone: "0422333444"
}

// Patient 3 - Senior
{
  name: "Margaret Smith",
  date_of_birth: "1955-11-08",
  hospital: "Royal Melbourne",
  email: "margaret.smith@example.com",
  phone: "0433444555"
}
```

## Automated Testing Script

Save this as `test.sh`:
```bash
#!/bin/bash

echo "Testing Surgical Questionnaires Platform..."

# Test home page
echo "1. Testing home page..."
curl -s http://localhost:3000 | grep -q "Prof Aaron Buckland" && echo "✓ Home page OK" || echo "✗ Home page FAILED"

# Test database initialization
echo "2. Testing database initialization..."
curl -s -X POST http://localhost:3000/api/init-db | grep -q "success" && echo "✓ Database OK" || echo "✗ Database FAILED"

# Test session creation
echo "3. Testing session creation..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","date_of_birth":"1990-01-01","hospital":"Test Hospital"}')

if echo "$RESPONSE" | grep -q "session_token"; then
  echo "✓ Session creation OK"
  TOKEN=$(echo "$RESPONSE" | grep -o '"session_token":"[^"]*' | cut -d'"' -f4)
  echo "  Session token: $TOKEN"
else
  echo "✗ Session creation FAILED"
fi

echo ""
echo "Testing complete!"
```

Make executable and run:
```bash
chmod +x test.sh
./test.sh
```

## Report Issues

When reporting issues, please include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable
5. Console errors from browser DevTools
6. PM2 logs: `pm2 logs webapp --nostream --lines 50`
