/**
 * ============================================================================
 * GRAMLINK 360 - Announcements Controller (Supabase Integrated)
 * ============================================================================
 * Live database query to public.announcements, category filters, search,
 * loading skeletons, error handling, and full agenda modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAnnouncementsView();
});

function initAnnouncementsView() {
  const container = document.getElementById('announcementsListContainer');
  const searchInput = document.getElementById('announcementSearchInput');
  const filterBtns = document.querySelectorAll('#announcementCategoryFilters button');
  const emptyState = document.getElementById('noAnnouncementsFound');

  if (!container) return;

  let currentCategory = 'all';
  let searchQuery = '';
  let announcementsData = [];

  function showLoading() {
    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = Array(3).fill(0).map(() => `
      <div class="announcement-card skeleton-loader" style="height: 140px; opacity: 0.6; border-radius: var(--radius-md);"></div>
    `).join('');
  }

  async function loadAnnouncements() {
    showLoading();

    let loadedFromDb = false;

    if (window.GramlinkAPI && window.GramlinkAPI.announcements) {
      try {
        const { data, error } = await window.GramlinkAPI.announcements.list(currentCategory, searchQuery);
        if (!error && data && data.length > 0) {
          announcementsData = data.map(a => ({
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
          loadedFromDb = true;
          renderList(announcementsData);
          return;
        } else if (error) {
          console.warn('Supabase announcements query note:', error);
        }
      } catch (err) {
        console.warn('Supabase announcements exception:', err);
      }
    }

    // Fallback to local state if offline or no cloud records found
    if (!loadedFromDb) {
      const all = GramlinkState.getAnnouncements();
      announcementsData = all.filter(item => {
        const matchCat = currentCategory === 'all' || item.category.toLowerCase() === currentCategory.toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        const matchQuery = !q ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q);
        return matchCat && matchQuery;
      });
      renderList(announcementsData);
    }
  }

  function renderList(list) {
    if (!container) return;

    const filtered = (list || []).filter(item => {
      const q = searchQuery.toLowerCase().trim();
      return !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = filtered.map(item => {
      const dateParts = (item.date || '15 Oct').split(' ');
      const day = dateParts[0] || '15';
      const month = dateParts[1] || 'Oct';

      return `
        <div class="announcement-card reveal revealed">
          <div class="announcement-date-badge">
            <span class="day">${day}</span>
            <span class="month">${month}</span>
          </div>

          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
              <span class="badge ${item.isUrgent ? 'badge-urgent' : 'badge-progress'}">
                ${item.isUrgent ? 'Urgent Notice' : item.category}
              </span>
              <span style="font-size: 0.8rem; color: var(--text-subtle);">
                📍 ${item.venue} • ⏰ ${item.time}
              </span>
            </div>

            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--primary-900);">
              ${item.title}
            </h3>

            <p style="font-size: 0.925rem; line-height: 1.6; margin-bottom: 0.85rem; color: var(--text-muted);">
              ${item.description}
            </p>

            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; border-top: 1px solid var(--surface-subtle); padding-top: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--primary-700);">
                Authorized by: ${item.author}
              </span>
              <button class="btn btn-secondary btn-sm read-ann-btn" data-id="${item.id}" style="padding: 0.35rem 0.65rem;">
                Read Full Agenda →
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers to read modal buttons
    container.querySelectorAll('.read-ann-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openAnnouncementModal(id);
      });
    });
  }

  // Filter click handlers
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentCategory = e.currentTarget.getAttribute('data-category');
      loadAnnouncements();
    });
  });

  // Search input typing with debounce
  let searchTimer;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = e.target.value;
        loadAnnouncements();
      }, 250);
    });
  }

  function openAnnouncementModal(id) {
    const ann = announcementsData.find(a => a.id === id);
    if (!ann) return;

    const modal = document.getElementById('announcementModal');
    if (!modal) return;

    const badge = document.getElementById('modalAnnBadge');
    if (badge) {
      badge.className = `badge ${ann.isUrgent ? 'badge-urgent' : 'badge-progress'}`;
      badge.textContent = ann.isUrgent ? 'Urgent Notice' : ann.category;
    }

    document.getElementById('modalAnnTitle').textContent = ann.title;
    document.getElementById('modalAnnDateTime').textContent = `${ann.date} • ${ann.time}`;
    document.getElementById('modalAnnVenue').textContent = ann.venue;
    document.getElementById('modalAnnDescription').textContent = ann.description;
    document.getElementById('modalAnnAuthor').textContent = ann.author;

    modal.classList.add('open');

    const closeModal = () => modal.classList.remove('open');
    document.getElementById('closeAnnModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('closeAnnModalBtn2')?.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  loadAnnouncements();
}
