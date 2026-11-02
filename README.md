# 👁️ VisionAries - Clinical AI Diabetic Retinopathy Diagnostic Suite

An advanced AI-powered clinical platform for screening, grading, and reporting diabetic retinopathy from retinal fundus photographs using deep learning (PyTorch ResNet-152 architecture), clinician authentication, and comprehensive patient telemetry.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-ResNet--152-red.svg)
![Flask](https://img.shields.io/badge/Flask-3.x-green.svg)
![Database](https://img.shields.io/badge/Database-SQLite-lightgrey.svg)
![Export](https://img.shields.io/badge/Export-PDF%20%7C%20CSV%20%7C%20JSON-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 🌟 Clinical Features

- **VisionAries Deep Neural Engine**: PyTorch ResNet-152 deep convolutional neural network for automated ICDR 5-tier classification.
- **Doctor & Clinician Authentication Portal**:
  - Doctor login modal with 1-click presets (Dr. Arthur Vance, Dr. Evelyn Reed, Dr. Marcus Chen) or custom physician sign-in.
  - Active session state displayed in the navigation bar with doctor credentials and online verification status.
  - Attending clinician stamping on all screening reports with license number, specialty, hospital center, and digital sign-off.
- **Comprehensive Patient Clinical Telemetry Intake**:
  - **Demographics**: Full Name, Medical Record Number (MRN) with auto-generator, Age, Biological Sex, Contact Phone & Email.
  - **Diabetic & Glycemic Markers**: Diabetes Classification (Type 1, Type 2, Gestational, Pre-diabetes), Duration in Years, Recent HbA1c (%), Systemic Blood Pressure (mmHg), Glycemic Management Regimen.
  - **Ophthalmic Assessment**: Examined Eye (Right Eye [OD], Left Eye [OS], Both [OU]), Visual Acuity, Prior Interventions (PRP Laser, Anti-VEGF Injections, Vitrectomy), and Reported Symptoms.
- **Clinical Diagnostic Report & Scorecard**:
  - Attending Doctor verification stamp & signature block.
  - Complete patient clinical data grid.
  - Examined fundus scan photo with zoom/inspect capability.
  - Circular animated confidence gauge & severity color-coded classification badge.
  - Microvascular pathology findings & actionable clinical management recommendations.
  - Multi-class probability distribution bars.
- **Multi-Format Export & Downloads**:
  - 📄 **Download PDF Report**: Generates an official, certified hospital diagnostic document with doctor credentials, patient telemetry, and AI diagnosis.
  - 📊 **Download Patient CSV**: Standard spreadsheet export of patient screening data.
  - 📑 **Export JSON (HL7/FHIR)**: Standardized interoperable health record for EMR/EHR ingestion.
  - 🖨️ **Print Report**: Formatted with dedicated `@media print` clean hospital paper stylesheet.
- **Patient Screening Archive & Database**:
  - SQLite persistent database (`screenings.db`) storing all historical screenings.
  - Searchable by Patient Name, MRN, Clinician, or Severity Level.
  - Metric summary chips (Total Screened, Normal, Early Stage, Urgent Referral).
  - Bulk "Export All Archive to CSV" button.
- **Quick Test Clinical Sample Gallery**:
  - One-click testing with preloaded standard retinal scans across all 5 severity stages (Grade 0 Normal to Grade 4 Proliferative DR).

---

## 📋 ICDR Severity Classification

| Grade | Clinical Stage | Microvascular Findings | Recommended Action |
|:---:|:---|:---|:---|
| **0** | **No DR** | Healthy fundus, no microaneurysms or lesions | Routine annual screening |
| **1** | **Mild NPDR** | Microaneurysms only in retinal capillary bed | Review in 6–12 months |
| **2** | **Moderate NPDR** | Microaneurysms, dot/blot hemorrhages, hard exudates | Ophthalmology consult in 3–6 months |
| **3** | **Severe NPDR** | 4:2:1 Rule: &gt;20 hemorrhages/quad, venous beading | Urgent specialist referral in 2–4 weeks |
| **4** | **Proliferative DR** | Neovascularization (NVD/NVE), vitreous hemorrhage | **Emergency intervention in 24–48 hours** |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.8+
- PyTorch and Flask (`pip install -r requirements.txt`)

### 2. Start VisionAries
```bash
python app.py
```
Open your browser and navigate to:
```
http://localhost:5000
```

### 3. Model Weights (Optional)
The system automatically includes an intelligent clinical heuristic diagnostic engine for instant out-of-the-box demonstration. If you have the trained Kaggle PyTorch checkpoint:
1. Place `classifier.pt` in `Retinal_blindness_detection_Pytorch-master/classifier.pt`
2. Restart `python app.py`. VisionAries will automatically load the model weights.

---

## 📡 API Endpoints

- `GET /api/health` — Application status and compute device.
- `GET /api/clinicians` — Preloaded list of verified clinicians.
- `POST /api/auth/login` — Clinician login authentication.
- `POST /api/predict` — Analyze fundus image with patient & clinician form-data.
- `GET /api/screenings` — Retrieve all stored patient screening records.
- `GET /api/screenings/<id>` — Retrieve full details for a specific screening.
- `DELETE /api/screenings/<id>` — Remove a screening record from the database.
- `GET /api/screenings/export/csv` — Export all archived patient records to CSV.
- `GET /api/sample-images` — List sample retinal fundus photographs.

---

## 📄 License
This project is licensed under the MIT License.
