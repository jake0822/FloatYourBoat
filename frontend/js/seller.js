/**
 * seller.js — FloatYourBoat Seller CRUD Page Logic
 * Simplified to match current seller form.
 */

(function () {
  const { FYB, FYBAuth } = window;
  let editingId = null;

  document.addEventListener('DOMContentLoaded', async () => {
    await FYB.initData();
    FYBAuth.requireSeller();
    FYBAuth.renderNav();

    const user = FYBAuth.getCurrentUser();
    if (user) {
      document.getElementById('form-seller-id').value = user.id;
      document.getElementById('form-seller-name').value = user.name;
    }

    renderLocationStateOptions();
    await renderMyListings();
  });

  function renderLocationStateOptions() {
    const stateSelect = document.getElementById('form-location-state');
    if (!stateSelect) return;

    stateSelect.replaceChildren();
    stateSelect.appendChild(new Option('Select state…', ''));

    for (const [code, state] of Object.entries(FYB.BUYER_LOCATIONS)) {
      stateSelect.appendChild(new Option(state.label, code));
    }

    stateSelect.addEventListener('change', () => {
      renderLocationCityOptions(stateSelect.value, '');
    });
  }

  function renderLocationCityOptions(stateCode, selectedCity = '') {
    const citySelect = document.getElementById('form-location-city');
    if (!citySelect) return;

    citySelect.replaceChildren();
    citySelect.appendChild(new Option('Select city…', ''));

    const state = FYB.BUYER_LOCATIONS[stateCode];
    if (state) {
      state.cities.forEach(city => citySelect.appendChild(new Option(city.name, city.name)));
    }

    citySelect.disabled = !state;
    if (selectedCity) citySelect.value = selectedCity;
  }

  async function renderMyListings() {
    const user = FYBAuth.getCurrentUser();
    const listings = await FYB.getListingsBySeller(user.username);
    const tbody = document.getElementById('listings-tbody');
    const empty = document.getElementById('empty-listings');

    if (!listings.length) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    tbody.innerHTML = listings.map(l => `
      <tr>
        <td>${FYBAuth.escapeHtml(l.title)}</td>
        <td>${FYBAuth.escapeHtml(l.type || 'Boat')}</td>
        <td>${FYB.formatPrice(l.price)}</td>
        <td><span class="badge ${l.status === 'sold' ? 'badge-sold' : 'badge-available'}">${l.status}</span></td>
        <td>${FYB.getSaveCount(l)} saves</td>
        <td>${FYB.formatDate(l.datePosted)}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-primary btn-sm" onclick="handleEdit('${l.id}')">✏️ Edit</button>
            ${l.status === 'available'
              ? `<button class="btn btn-warning btn-sm" onclick="handleMarkSold('${l.id}')">✔ Mark Sold</button>`
              : `<button class="btn btn-outline btn-sm" onclick="handleMarkAvailable('${l.id}')">↩ Re-list</button>`}
            <button class="btn btn-danger btn-sm" onclick="handleDelete('${l.id}')">🗑 Delete</button>
          </div>
        </td>
      </tr>`).join('');
  }

  window.openCreateForm = function () {
    editingId = null;
    document.getElementById('form-title-label').textContent = 'New Listing';
    document.getElementById('listing-form').reset();

    const user = FYBAuth.getCurrentUser();
    document.getElementById('form-seller-id').value = user.id;
    document.getElementById('form-seller-name').value = user.name;

    renderLocationCityOptions('', '');
    document.getElementById('listing-form-section').classList.remove('hidden');
    document.getElementById('listing-form-section').scrollIntoView({ behavior: 'smooth' });
  };

  window.closeForm = function () {
    document.getElementById('listing-form-section').classList.add('hidden');
    editingId = null;
  };

  function openEditForm(listing) {
    editingId = listing.id;
    document.getElementById('form-title-label').textContent = 'Edit Listing';
    document.getElementById('form-title').value = listing.title || '';
    document.getElementById('form-price').value = listing.price || '';
    document.getElementById('form-description').value = listing.description || '';
    document.getElementById('form-image-emoji').value = listing.imageEmoji || '🚤';

    const [cityName = '', stateCode = ''] = (listing.location || '').split(',').map(s => s.trim());
    document.getElementById('form-location-state').value = stateCode;
    renderLocationCityOptions(stateCode, cityName);

    document.getElementById('listing-form-section').classList.remove('hidden');
    document.getElementById('listing-form-section').scrollIntoView({ behavior: 'smooth' });
  }

  window.handleFormSubmit = async function (e) {
    e.preventDefault();
    const user = FYBAuth.getCurrentUser();

    const stateCode = document.getElementById('form-location-state').value;
    const cityName = document.getElementById('form-location-city').value;

    if (!stateCode || !cityName) {
      showNotification('Please select a state and city.', 'warning');
      return;
    }

    const cityObj = FYB.BUYER_LOCATIONS[stateCode]?.cities.find(c => c.name === cityName);
    if (!cityObj) {
      showNotification('Please select a valid city.', 'warning');
      return;
    }

    const data = {
      sellerId: user.id,
      sellerName: user.name,
      title: document.getElementById('form-title').value.trim(),
      price: parseFloat(document.getElementById('form-price').value),
      location: `${cityName}, ${stateCode}`,
      description: document.getElementById('form-description').value.trim(),
      imageEmoji: document.getElementById('form-image-emoji').value.trim() || '🚤',
      type: 'Boat',
      year: new Date().getFullYear(),
      length: 0,
      engine: '',
      hours: null,
      condition: 'Used',
      lat: cityObj.lat,
      lng: cityObj.lng
    };

    try {
      if (editingId) {
        await FYB.updateListing(editingId, data);
        showNotification('✅ Listing updated.', 'success');
      } else {
        await FYB.addListing(data);
        showNotification('✅ Listing created.', 'success');
      }
      closeForm();
      await renderMyListings();
    } catch {
      showNotification('❌ Unable to save listing.', 'danger');
    }
  };

  window.handleEdit = id => {
    const listing = FYB.getListingById(id);
    if (listing) openEditForm(listing);
  };

  window.handleMarkSold = async id => {
    await FYB.updateListing(id, { status: 'sold' });
    await renderMyListings();
    showNotification('Listing marked sold.', 'info');
  };

  window.handleMarkAvailable = async id => {
    await FYB.updateListing(id, { status: 'available' });
    await renderMyListings();
    showNotification('Listing re-listed.', 'success');
  };

  window.handleDelete = async id => {
    if (!confirm('Delete this listing permanently?')) return;
    await FYB.deleteListing(id);
    await renderMyListings();
    showNotification('Listing deleted.', 'danger');
  };

  function showNotification(msg, type = 'info') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerHTML = `<span>${msg}</span><button class="close-btn" onclick="this.parentElement.remove()">✕</button>`;
    area.prepend(div);
    setTimeout(() => div.remove(), 5000);
  }
})();