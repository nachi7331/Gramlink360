/**
 * GRAMLINK 360 - Central State & Data Engine (Supabase-Synced)
 * Persisted in browser localStorage with live real-time Supabase sync.
 */

const GramlinkState = (() => {
  const STORAGE_KEYS = {
    COMPLAINTS: 'gramlink_complaints',
    SERVICES: 'gramlink_services',
    ANNOUNCEMENTS: 'gramlink_announcements',
    CURRENT_USER: 'gramlink_auth_user',
    INITIALIZED: 'gramlink_state_init_v3'
  };

  // Default Fallback Datasets
  const SEED_SERVICES = [
    {
      id: 'srv-1',
      title: 'Primary Health Centre & OPD',
      category: 'health',
      dept: 'Public Health Department',
      timings: 'Monday – Saturday: 8:00 AM – 2:00 PM',
      officer: 'Dr. Anjali Kulkarni (Medical Officer)',
      phone: '+91 94231 00112',
      location: 'Near Old Bus Stand, Shivrajpur',
      description: 'Free basic medical consultation, maternal care, primary vaccinations, and essential medicine distribution.',
      requirements: 'Aadhaar Card, Health ID (ABHA) if available.'
    },
    {
      id: 'srv-2',
      title: 'Krishi Seva Kendra & Soil Testing',
      category: 'agriculture',
      dept: 'Agriculture & Farmer Welfare',
      timings: 'Daily: 9:00 AM – 5:00 PM',
      officer: 'Shri Vikram Shinde (Agriculture Assistant)',
      phone: '+91 98220 44321',
      location: 'Kisan Bhawan, Ward 4',
      description: 'Subsidized fertilizer quotas, government seed varieties, free soil health cards, and crop advisory for Kharif & Rabi.',
      requirements: '7/12 Land Extract, Aadhaar Card, Bank Passbook.'
    },
    {
      id: 'srv-3',
      title: 'Drinking Water & Handpump Maintenance',
      category: 'utilities',
      dept: 'Jal Jeevan & Water Supply Dept',
      timings: '24/7 Water Line Emergency Desk',
      officer: 'Santosh Jadhav (Water Works Supervisor)',
      phone: '+91 98810 55122',
      location: 'Gram Panchayat Pump House',
      description: 'Overhead tank supply regulation, chlorination monitoring, and rapid repair of community borewells and handpumps.',
      requirements: 'House Tax Receipt or Ward Number.'
    },
    {
      id: 'srv-4',
      title: 'Village Electricity & Solar Streetlights',
      category: 'utilities',
      dept: 'MSEDCL / Panchayat Energy Cell',
      timings: 'Daily: 8:00 AM – 6:00 PM',
      officer: 'Mahesh Gaikwad (Lineman)',
      phone: '+91 97650 99401',
      location: 'Sub-Station Road, Ward 2',
      description: 'Report power fluctuations, faulty village transformers, dark street corners, or request agricultural pump connection.',
      requirements: 'Electricity Bill Consumer Number (12 digits).'
    },
    {
      id: 'srv-5',
      title: 'Panchayat Certificates & Documents',
      category: 'documents',
      dept: 'Panchayat Revenue & Records',
      timings: 'Mon – Fri: 10:00 AM – 4:00 PM',
      officer: 'Pramod More (Gram Sevak)',
      phone: '+91 98900 88219',
      location: 'Gram Panchayat Main Office Room 3',
      description: 'Issuance of Birth, Death, Residence, Below Poverty Line (BPL), and No-Objection Certificates (NOC).',
      requirements: 'Application form, 2 Passport Photos, Identity Proof.'
    },
    {
      id: 'srv-6',
      title: 'Fair Price Ration Shop (PDS)',
      category: 'documents',
      dept: 'Food & Civil Supplies',
      timings: '1st to 20th of every month: 9:00 AM – 6:00 PM',
      officer: 'Kishore Patil (Ration Shop In-charge)',
      phone: '+91 99210 11984',
      location: 'Ward 1, Dr. Ambedkar Marg',
      description: 'Monthly distribution of subsidized wheat, rice, sugar, and kerosene under National Food Security Act (NFSA).',
      requirements: 'Digital Ration Card (NFSA) & Aadhaar biometric verification.'
    }
  ];

  const SEED_COMPLAINTS = [
    {
      id: 'cmp-1042',
      tokenNumber: 'GL-2026-1042',
      category: 'utilities',
      categoryName: 'Drinking Water Supply',
      title: 'Broken Handpump in Shivaji Chowk',
      ward: 'Ward 2 - Shivaji Chowk',
      applicantName: 'Ramesh Patil',
      applicantPhone: '+91 98221 54321',
      description: 'Community handpump handle broken since Tuesday. Around 30 households are facing severe drinking water shortage.',
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-10-07T09:30:00Z',
      assignedOfficer: 'Santosh Jadhav (Water Works Supervisor)',
      slaDueAt: '2026-10-10T12:00:00Z',
      timeline: [
        { title: 'Grievance Registered', time: '07 Oct 2026, 09:30 AM', note: 'Token GL-2026-1042 auto-generated via Gramlink 360.' },
        { title: 'Verified by Gram Sevak', time: '07 Oct 2026, 02:15 PM', note: 'Site verified; categorized as high priority community asset.' },
        { title: 'Assigned to Field Officer', time: '08 Oct 2026, 10:00 AM', note: 'Assigned to Santosh Jadhav with 48h SLA deadline.' },
        { title: 'Replacement Parts Dispatched', time: '09 Oct 2026, 11:20 AM', note: 'New mechanical piston assembly sent to Ward 2.' }
      ]
    },
    {
      id: 'cmp-1088',
      tokenNumber: 'GL-2026-1088',
      category: 'utilities',
      categoryName: 'Street Lighting & Solar',
      title: '3 Streetlights Out on Temple Approach Road',
      ward: 'Ward 3 - Mandir Galli',
      applicantName: 'Sunil Shinde',
      applicantPhone: '+91 97654 32190',
      description: 'Complete darkness near the village primary school and temple curve. Safety hazard for women and elderly at night.',
      priority: 'Medium',
      status: 'Resolved',
      createdAt: '2026-10-04T18:15:00Z',
      assignedOfficer: 'Mahesh Gaikwad (Lineman)',
      slaDueAt: '2026-10-06T18:15:00Z',
      resolvedAt: '2026-10-06T14:45:00Z',
      resolutionNotes: 'Replaced faulty capacitor and installed 2 new 45W energy-efficient LED streetlamps.',
      timeline: [
        { title: 'Grievance Registered', time: '04 Oct 2026, 06:15 PM', note: 'Ticket submitted online.' },
        { title: 'Technician Dispatched', time: '05 Oct 2026, 11:00 AM', note: 'Line inspection completed by Lineman Mahesh Gaikwad.' },
        { title: 'Repair Completed & Verified', time: '06 Oct 2026, 02:45 PM', note: 'Street lights tested and functional. Citizen acknowledged resolution.' }
      ]
    },
    {
      id: 'cmp-2104',
      tokenNumber: 'GL-2026-2104',
      category: 'sanitation',
      categoryName: 'Sanitation & Solid Waste',
      title: 'Drainage Overflow Near Kisan Vasti Culvert',
      ward: 'Ward 4 - Kisan Vasti',
      applicantName: 'Savita Pawar',
      applicantPhone: '+91 94220 88991',
      description: 'Rain runoff drain blocked with silt and debris, causing foul water to enter adjacent farming lane.',
      priority: 'Urgent',
      status: 'Pending',
      createdAt: '2026-10-09T08:00:00Z',
      assignedOfficer: 'Pramod More (Gram Sevak)',
      slaDueAt: '2026-10-11T08:00:00Z',
      timeline: [
        { title: 'Grievance Registered', time: '09 Oct 2026, 08:00 AM', note: 'Complaint lodged by resident Savita Pawar.' },
        { title: 'Pending Field Inspection', time: '09 Oct 2026, 09:15 AM', note: 'Sanitation squad schedule queued for inspection.' }
      ]
    }
  ];

  const SEED_ANNOUNCEMENTS = [
    {
      id: 'ann-1',
      title: 'Annual Pre-Diwali Gram Sabha Meeting',
      category: 'Gram Sabha',
      date: '15 Oct 2026',
      time: '10:00 AM',
      venue: 'Gram Panchayat Hall, Shivrajpur',
      isUrgent: true,
      description: 'Discussion of Ward 1 to 5 development budgets, approval of new PM Awas Yojana beneficiary lists, and water conservation audit. All adult residents are requested to attend.',
      author: 'Sarpanch Sunita Deshmukh'
    },
    {
      id: 'ann-2',
      title: 'Free Rabi Season High-Yield Seed Distribution',
      category: 'Agriculture',
      date: '12 Oct 2026',
      time: '09:00 AM – 04:00 PM',
      venue: 'Krishi Seva Kendra, Ward 4',
      isUrgent: false,
      description: 'Government subsidized Gram and Wheat seeds (Phule Vikram & Samadhan) will be distributed to small & marginal farmers. Bring 7/12 extract.',
      author: 'Agriculture Officer Shinde'
    },
    {
      id: 'ann-3',
      title: 'Intensified Pulse Polio & Child Health Immunization Drive',
      category: 'Health',
      date: '18 Oct 2026',
      time: '08:30 AM – 02:00 PM',
      venue: 'Primary Health Centre & Anganwadi No. 1, 2, 3',
      isUrgent: false,
      description: 'Free oral polio drops and routine MMR vaccination for all children under 5 years of age. Medical staff will also conduct home visits in rural clusters.',
      author: 'Dr. Anjali Kulkarni'
    }
  ];

  // Initialize store
  function init() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(SEED_SERVICES));
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(SEED_COMPLAINTS));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(SEED_ANNOUNCEMENTS));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }

    // Auto-sync with live Supabase in background
    syncFromSupabase();
  }

  // Background Sync from Supabase PostgreSQL
  async function syncFromSupabase() {
    if (window.GramlinkSupabase && window.GramlinkSupabase.client) {
      try {
        // Sync Services
        const liveServices = await window.GramlinkSupabase.fetchServices();
        if (liveServices && liveServices.length > 0) {
          const mappedServices = liveServices.map(s => ({
            id: s.id,
            title: s.title,
            category: s.category,
            dept: s.department,
            timings: s.timings,
            officer: s.officer_name,
            phone: s.officer_phone || '+91 94231 00000',
            location: s.location,
            description: s.description,
            requirements: s.requirements
          }));
          localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(mappedServices));
        }

        // Sync Announcements
        const liveAnnouncements = await window.GramlinkSupabase.fetchAnnouncements();
        if (liveAnnouncements && liveAnnouncements.length > 0) {
          const mappedAnn = liveAnnouncements.map(a => ({
            id: a.id,
            title: a.title,
            category: a.category,
            date: a.event_date || '15 Oct 2026',
            time: a.event_time || '10:00 AM',
            venue: a.venue,
            isUrgent: a.is_urgent,
            description: a.description,
            author: a.author_designation || 'Panchayat Administration'
          }));
          localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(mappedAnn));
        }
      } catch (e) {
        console.warn('Supabase sync notice:', e);
      }
    }
  }

  init();

  return {
    // Services
    getServices: () => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || SEED_SERVICES;
      } catch (e) {
        return SEED_SERVICES;
      }
    },

    // Complaints
    getComplaints: () => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) || SEED_COMPLAINTS;
      } catch (e) {
        return SEED_COMPLAINTS;
      }
    },

    getComplaintByToken: (token) => {
      const all = GramlinkState.getComplaints();
      const cleanToken = (token || '').trim().toUpperCase();
      return all.find(c => c.tokenNumber.toUpperCase() === cleanToken) || null;
    },

    addComplaint: (complaintData) => {
      const all = GramlinkState.getComplaints();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const tokenNumber = `GL-2026-${randomSuffix}`;
      
      const newComplaint = {
        id: `cmp-${Date.now()}`,
        tokenNumber,
        category: complaintData.category || 'general',
        categoryName: complaintData.categoryName || 'General Panchayat Service',
        title: complaintData.title,
        ward: complaintData.ward,
        applicantName: complaintData.applicantName || 'Anonymous Villager',
        applicantPhone: complaintData.applicantPhone || 'Not provided',
        description: complaintData.description,
        priority: complaintData.priority || 'Medium',
        status: 'Pending',
        createdAt: new Date().toISOString(),
        assignedOfficer: 'Pending Assignment',
        slaDueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        timeline: [
          {
            title: 'Grievance Registered',
            time: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            note: `Assigned reference token ${tokenNumber}. Queued for Gram Sevak review.`
          }
        ]
      };

      all.unshift(newComplaint);
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(all));

      // Asynchronously push to Supabase PostgreSQL table
      if (window.GramlinkSupabase && window.GramlinkSupabase.createComplaint) {
        window.GramlinkSupabase.createComplaint(complaintData)
          .then(res => console.log('✅ Complaint synced with Supabase:', res))
          .catch(err => console.warn('Supabase complaint sync fallback:', err.message));
      }

      return newComplaint;
    },

    updateComplaintStatus: (tokenNumber, newStatus, adminNote) => {
      const all = GramlinkState.getComplaints();
      const index = all.findIndex(c => c.tokenNumber === tokenNumber);
      if (index === -1) return null;

      const complaint = all[index];
      complaint.status = newStatus;
      
      if (newStatus === 'Resolved') {
        complaint.resolvedAt = new Date().toISOString();
        complaint.resolutionNotes = adminNote || 'Field verification completed and grievance resolved successfully.';
      }

      complaint.timeline.push({
        title: `Status changed to: ${newStatus}`,
        time: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        note: adminNote || `Panchayat administrative review updated status to ${newStatus}.`
      });

      all[index] = complaint;
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(all));

      // Asynchronously update Supabase table
      if (window.GramlinkSupabase && window.GramlinkSupabase.updateComplaintStatus) {
        window.GramlinkSupabase.updateComplaintStatus(tokenNumber, newStatus, adminNote)
          .then(res => console.log('✅ Status updated in Supabase:', res))
          .catch(err => console.warn('Supabase status update fallback:', err.message));
      }

      return complaint;
    },

    // Announcements
    getAnnouncements: () => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) || SEED_ANNOUNCEMENTS;
      } catch (e) {
        return SEED_ANNOUNCEMENTS;
      }
    },

    addAnnouncement: (announcement) => {
      const all = GramlinkState.getAnnouncements();
      const newAnn = {
        id: `ann-${Date.now()}`,
        title: announcement.title,
        category: announcement.category || 'General',
        date: announcement.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: announcement.time || '10:00 AM',
        venue: announcement.venue || 'Gram Panchayat Office',
        isUrgent: !!announcement.isUrgent,
        description: announcement.description,
        author: announcement.author || 'Panchayat Administration'
      };
      all.unshift(newAnn);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(all));

      // Sync to live Supabase
      if (window.GramlinkSupabase && window.GramlinkSupabase.createAnnouncement) {
        window.GramlinkSupabase.createAnnouncement(announcement)
          .then(res => console.log('✅ Announcement synced to Supabase:', res))
          .catch(err => console.warn('Supabase announcement sync fallback:', err.message));
      }

      return newAnn;
    },

    // Auth Sessions
    getCurrentUser: () => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
      } catch (e) {
        return null;
      }
    },

    setCurrentUser: (userData) => {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      if (window.GramlinkSupabase && window.GramlinkSupabase.signOut) {
        window.GramlinkSupabase.signOut();
      }
    }
  };
})();

if (typeof window !== 'undefined') {
  window.GramlinkState = GramlinkState;
}
