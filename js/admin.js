/**
 * ============================================================================
 * GRAMLINK 360 - Admin & Sarpanch Control Room Controller (Supabase Integrated)
 * ============================================================================
 * Enforces server-side permissions via Supabase Auth & PostgreSQL Row Level Security.
 * Features:
 * - Search by reference token, applicant name, ward, title
 * - Category and status combined filters
 * - Desktop Table View + Responsive Mobile Touch Card View
 * - Real Data SVG Analytics Chart (computed from live records)
 * - Administrative Status Triage with RLS exception handling
 * - Notice Broadcast and CSV Audit Export
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});

async function initAdminDashboard() {
  const tableBody = document.getElementById('adminComplaintsTableBody');
  const cardList = document.getElementById('adminComplaintsCardList');
  const statusFilterSelect = document.getElementById('adminStatusFilter');
  const categoryFilterSelect = document.getElementById('adminCategoryFilter');
  const searchInput = document.getElementById('adminSearchInput');
  const chartContainer = document.getElementById('adminChartContainer');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const openBroadcastBtn = document.getElementById('openAnnouncementModalBtn');
  const broadcastModal = document.getElementById('broadcastModal');
  const broadcastForm = document.getElementById('broadcastForm');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const headerNameEl = document.getElementById('adminHeaderName');

  let rawComplaints = [];
  let currentSearchQuery = '';

  // Show table skeleton
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-subtle);">
          <div class="skeleton-loader" style="height: 32px; width: 70%; margin: 0 auto 0.75rem auto; border-radius: var(--radius-sm);"></div>
          <span>⏳ Verifying administrator credentials with Supabase PostgreSQL...</span>
        </td>
      </tr>
    `;
  }

  // 1. Strict Permission Verification via Supabase Auth & Profiles Table
  let isAdminAuthorized = false;
  let activeUser = null;

  if (window.GramlinkAPI && window.GramlinkAPI.auth) {
    try {
      const { session, user, profile } = await window.GramlinkAPI.auth.getSession();
      if (session && user) {
        activeUser = user;
        isAdminAuthorized = (profile && profile.role === 'administrator');
        if (headerNameEl && profile?.full_name) {
          headerNameEl.textContent = `${profile.full_name} (Administrator)`;
        }
      }
    } catch (e) {
      console.warn('Admin session check notice:', e);
    }
  }

  // Fallback check for demo test sessions
  const localUser = GramlinkState.getCurrentUser();
  if (!isAdminAuthorized && localUser && localUser.role === 'admin') {
    isAdminAuthorized = true;
    if (headerNameEl && localUser.name) {
      headerNameEl.textContent = `${localUser.name} (Demo Admin)`;
    }
  }

  // Permission Denial State
  if (!isAdminAuthorized) {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem 1.5rem; background: #fffaf0;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛑</div>
            <h3 style="color: #991b1b; margin-bottom: 0.5rem;">Access Restricted: Administrator Privileges Required</h3>
            <p style="color: #7f1d1d; max-width: 580px; margin: 0 auto 1.25rem auto; font-size: 0.9rem; line-height: 1.6;">
              Your current account does not have the <strong>administrator</strong> role. In accordance with PostgreSQL Row Level Security (RLS), direct database updates are rejected at the database kernel level (HTTP 401/403).
            </p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
              <a href="auth.html" class="btn btn-primary btn-sm">Sign In as Administrator</a>
              <a href="../index.html" class="btn btn-secondary btn-sm">Return to Home</a>
            </div>
          </td>
        </tr>
      `;
    }
    if (cardList) cardList.innerHTML = '';
    if (openBroadcastBtn) openBroadcastBtn.disabled = true;
    return;
  }

  // 2. Load Real Complaints from Supabase
  async function loadData() {
    if (window.GramlinkAPI && window.GramlinkAPI.complaints) {
      try {
        const { data, error } = await window.GramlinkAPI.complaints.listAllForAdmin();
        if (!error && Array.isArray(data) && data.length > 0) {
          rawComplaints = data.map(c => ({
            id: c.id,
            tokenNumber: c.reference_token,
            title: c.title,
            category: c.category,
            categoryName: c.category,
            ward: c.ward_no,
            applicantName: c.applicant_name,
            applicantPhone: c.applicant_phone,
            priority: c.priority,
            status: c.status,
            createdAt: c.created_at,
            assignedOfficer: 'Santosh Jadhav (Water Works Supervisor)',
            isCloud: true
          }));
        }
      } catch (e) {
        console.warn('Supabase admin complaints fetch notice:', e);
      }
    }

    // Fallback to local state if offline or no cloud records found
    if (rawComplaints.length === 0) {
      rawComplaints = GramlinkState.getComplaints().map(c => ({
        ...c,
        isDemo: true
      }));
    }

    renderKPIs();
    renderChart();
    renderFilteredViews();
  }

  // 3. Render KPI Counters
  function renderKPIs() {
    const total = rawComplaints.length;
    const pending = rawComplaints.filter(c => c.status === 'Pending').length;
    const progress = rawComplaints.filter(c => c.status === 'In Progress').length;
    const resolved = rawComplaints.filter(c => c.status === 'Resolved').length;

    const totalEl = document.getElementById('adminTotalGrievances');
    const pendEl = document.getElementById('adminPendingCount');
    const progEl = document.getElementById('adminProgressCount');
    const resEl = document.getElementById('adminResolvedCount');

    if (totalEl) totalEl.textContent = total;
    if (pendEl) pendEl.textContent = pending;
    if (progEl) progEl.textContent = progress;
    if (resEl) resEl.textContent = resolved;
  }

  // 4. Render Real Data Chart
  function renderChart() {
    if (!chartContainer) return;

    if (rawComplaints.length === 0) {
      chartContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No grievances registered in database yet.</p>`;
      return;
    }

    const categories = {
      utilities: { label: 'Drinking Water', count: 0, color: '#0284c7' },
      electricity: { label: 'Electricity & Lighting', count: 0, color: '#f59e0b' },
      roads: { label: 'Roads & Drainage', count: 0, color: '#8b5cf6' },
      sanitation: { label: 'Sanitation & Garbage', count: 0, color: '#10b981' },
      health: { label: 'Primary Health PHC', count: 0, color: '#ef4444' },
      ration: { label: 'Fair Price Ration', count: 0, color: '#6366f1' },
      general: { label: 'General Service', count: 0, color: '#64748b' }
    };

    rawComplaints.forEach(c => {
      const key = (c.category || 'general').toLowerCase();
      if (categories[key]) categories[key].count++;
      else categories.general.count++;
    });

    const list = Object.values(categories).filter(c => c.count > 0);
    const maxVal = Math.max(...list.map(c => c.count), 1);

    chartContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        ${list.map(item => {
          const pct = ((item.count / rawComplaints.length) * 100).toFixed(0);
          return `
            <div style="background: var(--surface-subtle); padding: 0.85rem 1rem; border-radius: var(--radius-sm); border-left: 4px solid ${item.color};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <strong style="font-size: 0.825rem; color: var(--primary-900);">${item.label}</strong>
                <span style="font-size: 0.85rem; font-weight: 700; color: ${item.color};">${item.count} (${pct}%)</span>
              </div>
              <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                <div style="width: ${(item.count / maxVal) * 100}%; height: 100%; background: ${item.color};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 5. Filter and Search Logic
  function getFilteredList() {
    const statusVal = statusFilterSelect ? statusFilterSelect.value : 'all';
    const catVal = categoryFilterSelect ? categoryFilterSelect.value : 'all';
    const q = currentSearchQuery.toLowerCase().trim();

    return rawComplaints.filter(c => {
      const matchStatus = (statusVal === 'all' || c.status === statusVal);
      const matchCat = (catVal === 'all' || (c.category || '').toLowerCase() === catVal.toLowerCase());
      const matchSearch = !q ||
        (c.tokenNumber || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.applicantName || '').toLowerCase().includes(q) ||
        (c.applicantPhone || '').toLowerCase().includes(q) ||
        (c.ward || '').toLowerCase().includes(q);

      return matchStatus && matchCat && matchSearch;
    });
  }

  // 6. Render Desktop Table and Mobile Card Views
  function renderFilteredViews() {
    const filtered = getFilteredList();

    // A. Desktop Table View
    if (tableBody) {
      if (filtered.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
              No grievances found matching the current filters.
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = filtered.map(c => `
          <tr>
            <td>
              <strong style="font-family: var(--font-heading); color: var(--primary-900);">${c.tokenNumber}</strong>
              <small style="display: block; font-size: 0.7rem; color: var(--text-subtle);">
                ${c.isCloud ? '☁️ Supabase' : '📋 Demo Record'}
              </small>
            </td>
            <td>
              <strong>${c.title}</strong>
              <small style="display: block; color: var(--text-subtle);">${c.categoryName || c.category}</small>
            </td>
            <td>${c.ward}</td>
            <td>
              <div>${c.applicantName}</div>
              <small style="color: var(--text-subtle);">${c.applicantPhone}</small>
            </td>
            <td>
              <span class="badge ${c.priority === 'Urgent' ? 'badge-urgent' : 'badge-demo'}">
                ${c.priority}
              </span>
            </td>
            <td>
              <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 500;">
                ${c.assignedOfficer}
              </span>
            </td>
            <td>
              <select class="form-control admin-status-select" data-token="${c.tokenNumber}" style="font-size: 0.825rem; padding: 0.35rem 0.65rem; border-radius: var(--radius-sm); font-weight: 600;" aria-label="Change status for ${c.tokenNumber}">
                <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>🔧 In Progress</option>
                <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>✅ Resolved</option>
              </select>
            </td>
            <td>
              <a href="complaint-track.html?token=${c.tokenNumber}" class="btn btn-secondary btn-sm" style="padding: 0.3rem 0.6rem;">
                Inspect →
              </a>
            </td>
          </tr>
        `).join('');
      }
    }

    // B. Mobile Touch Card View (< 860px)
    if (cardList) {
      if (filtered.length === 0) {
        cardList.innerHTML = `
          <div style="text-align: center; padding: 2rem; background: #fff; border-radius: var(--radius-md); border: 1px solid var(--surface-border); color: var(--text-muted);">
            No grievances found matching the current filters.
          </div>
        `;
      } else {
        cardList.innerHTML = filtered.map(c => `
          <div class="triage-card">
            <div class="triage-card-header">
              <div>
                <strong style="color: var(--primary-900); font-size: 1.05rem;">${c.tokenNumber}</strong>
                <small style="display: block; color: var(--text-subtle); font-size: 0.75rem;">
                  📍 ${c.ward} • ${c.isCloud ? '☁️ Supabase Cloud' : '📋 Demo Record'}
                </small>
              </div>
              <span class="badge ${c.priority === 'Urgent' ? 'badge-urgent' : 'badge-demo'}">
                ${c.priority}
              </span>
            </div>

            <div class="triage-card-body">
              <strong style="color: var(--text-main); display: block; margin-bottom: 0.25rem;">${c.title}</strong>
              <small style="color: var(--text-subtle); display: block;">Applicant: ${c.applicantName} (${c.applicantPhone})</small>
            </div>

            <div class="triage-card-footer">
              <div style="flex: 1; min-width: 160px;">
                <label style="font-size: 0.75rem; color: var(--text-subtle); display: block; margin-bottom: 0.2rem;">Status Action:</label>
                <select class="form-control admin-status-select" data-token="${c.tokenNumber}" style="font-size: 0.825rem; padding: 0.35rem 0.5rem; font-weight: 600;" aria-label="Change status for ${c.tokenNumber}">
                  <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                  <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>🔧 In Progress</option>
                  <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>✅ Resolved</option>
                </select>
              </div>

              <a href="complaint-track.html?token=${c.tokenNumber}" class="btn btn-secondary btn-sm" style="padding: 0.45rem 0.75rem;">
                Inspect Timeline →
              </a>
            </div>
          </div>
        `).join('');
      }
    }

    // Attach Status Change Listeners across both desktop and mobile views
    document.querySelectorAll('.admin-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const token = e.target.getAttribute('data-token');
        const newStatus = e.target.value;
        const note = prompt(`Enter resolution notes or field update for ${token}:`, `Status transitioned to ${newStatus} by Panchayat Sarpanch.`);
        
        if (note !== null) {
          e.target.disabled = true;

          // 1. Live update in Supabase PostgreSQL table
          if (window.GramlinkAPI && window.GramlinkAPI.complaints) {
            const { data, error } = await window.GramlinkAPI.complaints.updateStatus(token, newStatus, note);
            if (error) {
              showToast(`RLS Error: ${error}`, 'error');
              console.warn('Update rejected by Supabase RLS:', error);
              renderFilteredViews();
              return;
            }
          }

          // 2. Sync to local state
          GramlinkState.updateComplaintStatus(token, newStatus, note);
          
          // Update in-memory complaint list
          const target = rawComplaints.find(c => c.tokenNumber === token);
          if (target) target.status = newStatus;

          showToast(`Updated ${token} to ${newStatus}! Logged in audit history.`, 'success');
          renderKPIs();
          renderChart();
          renderFilteredViews();
        } else {
          renderFilteredViews();
        }
      });
    });
  }

  // Filter Listeners
  if (statusFilterSelect) statusFilterSelect.addEventListener('change', renderFilteredViews);
  if (categoryFilterSelect) categoryFilterSelect.addEventListener('change', renderFilteredViews);

  // Search input with debounce
  let searchTimer;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentSearchQuery = e.target.value;
        renderFilteredViews();
      }, 200);
    });
  }

  // Broadcast Modal controls
  if (openBroadcastBtn && broadcastModal) {
    openBroadcastBtn.addEventListener('click', () => {
      broadcastModal.classList.add('open');
    });

    const closeModal = () => broadcastModal.classList.remove('open');
    document.getElementById('closeBroadcastModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('closeBroadcastModalBtn2')?.addEventListener('click', closeModal);

    broadcastModal.addEventListener('click', (e) => {
      if (e.target === broadcastModal) closeModal();
    });
  }

  // Broadcast Form Submit with Supabase
  if (broadcastForm) {
    broadcastForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('annTitle').value.trim();
      const category = document.getElementById('annCategory').value;
      const venue = document.getElementById('annVenue').value.trim();
      const desc = document.getElementById('annDesc').value.trim();
      const isUrgent = document.getElementById('annUrgent').checked;

      if (!title || title.length < 5) {
        showToast('Please provide a title with at least 5 characters.', 'error');
        return;
      }
      if (!desc || desc.length < 10) {
        showToast('Please provide notice details with at least 10 characters.', 'error');
        return;
      }

      const submitBtn = broadcastForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Publishing to Supabase...';
      }

      try {
        if (window.GramlinkAPI && window.GramlinkAPI.announcements) {
          const { data, error } = await window.GramlinkAPI.announcements.create({
            title,
            category,
            venue,
            description: desc,
            isUrgent,
            author: 'Sarpanch Sunita Deshmukh'
          });

          if (error) {
            throw new Error(error);
          }
        }

        GramlinkState.addAnnouncement({
          title,
          category,
          venue,
          description: desc,
          isUrgent,
          author: 'Sarpanch Sunita Deshmukh'
        });

        broadcastForm.reset();
        broadcastModal.classList.remove('open');
        showToast('Announcement published successfully to village portal!', 'success');
      } catch (err) {
        console.error('Publish error:', err);
        showToast(`Publishing Error: ${err.message}`, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '🚀 Publish to Village Portal';
        }
      }
    });
  }

  // Export to CSV
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const all = rawComplaints;
      const headers = ['Token Number', 'Title', 'Category', 'Ward', 'Applicant', 'Phone', 'Priority', 'Status', 'Filed Date'];
      const rows = all.map(c => [
        `"${c.tokenNumber}"`,
        `"${(c.title || '').replace(/"/g, '""')}"`,
        `"${c.categoryName || c.category}"`,
        `"${c.ward}"`,
        `"${c.applicantName}"`,
        `"${c.applicantPhone}"`,
        `"${c.priority}"`,
        `"${c.status}"`,
        `"${c.createdAt}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Gramlink360_Grievance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      showToast('Downloaded CSV grievance audit report', 'success');
    });
  }

  // Admin Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (window.GramlinkAPI && window.GramlinkAPI.auth) {
        await window.GramlinkAPI.auth.signOut();
      }
      GramlinkState.logout();
      showToast('Signed out of admin control room', 'info');
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 600);
    });
  }

  // Initial Load
  loadData();
}
