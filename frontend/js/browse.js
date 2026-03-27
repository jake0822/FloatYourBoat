/**
 * browse.js — FloatYourBoat Browse Page Logic
 * Handles search, filter, sort, and listing card rendering.
 */

(function () {
  const { FYB, FYBAuth } = window;

  let allListings = [];
  let userLat = null;
  let userLng = null;
  let popularityAlertShown = false;

  // ── Init ───────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    FYB.initData();
    FYBAuth.renderNav();
    allListings = FYB.getListings().filter(l => l.status === 'available');
    applyFilters();
    setupProximitySort();
  });

  // ── Proximity Sort Setup ───────────────────────────────────────────────────
  function setupProximitySort() {
    const sortSelect = document.getElementById('sort');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', () => {
      if (sortSelect.value === 'proximity') {
        if (userLat === null) {
          requestLocation();
        }
      }
      applyFilters();
    });
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser.', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        applyFilters();
      },
      () => {
        showNotification('Location access denied. Using default sort.', 'warning');
        document.getElementById('sort').value = 'newest';
        applyFilters();
      }
    );
  }

  // ── Filters & Sort ─────────────────────────────────────────────────────────
  function applyFilters() {
    const search   = (document.getElementById('search')?.value || '').toLowerCase().trim();
    const type     = document.getElementById('type')?.value || '';
    const minPrice = parseFloat(document.getElementById('min-price')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price')?.value) || Infinity;
    const sort     = document.getElementById('sort')?.value || 'newest';
    const showSold = document.getElementById('show-sold')?.checked || false;

    let results = FYB.getListings();

    if (!showSold) {
      results = results.filter(l => l.status === 'available');
    }

    if (search) {
      results = results.filter(l =>
        l.title.toLowerCase().includes(search) ||
        l.location.toLowerCase().includes(search) ||
        l.type.toLowerCase().includes(search) ||
        l.sellerName.toLowerCase().includes(search)
      );
    }

    if (type) {
      results = results.filter(l => l.type === type);
    }

    results = results.filter(l => l.price >= minPrice && l.price <= maxPrice);

    // Sort
    switch (sort) {
      case 'newest':
        results.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.datePosted) - new Date(b.datePosted));
        break;
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        results.sort((a, b) => FYB.getSaveCount(b) - FYB.getSaveCount(a));
        break;
      case 'proximity':
        if (userLat !== null) {
          results.sort((a, b) => {
            const dA = FYB.haversineDistance(userLat, userLng, a.lat, a.lng);
            const dB = FYB.haversineDistance(userLat, userLng, b.lat, b.lng);
            return dA - dB;
          });
        }
        break;
    }

    renderListings(results);
    checkPopularityAlerts(results);
    updateResultCount(results.length);
  }

  // ── Popularity Alerts ──────────────────────────────────────────────────────
  function checkPopularityAlerts(results) {
    const user = FYBAuth.getCurrentUser();
    if (!user || user.role !== 'buyer') return;

    const POPULAR_THRESHOLD = 2;
    const popularSaved = results.filter(l =>
      FYB.getSaveCount(l) >= POPULAR_THRESHOLD &&
      l.savedBy.includes(user.id)
    );

    if (popularSaved.length > 0 && !popularityAlertShown) {
      popularityAlertShown = true;
      const names = popularSaved.map(l => `"${l.title}"`).join(', ');
      showNotification(
        `🔥 Heads up! ${names} ${popularSaved.length === 1 ? 'is' : 'are'} trending — act fast before it's gone!`,
        'warning'
      );
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────
  function renderListings(listings) {
    const container = document.getElementById('listings-container');
    if (!container) return;

    if (listings.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">⚓</div>
          <h3>No listings found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>`;
      return;
    }

    const user = FYBAuth.getCurrentUser();

    container.innerHTML = listings.map(l => {
      const isSaved = user && FYB.isListingSaved(user.id, l.id);
      const saveCount = FYB.getSaveCount(l);
      const isPopular = saveCount >= 2;
      const dist = (user && userLat !== null)
        ? Math.round(FYB.haversineDistance(userLat, userLng, l.lat, l.lng))
        : null;

      return `
        <div class="card">
          <div class="card-img-placeholder">${FYBAuth.escapeHtml(l.imageEmoji)}</div>
          <div class="card-body">
            <div class="flex align-center justify-between mb-1">
              <span class="badge ${l.status === 'sold' ? 'badge-sold' : 'badge-available'}">
                ${l.status === 'sold' ? 'Sold' : 'Available'}
              </span>
              ${isPopular ? '<span class="badge badge-popular">🔥 Popular</span>' : ''}
            </div>
            <div class="card-title">${FYBAuth.escapeHtml(l.title)}</div>
            <div class="card-text">${FYBAuth.escapeHtml(l.location)}${dist !== null ? ` &nbsp;·&nbsp; ~${dist} mi away` : ''}</div>
            <div class="card-text">${FYBAuth.escapeHtml(l.type)} · ${l.year} · ${l.length} ft</div>
            <div class="card-price">${FYB.formatPrice(l.price)}</div>
            <div class="stats-row">
              <span class="stat-item"><span class="stat-icon">🔖</span> ${saveCount} saved</span>
            </div>
            <div class="flex flex-gap mt-2">
              <a href="listing.html?id=${l.id}" class="btn btn-primary btn-sm">View Details</a>
              ${user && user.role === 'buyer' && l.status === 'available' ? `
                <button class="btn btn-sm ${isSaved ? 'btn-warning' : 'btn-outline'}"
                        onclick="toggleSave('${l.id}', this)">
                  ${isSaved ? '🔖 Saved' : '+ Save'}
                </button>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function updateResultCount(count) {
    const el = document.getElementById('result-count');
    if (el) el.textContent = `${count} listing${count !== 1 ? 's' : ''} found`;
  }

  // ── Save Toggle ────────────────────────────────────────────────────────────
  window.toggleSave = function (listingId, btn) {
    const user = FYBAuth.getCurrentUser();
    if (!user) { window.location.href = 'index.html'; return; }
    const saved = FYB.isListingSaved(user.id, listingId);
    if (saved) {
      FYB.unsaveListing(user.id, listingId);
      btn.textContent = '+ Save';
      btn.classList.remove('btn-warning');
      btn.classList.add('btn-outline');
    } else {
      FYB.saveListing(user.id, listingId);
      btn.textContent = '🔖 Saved';
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-warning');
    }
    allListings = FYB.getListings().filter(l => l.status === 'available');
    popularityAlertShown = false;
  };

  // ── Notification Helper ────────────────────────────────────────────────────
  function showNotification(msg, type = 'info') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerHTML = `<span>${msg}</span><button class="close-btn" onclick="this.parentElement.remove()">✕</button>`;
    area.appendChild(div);
    setTimeout(() => div.remove(), 8000);
  }

  // ── Global filter trigger ──────────────────────────────────────────────────
  window.applyFilters = applyFilters;
  window.clearFilters = function () {
    document.getElementById('search').value = '';
    document.getElementById('type').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    document.getElementById('sort').value = 'newest';
    document.getElementById('show-sold').checked = false;
    applyFilters();
  };
})();
