/**
 * ============================================================================
 * GRAMLINK 360 - Complaints & Grievance Redressal Controller
 * ============================================================================
 * Handles grievance submission, client-side validation, GPS simulation,
 * token generation, Supabase PostgreSQL persistence with Row Level Security (RLS),
 * and the real-time tracking timeline.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSubmissionForm();
  initTrackingView();
});

/* --------------------------------------------------------------------------
   SUBMISSION FORM CONTROLLER
   -------------------------------------------------------------------------- */
async function initSubmissionForm() {
  const form = document.getElementById('grievanceSubmissionForm');
  if (!form) return;

  const categorySelect = document.getElementById('complaintCategory');
  const wardSelect = document.getElementById('complaintWard');
  const titleInput = document.getElementById('complaintTitle');
  const descInput = document.getElementById('complaintDesc');
  const charDisplay = document.getElementById('charCountDisplay');
  const nameInput = document.getElementById('applicantName');
  const phoneInput = document.getElementById('applicantPhone');
  const photoInput = document.getElementById('complaintPhotoFile');
  const previewContainer = document.getElementById('photoPreviewContainer');
  const previewImg = document.getElementById('photoPreviewImg');
  const previewName = document.getElementById('photoPreviewName');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const gpsBtn = document.getElementById('detectGpsBtn');
  const geoInput = document.getElementById('complaintGeoInput');

  // Pre-fill Category if passed via URL ?category=...
  const urlParams = new URLSearchParams(window.location.search);
  const preCategory = urlParams.get('category');
  if (preCategory && categorySelect) {
    categorySelect.value = preCategory;
  }

  // Pre-fill applicant details if resident is logged in
  let currentUser = GramlinkState.getCurrentUser();
  if (window.GramlinkAPI && window.GramlinkAPI.auth) {
    try {
      const sessionData = await window.GramlinkAPI.auth.getSession();
      if (sessionData && sessionData.user) {
        const prof = sessionData.profile || {};
        currentUser = {
          id: sessionData.user.id,
          name: prof.full_name || sessionData.user.email?.split('@')[0],
          phone: prof.phone || '',
          ward: prof.ward_no || 'Ward 2 - Shivaji Chowk'
        };
      }
    } catch (e) {
      console.warn('Could not verify session in complaint form:', e);
    }
  }

  // Insert an Authentication / RLS status banner above the form if needed
  const formCard = form.parentElement;
  if (formCard && !document.getElementById('authStatusBanner')) {
    const banner = document.createElement('div');
    banner.id = 'authStatusBanner';
    banner.style.marginBottom = '1.5rem';
    banner.style.padding = '0.75rem 1rem';
    banner.style.borderRadius = 'var(--radius-md)';
    banner.style.fontSize = '0.85rem';

    if (currentUser && currentUser.name) {
      banner.style.background = '#f0fdf4';
      banner.style.border = '1px solid #bbf7d0';
      banner.style.color = '#166534';
      banner.innerHTML = `<strong>✓ Authenticated Citizen:</strong> Submitting as <strong>${currentUser.name}</strong> (${currentUser.ward || 'Ward 2'}). Complaint will be linked directly to your Supabase citizen ID under Row Level Security.`;
      if (nameInput) nameInput.value = currentUser.name;
      if (phoneInput && currentUser.phone) phoneInput.value = currentUser.phone;
      if (wardSelect && currentUser.ward) wardSelect.value = currentUser.ward;
    } else {
      banner.style.background = '#fffbeb';
      banner.style.border = '1px solid #fde68a';
      banner.style.color = '#92400e';
      banner.innerHTML = `<strong>⚠️ Authentication Notice:</strong> You are not currently signed in. In accordance with Supabase Row Level Security (RLS), official complaints persisted to the database require an authenticated citizen account. <a href="auth.html" style="font-weight: 700; color: #b45309; text-decoration: underline;">Sign In here</a> or continue in local simulation mode.`;
    }
    form.parentNode.insertBefore(banner, form);
  }

  // Character counter
  if (descInput && charDisplay) {
    descInput.addEventListener('input', () => {
      charDisplay.textContent = `${descInput.value.length} / 500`;
    });
  }

  // GPS Auto-detect simulation
  if (gpsBtn && geoInput) {
    gpsBtn.addEventListener('click', () => {
      gpsBtn.disabled = true;
      gpsBtn.textContent = '⌛ Detecting...';
      setTimeout(() => {
        geoInput.value = '18.1528° N, 74.5770° E (Ward 2 Shivrajpur GPS)';
        gpsBtn.disabled = false;
        gpsBtn.textContent = '✓ Located';
        showToast('GPS coordinates tagged to Shivrajpur Ward 2', 'success');
      }, 600);
    });
  }

  // Photo upload preview
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (previewImg) previewImg.src = event.target.result;
          if (previewName) previewName.textContent = file.name;
          if (previewContainer) previewContainer.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    });

    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', () => {
        photoInput.value = '';
        if (previewContainer) previewContainer.style.display = 'none';
      });
    }
  }

  // Form Submission & Validation
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

    // Reset error styling
    form.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));

    if (!categorySelect.value) {
      categorySelect.classList.add('error');
      isValid = false;
    }
    if (!wardSelect.value) {
      wardSelect.classList.add('error');
      isValid = false;
    }
    if (!titleInput.value || titleInput.value.trim().length < 6) {
      titleInput.classList.add('error');
      isValid = false;
    }
    if (!descInput.value || descInput.value.trim().length < 15) {
      descInput.classList.add('error');
      isValid = false;
    }
    if (!nameInput.value.trim()) {
      nameInput.classList.add('error');
      isValid = false;
    }
    if (!phoneInput.value.trim() || !/^[0-9]{10}$/.test(phoneInput.value.trim())) {
      phoneInput.classList.add('error');
      isValid = false;
    }

    if (!isValid) {
      showToast('Please correct the highlighted fields before submitting.', 'error');
      return;
    }

    // Submit payload
    const submitBtn = document.getElementById('submitGrievanceBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Submitting to Supabase PostgreSQL...';
    }

    const payload = {
      category: categorySelect.value,
      categoryName: categorySelect.options[categorySelect.selectedIndex]?.text || categorySelect.value,
      title: titleInput.value.trim(),
      ward: wardSelect.value,
      applicantName: nameInput.value.trim(),
      applicantPhone: phoneInput.value.trim(),
      description: descInput.value.trim(),
      priority: document.getElementById('complaintPriority')?.value || 'Medium',
      geoCoordinates: geoInput ? geoInput.value : null
    };

    let newGrievance = null;

    // 1. Attempt Supabase direct creation with RLS check
    if (window.GramlinkAPI && window.GramlinkAPI.complaints) {
      try {
        const { data, error } = await window.GramlinkAPI.complaints.create(payload);
        if (data && !error) {
          newGrievance = {
            id: data.id,
            tokenNumber: data.reference_token,
            category: data.category,
            title: data.title,
            ward: data.ward_no,
            applicantName: data.applicant_name,
            applicantPhone: data.applicant_phone,
            description: data.description,
            priority: data.priority,
            status: data.status,
            createdAt: data.created_at,
            assignedOfficer: 'Pending Assignment',
            slaDueAt: data.sla_due_at,
            timeline: [
              {
                title: 'Grievance Registered',
                time: new Date(data.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                note: `Reference token ${data.reference_token} formally recorded in Supabase.`
              }
            ]
          };
          console.log('✅ Grievance created in live Supabase:', data);
          showToast(`Grievance formally registered in Supabase: ${data.reference_token}`, 'success');
        } else if (error) {
          console.warn('Supabase insert rejected by RLS or Auth:', error);
          showToast(error, 'warning', 5000);
        }
      } catch (err) {
        console.warn('Supabase insert exception:', err);
      }
    }

    // 2. Local State sync for offline/demo fallback
    if (!newGrievance) {
      newGrievance = GramlinkState.addComplaint(payload);
    } else {
      // Also cache in local state so tracker and resident history see it instantly
      const all = GramlinkState.getComplaints();
      all.unshift(newGrievance);
      localStorage.setItem('gramlink_complaints', JSON.stringify(all));
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🚀 Submit Grievance to Panchayat';
    }

    // Open Success Modal
    const modal = document.getElementById('submissionSuccessModal');
    const tokenDisplay = document.getElementById('generatedTokenDisplay');
    const trackBtn = document.getElementById('trackThisTokenBtn');

    if (tokenDisplay) tokenDisplay.textContent = newGrievance.tokenNumber;
    if (trackBtn) trackBtn.href = `complaint-track.html?token=${newGrievance.tokenNumber}`;
    if (modal) modal.classList.add('open');

    form.reset();
    if (charDisplay) charDisplay.textContent = '0 / 500';
    if (previewContainer) previewContainer.style.display = 'none';
  });

  // Modal actions
  const successModal = document.getElementById('submissionSuccessModal');
  const copyBtn = document.getElementById('copyTokenBtn');
  const closeSuccessBtn = document.getElementById('closeSuccessModalBtn');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const token = document.getElementById('generatedTokenDisplay')?.textContent?.trim();
      if (token) {
        navigator.clipboard.writeText(token).then(() => {
          showToast(`Copied ${token} to clipboard!`, 'success');
          copyBtn.textContent = '✓ Copied!';
          setTimeout(() => copyBtn.textContent = '📋 Copy Token', 2000);
        });
      }
    });
  }

  if (closeSuccessBtn && successModal) {
    closeSuccessBtn.addEventListener('click', () => {
      successModal.classList.remove('open');
    });
  }
}

