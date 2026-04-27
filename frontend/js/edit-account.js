/**
 * edit-account.js — Edit Account Page
 * Handles editing user profile information
 */

function initEditAccountPage() {
  const user = FYBAuth.getCurrentUser();
  if (!user) {
    window.location.href = 'login';
    return;
  }

  // Populate name field
  document.getElementById('edit-name').value = user.name || '';

  // Show/hide fields based on role
  const buyerFields = document.getElementById('buyer-fields');
  const sellerFields = document.getElementById('seller-fields');

  if (user.role === 'buyer') {
    buyerFields.style.display = 'block';
    sellerFields.style.display = 'none';

    // Parse location from "City, State" format
    const location = user.location || '';
    const parts = location.split(', ');
    const cityName = parts[0] || '';
    const stateCode = parts[1] || '';

    // These will be populated by setupEditAccountLocationSelectors
    setTimeout(() => {
      document.getElementById('edit-state').value = stateCode;
      renderEditAccountCities(stateCode);
      document.getElementById('edit-city').value = cityName;
    }, 100);
  } else if (user.role === 'seller') {
    buyerFields.style.display = 'none';
    sellerFields.style.display = 'block';
    document.getElementById('edit-email').value = user.email || '';
  }
}

function setupEditAccountLocationSelectors() {
  const stateSelect = document.getElementById('edit-state');
  const citySelect = document.getElementById('edit-city');
  if (!stateSelect || !citySelect) return;

  const locations = FYB.BUYER_LOCATIONS || {};
  stateSelect.replaceChildren();
  const statePlaceholder = document.createElement('option');
  statePlaceholder.value = '';
  statePlaceholder.textContent = 'Select state';
  stateSelect.appendChild(statePlaceholder);

  const sortedStates = Object.entries(locations).sort((a, b) => a[1].label.localeCompare(b[1].label));
  for (const [code, state] of sortedStates) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = state.label;
    stateSelect.appendChild(option);
  }

  stateSelect.addEventListener('change', () => {
    renderEditAccountCities(stateSelect.value);
  });

  renderEditAccountCities('');
}

function renderEditAccountCities(stateCode) {
  const citySelect = document.getElementById('edit-city');
  const state = (FYB.BUYER_LOCATIONS || {})[stateCode];
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
}

function showAlert(msg, type = 'danger') {
  const el = document.getElementById('auth-alert');
  el.className = `alert alert-${type}`;
  document.getElementById('auth-alert-msg').textContent = msg;
}

function hideAlert() {
  document.getElementById('auth-alert').classList.add('hidden');
}

async function handleEditAccount(e) {
  e.preventDefault();
  const user = FYBAuth.getCurrentUser();
  if (!user) {
    showAlert('No user logged in');
    return;
  }

  const name = document.getElementById('edit-name').value.trim();
  if (!name) {
    showAlert('Name is required');
    return;
  }

  try {
    let payload;
    if (user.role === 'buyer') {
      const stateCode = document.getElementById('edit-state').value;
      const cityName = document.getElementById('edit-city').value;

      if (!stateCode || !cityName) {
        showAlert('Location is required');
        return;
      }

      const location = `${cityName}, ${stateCode}`;
      payload = {
        username: user.username,
        name,
        location,
      };

      // Update user in session
      const updatedUser = { ...user, name, location };
      FYBAuth.setCurrentUser(updatedUser);
    } else if (user.role === 'seller') {
      const email = document.getElementById('edit-email').value.trim();
      if (!email) {
        showAlert('Email is required');
        return;
      }

      payload = {
        username: user.username,
        name,
        email,
      };

      // Update user in session
      const updatedUser = { ...user, name, email };
      FYBAuth.setCurrentUser(updatedUser);
    }

    // Call the appropriate API endpoint
    const endpoint = user.role === 'buyer' ? '/api/add_or_update_buyer' : '/api/add_or_update_seller';
    await FYB.apiJson(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    // Redirect to home page
    window.location.href = '/';
  } catch (err) {
    console.error('Error updating account:', err);
    showAlert('Failed to update account. Please try again.');
  }
}
