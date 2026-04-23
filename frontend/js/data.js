/**
 * data.js — FloatYourBoat Data Layer
 * API-backed data access and lightweight client-side cache.
 */

const KEYS = {
  CURRENT_USER: 'fyb_current_user',
  GEO_CACHE: 'fyb_geo_cache',
};

let BUYER_LOCATIONS = {};
let _citiesPromise = null;
let _initPromise = null;

let usersCache = [];
let listingsCache = [];
const savedListingIdsByUser = new Map();

function loadCities() {
  if (_citiesPromise) return _citiesPromise;
  _citiesPromise = fetch('/api/cities')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load city data');
      return res.json();
    })
    .then(data => {
      BUYER_LOCATIONS = data || {};
      if (window.FYB) window.FYB.BUYER_LOCATIONS = BUYER_LOCATIONS;
    })
    .catch(err => {
      console.error('Failed to load city data:', err);
      BUYER_LOCATIONS = {};
    });
  return _citiesPromise;
}

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let details = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      details = body?.error || details;
    } catch {
      // ignore
    }
    throw new Error(details);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

function parsePrice(value) {
  if (typeof value === 'number') return value;
  const numeric = String(value ?? '').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapListingFromApi(raw) {
  const id = String(raw?.listing_id ?? '');
  const isSold = Boolean(raw?.is_sold);
  return {
    id,
    title: raw?.name || 'Untitled Listing',
    description: raw?.description || '',
    location: raw?.location || '',
    price: parsePrice(raw?.price),
    datePosted: raw?.date_listed || '',
    status: isSold ? 'sold' : 'available',
    sellerId: raw?.seller_username || '',
    sellerName: raw?.seller_name || raw?.seller_username || 'Unknown Seller',
    saveCount: Number(raw?.save_count || 0),
    type: 'Boat',
    year: 'N/A',
    length: 'N/A',
    condition: 'N/A',
    engine: '',
    hours: null,
    imageEmoji: '🚤',
  };
}

async function loadUsers() {
  usersCache = await apiJson('/api/get_all_users');
  return usersCache;
}

async function loadListings() {
  const all = [];
  let page = 0;

  while (true) {
    const batch = await apiJson(`/api/get_browse_page/${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch.map(mapListingFromApi));
    if (batch.length < 10) break;
    page += 1;
  }

  listingsCache = all;
  return listingsCache;
}

async function ensureSavedListingIdsLoaded(userId) {
  const id = String(userId || '').trim();
  if (!id) return new Set();
  if (savedListingIdsByUser.has(id)) return savedListingIdsByUser.get(id);

  const listingIds = await apiJson(`/api/get_saved_listing_ids/${encodeURIComponent(id)}`);
  const set = new Set((listingIds || []).map(v => String(v)));
  savedListingIdsByUser.set(id, set);
  return set;
}

async function initData() {
  if (_initPromise) return _initPromise;
  _initPromise = Promise.all([loadCities(), loadUsers(), loadListings()])
    .then(async () => {
      const currentRaw = sessionStorage.getItem(KEYS.CURRENT_USER);
      if (!currentRaw) return;
      try {
        const currentUser = JSON.parse(currentRaw);
        if (currentUser?.role === 'buyer' && currentUser?.id) {
          await ensureSavedListingIdsLoaded(currentUser.id);
        }
      } catch {
        // ignore bad session payload
      }
    })
    .catch(err => {
      console.error('Failed to initialize app data:', err);
    });

  return _initPromise;
}

function getListings() {
  return listingsCache.slice();
}

function getListingById(id) {
  const key = String(id);
  return listingsCache.find(l => l.id === key) || null;
}

function saveListings(listings) {
  listingsCache = Array.isArray(listings) ? listings.slice() : [];
}

async function addListing(listing) {
  const payload = {
    listing_id: 0,
    name: listing?.title || 'Untitled Listing',
    description: listing?.description || '',
    location: listing?.location || '',
    price: Number(listing?.price || 0),
    date_listed: new Date().toISOString().split('T')[0],
    is_sold: false,
    seller_username: listing?.sellerId || listing?.seller_username || '',
  };

  await apiJson('/api/add_or_update_listing', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  await loadListings();
  return listingsCache[0] || null;
}

async function updateListing(id, updates) {
  const current = getListingById(id);
  if (!current) return null;

  const next = { ...current, ...updates };
  const payload = {
    listing_id: Number(next.id),
    name: next.title || 'Untitled Listing',
    description: next.description || '',
    location: next.location || '',
    price: Number(next.price || 0),
    date_listed: next.datePosted || new Date().toISOString().split('T')[0],
    is_sold: (next.status || 'available') === 'sold',
    seller_username: next.sellerId || '',
  };

  await apiJson('/api/add_or_update_listing', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  await loadListings();
  return getListingById(id);
}

async function deleteListing(id) {
  await apiJson(`/api/delete_listing/${Number(id)}`, { method: 'DELETE' });
  listingsCache = listingsCache.filter(l => l.id !== String(id));
}

function getListingsBySeller(sellerId) {
  const key = String(sellerId || '').toLowerCase();
  return listingsCache.filter(l => (l.sellerId || '').toLowerCase() === key);
}

function getUsers() {
  return usersCache.slice();
}

function saveUsers(users) {
  usersCache = Array.isArray(users) ? users.slice() : [];
}

function upsertUserLocal(user) {
  const idx = usersCache.findIndex(u => u.username === user.username);
  if (idx === -1) {
    usersCache.push(user);
    return user;
  }
  usersCache[idx] = { ...usersCache[idx], ...user };
  return usersCache[idx];
}

function updateUser(id, updates) {
  const key = String(id || '');
  const idx = usersCache.findIndex(u => String(u.id) === key);
  if (idx === -1) return null;

  const updated = { ...usersCache[idx], ...updates };
  usersCache[idx] = updated;

  const endpoint = updated.role === 'buyer' ? '/api/add_or_update_buyer' : '/api/add_or_update_seller';
  const payload = updated.role === 'buyer'
    ? {
        username: updated.username,
        name: updated.name,
        location: updated.location || '',
      }
    : {
        username: updated.username,
        name: updated.name,
        email: updated.email || '',
      };

  apiJson(endpoint, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }).catch(err => {
    console.error('Failed to update user:', err);
  });

  return updated;
}

function getUserById(id) {
  const key = String(id || '');
  return usersCache.find(u => String(u.id) === key) || null;
}

function getUserByUsername(username) {
  const key = String(username || '').trim().toLowerCase();
  return usersCache.find(u => String(u.username || '').toLowerCase() === key) || null;
}

async function registerUser(user) {
  if (getUserByUsername(user.username)) {
    return { error: 'Username already taken.' };
  }

  const isBuyer = user.role === 'buyer';
  const endpoint = isBuyer ? '/api/add_or_update_buyer' : '/api/add_or_update_seller';
  const payload = isBuyer
    ? {
        username: user.username,
        name: user.name,
        location: user.location || '',
      }
    : {
        username: user.username,
        name: user.name,
        email: user.email || '',
      };

  await apiJson(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const created = {
    id: user.username,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email || '',
    location: user.location || '',
  };

  upsertUserLocal(created);
  return created;
}

function getSavedListingIds(userId) {
  const set = savedListingIdsByUser.get(String(userId || '')) || new Set();
  return Array.from(set);
}

async function saveListing(userId, listingId) {
  const userKey = String(userId || '');
  const listingKey = String(listingId || '');
  if (!userKey || !listingKey) return;

  const set = await ensureSavedListingIdsLoaded(userKey);
  if (set.has(listingKey)) return;

  set.add(listingKey);
  const listing = getListingById(listingKey);
  if (listing) listing.saveCount = Number(listing.saveCount || 0) + 1;

  try {
    await apiJson('/api/save_listing', {
      method: 'POST',
      body: JSON.stringify({
        buyer_username: userKey,
        listing_id: Number(listingKey),
      }),
    });
  } catch (err) {
    set.delete(listingKey);
    if (listing) listing.saveCount = Math.max(0, Number(listing.saveCount || 0) - 1);
    throw err;
  }
}

async function unsaveListing(userId, listingId) {
  const userKey = String(userId || '');
  const listingKey = String(listingId || '');
  if (!userKey || !listingKey) return;

  const set = await ensureSavedListingIdsLoaded(userKey);
  if (!set.has(listingKey)) return;

  set.delete(listingKey);
  const listing = getListingById(listingKey);
  if (listing) listing.saveCount = Math.max(0, Number(listing.saveCount || 0) - 1);

  try {
    await apiJson(`/api/unsave_listing/${encodeURIComponent(userKey)}/${Number(listingKey)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    set.add(listingKey);
    if (listing) listing.saveCount = Number(listing.saveCount || 0) + 1;
    throw err;
  }
}

function isListingSaved(userId, listingId) {
  const set = savedListingIdsByUser.get(String(userId || ''));
  if (!set) return false;
  return set.has(String(listingId || ''));
}

function getSavedListings(userId) {
  const set = savedListingIdsByUser.get(String(userId || ''));
  if (!set) return [];
  return listingsCache.filter(l => set.has(String(l.id)));
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function formatPrice(price) {
  return '$' + Number(price || 0).toLocaleString('en-US');
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  if (!isoMatch) return String(dateStr);
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getSaveCount(listing) {
  return Number(listing?.saveCount || 0);
}

function getGeoCache() {
  const raw = localStorage.getItem(KEYS.GEO_CACHE);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveGeoCache(cache) {
  localStorage.setItem(KEYS.GEO_CACHE, JSON.stringify(cache));
}

let geocodeQueue = Promise.resolve();
const GEOCODE_THROTTLE_INTERVAL_MS = 1000;
let lastGeocodeAt = 0;

function queueGeocodeRequest(task) {
  const run = geocodeQueue
    .catch(() => {})
    .then(async () => {
      const elapsed = Date.now() - lastGeocodeAt;
      if (elapsed < GEOCODE_THROTTLE_INTERVAL_MS) {
        await new Promise(resolve => setTimeout(resolve, GEOCODE_THROTTLE_INTERVAL_MS - elapsed));
      }
      lastGeocodeAt = Date.now();
      return task();
    });

  geocodeQueue = run.then(() => undefined, () => undefined);
  return run;
}

async function geocodeLocation(location) {
  const cleanLocation = (location || '').trim();
  if (!cleanLocation) return null;

  const key = cleanLocation.toLowerCase();
  const cache = getGeoCache();
  if (cache[key]) return cache[key];

  const result = await queueGeocodeRequest(async () => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanLocation)}&count=1&language=en&format=json`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Geocoding request failed.');
    }

    const payload = await res.json();
    const top = payload?.results?.[0];
    if (!top) return null;

    const lat = parseFloat(top.latitude);
    const lng = parseFloat(top.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    const parts = [top.name, top.admin1, top.country].filter(Boolean);
    return { lat, lng, displayName: parts.join(', ') };
  });

  if (!result) return null;
  cache[key] = result;
  saveGeoCache(cache);
  return result;
}

window.FYB = window.FYB || {};
Object.assign(window.FYB, {
  KEYS,
  BUYER_LOCATIONS,
  initData,
  ensureSavedListingIdsLoaded,
  getListings,
  getListingById,
  saveListings,
  addListing,
  updateListing,
  deleteListing,
  getListingsBySeller,
  getUsers,
  saveUsers,
  updateUser,
  getUserById,
  getUserByUsername,
  registerUser,
  getSavedListingIds,
  saveListing,
  unsaveListing,
  isListingSaved,
  getSavedListings,
  haversineDistance,
  formatPrice,
  formatDate,
  getSaveCount,
  geocodeLocation,
});
