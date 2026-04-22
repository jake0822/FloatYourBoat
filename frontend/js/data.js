/**
 * data.js — FloatYourBoat Data Layer
 * Manages sample data and localStorage persistence.
 */

// ── Storage Keys ──────────────────────────────────────────────────────────────
const KEYS = {
  LISTINGS:      'fyb_listings',
  USERS:         'fyb_users',
  CURRENT_USER:  'fyb_current_user',
  SAVED_LISTINGS:'fyb_saved_listings',
  GEO_CACHE:     'fyb_geo_cache',
};

// ── Buyer Location Options ───────────────────────────────────────────────────
const BUYER_LOCATIONS = {
  AL: { label: 'Alabama', cities: [{ name: 'Montgomery', lat: 32.3792, lng: -86.3077 }] },
  AK: { label: 'Alaska', cities: [{ name: 'Juneau', lat: 58.3019, lng: -134.4197 }] },
  AZ: { label: 'Arizona', cities: [{ name: 'Phoenix', lat: 33.4484, lng: -112.0740 }] },
  AR: { label: 'Arkansas', cities: [{ name: 'Little Rock', lat: 34.7465, lng: -92.2896 }] },
  CA: { label: 'California', cities: [{ name: 'Sacramento', lat: 38.5816, lng: -121.4944 }] },
  CO: { label: 'Colorado', cities: [{ name: 'Denver', lat: 39.7392, lng: -104.9903 }] },
  CT: { label: 'Connecticut', cities: [{ name: 'Hartford', lat: 41.7658, lng: -72.6734 }] },
  DE: { label: 'Delaware', cities: [{ name: 'Dover', lat: 39.1582, lng: -75.5244 }] },
  FL: {
    label: 'Florida',
    cities: [
      { name: 'Tallahassee', lat: 30.4383, lng: -84.2807 },
      { name: 'Orlando', lat: 28.5383, lng: -81.3792 },
      { name: 'Panama City', lat: 30.1588, lng: -85.6602 },
      { name: 'Gainesville', lat: 29.6516, lng: -82.3248 },
      { name: 'Destin', lat: 30.3935, lng: -86.4958 },
      { name: 'Fort Lauderdale', lat: 26.1224, lng: -80.1373 },
      { name: 'Pensacola', lat: 30.4213, lng: -87.2169 },
      { name: 'Miami', lat: 25.7617, lng: -80.1918 },
      { name: 'Jacksonville', lat: 30.3322, lng: -81.6557 },
      { name: 'Tampa', lat: 27.9506, lng: -82.4572 },
    ],
  },
  GA: { label: 'Georgia', cities: [{ name: 'Atlanta', lat: 33.7490, lng: -84.3880 }] },
  HI: { label: 'Hawaii', cities: [{ name: 'Honolulu', lat: 21.3069, lng: -157.8583 }] },
  ID: { label: 'Idaho', cities: [{ name: 'Boise', lat: 43.6150, lng: -116.2023 }] },
  IL: { label: 'Illinois', cities: [{ name: 'Springfield', lat: 39.7817, lng: -89.6501 }] },
  IN: { label: 'Indiana', cities: [{ name: 'Indianapolis', lat: 39.7684, lng: -86.1581 }] },
  IA: { label: 'Iowa', cities: [{ name: 'Des Moines', lat: 41.5868, lng: -93.6250 }] },
  KS: { label: 'Kansas', cities: [{ name: 'Topeka', lat: 39.0473, lng: -95.6752 }] },
  KY: { label: 'Kentucky', cities: [{ name: 'Frankfort', lat: 38.2009, lng: -84.8733 }] },
  LA: { label: 'Louisiana', cities: [{ name: 'Baton Rouge', lat: 30.4515, lng: -91.1871 }] },
  ME: { label: 'Maine', cities: [{ name: 'Augusta', lat: 44.3106, lng: -69.7795 }] },
  MD: { label: 'Maryland', cities: [{ name: 'Annapolis', lat: 38.9784, lng: -76.4922 }] },
  MA: { label: 'Massachusetts', cities: [{ name: 'Boston', lat: 42.3601, lng: -71.0589 }] },
  MI: { label: 'Michigan', cities: [{ name: 'Lansing', lat: 42.7325, lng: -84.5555 }] },
  MN: { label: 'Minnesota', cities: [{ name: 'Saint Paul', lat: 44.9537, lng: -93.0900 }] },
  MS: { label: 'Mississippi', cities: [{ name: 'Jackson', lat: 32.2988, lng: -90.1848 }] },
  MO: { label: 'Missouri', cities: [{ name: 'Jefferson City', lat: 38.5767, lng: -92.1735 }] },
  MT: { label: 'Montana', cities: [{ name: 'Helena', lat: 46.5891, lng: -112.0391 }] },
  NE: { label: 'Nebraska', cities: [{ name: 'Lincoln', lat: 40.8136, lng: -96.7026 }] },
  NV: { label: 'Nevada', cities: [{ name: 'Carson City', lat: 39.1638, lng: -119.7674 }] },
  NH: { label: 'New Hampshire', cities: [{ name: 'Concord', lat: 43.2081, lng: -71.5376 }] },
  NJ: { label: 'New Jersey', cities: [{ name: 'Trenton', lat: 40.2206, lng: -74.7699 }] },
  NM: { label: 'New Mexico', cities: [{ name: 'Santa Fe', lat: 35.6870, lng: -105.9378 }] },
  NY: { label: 'New York', cities: [{ name: 'Albany', lat: 42.6526, lng: -73.7562 }] },
  NC: { label: 'North Carolina', cities: [{ name: 'Raleigh', lat: 35.7796, lng: -78.6382 }] },
  ND: { label: 'North Dakota', cities: [{ name: 'Bismarck', lat: 46.8083, lng: -100.7837 }] },
  OH: { label: 'Ohio', cities: [{ name: 'Columbus', lat: 39.9612, lng: -82.9988 }] },
  OK: { label: 'Oklahoma', cities: [{ name: 'Oklahoma City', lat: 35.4676, lng: -97.5164 }] },
  OR: { label: 'Oregon', cities: [{ name: 'Salem', lat: 44.9429, lng: -123.0351 }] },
  PA: { label: 'Pennsylvania', cities: [{ name: 'Harrisburg', lat: 40.2732, lng: -76.8867 }] },
  RI: { label: 'Rhode Island', cities: [{ name: 'Providence', lat: 41.8240, lng: -71.4128 }] },
  SC: { label: 'South Carolina', cities: [{ name: 'Columbia', lat: 34.0007, lng: -81.0348 }] },
  SD: { label: 'South Dakota', cities: [{ name: 'Pierre', lat: 44.3683, lng: -100.3510 }] },
  TN: { label: 'Tennessee', cities: [{ name: 'Nashville', lat: 36.1627, lng: -86.7816 }] },
  TX: { label: 'Texas', cities: [{ name: 'Austin', lat: 30.2672, lng: -97.7431 }] },
  UT: { label: 'Utah', cities: [{ name: 'Salt Lake City', lat: 40.7608, lng: -111.8910 }] },
  VT: { label: 'Vermont', cities: [{ name: 'Montpelier', lat: 44.2601, lng: -72.5754 }] },
  VA: { label: 'Virginia', cities: [{ name: 'Richmond', lat: 37.5407, lng: -77.4360 }] },
  WA: { label: 'Washington', cities: [{ name: 'Olympia', lat: 47.0379, lng: -122.9007 }] },
  WV: { label: 'West Virginia', cities: [{ name: 'Charleston', lat: 38.3498, lng: -81.6326 }] },
  WI: { label: 'Wisconsin', cities: [{ name: 'Madison', lat: 43.0731, lng: -89.4012 }] },
  WY: { label: 'Wyoming', cities: [{ name: 'Cheyenne', lat: 41.1400, lng: -104.8202 }] },
};

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_USERS = [
  {
    id: 'u1',
    username: 'alice_buyer',
    role: 'buyer',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    location: 'Tallahassee, FL',
  },
  {
    id: 'u2',
    username: 'bob_seller',
    role: 'seller',
    name: 'Bob Martinez',
    email: 'bob@example.com',
  },
  {
    id: 'u3',
    username: 'carol_buyer',
    role: 'buyer',
    name: 'Carol Williams',
    email: 'carol@example.com',
    location: 'Orlando, FL',
  },
  {
    id: 'u4',
    username: 'dave_seller',
    role: 'seller',
    name: 'Dave Thompson',
    email: 'dave@example.com',
  },
];

