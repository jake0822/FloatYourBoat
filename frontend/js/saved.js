/**
 * saved.js — FloatYourBoat Saved Listings Page Logic
 */

(function () {
  const { FYB, FYBAuth } = window;

  document.addEventListener('DOMContentLoaded', () => {
    FYB.initData();
    FYBAuth.requireBuyer();
    FYBAuth.renderNav();
    renderSavedListings();
  });

  function renderSavedListings() {
    const user = FYBAuth.getCurrentUser();
    const saved = FYB.getSavedListings(user.id);
    const container = document.getElementById('saved-container');
    const emptyEl = document.getElementById('empty-state');
    const countEl = document.getElementById('saved-count');

    if (countEl) countEl.textContent = `${saved.length} saved listing${saved.length !== 1 ? 's' : ''}`;

    if (saved.length === 0) {
      container.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');

    // Separate available vs sold
    const available = saved.filter(l => l.status === 'available');
    const soldSaved = saved.filter(l => l.status === 'sold');

    let html = '';

    if (available.length > 0) {
      html += '<h3 style="color:var(--navy); margin-bottom:1rem;">Available</h3>';
      html += '<div class="listings-grid">' + available.map(l => cardHtml(l, user)).join('') + '</div>';
    }

    if (soldSaved.length > 0) {
      html += '<h3 style="color:var(--navy); margin:1.5rem 0 1rem;">Sold (Archived)</h3>';
      html += '<div class="listings-grid" style="opacity:0.7;">' + soldSaved.map(l => cardHtml(l, user)).join('') + '</div>';
    }

    container.innerHTML = html;

    // Popularity alerts
    const POPULAR_THRESHOLD = 2;
    const trending = available.filter(l => FYB.getSaveCount(l) >= POPULAR_THRESHOLD);
    if (trending.length > 0) {
      const names = trending.map(l => `"${l.title}"`).join(', ');
      showNotification(
        `🔥 ${names} ${trending.length === 1 ? 'is' : 'are'} trending — act fast before ${trending.length === 1 ? 'it\'s' : 'they\'re'} gone!`,
        'warning'
      );
    }
  }

  function cardHtml(l, user) {
    const saveCount = FYB.getSaveCount(l);
    const isPopular = saveCount >= 2;

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
          <div class="card-text">${FYBAuth.escapeHtml(l.location)}</div>
          <div class="card-text">${FYBAuth.escapeHtml(l.type)} · ${l.year} · ${l.length} ft</div>
          <div class="card-price">${FYB.formatPrice(l.price)}</div>
          <div class="stats-row">
            <span class="stat-item"><span class="stat-icon">🔖</span> ${saveCount} saved</span>
          </div>
          <div class="flex flex-gap mt-2">
            <a href="listing.html?id=${l.id}" class="btn btn-primary btn-sm">View Details</a>
            <button class="btn btn-danger btn-sm" onclick="handleUnsave('${l.id}')">Remove</button>
          </div>
        </div>
      </div>`;
  }

  window.handleUnsave = function (listingId) {
    const user = FYBAuth.getCurrentUser();
    FYB.unsaveListing(user.id, listingId);
    renderSavedListings();
    showNotification('Listing removed from your saved list.', 'info');
  };

  function showNotification(msg, type = 'info') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerHTML = `<span>${msg}</span><button class="close-btn" onclick="this.parentElement.remove()">✕</button>`;
    area.appendChild(div);
    setTimeout(() => div.remove(), 8000);
  }
})();
