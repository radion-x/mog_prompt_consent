// Global state
let currentSession = null;

// Initialize questionnaire workflow
async function initQuestionnaire(sessionToken) {
    try {
        const response = await axios.get(`/api/sessions/${sessionToken}`);
        currentSession = response.data;
        
        updateProgressBar(currentSession.current_step, currentSession.completed_steps);
        loadCurrentStep();
    } catch (error) {
        showError('Failed to load questionnaire session');
    }
}

// Update progress bar
function updateProgressBar(currentStep, completedSteps) {
    for (let i = 1; i <= 5; i++) {
        const stepEl = document.getElementById(`step${i}`);
        const circle = stepEl.querySelector('div');
        
        if (completedSteps.includes(i)) {
            circle.classList.remove('bg-gray-300');
            circle.classList.add('bg-green-500');
        } else if (i === currentStep) {
            circle.classList.remove('bg-gray-300');
            circle.classList.add('bg-blue-600');
        }
    }
}

// Load current step questionnaire
function loadCurrentStep() {
    const step = currentSession.current_step;
    
    switch(step) {
        case 1:
            renderODI();
            break;
        case 2:
            renderVAS();
            break;
        case 3:
            renderEQ5D();
            break;
        case 4:
            renderSurgicalConsent();
            break;
        case 5:
            renderIFC();
            break;
        default:
            window.location.href = '/complete';
    }
}

// ========== ODI Questionnaire ==========
function renderODI() {
    const container = document.getElementById('questionnaireContainer');
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Oswestry Disability Index (ODI)</h2>
        <p class="text-gray-600 mb-6">
            This questionnaire is designed to give us information about how your back (or leg) trouble 
            affects your ability to manage in everyday life. Please answer every section. 
            Tick one box only in each section that most closely describes you today.
        </p>
        
        <form id="odiForm" class="space-y-8">
            ${generateODISection('pain_intensity', 'Section 1 - Pain Intensity', [
                'I have no pain at the moment.',
                'The pain is very mild at the moment.',
                'The pain is moderate at the moment.',
                'The pain is fairly severe at the moment.',
                'The pain is very severe at the moment.',
                'The pain is the worst imaginable at the moment.'
            ])}
            
            ${generateODISection('personal_care', 'Section 2 - Personal Care (washing, dressing, etc.)', [
                'I can look after myself normally without causing extra pain.',
                'I can look after myself normally, but it is very painful.',
                'It is painful to look after myself, and I am slow and careful.',
                'I need some help but manage most of my personal care.',
                'I need help every day in most aspects of self care.',
                'I do not get dressed, I wash with difficulty and I stay in bed.'
            ])}
            
            ${generateODISection('lifting', 'Section 3 - Lifting', [
                'I can lift heavy objects without extra pain.',
                'I can lift heavy objects, but it causes extra pain.',
                'Pain prevents me from lifting heavy objects off the floor, but I can manage if they are conveniently positioned, e.g. on a table.',
                'Pain prevents me from lifting heavy objects, but I can manage light to medium weights if they are conveniently positioned.',
                'I can lift only very light objects.',
                'I cannot lift or carry anything at all.'
            ])}
            
            ${generateODISection('walking', 'Section 4 - Walking', [
                'Pain does not prevent me from walking any distance.',
                'Pain prevents me from walking more than one kilometre.',
                'Pain prevents me from walking more than 500 metres.',
                'Pain prevents me from walking more than 100 metres.',
                'I can only walk using a stick or crutches.',
                'I am in bed most of the time and have to crawl to the toilet.'
            ])}
            
            ${generateODISection('sitting', 'Section 5 - Sitting', [
                'I can sit in any chair as long as I like.',
                'I can sit in my favourite chair as long as I like.',
                'Pain prevents me from sitting for more than 1 hour.',
                'Pain prevents me from sitting for more than half an hour.',
                'Pain prevents me from sitting for more than 10 minutes.',
                'Pain prevents me from sitting at all.'
            ])}
            
            ${generateODISection('standing', 'Section 6 - Standing', [
                'I can stand as long as I want without extra pain.',
                'I can stand as long as I want, but it causes me extra pain.',
                'Pain prevents me from standing for more than 1 hour.',
                'Pain prevents me from standing for more than half an hour.',
                'Pain prevents me from standing for more than 10 minutes.',
                'Pain prevents me from standing at all.'
            ])}
            
            ${generateODISection('sleeping', 'Section 7 - Sleeping', [
                'My sleep is never disturbed by pain.',
                'My sleep is occasionally disturbed by pain.',
                'I have less than 6 hours sleep because of pain.',
                'I have less than 4 hours sleep because of pain.',
                'I have less than 2 hours sleep because of pain.',
                'I cannot sleep at all because of pain.'
            ])}
            
            ${generateODISection('sex_life', 'Section 8 - Sex Life (if applicable)', [
                'My sex life is normal and causes no extra pain.',
                'My sex life is normal but causes some extra pain.',
                'My sex life is nearly normal but is very painful.',
                'My sex life is severely restricted by pain.',
                'My sex life is nearly absent because of pain.',
                'Pain prevents any sex life at all.'
            ])}
            
            ${generateODISection('social_life', 'Section 9 - Social Life', [
                'My social life is normal and causes me no extra pain.',
                'My social life is normal but increases the degree of pain.',
                'Pain has no significant effect on my social life apart from limiting my more energetic interests, e.g. sport, etc.',
                'Pain has restricted my social life, and I do not go out as often.',
                'Pain has restricted social life to my home.',
                'I have no social life because of pain.'
            ])}
            
            ${generateODISection('travelling', 'Section 10 - Travelling', [
                'I can travel anywhere without pain.',
                'I can travel anywhere, but it causes extra pain.',
                'Pain is bad, but I manage journeys over two hours.',
                'Pain restricts me to journeys of less than one hour.',
                'Pain restricts me to short, necessary journeys under 30 minutes.',
                'Pain prevents me from travelling except to receive treatment.'
            ])}
            
            <div class="pt-6 border-t">
                <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Save and Continue
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('odiForm').addEventListener('submit', submitODI);
}

