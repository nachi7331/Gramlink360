/**
 * GRAMLINK 360 - Main Frontend Controller & Global Interactions
 * Handles navigation, mobile drawer, scroll animations, toasts, and UI bindings
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileDrawer();
  initScrollReveals();
  initLanguageSwitcher();
  initUserSessionBadge();
  initQuickTrackWidgets();
  initHomeAnnouncements();
});

/* --------------------------------------------------------------------------
   STICKY HEADER SCROLL EFFECT
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   MOBILE NAVIGATION DRAWER
   -------------------------------------------------------------------------- */
function initMobileDrawer() {
  const openBtn = document.querySelector('.mobile-toggle-btn');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const closeBtn = document.querySelector('.mobile-drawer-close');

  if (!openBtn || !drawer) return;

  const toggleDrawer = (isOpen) => {
    drawer.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  openBtn.addEventListener('click', () => toggleDrawer(true));
  if (closeBtn) closeBtn.addEventListener('click', () => toggleDrawer(false));

  drawer.addEventListener('click', (e) => {
    if (e.target === drawer || e.target.classList.contains('mobile-nav-link')) {
      toggleDrawer(false);
    }
  });
}

/* --------------------------------------------------------------------------
   INTERSECTION OBSERVER SCROLL REVEALS
   -------------------------------------------------------------------------- */
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   LANGUAGE SWITCHER
   -------------------------------------------------------------------------- */
function initLanguageSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedLang = e.currentTarget.getAttribute('data-lang');
      if (typeof setLanguage === 'function') {
        setLanguage(selectedLang);
        showToast(selectedLang === 'mr' ? 'मराठी भाषा निवडली आहे' : 'Switched to English', 'success');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   USER SESSION BADGE IN NAVIGATION
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   USER SESSION BADGE IN NAVIGATION
   -------------------------------------------------------------------------- */
async function initUserSessionBadge() {
  const isInsidePages = window.location.pathname.includes('/pages/');
  const prefix = isInsidePages ? '' : 'pages/';

  // 1. Initial render from cached state
  let user = GramlinkState.getCurrentUser();

  // 2. Check live Supabase Auth session if API is loaded
  if (window.GramlinkAPI && window.GramlinkAPI.auth) {
    try {
      const sessionData = await window.GramlinkAPI.auth.getSession();
      if (sessionData && sessionData.user) {
        const profile = sessionData.profile || {};
        user = {
          id: sessionData.user.id,
          name: profile.full_name || sessionData.user.email?.split('@')[0] || 'Resident',
          role: profile.role === 'administrator' ? 'admin' : (profile.role || 'citizen'),
          ward: profile.ward_no || 'Ward 2 - Shivaji Chowk'
        };
        GramlinkState.setCurrentUser(user);
      } else if (!user || !user.isDemo) {
        // No session active
        // GramlinkState.logout();
      }
    } catch (e) {
      console.warn('Session check note:', e);
    }
  }

  const authNavSlot = document.querySelectorAll('.nav-auth-slot');

  authNavSlot.forEach(slot => {
    if (user && user.name) {
      const targetDash = user.role === 'admin' 
        ? `${prefix}admin-dashboard.html` 
        : `${prefix}resident-dashboard.html`;

      slot.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <a href="${targetDash}" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
            <span>${user.name} (${user.role === 'admin' ? 'Admin' : 'Resident'})</span>
          </a>
          <button class="btn btn-secondary btn-sm global-logout-btn" title="Sign out" style="padding: 0.45rem 0.65rem;">
            🚪
          </button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <a href="${prefix}auth.html" class="btn btn-primary btn-sm" data-i18n="nav_login">
          Login / Register
        </a>
      `;
    }
  });

  // Attach logout handler
  document.querySelectorAll('.global-logout-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (window.GramlinkAPI && window.GramlinkAPI.auth) {
        await window.GramlinkAPI.auth.signOut();
      }
      GramlinkState.logout();
      showToast('Signed out successfully', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 600);
    });
  });
}

/* --------------------------------------------------------------------------
   QUICK TRACK WIDGET
   -------------------------------------------------------------------------- */
function initQuickTrackWidgets() {
  const trackForms = document.querySelectorAll('.quick-track-form');
  trackForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="text"]');
      const token = input ? input.value.trim() : '';

      if (!token) {
        showToast('Please enter a 10-character reference token (e.g. GL-2026-1042)', 'warning');
        return;
      }

      // Check if we are already on complaint-track.html
      const isTrackPage = window.location.pathname.includes('complaint-track.html');
      if (isTrackPage) {
        if (typeof performSearch === 'function') {
          performSearch(token);
        }
      } else {
        // Redirect to tracking page with query param
        const basePath = window.location.pathname.includes('/pages/') ? '' : 'pages/';
        window.location.href = `${basePath}complaint-track.html?token=${encodeURIComponent(token)}`;
      }
    });
  });
}

/* --------------------------------------------------------------------------
   TOAST NOTIFICATION ENGINE
   -------------------------------------------------------------------------- */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span style="font-size: 1.15rem;">${iconMap[type] || 'ℹ️'}</span>
    <div style="flex: 1; font-size: 0.9rem; font-weight: 500; color: #15241d;">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* --------------------------------------------------------------------------
   HOMEPAGE LIVE ANNOUNCEMENTS SYNC (SUPABASE)
   -------------------------------------------------------------------------- */
async function initHomeAnnouncements() {
  const container = document.getElementById('homeAnnouncementsContainer');
  if (!container || !window.GramlinkAPI || !window.GramlinkAPI.announcements) return;

  try {
    const { data, error } = await window.GramlinkAPI.announcements.list('all');
    if (!error && data && data.length > 0) {
      const top2 = data.slice(0, 2);
      container.innerHTML = top2.map(item => {
        const dateParts = (item.event_date || '15 Oct').split(' ');
        const day = dateParts[0] || '15';
        const month = dateParts[1] || 'Oct';
        return `
          <div class="announcement-card reveal revealed">
            <div class="announcement-date-badge">
              <span class="day">${day}</span>
              <span class="month">${month}</span>
            </div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                <span class="badge ${item.is_urgent ? 'badge-urgent' : 'badge-progress'}">
                  ${item.is_urgent ? 'Urgent Notice' : item.category}
                </span>
                <span style="font-size: 0.8rem; color: var(--text-subtle);">📍 ${item.venue} • ⏰ ${item.event_time || '10:00 AM'}</span>
              </div>
              <h3 style="font-size: 1.15rem; margin-bottom: 0.35rem;">${item.title}</h3>
              <p style="font-size: 0.9rem; margin-bottom: 0.75rem;">${item.description}</p>
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--primary-700);">Published by: ${item.author_designation || 'Panchayat Administration'}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    console.warn('Home announcements sync notice:', e);
  }
}

// Export global helper for other scripts
window.showToast = showToast;
