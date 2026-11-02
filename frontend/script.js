/**
 * VisionAries - AI Diabetic Retinopathy Diagnostic Suite
 * Frontend Controller: Clinician Authentication, Patient Telemetry, AI Grading & Multi-Format Reporting
 */

// API Base URL (Auto-detects whether running on Flask port 5000, static dev server 5500, or deployed cloud domain)
const isLocalStaticDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
                          window.location.port && 
                          window.location.port !== '5000';

const API_BASE_URL = isLocalStaticDev 
    ? `${window.location.protocol}//${window.location.hostname}:5000/api` 
    : '/api';

const SAMPLES_BASE_URL = isLocalStaticDev 
    ? `${window.location.protocol}//${window.location.hostname}:5000/samples` 
    : '/samples';

// Predefined Clinicians
const PRESET_CLINICIANS = [
    {
        id: "DOC-77402",
        name: "Dr. Arthur Vance, MD",
        specialty: "Vitreoretinal Specialist & Surgeon",
        license: "MED-RET-77402",
        facility: "VisionAries Eye & Retinal Diagnostic Center",
        email: "a.vance@visionaries-retina.org",
        avatar: "👨‍⚕️"
    },
    {
        id: "DOC-49210",
        name: "Dr. Evelyn Reed, MD, PhD",
        specialty: "Consultant Medical Ophthalmologist",
        license: "MED-OPH-49210",
        facility: "Metropolitan Diabetic Eye Institute",
        email: "e.reed@visionaries-retina.org",
        avatar: "👩‍⚕️"
    },
    {
        id: "DOC-29104",
        name: "Dr. Marcus Chen, OD",
        specialty: "Senior Optometric Physician",
        license: "OPT-29104",
        facility: "VisionAries Community Retinal Screening Unit",
        email: "m.chen@visionaries-retina.org",
        avatar: "👨‍⚕️"
    }
];

// Severity Level Color Mapping (White & Gold High-Contrast Palette)
const SEVERITY_COLORS = {
    0: '#15803d', // No DR - Deep Emerald
    1: '#1d4ed8', // Mild - Royal Navy
    2: '#b45309', // Moderate - Amber Gold
    3: '#c2410c', // Severe - Deep Sienna
    4: '#b91c1c'  // Proliferative DR - Crimson
};

const SEVERITY_NAMES = {
    0: 'No DR (Grade 0)',
    1: 'Mild NPDR (Grade 1)',
    2: 'Moderate NPDR (Grade 2)',
    3: 'Severe NPDR (Grade 3)',
    4: 'Proliferative DR (Grade 4)'
};

// Application State
let activeClinician = PRESET_CLINICIANS[0];
let selectedFile = null;
let currentScreeningResult = null;
let allArchivedScreenings = [];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    loadSavedClinician();
    renderQuickCliniciansList();
    generateNewMRN();
    initializeEventListeners();
    fetchArchivedScreenings();
    checkBackendHealth();
});

/* ==========================================================================
   Clinician Authentication & Session Management
   ========================================================================== */
function loadSavedClinician() {
    try {
        const saved = localStorage.getItem('visionaries_active_clinician');
        if (saved) {
            activeClinician = JSON.parse(saved);
        }
    } catch (e) {
        activeClinician = PRESET_CLINICIANS[0];
    }
    updateClinicianUI();
}

function saveActiveClinician(clinician) {
    activeClinician = clinician;
    localStorage.setItem('visionaries_active_clinician', JSON.stringify(clinician));
    updateClinicianUI();
    showToast(`Authenticated as ${clinician.name}`, 'success');
}