function generateODISection(name, title, options) {
    return `
        <div class="border-l-4 border-blue-500 pl-4">
            <h3 class="font-semibold text-gray-800 mb-3">${title}</h3>
            <div class="space-y-2">
                ${options.map((option, index) => `
                    <label class="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input type="radio" name="${name}" value="${index}" required class="mt-1">
                        <span class="text-gray-700">${option}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

async function submitODI(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    let totalScore = 0;
    
    for (const [key, value] of formData.entries()) {
        data[key] = parseInt(value);
        totalScore += parseInt(value);
    }
    
    data.total_score = totalScore;
    data.session_token = currentSession.session_token;
    
    try {
        const response = await axios.post('/api/questionnaires/odi', data);
        if (response.data.success) {
            currentSession.current_step = response.data.next_step;
            currentSession.completed_steps.push(1);
            updateProgressBar(currentSession.current_step, currentSession.completed_steps);
            loadCurrentStep();
            window.scrollTo(0, 0);
        }
    } catch (error) {
        showError('Failed to save ODI response');
    }
}

// ========== VAS Questionnaire ==========
function renderVAS() {
    const container = document.getElementById('questionnaireContainer');
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Visual Analogue Scale (VAS)</h2>
        <p class="text-gray-600 mb-6">
            Please indicate the intensity of your pain using the scales below. 
            Use the slider to mark your pain level from 0 (No Pain) to 10 (Worst Pain Imaginable).
        </p>
        
        <form id="vasForm" class="space-y-8">
            ${generateVASSlider('neck_pain', 'Neck Pain')}
            ${generateVASSlider('right_arm', 'Right Arm')}
            ${generateVASSlider('left_arm', 'Left Arm')}
            ${generateVASSlider('back_pain', 'Back Pain')}
            ${generateVASSlider('right_leg', 'Right Leg')}
            ${generateVASSlider('left_leg', 'Left Leg')}
            
            <div class="pt-6 border-t">
                <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Save and Continue
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('vasForm').addEventListener('submit', submitVAS);
    
    // Initialize sliders
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const valueDisplay = e.target.nextElementSibling;
            valueDisplay.textContent = e.target.value;
        });
    });
}

