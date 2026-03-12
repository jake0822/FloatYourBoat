/**
 * seller.js — FloatYourBoat Seller CRUD Page Logic
 * Create, edit, delete, and mark listings as sold.
 */

(function () {
  const { FYB, FYBAuth } = window;

  let editingId = null;

  document.addEventListener('DOMContentLoaded', () => {
    FYB.initData();
    FYBAuth.requireSeller();
    FYBAuth.renderNav();

    // Pre-fill seller info from session
    const user = FYBAuth.getCurrentUser();
    if (user) {
      document.getElementById('form-seller-id').value = user.id;
      document.getElementById('form-seller-name').value = user.name;
    }

    // Check for edit query param (coming from listing detail page)
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId) {
      const listing = FYB.getListingById(editId);
      if (listing && listing.sellerId === user.id) {
        openEditForm(listing);
      }
    }

    renderMyListings();
    setupFormValidation();
  });

  // ── Listing Table ──────────────────────────────────────────────────────────
  function renderMyListings() {
    const user = FYBAuth.getCurrentUser();
    const myListings = FYB.getListingsBySeller(user.id);
    const tbody = document.getElementById('listings-tbody');
    const emptyMsg = document.getElementById('empty-listings');

    if (myListings.length === 0) {
      tbody.innerHTML = '';
      emptyMsg.classList.remove('hidden');
      return;
    }

    emptyMsg.classList.add('hidden');
    tbody.innerHTML = myListings.map(l => `
      <tr>
        <td>${FYBAuth.escapeHtml(l.title)}</td>
        <td>${FYBAuth.escapeHtml(l.type)}</td>
        <td>${FYB.formatPrice(l.price)}</td>
        <td><span class="badge ${l.status === 'sold' ? 'badge-sold' : 'badge-available'}">${l.status}</span></td>
        <td>${FYB.getSaveCount(l)} saves</td>
        <td>${FYB.formatDate(l.datePosted)}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-primary btn-sm" onclick="handleEdit('${l.id}')">✏️ Edit</button>
            ${l.status === 'available'
              ? `<button class="btn btn-warning btn-sm" onclick="handleMarkSold('${l.id}')">✔ Mark Sold</button>`
              : `<button class="btn btn-outline btn-sm" onclick="handleMarkAvailable('${l.id}')">↩ Re-list</button>`
            }
            <button class="btn btn-danger btn-sm" onclick="handleDelete('${l.id}')">🗑 Delete</button>
          </div>
        </td>
      </tr>`).join('');
  }

  // ── Form: Open / Close ─────────────────────────────────────────────────────
  window.openCreateForm = function () {
    editingId = null;
    document.getElementById('form-title-label').textContent = 'New Listing';
    document.getElementById('listing-form').reset();
    const user = FYBAuth.getCurrentUser();
    document.getElementById('form-seller-id').value = user.id;
    document.getElementById('form-seller-name').value = user.name;
    document.getElementById('listing-form-section').classList.remove('hidden');
    document.getElementById('listing-form-section').scrollIntoView({ behavior: 'smooth' });
  };

  window.closeForm = function () {
    document.getElementById('listing-form-section').classList.add('hidden');
    editingId = null;
    // Clear edit param from URL without reload
    const url = new URL(location.href);
    url.searchParams.delete('edit');
    history.replaceState(null, '', url.toString());
  };

  function openEditForm(listing) {
    editingId = listing.id;
    document.getElementById('form-title-label').textContent = 'Edit Listing';
    document.getElementById('form-title').value = listing.title;
    document.getElementById('form-type').value = listing.type;
    document.getElementById('form-year').value = listing.year;
    document.getElementById('form-length').value = listing.length;
    document.getElementById('form-price').value = listing.price;
    document.getElementById('form-location').value = listing.location;
    document.getElementById('form-engine').value = listing.engine || '';
    document.getElementById('form-hours').value = listing.hours !== null ? listing.hours : '';
    document.getElementById('form-condition').value = listing.condition;
    document.getElementById('form-description').value = listing.description;
    document.getElementById('form-image-emoji').value = listing.imageEmoji || '🚤';
    document.getElementById('listing-form-section').classList.remove('hidden');
    document.getElementById('listing-form-section').scrollIntoView({ behavior: 'smooth' });
  }

  // ── Form: Submit ───────────────────────────────────────────────────────────
  window.handleFormSubmit = function (e) {
    e.preventDefault();
    const user = FYBAuth.getCurrentUser();

    const data = {
      sellerId:    user.id,
      sellerName:  user.name,
      title:       document.getElementById('form-title').value.trim(),
      type:        document.getElementById('form-type').value,
      year:        parseInt(document.getElementById('form-year').value),
      length:      parseFloat(document.getElementById('form-length').value),
      price:       parseFloat(document.getElementById('form-price').value),
      location:    document.getElementById('form-location').value.trim(),
      engine:      document.getElementById('form-engine').value.trim(),
      hours:       document.getElementById('form-hours').value !== ''
                     ? parseFloat(document.getElementById('form-hours').value)
                     : null,
      condition:   document.getElementById('form-condition').value,
      description: document.getElementById('form-description').value.trim(),
      imageEmoji:  document.getElementById('form-image-emoji').value.trim() || '🚤',
      // Default coordinates to Tallahassee, FL when not geocoding
      lat: 30.4383,
      lng: -84.2807,
    };

    if (editingId) {
      FYB.updateListing(editingId, data);
      showNotification('✅ Listing updated successfully.', 'success');
    } else {
      FYB.addListing(data);
      showNotification('✅ Listing created successfully.', 'success');
    }

    closeForm();
    renderMyListings();
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  window.handleEdit = function (id) {
    const listing = FYB.getListingById(id);
    if (listing) openEditForm(listing);
  };

  // ── Mark Sold / Re-list ────────────────────────────────────────────────────
  window.handleMarkSold = function (id) {
    if (!confirm('Mark this listing as sold?')) return;
    FYB.updateListing(id, { status: 'sold' });
    renderMyListings();
    showNotification('Listing marked as sold.', 'info');
  };

  window.handleMarkAvailable = function (id) {
    FYB.updateListing(id, { status: 'available' });
    renderMyListings();
    showNotification('Listing re-listed as available.', 'success');
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  window.handleDelete = function (id) {
    if (!confirm('Are you sure you want to permanently delete this listing?')) return;
    FYB.deleteListing(id);
    renderMyListings();
    showNotification('Listing deleted.', 'danger');
  };

  // ── Form Validation ────────────────────────────────────────────────────────
  function setupFormValidation() {
    const yearInput = document.getElementById('form-year');
    const currentYear = new Date().getFullYear();
    // Allow current year only; brand-new boats are listed with the current model year.
    yearInput.max = currentYear;
  }

  // ── Notification ───────────────────────────────────────────────────────────
  function showNotification(msg, type = 'info') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerHTML = `<span>${msg}</span><button class="close-btn" onclick="this.parentElement.remove()">✕</button>`;
    area.prepend(div);
    setTimeout(() => div.remove(), 6000);
  }
})();