function updateClinicianUI() {
    // Navbar
    const navName = document.getElementById('navClinicianName');
    const navAvatar = document.getElementById('navClinicianAvatar');
    if (navName) navName.textContent = activeClinician.name;
    if (navAvatar) navAvatar.textContent = activeClinician.avatar || '🩺';

    // Banner on Screening Intake
    const bName = document.getElementById('bannerDoctorName');
    const bMeta = document.getElementById('bannerDoctorMeta');
    const bAvatar = document.getElementById('bannerDoctorAvatar');
    const subDoc = document.getElementById('submitDoctorName');

    if (bName) bName.textContent = activeClinician.name;
    if (bMeta) bMeta.innerHTML = `${activeClinician.specialty} &bull; License: <strong>${activeClinician.license}</strong> &bull; ${activeClinician.facility}`;
    if (bAvatar) bAvatar.textContent = activeClinician.avatar || '👨‍⚕️';
    if (subDoc) subDoc.textContent = activeClinician.name;
}

function renderQuickCliniciansList() {
    const container = document.getElementById('quickCliniciansGrid');
    if (!container) return;

    container.innerHTML = '';
    PRESET_CLINICIANS.forEach(c => {
        const isSelected = c.id === activeClinician.id;
        const card = document.createElement('div');
        card.className = `clinician-select-card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => {
            saveActiveClinician(c);
            closeLoginModal();
        };

        card.innerHTML = `
            <div class="card-left-info">
                <div class="clinician-badge-avatar">${c.avatar}</div>
                <div>
                    <div class="clinician-card-name">${c.name}</div>
                    <div class="clinician-card-role">${c.specialty} &bull; Lic: ${c.license}</div>
                    <div class="clinician-card-facility">${c.facility}</div>
                </div>
            </div>
            <button type="button" class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}">
                ${isSelected ? 'Active Doctor' : 'Select'}
            </button>
        `;
        container.appendChild(card);
    });
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        renderQuickCliniciansList();
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}

function switchLoginTab(tab) {
    const quickTab = document.getElementById('tabQuick');
    const customTab = document.getElementById('tabCustom');
    const quickBtn = document.getElementById('tabQuickBtn');
    const customBtn = document.getElementById('tabCustomBtn');

    if (tab === 'quick') {
        quickTab.style.display = 'block';
        customTab.style.display = 'none';
        quickBtn.classList.add('active');
        customBtn.classList.remove('active');
    } else {
        quickTab.style.display = 'none';
        customTab.style.display = 'block';
        customBtn.classList.add('active');
        quickBtn.classList.remove('active');
    }
}

function handleCustomDoctorLogin(e) {
    e.preventDefault();
    const name = document.getElementById('docFullName').value.trim();
    const specialty = document.getElementById('docSpecialty').value.trim();
    const license = document.getElementById('docLicense').value.trim();
    const facility = document.getElementById('docFacility').value.trim();
    const email = document.getElementById('docEmail').value.trim();

    const customDoctor = {
        id: `DOC-${Math.floor(10000 + Math.random() * 90000)}`,
        name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
        specialty: specialty || 'Ophthalmologist',
        license: license || `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
        facility: facility || 'VisionAries Retinal Diagnostic Network',
        email: email || 'doctor@visionaries-retina.org',
        avatar: '🩺'
    };

    saveActiveClinician(customDoctor);
    closeLoginModal();
}

/* ==========================================================================
   Patient Telemetry & Sample Data Helpers
   ========================================================================== */
function generateNewMRN() {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const mrnField = document.getElementById('patientId');
    if (mrnField) {
        mrnField.value = `VA-${year}-${rand}`;
    }
}

function fillDemoPatient() {
    document.getElementById('patientName').value = 'Eleanor J. Vance';
    document.getElementById('patientAge').value = '58';
    document.getElementById('patientGender').value = 'Female';
    document.getElementById('patientContact').value = '+1 (555) 782-9014';
    document.getElementById('patientEmail').value = 'e.vance@example.org';

    document.getElementById('diabetesType').value = 'Type 2 Diabetes';
    document.getElementById('diabetesDuration').value = '12';
    document.getElementById('hba1c').value = '7.9';
    document.getElementById('bloodPressure').value = '136/84 mmHg';
    document.getElementById('management').value = 'Oral Hypoglycemics (Metformin/SGLT2)';

    document.getElementById('eyeSide').value = 'Right Eye (OD - Oculus Dexter)';
    document.getElementById('visualAcuity').value = '20/30 (Corrected to 20/25)';
    document.getElementById('priorTreatment').value = 'None / Treatment Naive';
    document.getElementById('clinicalNotes').value = 'Annual diabetic eye evaluation. Reports mild intermittent blurriness when fatigued. Clear media.';

    showToast('Loaded demo patient clinical profile.', 'info');
}