function generateVASSlider(name, label) {
    return `
        <div class="border-l-4 border-blue-500 pl-4">
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-semibold text-gray-800">${label}</h3>
                <span class="text-2xl font-bold text-blue-600" id="${name}_value">5.0</span>
            </div>
            <div class="relative pt-2 pb-6">
                <input type="range" name="${name}" min="0" max="10" step="0.1" value="5" required
                    class="w-full h-3 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer">
                <div class="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0 - No Pain</span>
                    <span>10 - Worst Pain</span>
                </div>
            </div>
        </div>
    `;
}

async function submitVAS(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = parseFloat(value);
    }
    
    data.session_token = currentSession.session_token;
    
    try {
        const response = await axios.post('/api/questionnaires/vas', data);
        if (response.data.success) {
            currentSession.current_step = response.data.next_step;
            currentSession.completed_steps.push(2);
            updateProgressBar(currentSession.current_step, currentSession.completed_steps);
            loadCurrentStep();
            window.scrollTo(0, 0);
        }
    } catch (error) {
        showError('Failed to save VAS response');
    }
}

// ========== EQ-5D-3L Questionnaire ==========
function renderEQ5D() {
    const container = document.getElementById('questionnaireContainer');
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">EQ-5D-3L Health Questionnaire</h2>
        <p class="text-gray-600 mb-6">
            By placing a tick in one box in each group below, please indicate which statements 
            best describe your own health state today.
        </p>
        
        <form id="eq5dForm" class="space-y-8">
            ${generateEQ5DSection('mobility', 'Mobility', [
                'I have no problems in walking around',
                'I have some problems in walking around',
                'I am confined to bed'
            ])}
            
            ${generateEQ5DSection('personal_care', 'Personal Care', [
                'I have no problems with personal care',
                'I have some problems washing or dressing myself',
                'I am unable to wash or dress myself'
            ])}
            
            ${generateEQ5DSection('usual_activities', 'Usual Activities (e.g. work, study, housework, family or leisure activities)', [
                'I have no problems with performing my usual activities',
                'I have some problems with performing my usual activities',
                'I am unable to perform my usual activities'
            ])}
            
            ${generateEQ5DSection('pain_discomfort', 'Pain / Discomfort', [
                'I have no pain or discomfort',
                'I have moderate pain or discomfort',
                'I have extreme pain or discomfort'
            ])}
            
            ${generateEQ5DSection('anxiety_depression', 'Anxiety / Depression', [
                'I am not anxious or depressed',
                'I am moderately anxious or depressed',
                'I am extremely anxious or depressed'
            ])}
            
            <div class="border-l-4 border-blue-500 pl-4">
                <h3 class="font-semibold text-gray-800 mb-4">Your Health State Today</h3>
                <p class="text-sm text-gray-600 mb-4">
                    Please indicate on a scale of 0-100 how good or bad your health state is today.
                    0 means the worst health state you can imagine. 100 means the best health state you can imagine.
                </p>
                <div class="relative pt-2 pb-6">
                    <input type="range" name="health_scale" min="0" max="100" step="1" value="50" required
                        class="w-full h-3 bg-gradient-to-r from-red-500 via-yellow-400 to-green-400 rounded-lg appearance-none cursor-pointer">
                    <div class="text-center mt-2">
                        <span class="text-3xl font-bold text-blue-600" id="health_scale_value">50</span>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0 - Worst</span>
                        <span>100 - Best</span>
                    </div>
                </div>
            </div>
            
            <div class="pt-6 border-t">
                <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Save and Continue
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('eq5dForm').addEventListener('submit', submitEQ5D);
    
    // Initialize health scale slider
    const healthSlider = document.querySelector('input[name="health_scale"]');
    healthSlider.addEventListener('input', (e) => {
        document.getElementById('health_scale_value').textContent = e.target.value;
    });
}

function generateEQ5DSection(name, title, options) {
    return `
        <div class="border-l-4 border-blue-500 pl-4">
            <h3 class="font-semibold text-gray-800 mb-3">${title}</h3>
            <div class="space-y-2">
                ${options.map((option, index) => `
                    <label class="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input type="radio" name="${name}" value="${index}" required class="mt-1">
                        <span class="text-gray-700">${option}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

async function submitEQ5D(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = parseInt(value);
    }
    
    data.session_token = currentSession.session_token;
    
    try {
        const response = await axios.post('/api/questionnaires/eq5d', data);
        if (response.data.success) {
            currentSession.current_step = response.data.next_step;
            currentSession.completed_steps.push(3);
            updateProgressBar(currentSession.current_step, currentSession.completed_steps);
            loadCurrentStep();
            window.scrollTo(0, 0);
        }
    } catch (error) {
        showError('Failed to save EQ-5D response');
    }
}