const SAMPLE_LISTINGS = [
  {
    id: 'l1',
    sellerId: 'u2',
    sellerName: 'Bob Martinez',
    title: '2019 Sea Ray SPX 190',
    type: 'Runabout',
    year: 2019,
    length: 19,
    price: 28500,
    location: 'Tallahassee, FL',
    lat: 30.4383,
    lng: -84.2807,
    description:
      'Beautiful 2019 Sea Ray SPX 190 in excellent condition. Single axle trailer included. MercruiserTM 4.3L MPI engine with only 87 hours. Fresh water only. Bimini top, ski tow bar, and swim platform.',
    condition: 'Excellent',
    engine: 'MercruiserTM 4.3L MPI',
    hours: 87,
    status: 'available',
    datePosted: '2025-12-01',
    savedBy: ['u1'],
    imageEmoji: '🚤',
  },
  {
    id: 'l2',
    sellerId: 'u2',
    sellerName: 'Bob Martinez',
    title: '2015 Boston Whaler 230 Outrage',
    type: 'Center Console',
    year: 2015,
    length: 23,
    price: 54900,
    location: 'Panama City, FL',
    lat: 30.1588,
    lng: -85.6602,
    description:
      'Iconic Boston Whaler 230 Outrage with twin Mercury 115 hp four-stroke outboards. Full electronics package including chart plotter and VHF radio. Rod holders, live well, and anchor system. Great offshore fishing boat.',
    condition: 'Good',
    engine: 'Twin Mercury 115 Four-Stroke',
    hours: 412,
    status: 'available',
    datePosted: '2025-11-15',
    savedBy: ['u1', 'u3'],
    imageEmoji: '⛵',
  },
  {
    id: 'l3',
    sellerId: 'u4',
    sellerName: 'Dave Thompson',
    title: '2020 Pontoon SunTracker Party Barge 22',
    type: 'Pontoon',
    year: 2020,
    length: 22,
    price: 35000,
    location: 'Gainesville, FL',
    lat: 29.6516,
    lng: -82.3248,
    description:
      'Perfect family pontoon boat. Mercury 115hp four-stroke, Bluetooth stereo, full cover, and bimini top. Used primarily on Santa Fe Lake. Low hours, garage kept. Trailer included.',
    condition: 'Like New',
    engine: 'Mercury 115 Four-Stroke',
    hours: 145,
    status: 'available',
    datePosted: '2026-01-10',
    savedBy: ['u3'],
    imageEmoji: '🛥️',
  },
  {
    id: 'l4',
    sellerId: 'u4',
    sellerName: 'Dave Thompson',
    title: '2017 Sailfish 320 Express Cruiser',
    type: 'Express Cruiser',
    year: 2017,
    length: 32,
    price: 89000,
    location: 'Destin, FL',
    lat: 30.3935,
    lng: -86.4958,
    description:
      'Impressive Sailfish 320 Express Cruiser. Twin 300hp Mercury Verado outboards. Full canvas, bow thruster, extended swim platform, and large cockpit. Excellent for offshore cruising and fishing. EPIRB, life raft, and full safety equipment included.',
    condition: 'Excellent',
    engine: 'Twin Mercury Verado 300',
    hours: 310,
    status: 'available',
    datePosted: '2025-10-20',
    savedBy: [],
    imageEmoji: '🚢',
  },
  {
    id: 'l5',
    sellerId: 'u2',
    sellerName: 'Bob Martinez',
    title: '2012 Malibu Wakesetter 21 VLX',
    type: 'Wake Boat',
    year: 2012,
    length: 21,
    price: 42000,
    location: 'Orlando, FL',
    lat: 28.5383,
    lng: -81.3792,
    description:
      'The ultimate wakeboarding and wakesurfing boat. Indmar Monsoon 350hp engine. Surf Gate technology, ballast system, and tower with board racks. Traxxas tower speakers and subwoofer. Garage kept, meticulously maintained.',
    condition: 'Good',
    engine: 'Indmar Monsoon 350hp',
    hours: 650,
    status: 'available',
    datePosted: '2026-02-05',
    savedBy: ['u1', 'u3'],
    imageEmoji: '🏄',
  },
  {
    id: 'l6',
    sellerId: 'u4',
    sellerName: 'Dave Thompson',
    title: '2018 Grady-White Canyon 271',
    type: 'Center Console',
    year: 2018,
    length: 27,
    price: 79500,
    location: 'Fort Lauderdale, FL',
    lat: 26.1224,
    lng: -80.1373,
    description:
      'Top-of-the-line Grady-White with twin Yamaha 150 four-strokes. Full Garmin electronics suite, trolling motor, live wells, and rigging station. World-class build quality with legendary unsinkable hull. Ready to fish.',
    condition: 'Excellent',
    engine: 'Twin Yamaha 150 Four-Stroke',
    hours: 205,
    status: 'sold',
    datePosted: '2025-09-01',
    savedBy: [],
    imageEmoji: '🎣',
  },
  {
    id: 'l7',
    sellerId: 'u2',
    sellerName: 'Bob Martinez',
    title: '2016 Hobie Mirage Pro Angler 14',
    type: 'Kayak',
    year: 2016,
    length: 14,
    price: 3200,
    location: 'Tallahassee, FL',
    lat: 30.4383,
    lng: -84.2807,
    description:
      'Ultimate fishing kayak with Mirage Drive pedal system. VANTAGE seat, transducer scupper, retractable skeg, and bow storage. H-crate with tackle management system included. Very stable hull, great for lakes and inshore.',
    condition: 'Good',
    engine: 'Pedal Drive',
    hours: null,
    status: 'available',
    datePosted: '2026-01-28',
    savedBy: ['u3'],
    imageEmoji: '🚣',
  },
  {
    id: 'l8',
    sellerId: 'u4',
    sellerName: 'Dave Thompson',
    title: '2022 NauticStar 2102 Legacy',
    type: 'Bay Boat',
    year: 2022,
    length: 21,
    price: 58000,
    location: 'Pensacola, FL',
    lat: 30.4213,
    lng: -87.2169,
    description:
      'Brand new 2022 NauticStar 2102 Legacy bay boat. Mercury 150 ProXS four-stroke with 12 hours only. Shallow draft hull perfect for inshore fishing. Factory warranty still valid. Includes custom trailer.',
    condition: 'Like New',
    engine: 'Mercury 150 ProXS',
    hours: 12,
    status: 'available',
    datePosted: '2026-03-01',
    savedBy: ['u1'],
    imageEmoji: '⚓',
  },
];