/* --------------------------------------------------------------------------
   COMPLAINT TRACKING CONTROLLER
   -------------------------------------------------------------------------- */
function initTrackingView() {
  const form = document.getElementById('trackSearchForm');
  const input = document.getElementById('trackSearchTokenInput');
  const quickBtns = document.querySelectorAll('.quick-token-btn');

  if (!input) return;

  // Handle Search function
  window.performSearch = async function (tokenToSearch) {
    const cleanToken = (tokenToSearch || '').trim().toUpperCase();
    if (!cleanToken) return;

    input.value = cleanToken;

    const emptyState = document.getElementById('trackEmptyState');
    const notFoundState = document.getElementById('trackNotFoundState');
    const resultContainer = document.getElementById('trackResultContainer');

    // Show Loading indicator in results area
    if (emptyState) emptyState.style.display = 'none';
    if (notFoundState) notFoundState.style.display = 'none';
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.style.opacity = '0.5';
    }

    let complaint = null;

    // 1. Query live Supabase PostgreSQL table
    if (window.GramlinkAPI && window.GramlinkAPI.complaints) {
      try {
        const { data: live, error } = await window.GramlinkAPI.complaints.getByToken(cleanToken);
        if (live && !error) {
          complaint = {
            id: live.id,
            tokenNumber: live.reference_token,
            category: live.category,
            categoryName: live.category,
            title: live.title,
            ward: live.ward_no,
            applicantName: live.applicant_name,
            applicantPhone: live.applicant_phone,
            description: live.description,
            priority: live.priority,
            status: live.status,
            createdAt: live.created_at,
            assignedOfficer: 'Santosh Jadhav (Water Works Supervisor)',
            resolutionNotes: live.resolution_notes,
            timeline: (live.complaint_status_history && live.complaint_status_history.length > 0)
              ? live.complaint_status_history.map(h => ({
                  title: `Status: ${h.new_status}`,
                  time: new Date(h.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                  note: h.notes || 'Verified update logged in Supabase.'
                }))
              : [
                  {
                    title: 'Grievance Registered',
                    time: new Date(live.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    note: 'Officially registered in Supabase PostgreSQL.'
                  }
                ]
          };
        }
      } catch (err) {
        console.warn('Supabase token query note:', err);
      }
    }

    // 2. Fallback to local state
    if (!complaint) {
      complaint = GramlinkState.getComplaintByToken(cleanToken);
    }

    if (resultContainer) resultContainer.style.opacity = '1';

    if (!complaint) {
      if (emptyState) emptyState.style.display = 'none';
      if (resultContainer) resultContainer.style.display = 'none';
      if (notFoundState) notFoundState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (notFoundState) notFoundState.style.display = 'none';
    if (resultContainer) resultContainer.style.display = 'block';

    renderComplaintDetails(complaint);
  };

  // Listen to form submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      performSearch(input.value);
    });
  }

  // Quick Demo Buttons
  quickBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const token = e.currentTarget.getAttribute('data-token');
      performSearch(token);
    });
  });

  // Auto-search from URL Query Param ?token=...
  const urlParams = new URLSearchParams(window.location.search);
  const initialToken = urlParams.get('token');
  if (initialToken) {
    performSearch(initialToken);
  }

  // Star Ratings feedback
  document.querySelectorAll('.rating-star').forEach(star => {
    star.addEventListener('click', (e) => {
      const rating = e.currentTarget.getAttribute('data-rating');
      showToast(`Thank you! Recorded ${rating}-star feedback for this service.`, 'success');
      document.querySelectorAll('.rating-star').forEach((s, idx) => {
        s.style.opacity = idx < rating ? '1' : '0.4';
      });
    });
  });
}

