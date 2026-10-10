/**
 * ============================================================================
 * GRAMLINK 360 - Bilingual Translation System (English & Marathi)
 * ============================================================================
 * Authentic Marathi (मराठी) and English dictionaries for all pages, filters,
 * statistics, charts, accessibility labels, and demonstration tags.
 */

const translations = {
  en: {
    // Accessibility
    "a11y_skip_to_content": "Skip to main content",
    "skip_to_main": "Skip to main content",
    "a11y_language": "Language / भाषा:",

    // Navigation
    "nav_home": "Home",
    "nav_services": "Services",
    "nav_submit": "File Complaint",
    "nav_track": "Track Status",
    "nav_announcements": "Announcements",
    "nav_village_pulse": "Village Pulse",
    "nav_resident_dash": "Resident Portal",
    "nav_admin_dash": "Admin Desk",
    "nav_login": "Login / Register",
    "nav_logout": "Logout",

    // Hero Section
    "hero_badge": "Official Digital Panchayat Portal",
    "hero_title_1": "One Village. Every Service.",
    "hero_title_2": "One Digital Future.",
    "hero_desc": "Empowering every resident of Gram Panchayat Shivrajpur with instant access to public services, fast grievance redressal with 48-hour SLAs, and open community notices.",
    "hero_btn_services": "Explore Services",
    "hero_btn_track": "Track Complaint",
    "hero_stat_resolved": "Resolved Rate",
    "hero_stat_sla": "Avg SLA Response",
    "hero_stat_families": "Registered Families",

    // Quick Tracker Widget
    "track_widget_title": "Track Any Village Complaint Instantly",
    "track_widget_desc": "Enter your unique 10-character reference token (e.g., GL-2026-1042)",
    "track_input_placeholder": "Enter Token (e.g. GL-2026-1042)",
    "track_btn": "Check Status",

    // Filters & Search
    "filter_all_status": "All Statuses",
    "filter_status_pending": "⏳ Pending",
    "filter_status_progress": "🔧 In Progress",
    "filter_status_resolved": "✅ Resolved",
    "filter_status_rejected": "❌ Rejected",
    "filter_all_categories": "All Categories",
    "filter_cat_water": "Drinking Water Supply",
    "filter_cat_power": "Electricity & Streetlights",
    "filter_cat_roads": "Roads & Drainage",
    "filter_cat_sanitation": "Sanitation & Garbage",
    "filter_cat_health": "Primary Health Centre",
    "filter_cat_ration": "Fair Price Ration (PDS)",
    "filter_cat_general": "General Panchayat Service",
    "category_all": "All Departments",
    "category_health": "Health & Sanitation",
    "category_agriculture": "Agriculture & Kisan",
    "category_utilities": "Water & Electricity",
    "category_documents": "Certificates & Revenue",
    "service_search_placeholder": "Search services by name, department, or keyword...",
    "search_complaints_placeholder": "Search by token, title, applicant name, ward...",
    "search_services_placeholder": "Search services by title, department, or keyword...",
    "search_announcements_placeholder": "Search notices by headline, venue, or description...",

    // Village Pulse & Statistics
    "pulse_title": "Village Pulse & Open Data Transparency",
    "pulse_desc": "Calculated dynamically from real database grievance records and simulated Panchayat utility schedules.",
    "stat_sla_compliance": "SLA Compliance",
    "stat_sla_desc": "Tickets closed within 48h deadline",
    "stat_total_grievances": "Total Received",
    "stat_total_desc": "Tickets registered in portal",
    "stat_resolved": "Resolved & Closed",
    "stat_resolved_desc": "Inspected and closed by officers",
    "stat_avg_time": "Avg. Resolution Time",
    "stat_avg_time_desc": "Official benchmark SLA: 48h",

    // Charts
    "chart_status_breakdown": "📊 Grievance Status Breakdown (Real Database Data)",
    "chart_category_distribution": "📈 Grievances by Department Category",
    "chart_ward_performance": "🏘️ Ward-Wise Performance & Resolution Ledger",

    // Services Directory
    "services_tag": "Village Directory",
    "services_title": "Essential Public & Citizen Services",
    "services_desc": "Direct access to local departments, welfare desks, and community infrastructure.",
    "service_btn_details": "View Details →",

    // Announcements
    "announcements_tag": "Panchayat Notice Board",
    "announcements_title": "Official Village Announcements & Gram Sabha",
    "announcements_desc": "Public notices, immunization drives, and democratic assembly meetings.",

    // Complaint Submission Form
    "complaint_form_title": "Lodge a Village Grievance",
    "complaint_form_desc": "Transparent, tracked, and bound by official Panchayat turnaround time with real-time status updates.",
    "field_category": "Department / Category",
    "field_ward": "Ward / Locality",
    "field_title": "Brief Subject of Issue",
    "field_desc": "Detailed Description of the Problem",
    "field_name": "Applicant Full Name",
    "field_phone": "Mobile Number (10 Digits)",
    "field_priority": "Priority / Severity",
    "btn_submit_complaint": "Submit Grievance to Panchayat",

    // Admin Control Room
    "admin_control_title": "Grievance Triage & Operational Desk",
    "admin_control_desc": "Review incoming tickets, update statuses, monitor SLAs, and broadcast village notices.",
    "btn_broadcast_notice": "📢 Broadcast Notice",
    "btn_export_csv": "📥 Export Report (CSV)",

    // Resident Portal
    "resident_welcome": "Welcome back,",
    "resident_portal_desc": "Track your personal grievances, check SLA deadlines, and view resolution proofs.",

    // Demonstration Badges & Integrity
    "demo_badge_academic": "Academic CSBS Demonstration Record",
    "demo_note_simulated": "Simulated Schedule Model (Non-Government Integration)",
    "footer_tagline": "Empowering rural India through transparent, accountable, and SLA-driven e-governance.",
    "footer_helpline": "Emergency Helplines:",
    "footer_demo_notice": "Academic CSBS Mini Project - Demonstration UI"
  },

  mr: {
    // Accessibility
    "a11y_skip_to_content": "मुख्य मजकुराकडे जा",
    "skip_to_main": "मुख्य सामग्रीकडे जा",
    "a11y_language": "भाषा / Language:",

    // Navigation
    "nav_home": "मुख्यपृष्ठ",
    "nav_services": "ग्राम सेवा",
    "nav_submit": "तक्रार नोंदवा",
    "nav_track": "तक्रार स्थिती",
    "nav_announcements": "सूचना व निर्णय",
    "nav_village_pulse": "गावाची प्रगती",
    "nav_resident_dash": "ग्रामस्थ पोर्टल",
    "nav_admin_dash": "प्रशासन कक्ष",
    "nav_login": "प्रवेश / नोंदणी",
    "nav_logout": "बाहेर पडा",

    // Hero Section
    "hero_badge": "अधिकृत डिजिटल ग्रामपंचायत पोर्टल",
    "hero_title_1": "एक गाव. सर्व सेवा.",
    "hero_title_2": "एक डिजिटल भविष्य.",
    "hero_desc": "ग्रामपंचायत शिवराजपूरच्या प्रत्येक नागरिकासाठी सार्वजनिक सुविधा, ४८ तासांच्या आत तक्रार निवारण आणि पारदर्शक ग्रामसभा सूचना एकाच डिजिटल मंचावर उपलब्ध.",
    "hero_btn_services": "ग्राम सेवा पहा",
    "hero_btn_track": "तक्रार तपासा",
    "hero_stat_resolved": "निवारण दर",
    "hero_stat_sla": "सरासरी निवारण वेळ",
    "hero_stat_families": "नोंदणीकृत कुटुंबे",

    // Quick Tracker Widget
    "track_widget_title": "तुमच्या तक्रारीची स्थिती त्वरित तपासा",
    "track_widget_desc": "तुमचा १० अंकी तक्रार संदर्भ क्रमांक टाका (उदा. GL-2026-1042)",
    "track_input_placeholder": "टोकन टाका (उदा. GL-2026-1042)",
    "track_btn": "स्थिती पहा",

    // Filters & Search
    "filter_all_status": "सर्व स्थिती",
    "filter_status_pending": "⏳ प्रलंबित",
    "filter_status_progress": "🔧 प्रगतीपथावर",
    "filter_status_resolved": "✅ निवारण पूर्ण",
    "filter_status_rejected": "❌ नाकारले",
    "filter_all_categories": "सर्व विभाग",
    "filter_cat_water": "पिण्याचे पाणी पुरवठा",
    "filter_cat_power": "वीज व पथदिवे",
    "filter_cat_roads": "रस्ते व गटारे",
    "filter_cat_sanitation": "स्वच्छता व कचरा व्यवस्थापन",
    "filter_cat_health": "प्राथमिक आरोग्य केंद्र",
    "filter_cat_ration": "रास्त भाव धान्य दुकान (रेशन)",
    "filter_cat_general": "सामान्य ग्रामपंचायत सेवा",
    "category_all": "सर्व विभाग",
    "category_health": "आरोग्य व स्वच्छता",
    "category_agriculture": "शेती व किसान योजना",
    "category_utilities": "पाणी व वीज पुरवठा",
    "category_documents": "दाखले व महसूल",
    "service_search_placeholder": "सेवेचे नाव, विभाग किंवा शब्दाने शोधा...",
    "search_complaints_placeholder": "टोकन, विषय, अर्जदार नाव किंवा वॉर्डाने शोधा...",
    "search_services_placeholder": "सेवेचे नाव, विभाग किंवा शब्दाने शोधा...",
    "search_announcements_placeholder": "सूचना शीर्षक किंवा ठिकाणाने शोधा...",

    // Village Pulse & Statistics
    "pulse_title": "गावाची प्रगती व पारदर्शक सामाजिक अंकेक्षण",
    "pulse_desc": "डेटाबेसमधील तक्रार नोंदी व शिवपूर ग्रामपंचायत सेवा वेळापत्रकावर आधारित थेट आकडेवारी.",
    "stat_sla_compliance": "SLA हमी पूर्तता",
    "stat_sla_desc": "४८ तासांच्या मुदतीत सोडवलेल्या तक्रारी",
    "stat_total_grievances": "एकूण प्राप्त तक्रारी",
    "stat_total_desc": "पोर्टलवर दाखल झालेल्या सर्व तक्रारी",
    "stat_resolved": "निवारण झालेल्या तक्रारी",
    "stat_resolved_desc": "अधिकाऱ्यांनी प्रत्यक्ष जागेवर जाऊन सोडवलेल्या",
    "stat_avg_time": "सरासरी निवारण वेळ",
    "stat_avg_time_desc": "अधिकृत कमाल मुदत: ४८ तास",

    // Charts
    "chart_status_breakdown": "📊 तक्रार स्थिती विश्लेषण (थेट डेटाबेस आकडेवारी)",
    "chart_category_distribution": "📈 विभागनिहाय तक्रारींचे प्रमाण",
    "chart_ward_performance": "🏘️ वॉर्डनिहाय कामगिरी व निवारण तक्ता",

    // Services Directory
    "services_tag": "गाव सेवा सूची",
    "services_title": "महत्त्वाच्या सार्वजनिक व नागरिक सेवा",
    "services_desc": "स्थानिक विभाग, कल्याणकारी योजना आणि पायाभूत सुविधांचा थेट लाभ घ्या.",
    "service_btn_details": "तपशील पहा →",

    // Announcements
    "announcements_tag": "ग्रामपंचायत सूचना फलक",
    "announcements_title": "अधिकृत गाव सूचना व ग्रामसभा",
    "announcements_desc": "ग्रामसभा बैठका, लसीकरण मोहिमा आणि कृषी सल्ला सूचना.",

    // Complaint Submission Form
    "complaint_form_title": "ग्रामपंचायतीकडे तक्रार नोंदवा",
    "complaint_form_desc": "पारदर्शक, ट्रॅक करण्यायोग्य आणि अधिकृत ४८ तासांच्या वेळेत निवारण हमीसह.",
    "field_category": "विभाग / वर्गवारी निवडा",
    "field_ward": "वॉर्ड / परिसर निवडा",
    "field_title": "समस्येचा मुख्य विषय",
    "field_desc": "समस्येचे सविस्तर वर्णन",
    "field_name": "अर्जदाराचे पूर्ण नाव",
    "field_phone": "मोबाईल नंबर (१० अंकी)",
    "field_priority": "गंभीरता पातळी",
    "btn_submit_complaint": "तक्रार ग्रामपंचायतीकडे सादर करा",

    // Admin Control Room
    "admin_control_title": "तक्रार निवारण व प्रशासकीय कक्ष",
    "admin_control_desc": "नवीन तक्रारींची तपासणी, स्थिती बदल, मुदत नियंत्रण व सूचना प्रसारण करा.",
    "btn_broadcast_notice": "📢 सूचना प्रसारित करा",
    "btn_export_csv": "📥 अहवाल डाऊनलोड करा (CSV)",

    // Resident Portal
    "resident_welcome": "स्वागत आहे,",
    "resident_portal_desc": "तुमच्या वैयक्तिक तक्रारी, मुदत तारीख आणि निवारण शेरा पहा.",

    // Demonstration Badges & Integrity
    "demo_badge_academic": "शैक्षणिक CSBS प्रात्यक्षिक नोंद",
    "demo_note_simulated": "प्रात्यक्षिक मॉडेल (शासकीय API जोडणी नाही)",
    "footer_tagline": "पारदर्शक, जबाबदार आणि तंत्रज्ञानयुक्त ई-प्रशासनाद्वारे ग्रामीण भारताचे सक्षमीकरण.",
    "footer_helpline": "आपत्कालीन संपर्क:",
    "footer_demo_notice": "शैक्षणिक CSBS मिनी प्रोजेक्ट - प्रात्यक्षिक प्रणाली"
  }
};

/**
 * Get current selected language from localStorage or default to 'en'
 */
function getCurrentLanguage() {
  return localStorage.getItem('gramlink_lang') || 'en';
}

/**
 * Set and apply language across entire DOM
 */
function setLanguage(lang) {
  if (!translations[lang]) return;
  localStorage.setItem('gramlink_lang', lang);
  applyTranslations(lang);

  // Update language buttons active state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
}

/**
 * Walk through DOM elements with [data-i18n] and [data-i18n-placeholder]
 */
function applyTranslations(lang) {
  const currentDict = translations[lang] || translations.en;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (currentDict[key]) {
      el.textContent = currentDict[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (currentDict[key]) {
      el.setAttribute('placeholder', currentDict[key]);
    }
  });
}

// Initialise language on script load
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = getCurrentLanguage();
  setLanguage(savedLang);
});