// ── Initialization ────────────────────────────────────────────────────────────
/**
 * Seed localStorage with sample data if it hasn't been seeded yet.
 */
function initData() {
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(SAMPLE_USERS));
  }
  if (!localStorage.getItem(KEYS.LISTINGS)) {
    localStorage.setItem(KEYS.LISTINGS, JSON.stringify(SAMPLE_LISTINGS));
  }
  normalizeStoredUsers();
  normalizeStoredListings();
}

// ── Listings ──────────────────────────────────────────────────────────────────
function getListings() {
  return JSON.parse(localStorage.getItem(KEYS.LISTINGS)) || [];
}

function getListingById(id) {
  return getListings().find(l => l.id === id) || null;
}

function saveListings(listings) {
  localStorage.setItem(KEYS.LISTINGS, JSON.stringify(listings));
}

function addListing(listing) {
  const listings = getListings();
  listing.id = 'l' + Date.now();
  listing.datePosted = new Date().toISOString().split('T')[0];
  listing.savedBy = [];
  listing.status = 'available';
  listings.push(listing);
  saveListings(listings);
  return listing;
}

function updateListing(id, updates) {
  const listings = getListings();
  const idx = listings.findIndex(l => l.id === id);
  if (idx === -1) return null;
  listings[idx] = { ...listings[idx], ...updates };
  saveListings(listings);
  return listings[idx];
}

