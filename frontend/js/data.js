/**
 * data.js — FloatYourBoat Data Layer
 * Uses backend APIs for listings/cities and local storage for user/session extras.
 */

const KEYS = {
  USERS: 'fyb_users',
  SAVED_LISTINGS: 'fyb_saved_listings',
  CURRENT_USER: 'fyb_current_user',
  GEO_CACHE: 'fyb_geo_cache',
};

let BUYER_LOCATIONS = {};
let _citiesPromise = null;
let _initPromise = null;

let usersCache = [];
let listingsCache = [];
let usersByUsername = new Map();
const BROWSE_PAGE_SIZE = 10;

function rebuildUserLookup() {
  usersByUsername = new Map(usersCache.map(user => [user.username, user]));
}

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
    throw new Error(`HTTP ${res.status}`);
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

function normalizeDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

function mapListingFromApi(raw) {
  const id = String(raw?.listing_id ?? '');
  const sellerUsername = raw?.seller_username || '';
  const seller = usersByUsername.get(sellerUsername);
  return {
    id,
    title: raw?.name || 'Untitled Listing',
    description: raw?.description || '',
    location: raw?.location || '',
    price: parsePrice(raw?.price),
    datePosted: raw?.date_listed || '',
    status: raw?.is_sold ? 'sold' : 'available',
    sellerId: sellerUsername,
    sellerName: seller?.name || sellerUsername || 'Unknown Seller',
    sellerUsername: seller?.seller_username || "UnknownSeller",
    type: 'Boat',
    year: 'N/A',
    length: 'N/A',
    condition: 'N/A',
    engine: '',
    hours: null,
    imageEmoji: '🚤',
  };
}

async function loadListings() {
  const all = [];
  let page = 0;

  while (true) {
    const batch = await apiJson(`/api/get_browse_page/${page}`);
    if (!Array.isArray(batch)) break;
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < BROWSE_PAGE_SIZE) break;
    page += 1;
  }

  // Seed minimal seller stubs from raw listing data so that sellers who exist in
  // the database but have never registered via the web UI can still log in.
  // Their name and email will be populated if/when they register through the UI.
  for (const raw of all) {
    const sellerKey = (raw.seller_username || '').trim();
    if (sellerKey && !usersByUsername.has(sellerKey)) {
      const stub = {
        id: sellerKey,
        username: sellerKey,
        role: 'seller',
        name: sellerKey,
        email: '',
        location: '',
      };
      usersCache.push(stub);
      usersByUsername.set(sellerKey, stub);
    }
  }

  listingsCache = all.map(mapListingFromApi);
  return listingsCache;
}

function getSavedStore() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SAVED_LISTINGS)) || {};
  } catch {
    return {};
  }
}

function setSavedStore(store) {
  localStorage.setItem(KEYS.SAVED_LISTINGS, JSON.stringify(store));
}

function getUsersStore() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.USERS)) || [];
  } catch {
    return [];
  }
}

function setUsersStore(users) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

function ensureSavedListingIdsLoaded(userId) {
  if (!userId) return Promise.resolve([]);
  const store = getSavedStore();
  const key = String(userId);
  if (!Array.isArray(store[key])) {
    store[key] = [];
    setSavedStore(store);
  }
  return Promise.resolve(store[key]);
}

async function initData() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    usersCache = getUsersStore();
    rebuildUserLookup();
    await loadCities();
    await loadListings();
    // Persist seeded seller stubs back to local storage.
    setUsersStore(usersCache);
  })().catch(err => {
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
  const existingIds = new Set(listingsCache.map(l => l.id));
  const payload = {
    listing_id: 0,
    name: listing?.title || 'Untitled Listing',
    description: listing?.description || '',
    location: listing?.location || '',
    price: Number(listing?.price || 0),
    date_listed: new Date().toISOString().split('T')[0],
    is_sold: false,
    seller_username: listing?.sellerId || '',
  };

  await apiJson('/api/add_or_update_listing', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  await loadListings();
  const created = listingsCache.find(l => !existingIds.has(l.id));
  return created || null;
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
    date_listed: normalizeDate(next.datePosted),
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
  try {
    await apiJson(`/api/delete_listing/${Number(id)}`, { method: 'DELETE' });
    listingsCache = listingsCache.filter(l => l.id !== String(id));
  } catch (err) {
    throw err;
  }
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
  rebuildUserLookup();
  setUsersStore(usersCache);
}

function updateUser(id, updates) {
  const key = String(id || '');
  const idx = usersCache.findIndex(u => String(u.id) === key);
  if (idx === -1) return null;

  const updated = { ...usersCache[idx], ...updates };
  usersCache[idx] = updated;
  rebuildUserLookup();
  setUsersStore(usersCache);

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

  // Intentionally fire-and-forget: UI updates immediately, and backend sync follows.
  apiJson(endpoint, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }).catch(err => {
    console.error('Failed to update user:', err);
  });

  return updated;
}

async function getUserByUsername(username) {
  const key = String(username || '').trim();
  try {
    let response = await fetch(`/api/get_user/${username}`);
    let data = await response.json();
    console.log(data);
    if ('error' in data) {
      return null;
    }
    return data;
  }
  catch {
    return null;
  }
}

async function registerUser(user) {
  if (getUserByUsername(user.username)) {
    return { error: 'Username already taken.' };
  }

  const created = {
    id: user.username,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email || '',
    location: user.location || '',
  };

  usersCache.push(created);
  rebuildUserLookup();
  setUsersStore(usersCache);

  const endpoint = created.role === 'buyer' ? '/api/add_or_update_buyer' : '/api/add_or_update_seller';
  const payload = created.role === 'buyer'
    ? {
        username: created.username,
        name: created.name,
        location: created.location,
      }
    : {
        username: created.username,
        name: created.name,
        email: created.email,
      };

  try {
    await apiJson(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Backend registration failed:', err);
  }

  return created;
}

function getSavedListingIds(userId) {
  const store = getSavedStore();
  return store[String(userId || '')] || [];
}

function getSaveCountByListingId(listingId) {
  const key = String(listingId || '');
  if (!key) return 0;
  const store = getSavedStore();
  return Object.values(store).reduce((count, ids) => {
    return count + (Array.isArray(ids) && ids.includes(key) ? 1 : 0);
  }, 0);
}

async function saveListing(userId, listingId) {
  const userKey = String(userId || '');
  const listingKey = String(listingId || '');
  if (!userKey || !listingKey) return;

  const store = getSavedStore();
  const ids = new Set(store[userKey] || []);
  ids.add(listingKey);
  store[userKey] = Array.from(ids);
  setSavedStore(store);
}

async function unsaveListing(userId, listingId) {
  const userKey = String(userId || '');
  const listingKey = String(listingId || '');
  const store = getSavedStore();
  const ids = new Set(store[userKey] || []);
  ids.delete(listingKey);
  store[userKey] = Array.from(ids);
  setSavedStore(store);
}

function isListingSaved(userId, listingId) {
  return getSavedListingIds(userId).includes(String(listingId || ''));
}

function getSavedListings(userId) {
  const idSet = new Set(getSavedListingIds(userId));
  return listingsCache.filter(l => idSet.has(String(l.id)));
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
  return getSaveCountByListingId(listing?.id);
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
