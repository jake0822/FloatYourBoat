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
};

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_USERS = [
  {
    id: 'u1',
    username: 'alice_buyer',
    password: 'password',
    role: 'buyer',
    name: 'Alice Johnson',
    email: 'alice@example.com',
  },
  {
    id: 'u2',
    username: 'bob_seller',
    password: 'password',
    role: 'seller',
    name: 'Bob Martinez',
    email: 'bob@example.com',
  },
  {
    id: 'u3',
    username: 'carol_buyer',
    password: 'password',
    role: 'buyer',
    name: 'Carol Williams',
    email: 'carol@example.com',
  },
  {
    id: 'u4',
    username: 'dave_seller',
    password: 'password',
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

// ── Exports (global) ──────────────────────────────────────────────────────────
// All functions and constants are made available on the window object so any
// page script can call them without a module bundler.
window.FYB = window.FYB || {};
Object.assign(window.FYB, {
  KEYS,
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
});