function deleteListing(id) {
  const listings = getListings().filter(l => l.id !== id);
  saveListings(listings);
}

function getListingsBySeller(sellerId) {
  return getListings().filter(l => l.sellerId === sellerId);
}

// ── Users ─────────────────────────────────────────────────────────────────────
function getUsers() {
  return JSON.parse(localStorage.getItem(KEYS.USERS)) || [];
}

function saveUsers(users) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

function updateUser(id, updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return users[idx];
}

function getUserById(id) {
  return getUsers().find(u => u.id === id) || null;
}

function getUserByUsername(username) {
  return getUsers().find(u => u.username === username) || null;
}

function registerUser(user) {
  const users = getUsers();
  if (users.find(u => u.username === user.username)) {
    return { error: 'Username already taken.' };
  }
  user.id = 'u' + Date.now();
  users.push(user);
  saveUsers(users);
  return user;
}

// ── Saved Listings (Buyer Feature) ────────────────────────────────────────────
function getSavedListingIds(userId) {
  const listings = getListings();
  return listings.filter(l => l.savedBy && l.savedBy.includes(userId)).map(l => l.id);
}

function saveListing(userId, listingId) {
  const listings = getListings();
  const listing = listings.find(l => l.id === listingId);
  if (!listing) return;
  if (!listing.savedBy.includes(userId)) {
    listing.savedBy.push(userId);
    saveListings(listings);
  }
}

