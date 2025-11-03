// Admin Dashboard JavaScript

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await axios.get('/api/admin/stats');
        const stats = response.data;
        
        document.getElementById('totalPatients').textContent = stats.total_patients;
        document.getElementById('completedSessions').textContent = stats.completed_sessions;
        document.getElementById('inProgressSessions').textContent = stats.in_progress_sessions;
        document.getElementById('todayPatients').textContent = stats.today_patients;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load recent patients for dashboard
async function loadRecentPatients() {
    try {
        const response = await axios.get('/api/admin/patients');
        const patients = response.data.slice(0, 5); // Get only first 5
        
        const tbody = document.getElementById('recentPatientsTable');
        
        if (patients.length === 0) {
            tbody.innerHTML = '<p class="text-center text-gray-500 py-4">No patients yet</p>';
            return;
        }
        
        tbody.innerHTML = `
            <table class="w-full">
                <thead class="border-b border-gray-200">
                    <tr>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hospital</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${patients.map(patient => `
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                            <td class="px-4 py-3 text-sm font-medium text-gray-900">${patient.name}</td>
                            <td class="px-4 py-3 text-sm text-gray-600">${patient.hospital || '-'}</td>
                            <td class="px-4 py-3 text-sm">
                                ${getStatusBadge(patient.status)}
                            </td>
                            <td class="px-4 py-3 text-sm">
                                ${getProgressBar(patient.completed_steps)}
                            </td>
                            <td class="px-4 py-3 text-sm">
                                <a href="/admin/patients/${patient.id}" class="text-mog-gold hover:text-mog-light-gold">
                                    View Details
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load recent patients:', error);
        document.getElementById('recentPatientsTable').innerHTML = 
            '<p class="text-center text-red-500 py-4">Failed to load patients</p>';
    }
}