/* ==========================================================================
   Retinal Image Upload & Quick Clinical Samples
   ========================================================================== */
function initializeEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const removeBtn = document.getElementById('removeBtn');

    // Click to upload
    uploadArea.addEventListener('click', (e) => {
        if (!selectedFile && e.target !== removeBtn && !removeBtn.contains(e.target)) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleSelectedFile(file);
    });

    // Drag and Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleSelectedFile(e.dataTransfer.files[0]);
        }
    });

    // Remove Image
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeSelectedFile();
    });

    // Smooth navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                scrollToSection(href.substring(1));
            }
        });
    });
}

function handleSelectedFile(file) {
    const validExtensions = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
        showToast('Please upload a valid retinal fundus image (PNG, JPG, or JPEG).', 'error');
        return;
    }

    if (file.size > 16 * 1024 * 1024) {
        showToast('File size exceeds the 16MB maximum limit.', 'error');
        return;
    }

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('previewFileName').textContent = file.name;
        document.getElementById('previewEyeTag').textContent = document.getElementById('eyeSide').value.split(' ')[0] + ' Retinal Scan';
        document.getElementById('uploadContent').style.display = 'none';
        document.getElementById('previewContainer').style.display = 'block';
        document.getElementById('analyzeBtn').disabled = false;
    };
    reader.readAsDataURL(file);
}

function removeSelectedFile() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('previewImage').src = '';
    document.getElementById('uploadContent').style.display = 'block';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('analyzeBtn').disabled = true;
}

// Quick Sample Image Selector
async function selectSampleImage(filename, gradeLabel, note) {
    try {
        let response = null;
        const candidateUrls = [
            `${SAMPLES_BASE_URL}/${filename}`,
            `/samples/${filename}`,
            `/public/samples/${filename}`,
            `/frontend/samples/${filename}`
        ];

        for (const url of candidateUrls) {
            try {
                const res = await fetch(url);
                if (res.ok) {
                    response = res;
                    break;
                }
            } catch (_) {}
        }

        if (!response || !response.ok) throw new Error('Sample image file unavailable');
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
        
        handleSelectedFile(file);
        showToast(`Loaded ${gradeLabel} sample: ${note}`, 'info');

        // If patient name is empty, auto-populate sample patient
        const pName = document.getElementById('patientName').value.trim();
        if (!pName) {
            fillDemoPatient();
        }
    } catch (err) {
        console.error('Error loading sample image:', err);
        showToast('Failed to load sample image. Please upload a file manually.', 'error');
    }
}

/* ==========================================================================
   Screening Execution & Analysis
   ========================================================================== */
