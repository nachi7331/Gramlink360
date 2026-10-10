/**
 * ============================================================================
 * GRAMLINK 360 - Services Directory Controller (Supabase Integrated)
 * ============================================================================
 * Live database query to public.services, category filtering, search,
 * loading skeletons, error handling, and service detail modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  initServicesView();
});

function initServicesView() {
  const container = document.getElementById('servicesGridContainer');
  const searchInput = document.getElementById('serviceSearchInput');
  const filterBtns = document.querySelectorAll('#categoryFilterButtons button');
  const emptyState = document.getElementById('noServicesFound');
  const resetBtn = document.getElementById('resetServiceSearchBtn');

  let currentCategory = 'all';
  let searchQuery = '';
  let servicesData = [];

  const categoryIcons = {
    health: '🩺',
    agriculture: '🌾',
    utilities: '💧',
    documents: '📜',
    education: '📚',
    general: '🏛️'
  };

  // Show loading skeleton
  function showLoading() {
    if (!container) return;
    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = Array(6).fill(0).map(() => `
      <div class="service-card skeleton-loader" style="height: 240px; opacity: 0.6; border-radius: var(--radius-md);"></div>
    `).join('');
  }

  // Fetch from Supabase with fallback to local state
  async function loadServices() {
    showLoading();

    let loadedFromDb = false;

    if (window.GramlinkAPI && window.GramlinkAPI.services) {
      try {
        const { data, error } = await window.GramlinkAPI.services.list(currentCategory, searchQuery);
        if (!error && data && data.length > 0) {
          servicesData = data.map(s => ({
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
          loadedFromDb = true;
          renderServices(servicesData);
          return;
        } else if (error) {
          console.warn('Supabase services query note:', error);
        }
      } catch (err) {
        console.warn('Supabase services query exception:', err);
      }
    }

    // Fallback to local state if offline or no cloud records match
    if (!loadedFromDb) {
      const allServices = GramlinkState.getServices();
      servicesData = allServices.filter(service => {
        const matchesCategory = currentCategory === 'all' || service.category === currentCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
          service.title.toLowerCase().includes(q) || 
          service.dept.toLowerCase().includes(q) || 
          service.description.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      });
      renderServices(servicesData);
    }
  }

  function renderServices(list) {
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = list.map(item => `
      <div class="service-card reveal revealed">
        <div class="service-icon-box">
          ${categoryIcons[item.category] || '🏛️'}
        </div>
        <span class="badge badge-progress" style="align-self: flex-start; margin-bottom: 0.65rem; font-size: 0.725rem;">
          ${item.dept}
        </span>
        <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--primary-900);">${item.title}</h3>
        <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem;">${item.description}</p>
        <div style="font-size: 0.8rem; color: var(--text-subtle); margin-bottom: 1rem;">
          📍 ${item.location}
        </div>
        <div class="service-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--surface-subtle); padding-top: 0.75rem;">
          <span style="font-size: 0.75rem; color: var(--text-subtle);">${item.timings.split(':')[0]}</span>
          <button class="btn btn-secondary btn-sm service-detail-btn" data-id="${item.id}" style="padding: 0.35rem 0.65rem;">
            View Details →
          </button>
        </div>
      </div>
    `).join('');

    // Attach click listeners to detail buttons
    container.querySelectorAll('.service-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openServiceModal(id);
      });
    });
  }

  // Category Filter clicks
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentCategory = e.currentTarget.getAttribute('data-category');
      loadServices();
    });
  });

  // Search input typing with debounce
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        loadServices();
      }, 250);
    });
  }

  // Reset button in empty state
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      currentCategory = 'all';
      filterBtns.forEach((b, idx) => b.classList.toggle('active', idx === 0));
      loadServices();
    });
  }

  function openServiceModal(serviceId) {
    const service = servicesData.find(s => s.id === serviceId);
    if (!service) return;

    const modal = document.getElementById('serviceDetailsModal');
    if (!modal) return;

    document.getElementById('modalServiceCategory').textContent = service.dept;
    document.getElementById('modalServiceTitle').textContent = service.title;
    document.getElementById('modalServiceDesc').textContent = service.description;
    document.getElementById('modalServiceTimings').textContent = service.timings;
    document.getElementById('modalServiceLocation').textContent = service.location;
    document.getElementById('modalServiceOfficer').textContent = service.officer;
    document.getElementById('modalServiceDept').textContent = service.dept;
    
    const phoneBtn = document.getElementById('modalServicePhone');
    if (phoneBtn) {
      phoneBtn.textContent = `📞 ${service.phone}`;
      phoneBtn.href = `tel:${service.phone.replace(/[^0-9+]/g, '')}`;
    }

    document.getElementById('modalServiceRequirements').textContent = service.requirements || 'No specific documents required.';

    const lodgeBtn = document.getElementById('modalServiceLodgeBtn');
    if (lodgeBtn) {
      lodgeBtn.href = `complaint-submit.html?category=${encodeURIComponent(service.category)}`;
    }

    modal.classList.add('open');

    const closeModal = () => modal.classList.remove('open');
    document.getElementById('closeServiceModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('closeServiceModalBtn2')?.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Initial load
  loadServices();
}