// Load patients list page
async function loadPatientsPage() {
    try {
        const response = await axios.get('/api/admin/patients');
        let patients = response.data;
        
        const tbody = document.getElementById('patientsTableBody');
        
        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-4 block"></i>
                        <p>No patients yet</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Setup search
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        
        function filterAndRender() {
            const searchTerm = searchInput.value.toLowerCase();
            const statusValue = statusFilter.value;
            
            let filtered = patients;
            
            if (searchTerm) {
                filtered = filtered.filter(p => 
                    p.name.toLowerCase().includes(searchTerm) ||
                    (p.email && p.email.toLowerCase().includes(searchTerm)) ||
                    (p.hospital && p.hospital.toLowerCase().includes(searchTerm))
                );
            }
            
            if (statusValue) {
                filtered = filtered.filter(p => p.status === statusValue);
            }
            
            renderPatientsTable(filtered);
        }
        
        searchInput.addEventListener('input', filterAndRender);
        statusFilter.addEventListener('change', filterAndRender);
        
        renderPatientsTable(patients);
    } catch (error) {
        console.error('Failed to load patients:', error);
        document.getElementById('patientsTableBody').innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center text-red-500">
                    Failed to load patients
                </td>
            </tr>
        `;
    }
}

function renderPatientsTable(patients) {
    const tbody = document.getElementById('patientsTableBody');
    
    if (patients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                    No patients match your search
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = patients.map(patient => `
        <tr class="fade-in">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">${patient.name}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${formatDate(patient.date_of_birth)}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${patient.hospital || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${patient.email || '-'}</td>
            <td class="px-6 py-4 text-sm">${getStatusBadge(patient.status)}</td>
            <td class="px-6 py-4 text-sm">${getProgressBar(patient.completed_steps)}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${formatDateTime(patient.created_at)}</td>
            <td class="px-6 py-4 text-sm">
                <div class="flex gap-2">
                    <a href="/admin/patients/${patient.id}" 
                        class="text-mog-gold hover:text-mog-light-gold" title="View Details">
                        <i class="fas fa-eye"></i>
                    </a>
                    ${patient.status === 'in_progress' ? `
                        <a href="/questionnaire/${patient.session_token}" target="_blank"
                            class="text-blue-600 hover:text-blue-800" title="Continue Questionnaire">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Load patient detail page
async function loadPatientDetail(patientId) {
    try {
        const response = await axios.get(`/api/admin/patients/${patientId}`);
        const data = response.data;
        const patient = data.patient;
        
        const container = document.getElementById('patientDetailContainer');
        
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Patient Info Card -->
                <div class="card">
                    <div class="card-header flex justify-between items-center">
                        <h2 class="text-xl">Patient Information</h2>
                        ${patient.status === 'completed' ? 
                            '<span class="badge badge-success"><i class="fas fa-check-circle mr-1"></i>Completed</span>' :
                            '<span class="badge badge-pending"><i class="fas fa-clock mr-1"></i>In Progress</span>'
                        }
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="text-sm font-semibold text-mog-dark-gray">Full Name</label>
                                <p class="text-lg text-gray-900 mt-1">${patient.name}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-mog-dark-gray">Date of Birth</label>
                                <p class="text-lg text-gray-900 mt-1">${formatDate(patient.date_of_birth)}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-mog-dark-gray">Hospital</label>
                                <p class="text-lg text-gray-900 mt-1">${patient.hospital || '-'}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-mog-dark-gray">Email</label>
                                <p class="text-lg text-gray-900 mt-1">${patient.email || '-'}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-mog-dark-gray">Phone</label>
                                <p class="text-lg text-gray-900 mt-1">${patient.phone || '-'}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-mog-dark-gray">Session Created</label>
                                <p class="text-lg text-gray-900 mt-1">${formatDateTime(patient.session_created_at)}</p>
                            </div>
                        </div>
                        
                        <div class="mt-6">
                            <label class="text-sm font-semibold text-mog-dark-gray mb-2 block">Questionnaire Progress</label>
                            ${getProgressBar(patient.completed_steps, true)}
                        </div>
                        
                        ${patient.status === 'in_progress' ? `
                            <div class="mt-6 flex gap-4">
                                <a href="/questionnaire/${patient.session_token}" target="_blank" 
                                    class="btn-mog-secondary">
                                    <i class="fas fa-external-link-alt mr-2"></i>Continue Questionnaire
                                </a>
                                <button onclick="showIFCModal('${patient.session_token}')" class="btn-mog-primary">
                                    <i class="fas fa-dollar-sign mr-2"></i>Pre-fill IFC Data
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${renderQuestionnaireCard('ODI (Oswestry Disability Index)', data.odi, renderODIData)}
                ${renderQuestionnaireCard('VAS (Visual Analogue Scale)', data.vas, renderVASData)}
                ${renderQuestionnaireCard('EQ-5D-3L Health Questionnaire', data.eq5d, renderEQ5DData)}
                ${renderQuestionnaireCard('Surgical Consent', data.consent, renderConsentData)}
                ${renderQuestionnaireCard('IFC (Informed Financial Consent)', data.ifc, renderIFCData)}
            </div>
            
            <!-- IFC Modal -->
            <div id="ifcModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                    <div class="card-header flex justify-between items-center">
                        <h3>Pre-fill IFC Financial Data</h3>
                        <button onclick="closeIFCModal()" class="text-white hover:text-gray-200">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <form id="ifcForm" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Quote Number *</label>
                                    <input type="text" name="quote_number" required value="QTE${Date.now()}"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Item Number *</label>
                                    <input type="text" name="item_number" required placeholder="e.g., 51011"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Procedure Description *</label>
                                <textarea name="description" required rows="2" placeholder="Enter procedure description"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                            </div>
                            
                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Fee (AUD) *</label>
                                    <input type="number" name="fee" required step="0.01" min="0" placeholder="0.00"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Rebate (AUD) *</label>
                                    <input type="number" name="rebate" required step="0.01" min="0" placeholder="0.00"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Gap (AUD)</label>
                                    <input type="number" name="gap" readonly
                                        class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                                </div>
                            </div>
                            
                            <div class="flex gap-4 pt-4">
                                <button type="submit" class="btn-mog-primary flex-1">
                                    <i class="fas fa-save mr-2"></i>Save IFC Data
                                </button>
                                <button type="button" onclick="closeIFCModal()" class="btn-mog-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Setup IFC form auto-calculation
        const ifcForm = document.getElementById('ifcForm');
        if (ifcForm) {
            const feeInput = ifcForm.querySelector('input[name="fee"]');
            const rebateInput = ifcForm.querySelector('input[name="rebate"]');
            const gapInput = ifcForm.querySelector('input[name="gap"]');
            
            function calculateGap() {
                const fee = parseFloat(feeInput.value) || 0;
                const rebate = parseFloat(rebateInput.value) || 0;
                gapInput.value = (fee - rebate).toFixed(2);
            }
            
            feeInput.addEventListener('input', calculateGap);
            rebateInput.addEventListener('input', calculateGap);
            
            ifcForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await saveIFCData(patient.session_token, new FormData(ifcForm));
            });
        }
        
        // If IFC data exists, pre-fill the form
        if (data.ifc) {
            setTimeout(() => {
                const form = document.getElementById('ifcForm');
                if (form) {
                    form.querySelector('input[name="quote_number"]').value = data.ifc.quote_number || '';
                    form.querySelector('input[name="item_number"]').value = data.ifc.item_number || '';
                    form.querySelector('textarea[name="description"]').value = data.ifc.description || '';
                    form.querySelector('input[name="fee"]').value = data.ifc.fee || '';
                    form.querySelector('input[name="rebate"]').value = data.ifc.rebate || '';
                    form.querySelector('input[name="gap"]').value = data.ifc.gap || '';
                }
            }, 100);
        }
    } catch (error) {
        console.error('Failed to load patient details:', error);
        document.getElementById('patientDetailContainer').innerHTML = `
            <div class="card">
                <div class="card-body text-center text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>Failed to load patient details</p>
                </div>
            </div>
        `;
    }
}