async function handleScreeningSubmit(e) {
    e.preventDefault();
    if (!selectedFile) {
        showToast('Please upload or select a retinal fundus photograph first.', 'error');
        return;
    }

    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzeBtnText = document.getElementById('analyzeBtnText');
    const spinner = document.getElementById('spinner');

    // UI Loading State
    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = 'Analyzing Retinal Image with ResNet-152...';
    spinner.style.display = 'block';

    // Prepare Form Data with all patient and clinician details
    const formData = new FormData();
    formData.append('file', selectedFile);

    // Patient Demographics
    formData.append('patient_id', document.getElementById('patientId').value.trim());
    formData.append('patient_name', document.getElementById('patientName').value.trim());
    formData.append('age', document.getElementById('patientAge').value);
    formData.append('gender', document.getElementById('patientGender').value);
    formData.append('contact', document.getElementById('patientContact').value.trim());
    formData.append('email', document.getElementById('patientEmail').value.trim());

    // Diabetic History
    formData.append('diabetes_type', document.getElementById('diabetesType').value);
    formData.append('diabetes_duration', document.getElementById('diabetesDuration').value);
    formData.append('hba1c', document.getElementById('hba1c').value);
    formData.append('blood_pressure', document.getElementById('bloodPressure').value.trim());
    formData.append('management', document.getElementById('management').value);

    // Ophthalmic Parameters
    formData.append('eye_side', document.getElementById('eyeSide').value);
    formData.append('visual_acuity', document.getElementById('visualAcuity').value.trim());
    formData.append('prior_treatment', document.getElementById('priorTreatment').value);
    
    // Checked Symptoms
    const symptomsChecked = Array.from(document.querySelectorAll('input[name="symptom"]:checked')).map(cb => cb.value);
    formData.append('symptoms', symptomsChecked.join(', ') || 'Asymptomatic');
    formData.append('notes', document.getElementById('clinicalNotes').value.trim());

    // Attending Clinician Details
    formData.append('clinician_name', activeClinician.name);
    formData.append('clinician_id', activeClinician.id);
    formData.append('clinician_specialty', activeClinician.specialty);
    formData.append('clinician_facility', activeClinician.facility);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let errorMsg = 'Diagnostic evaluation failed.';
            try {
                const errData = await response.json();
                if (errData && errData.error) {
                    errorMsg = errData.error;
                }
            } catch (jsonErr) {
                if (response.status === 501 || response.status === 404) {
                    errorMsg = `API server unreachable on this port (HTTP ${response.status}). Please run 'python app.py' and open http://localhost:5000`;
                } else {
                    errorMsg = `Diagnostic evaluation failed (HTTP ${response.status}).`;
                }
            }
            throw new Error(errorMsg);
        }

        const result = await response.json();
        currentScreeningResult = result;

        displayClinicalReport(result);
        fetchArchivedScreenings(); // Refresh database table
        showToast('Clinical screening report generated & saved to database!', 'success');

        // Scroll into view
        setTimeout(() => {
            const resultsCard = document.getElementById('resultsContainer');
            resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);

    } catch (error) {
        console.error('Screening Error:', error);
        showToast(error.message || 'Error occurred during AI screening.', 'error');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtnText.textContent = 'Execute Clinical AI Screening';
        spinner.style.display = 'none';
    }
}

/* ==========================================================================
   Display Clinical Report & Diagnostic Scorecard
   ========================================================================== */