/**
 * Render Complaint Details and Timeline Stepper
 */
function renderComplaintDetails(c) {
  document.getElementById('resultTitle').textContent = c.title;
  document.getElementById('resultToken').textContent = c.tokenNumber;
  document.getElementById('resultCreatedDate').textContent = new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  document.getElementById('resultDescription').textContent = c.description;
  document.getElementById('resultCategory').textContent = c.categoryName || c.category;
  document.getElementById('resultWard').textContent = c.ward;
  document.getElementById('resultOfficer').textContent = c.assignedOfficer || 'Awaiting Field Assignment';

  // Badges
  const statusBadge = document.getElementById('resultStatusBadge');
  if (statusBadge) {
    statusBadge.className = 'badge';
    if (c.status === 'Resolved') statusBadge.classList.add('badge-resolved');
    else if (c.status === 'In Progress') statusBadge.classList.add('badge-progress');
    else statusBadge.classList.add('badge-pending');
    statusBadge.textContent = c.status;
  }

  const priorityBadge = document.getElementById('resultPriorityBadge');
  if (priorityBadge) {
    priorityBadge.textContent = `${c.priority} Priority`;
  }

  // Stepper Visual Nodes
  const stepper = document.getElementById('stepperNodesContainer');
  if (stepper) {
    if (c.status === 'Resolved') {
      stepper.innerHTML = `
        <div class="timeline-step completed"><div class="step-node">✓</div><div class="step-title">Registered</div><div class="step-time">Completed</div></div>
        <div class="timeline-step completed"><div class="step-node">✓</div><div class="step-title">Verified</div><div class="step-time">Inspected</div></div>
        <div class="timeline-step completed"><div class="step-node">✓</div><div class="step-title">In Progress</div><div class="step-time">Action Taken</div></div>
        <div class="timeline-step completed"><div class="step-node">✓</div><div class="step-title">Resolved</div><div class="step-time">Verified Closed</div></div>
      `;
    } else if (c.status === 'In Progress') {
      stepper.innerHTML = `
        <div class="timeline-step completed"><div class="step-node">✓</div><div class="step-title">Registered</div><div class="step-time">Completed</div></div>
        <div class="timeline-step completed"><div class="step-node">✓</div><div class="step-title">Verified</div><div class="step-time">Inspected</div></div>
        <div class="timeline-step active"><div class="step-node">3</div><div class="step-title">In Progress</div><div class="step-time">Field Work Underway</div></div>
        <div class="timeline-step"><div class="step-node">4</div><div class="step-title">Resolution</div><div class="step-time">Pending Closure</div></div>
      `;
    } else {
      stepper.innerHTML = `
        <div class="timeline-step completed"><div class="step-node">✓</div><div class="step-title">Registered</div><div class="step-time">Ticket Created</div></div>
        <div class="timeline-step active"><div class="step-node">2</div><div class="step-title">Verification</div><div class="step-time">Gram Sevak Queue</div></div>
        <div class="timeline-step"><div class="step-node">3</div><div class="step-title">Assignment</div><div class="step-time">Pending Officer</div></div>
        <div class="timeline-step"><div class="step-node">4</div><div class="step-title">Resolution</div><div class="step-time">Pending Action</div></div>
      `;
    }
  }

  // Activity Log List
  const listContainer = document.getElementById('resultTimelineList');
  if (listContainer && c.timeline) {
    listContainer.innerHTML = c.timeline.map(item => `
      <div style="background: var(--surface-subtle); padding: 0.85rem 1rem; border-radius: var(--radius-sm); border-left: 3px solid var(--primary-600); display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <strong style="font-size: 0.885rem; color: var(--primary-900); display: block;">${item.title}</strong>
          <span style="font-size: 0.825rem; color: var(--text-muted);">${item.note}</span>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-subtle);">${item.time}</span>
      </div>
    `).join('');
  }

  // Resolution Notes box if resolved
  const proofBox = document.getElementById('resolutionProofBox');
  const proofText = document.getElementById('resolutionNotesText');
  if (proofBox && proofText) {
    if (c.status === 'Resolved' && c.resolutionNotes) {
      proofText.textContent = c.resolutionNotes;
      proofBox.style.display = 'block';
    } else {
      proofBox.style.display = 'none';
    }
  }
}
