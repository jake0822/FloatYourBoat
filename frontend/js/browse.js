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
  document.addEventListener('DOMContentLoaded', async () => {
    await FYB.initData();
    const currentUser = FYBAuth.getCurrentUser();
    if (currentUser?.role === 'buyer') {
      await FYB.ensureSavedListingIdsLoaded(currentUser.id);
    }
    FYBAuth.renderNav();
    allListings = FYB.getListings().filter(l => l.status === 'available');
    setupBuyerLocationSelectors();
    applyFilters();
    setupProximitySort();
  });

  // ── Proximity Sort Setup ───────────────────────────────────────────────────
  function setupBuyerLocationSelectors() {
    const stateSelect = document.getElementById('buyer-state');
    const citySelect = document.getElementById('buyer-city');
    if (!stateSelect || !citySelect) return;

    const user = FYBAuth.getCurrentUser();
    renderStateOptions(stateSelect);

    if (!user || user.role !== 'buyer') {
      stateSelect.disabled = true;
      citySelect.disabled = true;
      return;
    }

    const existing = findLocationByText(user.location || '');
    if (existing) {
      stateSelect.value = existing.stateCode;
      renderCityOptions(citySelect, existing.stateCode, existing.cityName);
      userLat = existing.lat;
      userLng = existing.lng;
    } else {
      renderCityOptions(citySelect, '', '');
    }

    stateSelect.addEventListener('change', () => {
      renderCityOptions(citySelect, stateSelect.value, '');
      persistBuyerLocation(user.id, '');
      userLat = null;
      userLng = null;
      if (document.getElementById('sort')?.value === 'proximity') {
        showNotification('Select your city to sort by proximity.', 'warning');
      }
    });

    citySelect.addEventListener('change', () => {
      if (!stateSelect.value || !citySelect.value) {
        persistBuyerLocation(user.id, '');
        userLat = null;
        userLng = null;
        return;
      }

      const selected = findCity(stateSelect.value, citySelect.value);
      if (!selected) return;
      persistBuyerLocation(user.id, `${selected.name}, ${stateSelect.value}`);
      userLat = selected.lat;
      userLng = selected.lng;
      if (document.getElementById('sort')?.value === 'proximity') {
        applyFilters();
      }
    });
  }

  function setupProximitySort() {
    const sortSelect = document.getElementById('sort');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', () => {
      if (sortSelect.value === 'proximity') {
        const ready = ensureBuyerLocation();
        if (!ready) {
          sortSelect.value = 'price-asc';
        }
      }
      applyFilters();
    });
  }

  function ensureBuyerLocation() {
    const user = FYBAuth.getCurrentUser();
    if (!user || user.role !== 'buyer') {
      showNotification('Log in as a buyer to sort by proximity.', 'warning');
      return false;
    }

    const stateSelect = document.getElementById('buyer-state');
    const citySelect = document.getElementById('buyer-city');
    if (!stateSelect?.value || !citySelect?.value) {
      showNotification('Select your state and city in the "My Location" filters to sort by proximity.', 'warning');
      return false;
    }

    const selected = findCity(stateSelect.value, citySelect.value);
    if (!selected) {
      showNotification('Please select a valid city.', 'warning');
      return false;
    }

    persistBuyerLocation(user.id, `${selected.name}, ${stateSelect.value}`);
    userLat = selected.lat;
    userLng = selected.lng;
    return true;
  }

  function renderStateOptions(stateSelect) {
    stateSelect.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select state';
    stateSelect.appendChild(placeholder);

    for (const [code, state] of Object.entries(FYB.BUYER_LOCATIONS)) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = state.label;
      stateSelect.appendChild(option);
    }
  }

  function renderCityOptions(citySelect, stateCode, selectedCity = '') {
    const state = FYB.BUYER_LOCATIONS[stateCode];
    citySelect.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select city';
    citySelect.appendChild(placeholder);

    if (state) {
      for (const city of state.cities) {
        const option = document.createElement('option');
        option.value = city.name;
        option.textContent = city.name;
        citySelect.appendChild(option);
      }
    }

    citySelect.disabled = !state;
    if (selectedCity && state?.cities.some(c => c.name === selectedCity)) {
      citySelect.value = selectedCity;
    }
  }

  function persistBuyerLocation(userId, location) {
    const updated = FYB.updateUser(userId, { location });
    if (updated) FYBAuth.setCurrentUser(updated);
  }

  function findCity(stateCode, cityName) {
    const state = FYB.BUYER_LOCATIONS[stateCode];
    if (!state) return null;
    return state.cities.find(c => c.name === cityName) || null;
  }

  function findLocationByText(locationText) {
    const clean = (locationText || '').trim();
    if (!clean) return null;
    const [cityRaw, stateRaw = ''] = clean.split(',').map(part => part.trim());
    const stateCode = normalizeStateCode(stateRaw);
    if (!stateCode) return null;
    const city = findCity(stateCode, cityRaw);
    if (!city) return null;
    return { stateCode, cityName: city.name, lat: city.lat, lng: city.lng };
  }

  function normalizeStateCode(stateText) {
    const normalized = (stateText || '').trim().toLowerCase();
    if (!normalized) return null;
    for (const [stateCode, state] of Object.entries(FYB.BUYER_LOCATIONS)) {
      if (normalized === stateCode.toLowerCase() || normalized === state.label.toLowerCase()) {
        return stateCode;
      }
    }
    return null;
  }

  // ── Filters & Sort ─────────────────────────────────────────────────────────
  function applyFilters() {
    const search   = (document.getElementById('search')?.value || '').toLowerCase().trim();
    const type     = document.getElementById('type')?.value || '';
    const minPrice = parseFloat(document.getElementById('min-price')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price')?.value) || Infinity;
    const sort     = document.getElementById('sort')?.value || 'price-asc';
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
            const dA = Number.isFinite(a.lat) && Number.isFinite(a.lng)
              ? FYB.haversineDistance(userLat, userLng, a.lat, a.lng)
              : Infinity;
            const dB = Number.isFinite(b.lat) && Number.isFinite(b.lng)
              ? FYB.haversineDistance(userLat, userLng, b.lat, b.lng)
              : Infinity;
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
              <a href="listing?id=${l.id}" class="btn btn-primary btn-sm">View Details</a>
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
  window.toggleSave = async function (listingId, btn) {
    const user = FYBAuth.getCurrentUser();
    if (!user) { window.location.href = 'index.html'; return; }
    const saved = FYB.isListingSaved(user.id, listingId);
    try {
      if (saved) {
        await FYB.unsaveListing(user.id, listingId);
        btn.textContent = '+ Save';
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-outline');
      } else {
        await FYB.saveListing(user.id, listingId);
        btn.textContent = '🔖 Saved';
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-warning');
      }
    } catch {
      showNotification('Unable to update saved listing right now.', 'danger');
    }
    allListings = FYB.getListings().filter(l => l.status === 'available');
    popularityAlertShown = false;
    applyFilters();
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
    document.getElementById('sort').value = 'price-asc';
    document.getElementById('show-sold').checked = false;
    applyFilters();
  };
})();