// Helper function to render questionnaire cards
function renderQuestionnaireCard(title, data, renderFunc) {
    if (!data) {
        return `
            <div class="card opacity-60">
                <div class="card-header">${title}</div>
                <div class="card-body text-center text-gray-500 py-8">
                    <i class="fas fa-file-alt text-3xl mb-2"></i>
                    <p>Not completed yet</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="card">
            <div class="card-header flex justify-between items-center">
                <span>${title}</span>
                <span class="badge badge-success">
                    <i class="fas fa-check mr-1"></i>Completed
                </span>
            </div>
            <div class="card-body">
                ${renderFunc(data)}
            </div>
        </div>
    `;
}

// Render ODI data
function renderODIData(odi) {
    const sections = [
        { key: 'pain_intensity', label: 'Pain Intensity' },
        { key: 'personal_care', label: 'Personal Care' },
        { key: 'lifting', label: 'Lifting' },
        { key: 'walking', label: 'Walking' },
        { key: 'sitting', label: 'Sitting' },
        { key: 'standing', label: 'Standing' },
        { key: 'sleeping', label: 'Sleeping' },
        { key: 'sex_life', label: 'Sex Life' },
        { key: 'social_life', label: 'Social Life' },
        { key: 'travelling', label: 'Travelling' }
    ];
    
    return `
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            ${sections.map(section => `
                <div>
                    <label class="text-sm font-semibold text-mog-dark-gray">${section.label}</label>
                    <p class="text-lg text-gray-900">${odi[section.key]} / 5</p>
                </div>
            `).join('')}
        </div>
        <div class="pt-4 border-t">
            <label class="text-sm font-semibold text-mog-dark-gray">Total Score</label>
            <p class="text-2xl font-bold text-mog-maroon">${odi.total_score} / 50</p>
        </div>
    `;
}

// Render VAS data
function renderVASData(vas) {
    const areas = [
        { key: 'neck_pain', label: 'Neck Pain' },
        { key: 'right_arm', label: 'Right Arm' },
        { key: 'left_arm', label: 'Left Arm' },
        { key: 'back_pain', label: 'Back Pain' },
        { key: 'right_leg', label: 'Right Leg' },
        { key: 'left_leg', label: 'Left Leg' }
    ];
    
    return `
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            ${areas.map(area => `
                <div>
                    <label class="text-sm font-semibold text-mog-dark-gray">${area.label}</label>
                    <p class="text-2xl font-bold text-mog-maroon">${vas[area.key].toFixed(1)} / 10</p>
                    <div class="w-full h-2 bg-gray-200 rounded-full mt-2">
                        <div class="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500" 
                            style="width: ${(vas[area.key] / 10 * 100)}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render EQ5D data
function renderEQ5DData(eq5d) {
    const dimensions = [
        { key: 'mobility', label: 'Mobility', options: ['No problems', 'Some problems', 'Confined to bed'] },
        { key: 'personal_care', label: 'Personal Care', options: ['No problems', 'Some problems', 'Unable'] },
        { key: 'usual_activities', label: 'Usual Activities', options: ['No problems', 'Some problems', 'Unable'] },
        { key: 'pain_discomfort', label: 'Pain/Discomfort', options: ['None', 'Moderate', 'Extreme'] },
        { key: 'anxiety_depression', label: 'Anxiety/Depression', options: ['None', 'Moderate', 'Extreme'] }
    ];
    
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            ${dimensions.map(dim => `
                <div>
                    <label class="text-sm font-semibold text-mog-dark-gray">${dim.label}</label>
                    <p class="text-lg text-gray-900">${dim.options[eq5d[dim.key]]}</p>
                </div>
            `).join('')}
        </div>
        <div class="pt-4 border-t">
            <label class="text-sm font-semibold text-mog-dark-gray">Health Scale</label>
            <p class="text-2xl font-bold text-mog-maroon">${eq5d.health_scale} / 100</p>
            <div class="w-full h-3 bg-gray-200 rounded-full mt-2">
                <div class="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-400" 
                    style="width: ${eq5d.health_scale}%"></div>
            </div>
        </div>
    `;
}

// Render Consent data
function renderConsentData(consent) {
    const items = consent.consent_items;
    
    return `
        <div class="mb-6">
            <label class="text-sm font-semibold text-mog-dark-gray">Procedure Name</label>
            <p class="text-lg text-gray-900">${consent.procedure_name}</p>
        </div>
        
        <div class="mb-6">
            <label class="text-sm font-semibold text-mog-dark-gray mb-3 block">Consent Items (${Object.keys(items).length} items initialed)</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                ${Object.entries(items).map(([key, value]) => `
                    <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <i class="fas fa-check-circle text-green-500"></i>
                        <span class="text-sm">${key}: <strong>${value}</strong></span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="text-sm font-semibold text-mog-dark-gray">Patient Signature</label>
                <p class="text-lg text-gray-900">${consent.patient_signature}</p>
            </div>
            ${consent.witness_signature ? `
                <div>
                    <label class="text-sm font-semibold text-mog-dark-gray">Witness Signature</label>
                    <p class="text-lg text-gray-900">${consent.witness_signature}</p>
                </div>
            ` : ''}
            <div>
                <label class="text-sm font-semibold text-mog-dark-gray">Signed At</label>
                <p class="text-lg text-gray-900">${formatDateTime(consent.signed_at)}</p>
            </div>
        </div>
    `;
}

// Render IFC data
function renderIFCData(ifc) {
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label class="text-sm font-semibold text-mog-dark-gray">Quote Number</label>
                <p class="text-lg text-gray-900">${ifc.quote_number}</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-mog-dark-gray">Item Number</label>
                <p class="text-lg text-gray-900">${ifc.item_number}</p>
            </div>
            <div class="md:col-span-2">
                <label class="text-sm font-semibold text-mog-dark-gray">Description</label>
                <p class="text-lg text-gray-900">${ifc.description}</p>
            </div>
        </div>
        
        <div class="bg-mog-gray p-6 rounded-lg mb-6">
            <div class="grid grid-cols-3 gap-6">
                <div>
                    <label class="text-sm font-semibold text-mog-dark-gray">Fee</label>
                    <p class="text-2xl font-bold text-mog-maroon">$${ifc.fee.toFixed(2)}</p>
                </div>
                <div>
                    <label class="text-sm font-semibold text-mog-dark-gray">Rebate</label>
                    <p class="text-2xl font-bold text-green-600">$${ifc.rebate.toFixed(2)}</p>
                </div>
                <div>
                    <label class="text-sm font-semibold text-mog-dark-gray">Patient Gap</label>
                    <p class="text-2xl font-bold text-mog-gold">$${ifc.gap.toFixed(2)}</p>
                </div>
            </div>
        </div>
        
        ${ifc.patient_signature ? `
            <div class="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="text-sm font-semibold text-mog-dark-gray">Patient Signature</label>
                    <p class="text-lg text-gray-900">${ifc.patient_signature}</p>
                </div>
                <div>
                    <label class="text-sm font-semibold text-mog-dark-gray">Signed At</label>
                    <p class="text-lg text-gray-900">${formatDateTime(ifc.signed_at)}</p>
                </div>
            </div>
        ` : '<p class="text-center text-gray-500 py-4">Awaiting patient signature</p>'}
    `;
}

// IFC Modal functions
let currentSessionToken = null;

function showIFCModal(sessionToken) {
    currentSessionToken = sessionToken;
    document.getElementById('ifcModal').classList.remove('hidden');
}

function closeIFCModal() {
    document.getElementById('ifcModal').classList.add('hidden');
    currentSessionToken = null;
}

async function saveIFCData(sessionToken, formData) {
    try {
        const data = {
            quote_number: formData.get('quote_number'),
            item_number: formData.get('item_number'),
            description: formData.get('description'),
            fee: parseFloat(formData.get('fee')),
            rebate: parseFloat(formData.get('rebate')),
            gap: parseFloat(formData.get('gap'))
        };
        
        const response = await axios.put(`/api/admin/ifc/${sessionToken}`, data);
        
        if (response.data.success) {
            alert('IFC data saved successfully!');
            closeIFCModal();
            // Reload the page to show updated data
            window.location.reload();
        }
    } catch (error) {
        console.error('Failed to save IFC data:', error);
        alert('Failed to save IFC data. Please try again.');
    }
}

// Helper functions
function getStatusBadge(status) {
    if (status === 'completed') {
        return '<span class="badge badge-success">Completed</span>';
    } else if (status === 'in_progress') {
        return '<span class="badge badge-pending">In Progress</span>';
    } else {
        return '<span class="badge badge-warning">Unknown</span>';
    }
}

function getProgressBar(completedSteps, detailed = false) {
    const steps = JSON.parse(completedSteps || '[]');
    const progress = (steps.length / 5) * 100;
    
    if (detailed) {
        const stepNames = ['ODI', 'VAS', 'EQ-5D-3L', 'Consent', 'IFC'];
        return `
            <div class="flex items-center gap-2 mb-2">
                ${stepNames.map((name, i) => `
                    <div class="flex-1 text-center">
                        <div class="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-bold
                            ${steps.includes(i + 1) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}">
                            ${steps.includes(i + 1) ? '<i class="fas fa-check"></i>' : (i + 1)}
                        </div>
                        <p class="text-xs mt-1 text-gray-600">${name}</p>
                    </div>
                `).join('')}
            </div>
            <div class="w-full h-2 bg-gray-200 rounded-full">
                <div class="h-full rounded-full bg-mog-maroon transition-all duration-300" style="width: ${progress}%"></div>
            </div>
            <p class="text-sm text-gray-600 mt-2">${steps.length} of 5 questionnaires completed</p>
        `;
    }
    
    return `
        <div class="w-full h-2 bg-gray-200 rounded-full">
            <div class="h-full rounded-full bg-mog-maroon" style="width: ${progress}%"></div>
        </div>
        <span class="text-xs text-gray-600 mt-1 inline-block">${steps.length}/5</span>
    `;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-AU', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize dashboard if on admin home page
if (window.location.pathname === '/admin') {
    window.addEventListener('DOMContentLoaded', () => {
        loadDashboardStats();
        loadRecentPatients();
    });
}