// ========== Surgical Consent ==========
function renderSurgicalConsent() {
    const container = document.getElementById('questionnaireContainer');
    
    const consentItems = [
        {
            id: 'item1',
            text: 'I am fully aware of the condition of my spine, the surgery or procedure offered and I hereby authorize Prof Aaron Buckland with any other surgeon and/or such assistants as may be selected and supervised by him, to perform the following procedure under general anaesthesia'
        },
        {
            id: 'item2',
            text: 'If indicated I consent to performance of a spinal fusion utilizing internal fixation devices or implants. The purpose of the implant(s) may include immobilization of the spine during fusion healing, correcting spinal alignment when necessary and/or stabilizing structural bone graft or other implants.'
        },
        {
            id: 'item2a',
            text: 'I give consent for the use of bone morphogenetic protein (Infuse; rhBMP-2), stem cells, or other supplements to aid bone healing to be used for my surgery. These bone graft substitutes including rhBMP-2 may be used in an off-label manner and I give permission to this off label use during my surgery.'
        },
        {
            id: 'item3',
            text: 'Prof Aaron Buckland has discussed with me and I fully understand the nature and purpose of the proposed procedure(s), and the risks of the procedure(s) including but not limited to: Death, Blindness or loss of vision, Infection, Haematoma, Dural leaks, Pneumonia or respiratory failure, Phlebitis, Loss of bladder or bowel control, Stroke, Myocardial infarction, Arachnoiditis, Non-union of bone, Adjacent segment degeneration or fracture, Failure of internal fixation device(s), Blood vessel injury, bleeding, or anaemia, Major organ failure, Paralysis or paresis, Embolism, Numbness or loss of sensation, Failure of relief of pain, numbness, or weakness, Worsening pain, numbness, or weakness, Disability, Retrograde ejaculation, Vocal or swallowing dysfunction.'
        },
        {
            id: 'item3_male',
            text: 'For Male Patients Only: I understand there is a small incidence (less than 5%) of retrograde ejaculation and/or impotence in male patients undergoing Anterior Spinal Surgery. I accept the possibility that these or other risks may occur.'
        },
        {
            id: 'item4',
            text: 'All feasible alternative treatments have been discussed (including the risks, consequences and probable effectiveness of each), including but not limited to: Doing nothing, Non-operative treatment with medications and/or exercise and/or injections, Decompression surgery alone, Decompression surgery with fusion and an internal fixation device(s), Posterior fusion alone with or without internal fixation device(s), Anterior Surgery, Combined posterior and anterior fusion with or without internal fixation device(s).'
        },
        {
            id: 'item5',
            text: 'I understand that any metallic instrumentation is only considered as a temporary means of stabilizing my spine. I understand that if my spine does not fuse, my metallic implant may loosen, a screw may break, or the system may fail. I also understand that the metallic implant is only as strong as the bone it is inserted into and could fail early if the bone is not strong (osteoporosis).'
        },
        {
            id: 'item6',
            text: 'I understand that I may require blood transfusions during or after my spine surgery. My questions/concerns about blood donation/transfusion have been answered to my satisfaction and I consent to receiving a blood transfusion.'
        },
        {
            id: 'item7',
            text: 'I have had sufficient opportunity to discuss my condition and treatment with Prof Buckland and his associates, and all of my questions have been answered to my satisfaction. I believe that I have adequate knowledge upon which to base an informed consent to the proposed treatment.'
        },
        {
            id: 'item8',
            text: 'I consent to the performance of operations and procedures in addition to or different from those now planned, as deemed medically necessary by Prof Buckland or his associates during the course of the presently authorized procedure because of unforeseen conditions.'
        },
        {
            id: 'item9',
            text: 'I impose no specific limitations or prohibitions regarding treatment other than those stated: (none unless specified)'
        },
        {
            id: 'item10',
            text: 'I have been advised that in some cases there may be visitors attending my surgery for educational purposes and therefore, I consent to visiting surgeons or allied health professionals, television or photography for the purpose of scientific presentation, medical publications and similar purposes. I consent to the use of evoked potential neurologic monitoring (spinal monitoring) during my surgery(s) or procedure(s).'
        },
        {
            id: 'item11',
            text: 'I give my consent to the use of my de-identified health information for use in clinical research, quality improvement programs and surgical audit.'
        }
    ];
    
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Patient Consent to Spinal Surgery</h2>
        <p class="text-gray-600 mb-6">
            Please read each item carefully and provide your initials in the box next to each statement 
            to indicate your understanding and consent.
        </p>
        
        <form id="consentForm" class="space-y-6">
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Procedure Name *</label>
                <input type="text" name="procedure_name" required
                    placeholder="Enter the name of the procedure"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            ${consentItems.map((item, index) => `
                <div class="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded">
                    <div class="flex items-start gap-4">
                        <div class="flex-1">
                            <p class="text-sm font-semibold text-gray-700 mb-2">Item ${index + 1}</p>
                            <p class="text-gray-700 text-sm leading-relaxed">${item.text}</p>
                        </div>
                        <div class="flex-shrink-0">
                            <input type="text" name="${item.id}" maxlength="10" required
                                placeholder="Initials"
                                class="w-24 px-3 py-2 border-2 border-blue-300 rounded-lg text-center font-semibold uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                </div>
            `).join('')}
            
            <div class="border-t pt-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Patient Signature *</label>
                        <input type="text" name="patient_signature" required
                            placeholder="Type your full name"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Witness Signature</label>
                        <input type="text" name="witness_signature"
                            placeholder="Witness name (optional)"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                </div>
            </div>
            
            <div class="pt-6 border-t">
                <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Save and Continue
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('consentForm').addEventListener('submit', submitConsent);
    
    // Convert initials to uppercase
    document.querySelectorAll('input[type="text"][maxlength="10"]').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    });
}

