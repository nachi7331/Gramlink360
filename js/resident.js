/**
 * ============================================================================
 * GRAMLINK 360 - Resident Portal Controller (Supabase Integrated)
 * ============================================================================
 * Fetches authenticated citizen's personal complaint history from public.complaints
 * using Supabase Auth session and Row Level Security (RLS).
 * Supports search, status/category filtering, real stats, and mobile card views.
 */

document.addEventListener('DOMContentLoaded', () => {
  initResidentPortal();
});

async function initResidentPortal() {
  const tableBody = document.getElementById('residentComplaintsTableBody');
  const cardList = document.getElementById('residentComplaintsCardList');
  const logoutBtn = document.getElementById('residentLogoutBtn');
  const nameEl = document.getElementById('residentWelcomeName');
  const wardEl = document.getElementById('residentWardBadge');

  const searchInput = document.getElementById('residentSearchInput');
  const statusFilterSelect = document.getElementById('residentStatusFilter');
  const categoryFilterSelect = document.getElementById('residentCategoryFilter');

  let rawComplaints = [];
  let currentSearchQuery = '';

  // Show loading skeleton in table and mobile list
  function showLoadingState() {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-subtle);">
            <div class="skeleton-loader" style="height: 32px; width: 60%; margin: 0 auto 0.75rem auto; border-radius: var(--radius-sm);"></div>
            <div class="skeleton-loader" style="height: 24px; width: 45%; margin: 0 auto 0.75rem auto; border-radius: var(--radius-sm);"></div>
            <span>⏳ Loading your grievance records from Supabase PostgreSQL...</span>
          </td>
        </tr>
      `;
    }
    if (cardList) {
      cardList.innerHTML = `
        <div class="skeleton-loader" style="height: 120px; border-radius: var(--radius-md); margin-bottom: 1rem;"></div>
        <div class="skeleton-loader" style="height: 120px; border-radius: var(--radius-md);"></div>
      `;
    }
  }

  showLoadingState();

  // 1. Verify Active Supabase Auth Session
  let activeUser = null;
  if (window.GramlinkAPI && window.GramlinkAPI.auth) {
    try {
      const { session, user, profile } = await window.GramlinkAPI.auth.getSession();
      if (session && user) {
        activeUser = {
          id: user.id,
          name: profile?.full_name || user.email?.split('@')[0] || 'Resident',
          phone: profile?.phone || '',
          ward: profile?.ward_no || 'Ward 2 - Shivaji Chowk',
          role: profile?.role || 'resident'
        };
      }
    } catch (e) {
      console.warn('Session verification notice:', e);
    }
  }

  // Fallback to local state if testing offline demo session
  if (!activeUser) {
    activeUser = GramlinkState.getCurrentUser();
  }

  // If still not authenticated, display Authentication Required state
  if (!activeUser) {
    if (nameEl) nameEl.textContent = 'Guest Citizen';
    const unauthHtml = `
      <div style="text-align: center; padding: 3rem 1.5rem; background: var(--surface-subtle); border-radius: var(--radius-md);">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔒</div>
        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--primary-900);">Authentication Required</h3>
        <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 1.25rem auto; font-size: 0.9rem; line-height: 1.5;">
          Under PostgreSQL Row Level Security (RLS), personal grievance history is strictly restricted to authenticated citizen accounts. Please sign in to view your filed complaints.
        </p>
        <a href="auth.html" class="btn btn-primary btn-sm">Sign In to Resident Portal</a>
      </div>
    `;

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 0;">${unauthHtml}</td>
        </tr>
      `;
    }
    if (cardList) {
      cardList.innerHTML = unauthHtml;
    }
    return;
  }

  // Set Profile Header details
  if (nameEl) nameEl.textContent = activeUser.name;
  if (wardEl) wardEl.textContent = activeUser.ward || 'Ward 2 - Shivaji Chowk';

  // 2. Fetch User's Complaints from Supabase
  let dbError = null;

  if (window.GramlinkAPI && window.GramlinkAPI.complaints) {
    try {
      const { data, error } = await window.GramlinkAPI.complaints.listForResident();
      if (!error && Array.isArray(data)) {
        rawComplaints = data.map(c => ({
          id: c.id,
          tokenNumber: c.reference_token,
          title: c.title,
          category: c.category,
          ward: c.ward_no,
          status: c.status,
          priority: c.priority || 'Medium',
          createdAt: c.created_at,
          isCloud: true
        }));
      } else if (error) {
        console.warn('Supabase resident complaints fetch notice:', error);
        dbError = error;
      }
    } catch (err) {
      dbError = err.message || 'Database query error';
    }
  }

  // Fallback to local state if offline demo session or if no cloud records found
  if (rawComplaints.length === 0 && !dbError) {
    const localAll = GramlinkState.getComplaints();
    rawComplaints = localAll.filter(c => 
      c.applicantName?.toLowerCase() === activeUser.name?.toLowerCase() ||
      c.tokenNumber === 'GL-2026-1042'
    ).map(c => ({
      ...c,
      isDemo: true
    }));
  }

  // 3. Render Real KPI Counters
  function renderMetrics() {
    const total = rawComplaints.length;
    const active = rawComplaints.filter(c => c.status !== 'Resolved').length;
    const resolved = rawComplaints.filter(c => c.status === 'Resolved').length;
    const rate = total > 0 ? `${Math.round((resolved / total) * 100)}%` : '0%';

    const totalEl = document.getElementById('residentTotalCount');
    const activeEl = document.getElementById('residentActiveCount');
    const resolvedEl = document.getElementById('residentResolvedCount');
    const rateEl = document.getElementById('residentResolutionRate');

    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (resolvedEl) resolvedEl.textContent = resolved;
    if (rateEl) rateEl.textContent = rate;
  }

  renderMetrics();

  // 4. Filtering and Search Logic
  function getFilteredComplaints() {
    const statusVal = statusFilterSelect ? statusFilterSelect.value : 'all';
    const catVal = categoryFilterSelect ? categoryFilterSelect.value : 'all';
    const q = currentSearchQuery.toLowerCase().trim();

    return rawComplaints.filter(c => {
      const matchStatus = (statusVal === 'all' || c.status === statusVal);
      const matchCat = (catVal === 'all' || (c.category || '').toLowerCase() === catVal.toLowerCase());
      const matchSearch = !q ||
        (c.tokenNumber || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.ward || '').toLowerCase().includes(q);

      return matchStatus && matchCat && matchSearch;
    });
  }

  // 5. Render Desktop Table and Mobile Touch Card Views
  function renderFilteredViews() {
    const filtered = getFilteredComplaints();

    // Render Table View (Desktop)
    if (tableBody) {
      if (dbError && rawComplaints.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2.5rem 1.5rem; background: #fffaf0;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
              <h4 style="color: #9a3412; margin-bottom: 0.35rem;">Database Connection Notice</h4>
              <p style="font-size: 0.85rem; color: #c2410c; max-width: 480px; margin: 0 auto 1rem auto;">
                ${dbError}
              </p>
              <button class="btn btn-secondary btn-sm" onclick="initResidentPortal()">🔄 Retry</button>
            </td>
          </tr>
        `;
      } else if (rawComplaints.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📋</div>
              <h4 style="margin-bottom: 0.35rem; color: var(--primary-900);">No Grievances Filed Yet</h4>
              <p style="font-size: 0.85rem; margin-bottom: 1.25rem;">
                You haven't submitted any complaints to Gram Panchayat Shivrajpur.
              </p>
              <a href="complaint-submit.html" class="btn btn-primary btn-sm">✍️ Lodge Your First Complaint</a>
            </td>
          </tr>
        `;
      } else if (filtered.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
              No grievances found matching the current search or filters.
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = filtered.map(c => {
          let badgeClass = 'badge-pending';
          if (c.status === 'Resolved') badgeClass = 'badge-resolved';
          else if (c.status === 'In Progress') badgeClass = 'badge-progress';

          const createdDate = new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

          return `
            <tr>
              <td>
                <strong style="color: var(--primary-900); font-family: var(--font-heading);">${c.tokenNumber}</strong>
                <small style="display: block; font-size: 0.7rem; color: var(--text-subtle);">
                  ${c.isCloud ? '☁️ Supabase' : '📋 Demo'}
                </small>
              </td>
              <td>
                <strong>${c.title}</strong>
                <small style="display: block; color: var(--text-subtle);">${c.category}</small>
              </td>
              <td>${c.ward}</td>
              <td><span class="badge ${badgeClass}">${c.status}</span></td>
              <td>${createdDate}</td>
              <td>
                <a href="complaint-track.html?token=${c.tokenNumber}" class="btn btn-secondary btn-sm" style="padding: 0.3rem 0.65rem;">
                  🔍 Track →
                </a>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Mobile Card View (< 860px)
    if (cardList) {
      if (dbError && rawComplaints.length === 0) {
        cardList.innerHTML = `
          <div style="text-align: center; padding: 2rem; background: #fffaf0; border-radius: var(--radius-md); border: 1px solid #fed7aa; color: #9a3412;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
            <h4>Database Connection Notice</h4>
            <p style="font-size: 0.85rem; margin-bottom: 1rem;">${dbError}</p>
            <button class="btn btn-secondary btn-sm" onclick="initResidentPortal()">🔄 Retry</button>
          </div>
        `;
      } else if (rawComplaints.length === 0) {
        cardList.innerHTML = `
          <div style="text-align: center; padding: 2rem; background: #fff; border-radius: var(--radius-md); border: 1px solid var(--surface-border); color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
            <h4 style="margin-bottom: 0.35rem; color: var(--primary-900);">No Grievances Filed Yet</h4>
            <p style="font-size: 0.85rem; margin-bottom: 1rem;">You haven't submitted any complaints yet.</p>
            <a href="complaint-submit.html" class="btn btn-primary btn-sm">✍️ Lodge Complaint</a>
          </div>
        `;
      } else if (filtered.length === 0) {
        cardList.innerHTML = `
          <div style="text-align: center; padding: 2rem; background: #fff; border-radius: var(--radius-md); border: 1px solid var(--surface-border); color: var(--text-muted);">
            No grievances found matching the current search or filters.
          </div>
        `;
      } else {
        cardList.innerHTML = filtered.map(c => {
          let badgeClass = 'badge-pending';
          if (c.status === 'Resolved') badgeClass = 'badge-resolved';
          else if (c.status === 'In Progress') badgeClass = 'badge-progress';

          const createdDate = new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

          return `
            <div class="triage-card">
              <div class="triage-card-header">
                <div>
                  <strong style="color: var(--primary-900); font-size: 1.05rem;">${c.tokenNumber}</strong>
                  <small style="display: block; color: var(--text-subtle); font-size: 0.75rem;">
                    📍 ${c.ward} • ${createdDate}
                  </small>
                </div>
                <span class="badge ${badgeClass}">${c.status}</span>
              </div>

              <div class="triage-card-body">
                <strong style="color: var(--text-main); display: block; margin-bottom: 0.25rem;">${c.title}</strong>
                <small style="color: var(--text-subtle);">${c.category}</small>
              </div>

              <div class="triage-card-footer">
                <span style="font-size: 0.75rem; color: var(--text-subtle);">
                  ${c.isCloud ? '☁️ Supabase PostgreSQL' : '📋 Local Demo'}
                </span>
                <a href="complaint-track.html?token=${c.tokenNumber}" class="btn btn-secondary btn-sm" style="padding: 0.3rem 0.65rem;">
                  🔍 Track Status →
                </a>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  renderFilteredViews();

  // 6. Bind Search & Filter Listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderFilteredViews();
    });
  }

  if (statusFilterSelect) {
    statusFilterSelect.addEventListener('change', () => {
      renderFilteredViews();
    });
  }

  if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener('change', () => {
      renderFilteredViews();
    });
  }

  // 7. Logout listener
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (window.GramlinkAPI && window.GramlinkAPI.auth) {
        await window.GramlinkAPI.auth.signOut();
      }
      GramlinkState.logout();
      if (typeof showToast === 'function') {
        showToast('Signed out of resident portal', 'info');
      }
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 500);
    });
  }
}