function displayClinicalReport(result) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.style.display = 'block';

    const p = result.patient || {};
    const info = result.info || {};
    const sevVal = result.severity_value;
    const sevColor = SEVERITY_COLORS[sevVal] || '#3b82f6';

    // Header Meta
    document.getElementById('repScreeningId').textContent = result.screening_id || 'SCR-2026-0001';
    document.getElementById('repDate').textContent = result.timestamp || new Date().toLocaleString();
    document.getElementById('repFacility').textContent = p.clinician_facility || activeClinician.facility;

    // Attending Clinician Stamp
    document.getElementById('repDoctorAvatar').textContent = activeClinician.avatar || '👨‍⚕️';
    document.getElementById('repDoctorName').textContent = p.clinician_name || activeClinician.name;
    document.getElementById('repDoctorSpecialty').textContent = p.clinician_specialty || activeClinician.specialty;
    document.getElementById('repDoctorLicense').textContent = p.clinician_id || activeClinician.license;
    document.getElementById('repDoctorFacility').textContent = p.clinician_facility || activeClinician.facility;
    document.getElementById('repSignatureScript').textContent = p.clinician_name || activeClinician.name;
    document.getElementById('repSigDate').textContent = result.timestamp || new Date().toLocaleDateString();

    // Patient Telemetry
    document.getElementById('repPatientName').textContent = p.patient_name || 'Anonymous';
    document.getElementById('repPatientId').textContent = p.patient_id || '-';
    document.getElementById('repPatientAgeSex').textContent = `${p.age || '-'} Yrs / ${p.gender || '-'}`;
    document.getElementById('repPatientContact').textContent = `${p.contact || 'N/A'} ${p.email ? `(${p.email})` : ''}`;
    document.getElementById('repDiabetesType').textContent = p.diabetes_type || 'Type 2 Diabetes';
    document.getElementById('repDiabetesDuration').textContent = `${p.diabetes_duration || 0} Years`;
    document.getElementById('repHbA1c').textContent = `${p.hba1c || 0}%`;
    document.getElementById('repBP').textContent = p.blood_pressure || 'Normal';
    document.getElementById('repEyeSide').textContent = p.eye_side || 'Right Eye (OD)';
    document.getElementById('repAcuity').textContent = p.visual_acuity || '20/20';
    document.getElementById('repPriorTreatment').textContent = p.prior_treatment || 'None';
    document.getElementById('repSymptoms').textContent = p.symptoms || 'Asymptomatic';

    // Retinal Fundus Image
    if (result.image_data) {
        document.getElementById('repFundusImage').src = result.image_data;
    } else if (selectedFile) {
        document.getElementById('repFundusImage').src = document.getElementById('previewImage').src;
    }
    document.getElementById('repScanTag').textContent = `${p.eye_side || 'Fundus'} Image Scan`;

    // AI Diagnostic Findings
    const sevBadge = document.getElementById('repSeverityBadge');
    sevBadge.textContent = `Grade ${sevVal}: ${result.severity_class}`;
    sevBadge.style.backgroundColor = sevColor;

    document.getElementById('repDiagnosisTitle').textContent = info.stage_name || result.severity_class;
    document.getElementById('repDiagnosisTitle').style.color = sevColor;

    const riskEl = document.getElementById('repRiskLevel');
    riskEl.textContent = info.risk || 'Standard Risk';
    riskEl.style.color = sevColor;

    document.getElementById('repDescription').textContent = info.description || '-';
    document.getElementById('repRecommendation').textContent = info.recommendation || '-';
    document.getElementById('repFollowup').textContent = info.followup || 'Consult eye specialist';

    // Screener Notes
    const notesBlock = document.getElementById('repNotesBlock');
    if (p.notes && p.notes.trim()) {
        notesBlock.style.display = 'block';
        document.getElementById('repDoctorNotes').textContent = p.notes;
    } else {
        notesBlock.style.display = 'none';
    }

    // Circular Confidence Progress
    updateCircularGauge(result.confidence || 0, sevColor);
    document.getElementById('repConfidenceVal').textContent = `${result.confidence}%`;

    // Probability Breakdown Bars
    renderProbabilityBars(result.probabilities || {});
}

function updateCircularGauge(percentage, color) {
    const circle = document.getElementById('repProgressCircle');
    if (!circle) return;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
    circle.style.stroke = color;

    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 150);
}

function renderProbabilityBars(probabilities) {
    const container = document.getElementById('repProbabilityBars');
    container.innerHTML = '';

    const classes = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR'];
    const colors = [SEVERITY_COLORS[0], SEVERITY_COLORS[1], SEVERITY_COLORS[2], SEVERITY_COLORS[3], SEVERITY_COLORS[4]];

    classes.forEach((className, idx) => {
        const prob = probabilities[className] || 0;
        const row = document.createElement('div');
        row.className = 'probability-bar-row';
        row.innerHTML = `
            <div class="prob-label">${SEVERITY_NAMES[idx] || className}</div>
            <div class="prob-track">
                <div class="prob-fill" style="width: 0%; background: ${colors[idx]};"></div>
            </div>
            <div class="prob-pct">${prob.toFixed(1)}%</div>
        `;
        container.appendChild(row);

        setTimeout(() => {
            const fill = row.querySelector('.prob-fill');
            fill.style.width = `${Math.min(100, Math.max(0, prob))}%`;
        }, 100 + (idx * 60));
    });
}

/* ==========================================================================
   Multi-Format Report Export & Downloads
   ========================================================================== */