async function submitConsent(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const consentItems = {};
    let procedure_name = '';
    let patient_signature = '';
    let witness_signature = '';
    
    for (const [key, value] of formData.entries()) {
        if (key === 'procedure_name') {
            procedure_name = value;
        } else if (key === 'patient_signature') {
            patient_signature = value;
        } else if (key === 'witness_signature') {
            witness_signature = value;
        } else {
            consentItems[key] = value;
        }
    }
    
    const data = {
        session_token: currentSession.session_token,
        procedure_name,
        consent_items: consentItems,
        patient_signature,
        witness_signature,
        signed_at: new Date().toISOString()
    };
    
    try {
        const response = await axios.post('/api/questionnaires/consent', data);
        if (response.data.success) {
            currentSession.current_step = response.data.next_step;
            currentSession.completed_steps.push(4);
            updateProgressBar(currentSession.current_step, currentSession.completed_steps);
            loadCurrentStep();
            window.scrollTo(0, 0);
        }
    } catch (error) {
        showError('Failed to save consent form');
    }
}

// ========== IFC (Informed Financial Consent) ==========
function renderIFC() {
    const container = document.getElementById('questionnaireContainer');
    
    // In a real implementation, this would be pre-filled by staff
    // For now, we'll allow the patient to see and confirm the details
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Informed Financial Consent</h2>
        <p class="text-gray-600 mb-6">
            Please review the estimated costs for your procedure and provide your signature to acknowledge your understanding.
        </p>
        
        <form id="ifcForm" class="space-y-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 class="font-semibold text-gray-800 mb-4">Estimate of Costs</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Quote Number</label>
                        <input type="text" name="quote_number" value="QTE${Date.now()}" readonly
                            class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input type="text" value="${new Date().toLocaleDateString()}" readonly
                            class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                    </div>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Item Number *</label>
                    <input type="text" name="item_number" required placeholder="e.g., 51011"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Procedure Description *</label>
                    <textarea name="description" required rows="2" 
                        placeholder="Enter procedure description"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fee (AUD) *</label>
                        <input type="number" name="fee" required step="0.01" min="0"
                            placeholder="0.00"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Rebate (AUD) *</label>
                        <input type="number" name="rebate" required step="0.01" min="0"
                            placeholder="0.00"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Patient Gap (AUD)</label>
                        <input type="number" name="gap" readonly
                            class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 class="font-semibold text-gray-800 mb-4">Important Information</h4>
                
                <div class="space-y-4 text-sm text-gray-700">
                    <div>
                        <p class="font-medium mb-2">Surgeon's Fee</p>
                        <p>The fees charged by this practice for surgical procedures reflect the costs associated with running a medical practice. 
                        Most health funds do not fully reimburse this fee. This fee also includes your review consultations for the first 3 months post-op.</p>
                    </div>
                    
                    <div>
                        <p class="font-medium mb-2">Surgical Assistant & Anaesthetist Fees</p>
                        <p>Most surgical procedures require the presence of an anaesthetist and surgical assistant. 
                        The quoted fee does not include their charges. These additional fees will be invoiced separately by the respective medical practitioners.</p>
                    </div>
                    
                    <div>
                        <p class="font-medium mb-2">Hospital & Additional Costs</p>
                        <p>We strongly recommend that you contact your health fund and provide the item numbers listed above to confirm your level of coverage for the procedure.</p>
                    </div>
                    
                    <div>
                        <p class="font-medium mb-2">Payment</p>
                        <p>You will need to pay the full amount highlighted above before your procedure. 
                        This fee is payable no later than 7 days before your procedure.</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <h4 class="font-semibold text-gray-800 mb-4">Consent & Acknowledgment</h4>
                <div class="space-y-3 text-sm text-gray-700 mb-4">
                    <label class="flex items-start space-x-3">
                        <input type="checkbox" required class="mt-1">
                        <span>I acknowledge that the surgical fee quotation provided is an estimate only.</span>
                    </label>
                    <label class="flex items-start space-x-3">
                        <input type="checkbox" required class="mt-1">
                        <span>I am responsible for all costs associated with my surgery, including any out-of-pocket expenses.</span>
                    </label>
                    <label class="flex items-start space-x-3">
                        <input type="checkbox" required class="mt-1">
                        <span>My health fund coverage should be confirmed directly with my insurer, and I am responsible for paying any outstanding amounts.</span>
                    </label>
                    <label class="flex items-start space-x-3">
                        <input type="checkbox" required class="mt-1">
                        <span>Additional health professionals, including an anaesthetist and surgical assistant, may be involved in my care, and their fees are not included in this estimate.</span>
                    </label>
                    <label class="flex items-start space-x-3">
                        <input type="checkbox" required class="mt-1">
                        <span>This fee is payable no later than 7 days before my procedure.</span>
                    </label>
                </div>
                
                <div class="mt-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Patient Signature *</label>
                    <input type="text" name="patient_signature" required
                        placeholder="Type your full name to sign"
                        class="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>
            
            <div class="pt-6 border-t">
                <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    Complete All Questionnaires
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('ifcForm').addEventListener('submit', submitIFC);
    
    // Auto-calculate gap
    const feeInput = document.querySelector('input[name="fee"]');
    const rebateInput = document.querySelector('input[name="rebate"]');
    const gapInput = document.querySelector('input[name="gap"]');
    
    function calculateGap() {
        const fee = parseFloat(feeInput.value) || 0;
        const rebate = parseFloat(rebateInput.value) || 0;
        gapInput.value = (fee - rebate).toFixed(2);
    }
    
    feeInput.addEventListener('input', calculateGap);
    rebateInput.addEventListener('input', calculateGap);
}

async function submitIFC(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
        session_token: currentSession.session_token,
        quote_number: formData.get('quote_number'),
        item_number: formData.get('item_number'),
        description: formData.get('description'),
        fee: parseFloat(formData.get('fee')),
        rebate: parseFloat(formData.get('rebate')),
        gap: parseFloat(formData.get('gap')),
        patient_signature: formData.get('patient_signature'),
        signed_at: new Date().toISOString()
    };
    
    try {
        const response = await axios.post('/api/questionnaires/ifc', data);
        if (response.data.success && response.data.completed) {
            window.location.href = '/complete';
        }
    } catch (error) {
        showError('Failed to save IFC response');
    }
}

// Error handling
function showError(message) {
    const container = document.getElementById('questionnaireContainer');
    container.innerHTML = `
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p class="font-bold">Error</p>
            <p>${message}</p>
        </div>
    `;
}
