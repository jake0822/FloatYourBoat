/**
 * listing.js — FloatYourBoat Listing Details Page Logic
 */

(function () {
  const { FYB, FYBAuth } = window;

  document.addEventListener('DOMContentLoaded', () => {
    FYB.initData();
    FYBAuth.renderNav();

    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (!id) {
      showError('No listing ID provided.');
      return;
    }

    const listing = FYB.getListingById(id);
    if (!listing) {
      showError('Listing not found.');
      return;
    }

    renderListing(listing);
  });

  function renderListing(listing) {
    const container = document.getElementById('listing-container');
    if (!container) return;

    const user = FYBAuth.getCurrentUser();
    const isSaved = user && FYB.isListingSaved(user.id, listing.id);
    const saveCount = FYB.getSaveCount(listing);
    const isPopular = saveCount >= 2;

    document.title = `FloatYourBoat — ${listing.title}`;

    // Build action buttons
    let actionBtns = '';
    if (user) {
      if (user.role === 'buyer' && listing.status === 'available') {
        actionBtns += `
          <button id="save-btn" class="btn ${isSaved ? 'btn-warning' : 'btn-outline'}" onclick="handleSave('${listing.id}')">
            ${isSaved ? '🔖 Saved' : '+ Save Listing'}
          </button>
          <button class="btn btn-success" onclick="handleContact('${listing.id}')">
            📧 Contact Seller
          </button>`;
      }
      if (user.id === listing.sellerId) {
        actionBtns += `
          <a href="seller.html?edit=${listing.id}" class="btn btn-primary">✏️ Edit Listing</a>`;
      }
    } else {
      actionBtns = `<a href="login" class="btn btn-primary">Login to Save or Contact</a>`;
    }

    container.innerHTML = `
      <div class="listing-detail">
        <div class="listing-detail-img-placeholder">${FYBAuth.escapeHtml(listing.imageEmoji)}</div>
        <div class="listing-detail-body">
          <div class="listing-detail-header">
            <div>
              <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; margin-bottom:0.5rem;">
                <span class="badge ${listing.status === 'sold' ? 'badge-sold' : 'badge-available'}">
                  ${listing.status === 'sold' ? 'Sold' : 'Available'}
                </span>
                ${isPopular ? '<span class="badge badge-popular">🔥 Popular</span>' : ''}
              </div>
              <div class="listing-detail-title">${FYBAuth.escapeHtml(listing.title)}</div>
              <div class="stats-row mt-1">
                <span class="stat-item"><span class="stat-icon">🔖</span> ${saveCount} people saved this</span>
              </div>
            </div>
            <div class="listing-detail-price">${FYB.formatPrice(listing.price)}</div>
          </div>

          <div class="listing-meta">
            <div class="listing-meta-item">
              <div class="meta-label">Location</div>
              <div class="meta-value">${FYBAuth.escapeHtml(listing.location)}</div>
            </div>
            <div class="listing-meta-item">
              <div class="meta-label">Listed</div>
              <div class="meta-value">${FYB.formatDate(listing.datePosted)}</div>
            </div>
            <div class="listing-meta-item">
              <div class="meta-label">Seller</div>
              <div class="meta-value">${FYBAuth.escapeHtml(listing.sellerName)}</div>
            </div>
          </div>

          <h3 style="color:var(--navy); margin-bottom:0.75rem;">Description</h3>
          <p class="listing-description">${FYBAuth.escapeHtml(listing.description)}</p>

          <div class="listing-actions">
            <a href="/" class="btn btn-outline">← Back to Browse</a>
            ${actionBtns}
          </div>
        </div>
      </div>`;

    // Popularity alert for saved buyers
    if (user && user.role === 'buyer' && isSaved && isPopular) {
      showNotification(
        `🔥 This listing is trending with ${saveCount} saves — it may go soon!`,
        'warning'
      );
    }
  }

  window.handleSave = function (listingId) {
    const user = FYBAuth.getCurrentUser();
    if (!user) { window.location.href = 'login'; return; }
    const saved = FYB.isListingSaved(user.id, listingId);
    if (saved) {
      FYB.unsaveListing(user.id, listingId);
    } else {
      FYB.saveListing(user.id, listingId);
    }
    // Re-render to reflect updated state
    const listing = FYB.getListingById(listingId);
    if (listing) renderListing(listing);
  };

  window.handleContact = function (listingId) {
    const listing = FYB.getListingById(listingId);
    if (!listing) return;
    const seller = FYB.getUserById(listing.sellerId);
    if (!seller) {
      showNotification('Unable to find seller information for this listing.', 'danger');
      return;
    }
    const sellerEmail = seller?.email?.trim();
    if (!sellerEmail) {
      showNotification('Seller email is not available for this listing.', 'danger');
      return;
    }
    const encodedSellerEmail = encodeURIComponent(sellerEmail);
    const safeSellerEmail = FYBAuth.escapeHtml(sellerEmail);

    const subject = encodeURIComponent(`FloatYourBoat inquiry: ${listing.title}`);
    const body = encodeURIComponent(
      `Hi ${listing.sellerName},\n\nI’m interested in your listing "${listing.title}" on FloatYourBoat. Is it still available?\n\nThanks,`
    );
    const mailtoLink = `mailto:${encodedSellerEmail}?subject=${subject}&body=${body}`;

    showModal(
      'Contact Seller',
      `<p>You are contacting <strong>${FYBAuth.escapeHtml(listing.sellerName)}</strong> about:</p>
       <p style="margin:0.75rem 0; font-weight:600;">"${FYBAuth.escapeHtml(listing.title)}"</p>
       <p>Email the seller at:</p>
       <p style="margin-top:0.5rem;">
         <a href="mailto:${encodedSellerEmail}" target="_blank" rel="noopener noreferrer">${safeSellerEmail}</a>
       </p>
       <p style="margin-top:0.75rem; color:var(--mid-gray);">Use the button below to open your default email app with a pre-filled message.</p>`,
      () => {
        closeModal();
        window.open(mailtoLink, '_blank', 'noopener,noreferrer');
        return true;
      },
      'Open Email App'
    );
  };

  function showError(msg) {
    const container = document.getElementById('listing-container');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚓</div>
          <h3>${msg}</h3>
          <a href="/" class="btn btn-primary mt-2">Back to Browse</a>
        </div>`;
    }
  }

  function showNotification(msg, type = 'info') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerHTML = `<span>${msg}</span><button class="close-btn" onclick="this.parentElement.remove()">✕</button>`;
    area.appendChild(div);
    setTimeout(() => div.remove(), 8000);
  }

  function showModal(title, bodyHtml, onConfirm, confirmLabel = 'Confirm') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    const confirmBtn = document.getElementById('modal-confirm');
    confirmBtn.textContent = confirmLabel;
    confirmBtn.onclick = onConfirm;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  window.closeModal = function () {
    document.getElementById('modal-overlay').classList.add('hidden');
  };
})();