// 1. PDF Download via html2pdf with window.print fallback
async function downloadPDFReport() {
    if (!currentScreeningResult) {
        showToast('No active screening record to export.', 'error');
        return;
    }

    const reportElement = document.getElementById('printableReport');
    const p = currentScreeningResult.patient || {};
    const mrn = p.patient_id || 'PATIENT';
    const filename = `VisionAries_Report_${mrn}_${new Date().toISOString().slice(0,10)}.pdf`;

    showToast('Generating official clinical PDF report...', 'info');

    // If html2pdf bundle is available
    if (typeof html2pdf !== 'undefined') {
        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(reportElement).save();
            showToast('PDF Report downloaded successfully!', 'success');
            return;
        } catch (err) {
            console.warn('html2pdf generation error, falling back to print dialog:', err);
        }
    }

    // Fallback: browser print dialog
    window.print();
}

// 2. CSV Download for Current Patient Screening
function downloadCurrentCSV() {
    if (!currentScreeningResult) {
        showToast('No active screening record to export.', 'error');
        return;
    }

    const r = currentScreeningResult;
    const p = r.patient || {};
    const info = r.info || {};

    const headers = [
        'Screening ID', 'Timestamp', 'Patient MRN', 'Patient Name', 'Age', 'Gender',
        'Contact', 'Email', 'Diabetes Type', 'Duration Years', 'HbA1c Percent',
        'Blood Pressure', 'Management', 'Examined Eye', 'Visual Acuity', 'Prior Retinal Tx',
        'Symptoms', 'Severity Grade (0-4)', 'Diagnosis Name', 'AI Confidence (%)',
        'Risk Level', 'Attending Clinician', 'Clinician License', 'Clinician Specialty',
        'Facility', 'Clinical Recommendations', 'Doctor Notes'
    ];

    const row = [
        r.screening_id || '',
        r.timestamp || '',
        p.patient_id || '',
        `"${(p.patient_name || '').replace(/"/g, '""')}"`,
        p.age || '',
        p.gender || '',
        `"${p.contact || ''}"`,
        `"${p.email || ''}"`,
        `"${p.diabetes_type || ''}"`,
        p.diabetes_duration || '',
        p.hba1c || '',
        `"${p.blood_pressure || ''}"`,
        `"${p.management || ''}"`,
        `"${p.eye_side || ''}"`,
        `"${p.visual_acuity || ''}"`,
        `"${p.prior_treatment || ''}"`,
        `"${(p.symptoms || '').replace(/"/g, '""')}"`,
        r.severity_value,
        `"${r.severity_class || ''}"`,
        r.confidence,
        `"${info.risk || ''}"`,
        `"${(p.clinician_name || activeClinician.name).replace(/"/g, '""')}"`,
        `"${p.clinician_id || activeClinician.license}"`,
        `"${p.clinician_specialty || activeClinician.specialty}"`,
        `"${p.clinician_facility || activeClinician.facility}"`,
        `"${(info.recommendation || '').replace(/"/g, '""')}"`,
        `"${(p.notes || '').replace(/"/g, '""')}"`
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VisionAries_${p.patient_id || 'Record'}_screening.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Patient CSV report downloaded!', 'success');
}

// 3. JSON Export (HL7/FHIR Format)
function downloadJSONRecord() {
    if (!currentScreeningResult) {
        showToast('No active screening record to export.', 'error');
        return;
    }

    const p = currentScreeningResult.patient || {};
    const fhirRecord = {
        resourceType: "DiagnosticReport",
        identifier: [{ system: "urn:visionaries:screening", value: currentScreeningResult.screening_id }],
        status: "final",
        category: [{ coding: [{ system: "http://snomed.info/sct", code: "394594003", display: "Ophthalmology" }] }],
        code: { coding: [{ system: "http://loinc.org", code: "74070-4", display: "Diabetic retinopathy screening report" }] },
        subject: {
            reference: `Patient/${p.patient_id}`,
            display: p.patient_name,
            gender: p.gender,
            age: p.age
        },
        effectiveDateTime: currentScreeningResult.timestamp,
        performer: [{
            display: p.clinician_name || activeClinician.name,
            role: p.clinician_specialty,
            license: p.clinician_id
        }],
        clinicalMetrics: {
            diabetesType: p.diabetes_type,
            durationYears: p.diabetes_duration,
            hba1c: p.hba1c,
            bloodPressure: p.blood_pressure,
            examinedEye: p.eye_side,
            visualAcuity: p.visual_acuity
        },
        conclusion: currentScreeningResult.severity_class,
        conclusionCode: [{
            severityGrade: currentScreeningResult.severity_value,
            confidence: currentScreeningResult.confidence,
            riskAssessment: currentScreeningResult.info ? currentScreeningResult.info.risk : ''
        }],
        probabilityDistribution: currentScreeningResult.probabilities
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fhirRecord, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `VisionAries_${p.patient_id || 'record'}_FHIR.json`);
    dlAnchorElem.click();

    showToast('HL7/FHIR JSON record exported!', 'success');
}

// 4. Print Report
function printReport() {
    window.print();
}

// 5. Next Patient Reset
function startNewPatient() {
    removeSelectedFile();
    generateNewMRN();
    document.getElementById('patientName').value = '';
    document.getElementById('patientAge').value = '';
    document.getElementById('patientContact').value = '';
    document.getElementById('patientEmail').value = '';
    document.getElementById('clinicalNotes').value = '';
    
    // Hide results
    document.getElementById('resultsContainer').style.display = 'none';

    // Scroll back to intake card
    scrollToSection('screening');
    showToast('Form ready for new patient screening.', 'info');
}

/* ==========================================================================
   Patient Records Archive & Database Table
   ========================================================================== */
async function fetchArchivedScreenings() {
    try {
        const response = await fetch(`${API_BASE_URL}/screenings`);
        if (!response.ok) return;
        const data = await response.json();
        allArchivedScreenings = data.screenings || [];

        renderArchiveStats(allArchivedScreenings);
        renderScreeningsTable(allArchivedScreenings);
    } catch (err) {
        console.error('Failed to fetch screenings archive:', err);
    }
}

function renderArchiveStats(screenings) {
    document.getElementById('totalScreenedCount').textContent = screenings.length;

    const normal = screenings.filter(s => s.severity_value === 0).length;
    const early = screenings.filter(s => s.severity_value === 1 || s.severity_value === 2).length;
    const urgent = screenings.filter(s => s.severity_value === 3 || s.severity_value === 4).length;

    document.getElementById('normalCount').textContent = normal;
    document.getElementById('earlyStageCount').textContent = early;
    document.getElementById('urgentReferralCount').textContent = urgent;
}

function renderScreeningsTable(screenings) {
    const tbody = document.getElementById('screeningsTableBody');
    if (!tbody) return;

    if (!screenings || screenings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-muted">
                    No patient screenings recorded yet. Complete a screening above to populate the clinical archive.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    screenings.forEach(s => {
        const tr = document.createElement('tr');
        const color = SEVERITY_COLORS[s.severity_value] || '#3b82f6';

        tr.innerHTML = `
            <td>
                <div class="table-patient-name">${s.patient_name || 'Anonymous'}</div>
                <div class="table-mrn">${s.patient_id || s.screening_id}</div>
            </td>
            <td>${s.age || '-'} / ${s.gender ? s.gender.charAt(0) : '-'}</td>
            <td>
                <span title="HbA1c: ${s.hba1c}%, BP: ${s.blood_pressure}">
                    ${s.diabetes_type || 'Type 2'}<br>
                    <small style="color: #94a3b8;">HbA1c: <strong>${s.hba1c || 0}%</strong></small>
                </span>
            </td>
            <td>${(s.eye_side || 'OD').split(' ')[0]}</td>
            <td>
                <span class="table-badge" style="background-color: ${color};">
                    ${s.severity_class || 'No DR'}
                </span>
            </td>
            <td><strong>${s.confidence || 0}%</strong></td>
            <td>
                <div style="font-weight: 600; color: #fff;">${s.clinician_name || 'Clinician'}</div>
                <small style="color: #64748b;">${s.clinician_id || ''}</small>
            </td>
            <td><small>${s.timestamp ? s.timestamp.slice(0, 16) : '-'}</small></td>
            <td class="text-right">
                <div class="table-actions">
                    <button class="table-action-btn" title="View Full Report" onclick="viewHistoricalReport('${s.screening_id}')">View</button>
                    <button class="table-action-btn delete" title="Delete Record" onclick="deleteScreeningRecord('${s.screening_id}')">&times;</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterScreeningsTable() {
    const query = document.getElementById('archiveSearchInput').value.toLowerCase().trim();
    const severity = document.getElementById('archiveSeverityFilter').value;

    const filtered = allArchivedScreenings.filter(s => {
        const matchesQuery = !query ||
            (s.patient_name && s.patient_name.toLowerCase().includes(query)) ||
            (s.patient_id && s.patient_id.toLowerCase().includes(query)) ||
            (s.clinician_name && s.clinician_name.toLowerCase().includes(query)) ||
            (s.screening_id && s.screening_id.toLowerCase().includes(query));

        const matchesSeverity = (severity === 'ALL') || (s.severity_class === severity);

        return matchesQuery && matchesSeverity;
    });

    renderScreeningsTable(filtered);
}

async function viewHistoricalReport(screeningId) {
    try {
        const response = await fetch(`${API_BASE_URL}/screenings/${screeningId}`);
        if (!response.ok) throw new Error('Record not found');
        const data = await response.json();
        const s = data.screening;

        const formattedResult = {
            screening_id: s.screening_id,
            timestamp: s.timestamp,
            severity_value: s.severity_value,
            severity_class: s.severity_class,
            confidence: s.confidence,
            probabilities: s.probabilities || {},
            info: s.info,
            image_data: s.image_data,
            patient: {
                patient_id: s.patient_id,
                patient_name: s.patient_name,
                age: s.age,
                gender: s.gender,
                contact: s.contact,
                email: s.email,
                diabetes_type: s.diabetes_type,
                diabetes_duration: s.diabetes_duration,
                hba1c: s.hba1c,
                blood_pressure: s.blood_pressure,
                management: s.management,
                eye_side: s.eye_side,
                visual_acuity: s.visual_acuity,
                prior_treatment: s.prior_treatment,
                symptoms: s.symptoms,
                notes: s.notes,
                clinician_name: s.clinician_name,
                clinician_id: s.clinician_id,
                clinician_specialty: s.clinician_specialty,
                clinician_facility: s.clinician_facility
            }
        };

        currentScreeningResult = formattedResult;
        displayClinicalReport(formattedResult);

        // Scroll to results
        document.getElementById('resultsContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast(`Loaded historical record for ${s.patient_name}`, 'info');

    } catch (err) {
        showToast('Failed to load screening record: ' + err.message, 'error');
    }
}

async function deleteScreeningRecord(screeningId) {
    if (!confirm('Are you sure you want to delete this screening record from the clinical database?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/screenings/${screeningId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete');
        showToast('Screening record removed.', 'info');
        fetchArchivedScreenings();
    } catch (err) {
        showToast('Error deleting record: ' + err.message, 'error');
    }
}

/* ==========================================================================
   Utility Functions & Health Check
   ========================================================================== */
function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
        const navHeight = document.querySelector('.navbar').offsetHeight || 70;
        const targetPos = el.offsetTop - navHeight - 15;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';

    toast.innerHTML = `
        <span style="font-size: 1.1rem;">${icon}</span>
        <span style="flex: 1;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ VisionAries Backend Online:', data);
        }
    } catch (e) {
        console.warn('VisionAries Backend offline or initializing...');
    }
}

console.log('👁️ VisionAries Clinical AI Diagnostic Suite Loaded');