function unsaveListing(userId, listingId) {
  const listings = getListings();
  const listing = listings.find(l => l.id === listingId);
  if (!listing) return;
  listing.savedBy = listing.savedBy.filter(id => id !== userId);
  saveListings(listings);
}

function isListingSaved(userId, listingId) {
  const listing = getListingById(listingId);
  return listing ? listing.savedBy.includes(userId) : false;
}

function getSavedListings(userId) {
  return getListings().filter(l => l.savedBy && l.savedBy.includes(userId));
}

// ── Utility Helpers ───────────────────────────────────────────────────────────
/**
 * Calculate distance between two lat/lng points using the Haversine formula.
 * Returns distance in miles.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
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

/**
 * Format a price number as USD currency string.
 */
function formatPrice(price) {
  return '$' + Number(price).toLocaleString('en-US');
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable form.
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Get the number of saves (popularity) for a listing.
 */
function getSaveCount(listing) {
  return listing.savedBy ? listing.savedBy.length : 0;
}

function normalizeStoredUsers() {
  const users = getUsers();
  let changed = false;
  const normalized = users.map(u => {
    if (u.role !== 'buyer') return u;
    const location = (u.location || u.city || '').trim();
    if (u.location !== location || Object.hasOwn(u, 'city')) {
      changed = true;
      const copy = { ...u, location };
      delete copy.city;
      return copy;
    }
    return u;
  });
  if (changed) saveUsers(normalized);
}

function normalizeStoredListings() {
  const listings = getListings();
  let changed = false;
  const normalized = listings.map(l => {
    const location = (l.location || l.city || '').trim();
    if (l.location !== location || Object.hasOwn(l, 'city')) {
      changed = true;
      const copy = { ...l, location };
      delete copy.city;
      return copy;
    }
    return l;
  });
  if (changed) saveListings(normalized);
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
// Open-Meteo free geocoding usage is generous, but we still throttle and cache
// to avoid bursty client behavior and reduce unnecessary requests.
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

// ── Exports (global) ──────────────────────────────────────────────────────────
// All functions and constants are made available on the window object so any
// page script can call them without a module bundler.
window.FYB = window.FYB || {};
Object.assign(window.FYB, {
  KEYS,
  BUYER_LOCATIONS,
  initData,
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
