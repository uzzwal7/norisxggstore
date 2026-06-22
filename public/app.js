// ==========================================================================
// SECURITY: escape user-supplied text before inserting into innerHTML, to
// prevent stored XSS from feedback/order text submitted by other users.
// ==========================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================================================
// API CONFIGURATION
// ==========================================================================
const API = '/api';

// ==========================================================================
// AUTH STATE MANAGEMENT
// ==========================================================================
let currentUser  = JSON.parse(localStorage.getItem('norisxgg_user'))  || null;
let authToken    = localStorage.getItem('norisxgg_token') || null;

function getHeaders(includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth && authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
}

function saveUserState(user, token) {
  currentUser = user;
  authToken   = token;
  localStorage.setItem('norisxgg_user',  JSON.stringify(user));
  localStorage.setItem('norisxgg_token', token);
  updateHeaderUserState();
}

function clearUserState() {
  currentUser = null;
  authToken   = null;
  localStorage.removeItem('norisxgg_user');
  localStorage.removeItem('norisxgg_token');
  updateHeaderUserState();
}

function updateHeaderUserState() {
  const btn = document.querySelector('.signin-btn');
  if (!btn) return;
  if (currentUser) {
    btn.innerHTML = `<i class="fa-regular fa-user"></i><span>${escapeHtml(currentUser.username)}</span>`;
    btn.onclick = showUserMenu;
  } else {
    btn.innerHTML = `<i class="fa-regular fa-user"></i><span>Sign In</span>`;
    btn.onclick = () => switchTab('auth');
  }

  // Show "My Orders" nav link only when logged in
  const ordersNav = document.getElementById('nav-orders');
  if (ordersNav) ordersNav.style.display = currentUser ? '' : 'none';
  const mobileOrdersNav = document.getElementById('mobile-nav-orders');
  if (mobileOrdersNav) mobileOrdersNav.style.display = currentUser ? '' : 'none';

  // Show notification bell only when logged in
  const notifContainer = document.getElementById('notif-bell-container');
  if (notifContainer) notifContainer.style.display = currentUser ? '' : 'none';
  if (currentUser) loadNotifications();
}

function showUserMenu() {
  if (!currentUser) { switchTab('auth'); return; }
  const existing = document.getElementById('user-dropdown-menu');
  if (existing) { existing.remove(); return; }

  const menu = document.createElement('div');
  menu.id = 'user-dropdown-menu';
  menu.className = 'user-dropdown-menu';
  menu.innerHTML = `
    <div class="udm-header">
      <i class="fas fa-user-circle"></i>
      <div>
        <strong>${escapeHtml(currentUser.username)}</strong>
        <span>${escapeHtml(currentUser.email)}</span>
      </div>
    </div>
    <hr>
    <button onclick="switchTab('orders'); document.getElementById('user-dropdown-menu')?.remove();">
      <i class="fas fa-box-open"></i> My Orders
    </button>
    <button onclick="handleLogout()">
      <i class="fas fa-right-from-bracket"></i> Logout
    </button>
  `;
  document.querySelector('.header-actions').appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
}

async function handleLogout() {
  clearUserState();
  cart = [];
  localStorage.removeItem('norisxgg_cart');
  updateCartUI();
  switchTab('home');
  showToast('Logged out successfully', 'info');
  document.getElementById('user-dropdown-menu')?.remove();
}

// ==========================================================================
// NOTIFICATIONS — admin sends messages (e.g. "game ID sent to your email")
// ==========================================================================
let myNotifications = [];

async function loadNotifications() {
  if (!authToken) return;
  try {
    const res = await fetch(`${API}/notifications/mine`, { headers: getHeaders() });
    if (!res.ok) return;
    myNotifications = await res.json();
    const unread = myNotifications.filter(n => !n.read).length;
    const badge  = document.getElementById('notif-badge');
    if (badge) {
      badge.style.display = unread ? 'flex' : 'none';
      badge.innerText = unread > 9 ? '9+' : unread;
    }
  } catch (err) {
    console.error('Failed to load notifications:', err);
  }
}

function toggleNotifDropdown() {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;
  const opening = !dropdown.classList.contains('open');
  if (opening) {
    renderNotifDropdown();
    dropdown.classList.add('open');
    setTimeout(() => document.addEventListener('click', closeNotifOnOutsideClick), 10);
  } else {
    dropdown.classList.remove('open');
  }
}

function closeNotifOnOutsideClick(e) {
  const container = document.getElementById('notif-bell-container');
  if (container && !container.contains(e.target)) {
    document.getElementById('notif-dropdown')?.classList.remove('open');
    document.removeEventListener('click', closeNotifOnOutsideClick);
  }
}

function renderNotifDropdown() {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;

  if (!myNotifications.length) {
    dropdown.innerHTML = `<div class="notif-empty"><i class="fas fa-bell-slash" style="font-size:22px;display:block;margin-bottom:8px;"></i>No notifications yet</div>`;
    return;
  }

  const icons = { info: 'fa-circle-info', success: 'fa-circle-check', error: 'fa-triangle-exclamation' };
  dropdown.innerHTML = myNotifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <i class="fas ${icons[n.type] || icons.info} notif-icon ${n.type}" onclick="markNotifRead('${n._id}')"></i>
      <div onclick="markNotifRead('${n._id}')" style="flex:1;">
        <div class="notif-text">${n.message}</div>
        <span class="notif-time">${new Date(n.createdAt).toLocaleString()}</span>
      </div>
      <button class="notif-delete-btn" onclick="event.stopPropagation(); deleteNotif('${n._id}')" title="Delete">
        <i class="fas fa-times"></i>
      </button>
    </div>`).join('');
}

async function deleteNotif(id) {
  try {
    await fetch(`${API}/notifications/${id}`, { method: 'DELETE', headers: getHeaders() });
    myNotifications = myNotifications.filter(n => n._id !== id);
    renderNotifDropdown();
    const unread = myNotifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.style.display = unread ? 'flex' : 'none'; badge.innerText = unread > 9 ? '9+' : unread; }
  } catch (err) {
    console.error('Failed to delete notification:', err);
  }
}

async function markNotifRead(id) {
  try {
    await fetch(`${API}/notifications/${id}/read`, { method: 'PUT', headers: getHeaders() });
    const n = myNotifications.find(x => x._id === id);
    if (n) n.read = true;
    renderNotifDropdown();
    const unread = myNotifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.style.display = unread ? 'flex' : 'none'; badge.innerText = unread > 9 ? '9+' : unread; }
  } catch (err) {
    console.error('Failed to mark notification read:', err);
  }
}

// ==========================================================================
// PRODUCT DATA — fetched from MongoDB via API
// ==========================================================================
let products = [];

async function loadProducts() {
  try {
    const res = await fetch(`${API}/products`);
    if (!res.ok) throw new Error('Server error');
    products = await res.json();
    renderHomeProducts();
    renderShopProducts();
    renderOffersPage();
    syncCarouselPrices();
  } catch (err) {
    console.error('Failed to load products:', err);
    showToast('Could not load products. Is the server running?', 'error');
  }
}

// ==========================================================================
// SPA ROUTING & APP STATE
// ==========================================================================
let activeTab      = 'home';
let currentSlide   = 0;
let carouselTimer  = null;
function getSlidesCount() { return document.querySelectorAll('.carousel-slide').length || 1; }

let cart          = JSON.parse(localStorage.getItem('norisxgg_cart')) || [];
let appliedPromo  = null;
let promoDiscount = 0;

let selectedCategory = 'all';
let searchFilterStr  = '';
let minPriceFilter   = 0;
let maxPriceFilter   = 15900;
let activeSort       = 'default';

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initCarousel();
  initRouting();
  updateCartUI();
  updatePriceFilterOutput();
  updateHeaderUserState();

  // Load products from API
  await loadProducts();

  // Load real customer rating stats (homepage + about page)
  await loadRatingStats();

  // If logged in, load server cart + notifications
  if (authToken) {
    await loadServerCart();
    await loadNotifications();
  }
});

// ── Real average rating from submitted feedback, shown on Home + About ──
async function loadRatingStats() {
  try {
    const res  = await fetch(`${API}/feedback/stats`);
    const data = await res.json();

    const starsEl = document.getElementById('home-rating-stars');
    const textEl  = document.getElementById('home-rating-text');
    if (starsEl && textEl) {
      if (data.count > 0) {
        starsEl.innerHTML = renderStarIcons(data.average);
        textEl.innerText  = `${data.average} / 5 — based on ${data.count} review${data.count === 1 ? '' : 's'}`;
      } else {
        textEl.innerText = 'Be the first to leave a review!';
      }
    }

    const aboutStat = document.getElementById('about-rating-stat');
    if (aboutStat) {
      aboutStat.querySelector('h3').innerText = data.count > 0 ? `${data.average} / 5` : 'No ratings yet';
    }

    // Replace the static testimonials with real reviews if any exist
    if (data.topReviews && data.topReviews.length > 0) {
      const grid = document.getElementById('testimonials-grid');
      if (grid) {
        grid.innerHTML = data.topReviews.map(r => `
          <div class="testimonial-card">
            <div class="testi-stars">${renderStarIcons(r.rating)}</div>
            <p class="testi-quote">"${escapeHtml(r.message)}"</p>
            <div class="testi-author">- ${escapeHtml(r.name)}</div>
          </div>`).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load rating stats:', err);
  }
}

function renderStarIcons(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let html = '';
  for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
  if (half) html += '<i class="fas fa-star-half-stroke"></i>';
  while (html.split('<i').length - 1 < 5) html += '<i class="far fa-star"></i>';
  return html;
}

// ── If logged in, load cart from server ──
async function loadServerCart() {
  try {
    const res  = await fetch(`${API}/cart`, { headers: getHeaders() });
    const data = await res.json();
    if (data.cart && data.cart.length > 0) {
      // Merge server cart with local cart
      data.cart.forEach(serverItem => {
        const local = cart.find(i => i.name === serverItem.name);
        if (local) {
          local.qty = Math.max(local.qty, serverItem.qty);
        } else {
          cart.push(serverItem);
        }
      });
      localStorage.setItem('norisxgg_cart', JSON.stringify(cart));
      updateCartUI();
    }
  } catch (err) {
    console.error('Cart load error:', err);
  }
}

// ── Sync cart to server if logged in ──
async function syncCartToServer() {
  if (!authToken) return;
  try {
    await fetch(`${API}/cart/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ cart })
    });
  } catch (err) {
    console.error('Cart sync failed:', err);
  }
}

// Routing implementation
function initRouting() {
  const validTabs = ['home', 'shop', 'offer', 'about', 'auth', 'orders'];
  const hash = window.location.hash.replace('#', '');
  switchTab(validTabs.includes(hash) ? hash : 'home');

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (validTabs.includes(h)) switchTab(h, false);
  });
}

function switchTab(tabId, updateHash = true) {
  // Redirect to auth if trying to access orders without login
  if (tabId === 'orders' && !currentUser) {
    showToast('Please sign in to view your orders', 'error');
    tabId = 'auth';
  }

  activeTab = tabId;
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
  document.getElementById(`tab-${tabId}`)?.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`nav-${tabId}`)?.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (updateHash) window.location.hash = tabId;

  document.getElementById('threedot-dropdown-box')?.parentNode.classList.remove('open');

  // Load orders when tab opens
  if (tabId === 'orders') renderOrdersTab();
}

// ==========================================================================
// THEME CONTROLLER
// ==========================================================================
function initTheme() {
  const saved = localStorage.getItem('norisxgg_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('norisxgg_theme', next);
  showToast(`Switched to ${next.toUpperCase()} mode`, 'info');
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3200);
}

// ==========================================================================
// HERO CAROUSEL
// ==========================================================================
function initCarousel()       { startCarouselTimer(); }
function startCarouselTimer() {
  if (carouselTimer) clearInterval(carouselTimer);
  carouselTimer = setInterval(() => changeSlide(1), 6000);
}

function changeSlide(dir) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots   = document.querySelectorAll('.carousel-dots .dot');
  if (!slides.length) return;
  const count = slides.length;
  slides[currentSlide].classList.remove('active');
  dots[currentSlide]?.classList.remove('active');
  currentSlide = (currentSlide + dir + count) % count;
  slides[currentSlide].classList.add('active');
  dots[currentSlide]?.classList.add('active');
  startCarouselTimer();
}

function setSlide(index) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots   = document.querySelectorAll('.carousel-dots .dot');
  if (!slides.length) return;
  slides[currentSlide].classList.remove('active');
  dots[currentSlide]?.classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  dots[currentSlide]?.classList.add('active');
  startCarouselTimer();
}

// ==========================================================================
// SEARCH HANDLERS — icon-only button that expands into a text input
// ==========================================================================
function toggleSearchBox() {
  const box   = document.getElementById('search-box-container');
  const input = document.getElementById('header-search-input');
  if (!box) return;
  const expanding = !box.classList.contains('search-expanded');
  if (expanding) {
    box.classList.add('search-expanded');
    setTimeout(() => input?.focus(), 50); // opens the mobile keyboard once visible
  } else {
    box.classList.remove('search-expanded');
    input?.blur();
  }
}

function collapseSearchIfEmpty() {
  const box   = document.getElementById('search-box-container');
  const input = document.getElementById('header-search-input');
  if (box && input && !input.value.trim()) {
    setTimeout(() => box.classList.remove('search-expanded'), 150);
  }
}

function handleHeaderSearch(query) {
  searchFilterStr = query;
  const s = document.getElementById('sidebar-search-input');
  if (s) s.value = query;
  if (activeTab !== 'shop') switchTab('shop');
  renderShopProducts();
}

function handleSidebarSearch(query) {
  searchFilterStr = query;
  const h = document.getElementById('header-search-input');
  if (h) h.value = query;
  renderShopProducts();
}

function toggleThreeDotMenu(e) {
  e.stopPropagation();
  document.querySelector('.threedot-menu-container').classList.toggle('open');
}
window.addEventListener('click', () => {
  document.querySelector('.threedot-menu-container')?.classList.remove('open');
});

function scrollToFeedback() {
  switchTab('home');
  setTimeout(() => document.getElementById('feedback-anchor')?.scrollIntoView({ behavior: 'smooth' }), 100);
}

// ==========================================================================
// HOME PAGE
// ==========================================================================
function renderHomeProducts() {
  const container = document.getElementById('top-selling-container');
  if (!container) return;
  const top = products.filter(p => p.isTopSelling);
  container.innerHTML = top.length ? top.map(createProductCardHTML).join('') : '<p>Loading products...</p>';
}

function goToShopCategory(cat) { filterByCategory(cat); switchTab('shop'); }

// ==========================================================================
// SHOP FILTERS
// ==========================================================================
function filterByCategory(cat) {
  selectedCategory = cat;
  document.querySelectorAll('.sidebar-cat-link').forEach(l => l.classList.remove('active'));
  const map = {
    'all': 'cat-all', 'Valo Points': 'cat-valo', 'CS 2 Points': 'cat-cs2',
    'Private Steam Accounts': 'cat-steam-acc', 'Offline Steam Games': 'cat-steam-games',
    'PUBG UC Store': 'cat-pubg', 'FreeFire Topup Store': 'cat-ff', 'AAA Games': 'cat-aaa'
  };
  document.getElementById(map[cat])?.classList.add('active');
  renderShopProducts();
}

function updatePriceFilterOutput() {
  const minS = document.getElementById('price-min');
  const maxS = document.getElementById('price-max');
  const lbl  = document.getElementById('price-range-val');
  if (!minS || !maxS) return;
  let min = parseInt(minS.value), max = parseInt(maxS.value);
  if (min > max) [min, max] = [max, min];
  minPriceFilter = min; maxPriceFilter = max;
  if (lbl) lbl.innerText = `Rs. ${min.toLocaleString()} — Rs. ${max.toLocaleString()}`;
  renderShopProducts();
}

function handleSortProducts(val) { activeSort = val; renderShopProducts(); }

// ==========================================================================
// SHOP PRODUCT GRID
// ==========================================================================
function renderShopProducts() {
  const grid = document.getElementById('shop-products-grid');
  const cnt  = document.getElementById('results-count-text');
  if (!grid) return;

  let filtered = products.filter(p => {
    const cat    = selectedCategory === 'all' || p.category === selectedCategory;
    const price  = p.price >= minPriceFilter && p.price <= maxPriceFilter;
    const search = p.name.toLowerCase().includes(searchFilterStr.toLowerCase()) ||
                   p.category.toLowerCase().includes(searchFilterStr.toLowerCase());
    return cat && price && search;
  });

  if (activeSort === 'price-low')  filtered.sort((a,b) => a.price - b.price);
  if (activeSort === 'price-high') filtered.sort((a,b) => b.price - a.price);
  if (activeSort === 'rating')     filtered.sort((a,b) => b.rating - a.rating);

  grid.innerHTML = filtered.length
    ? filtered.map(createProductCardHTML).join('')
    : `<div class="empty-shop-results" style="grid-column:1/-1;text-align:center;padding:50px 0;">
        <i class="fas fa-face-frown" style="font-size:44px;color:var(--text-muted);margin-bottom:15px;"></i>
        <h3>No Products Found</h3>
        <p style="color:var(--text-secondary);font-size:13px;">Adjust filters or search.</p>
       </div>`;

  renderRelatedProductsWidget(filtered);
  if (cnt) cnt.innerText = `Showing 1–${filtered.length} of ${filtered.length} results`;
}

function createProductCardHTML(product) {
  const id    = product._id || product.id;
  const sale  = product.sale ? `<span class="sale-badge">Sale!</span>` : '';
  const orig  = product.originalPrice ? `<span class="orig-price">Rs. ${product.originalPrice.toLocaleString()}</span>` : '';
  return `
    <div class="product-card" data-category="${product.category}">
      <div class="card-img-box">
        ${sale}
        <span class="rating-badge"><i class="fas fa-star"></i> ${product.rating.toFixed(1)}</span>
        <span class="category-tag">${product.category}</span>
        <img src="${product.image}" alt="${product.name}" onerror="this.src='images/1.png'">
      </div>
      <div class="card-details">
        <h3 class="product-title">${product.name}</h3>
        <div class="card-price-row">
          ${orig}
          <span class="curr-price">Rs. ${product.price.toLocaleString()}</span>
        </div>
        <div class="card-btn-group">
          <button class="add-cart-btn" onclick="addToCart('${product.name}')">
            <i class="fas fa-shopping-basket"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>`;
}

function renderRelatedProductsWidget(current) {
  const container = document.getElementById('related-products-container');
  if (!container) return;
  const related = products.filter(p => !current.find(c => c._id === p._id)).slice(0, 3);
  container.innerHTML = (related.length ? related : products.slice(0, 3)).map(p => `
    <div class="related-prod-item" onclick="goToShopCategory('${p.category}')">
      <div class="related-prod-img"><img src="${p.image}" alt="${p.name}" onerror="this.src='images/1.png'"></div>
      <div class="related-prod-info">
        <h4>${p.name}</h4>
        <span class="related-prod-price">Rs. ${p.price.toLocaleString()}</span>
      </div>
    </div>`).join('');
}

// ==========================================================================
// OFFERS PAGE
// ==========================================================================
function renderOffersPage() {
  const container = document.getElementById('offers-deals-grid');
  if (!container) return;
  const deals = products.filter(p => p.featuredInOffer);
  container.innerHTML = deals.map(createProductCardHTML).join('');
}

// ==========================================================================
// SHOPPING CART
// ==========================================================================
function addToCart(productName) {
  const product = products.find(p => p.name === productName);
  if (!product) return;

  const item = cart.find(i => i.name === productName);
  if (item) { item.qty += 1; }
  else {
    cart.push({
      productId: product._id,
      name:      product.name,
      price:     product.price,
      image:     product.image,
      category:  product.category,
      qty:       1
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added ${product.name} to cart`);
  toggleCartDrawer(true);
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart();
  updateCartUI();
  showToast(`Removed ${name} from cart`, 'error');
}

function updateQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.name !== name);
    showToast(`Removed ${name}`, 'error');
  } else {
    showToast(`Updated quantity`, 'info');
  }
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('norisxgg_cart', JSON.stringify(cart));
  syncCartToServer();
}

function getCartTotal() {
  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return Math.max(0, sub - promoDiscount);
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  ['floating-cart-badge', 'cart-items-count'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = total;
    el.style.display = id === 'cart-items-count' ? '' : (total === 0 ? 'none' : 'flex');
  });
  renderSidebarCart();
  renderCartDrawer();
}

function renderSidebarCart() {
  const c = document.getElementById('sidebar-cart-list');
  if (!c) return;
  if (!cart.length) { c.innerHTML = `<p class="empty-cart-text">No products in the cart.</p>`; return; }
  c.innerHTML = cart.map(item => `
    <div class="sidebar-cart-item">
      <div class="sidebar-cart-img"><i class="fas fa-shopping-basket"></i></div>
      <div class="sidebar-cart-details">
        <h4 class="sidebar-cart-title">${item.name}</h4>
        <span class="sidebar-cart-price">${item.qty} &times; Rs. ${item.price.toLocaleString()}</span>
      </div>
      <div class="sidebar-cart-remove" onclick="removeFromCart('${item.name}')">
        <i class="fas fa-trash-can"></i>
      </div>
    </div>`).join('') +
    `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-top:14px;color:var(--text-primary);">
      <span>Subtotal:</span>
      <span class="accent-text-blue">Rs. ${getCartTotal().toLocaleString()}</span>
    </div>
    <button class="checkout-btn" onclick="toggleCartDrawer(true)" style="padding:10px;font-size:11px;margin-top:14px;">Open Cart Drawer</button>`;
}

function renderCartDrawer() {
  const c       = document.getElementById('cart-drawer-items-list');
  const footer  = document.getElementById('cart-drawer-footer-details');
  const total   = document.getElementById('cart-drawer-total');
  const discRow = document.getElementById('cart-discount-row');
  const discLbl = document.getElementById('applied-code-label');
  const discVal = document.getElementById('cart-drawer-discount');
  if (!c) return;

  if (!cart.length) {
    c.innerHTML = `
      <div class="empty-cart-drawer">
        <i class="fas fa-shopping-bag empty-bag-icon"></i>
        <p>Your shopping cart is empty</p>
        <button class="shop-now-btn" onclick="switchTab('shop');toggleCartDrawer();">Shop Now</button>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';
  if (total)  total.innerText = `Rs. ${getCartTotal().toLocaleString()}`;

  if (appliedPromo && promoDiscount > 0) {
    if (discRow) discRow.style.display = 'flex';
    if (discLbl) discLbl.innerText = appliedPromo;
    if (discVal) discVal.innerText = `-Rs. ${promoDiscount.toLocaleString()}`;
  } else {
    if (discRow) discRow.style.display = 'none';
  }

  c.innerHTML = cart.map(item => `
    <div class="drawer-cart-item">
      <div class="drawer-item-img">
        <img src="${item.image || 'images/1.png'}" alt="${item.name}" onerror="this.src='images/1.png'">
      </div>
      <div class="drawer-item-details">
        <h4 class="drawer-item-title">${item.name}</h4>
        <div class="drawer-item-price-calc">
          ${item.qty} &times; Rs. ${item.price.toLocaleString()} = 
          <strong class="accent-text-blue">Rs. ${(item.qty * item.price).toLocaleString()}</strong>
        </div>
        <div class="drawer-item-qty-control">
          <button class="qty-btn" onclick="updateQty('${item.name}', -1)">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${item.name}', 1)">+</button>
        </div>
      </div>
      <div class="drawer-item-remove" onclick="removeFromCart('${item.name}')">
        <i class="fas fa-trash-can"></i>
      </div>
    </div>`).join('');
}

function toggleCartDrawer(forceOpen = false) {
  const panel    = document.getElementById('cart-drawer-panel');
  const backdrop = document.getElementById('cart-backdrop');
  if (!panel || !backdrop) return;
  if (forceOpen) {
    panel.classList.add('open');
    backdrop.style.display = 'block';
  } else {
    panel.classList.toggle('open');
    backdrop.style.display = panel.classList.contains('open') ? 'block' : 'none';
  }
}

function buyItemDirectly(name) { addToCart(name); toggleCartDrawer(true); }

// ==========================================================================
// PROMO CODE — validated against server
// ==========================================================================
async function applyPromoCode() {
  const input = document.getElementById('promo-code-input');
  if (!input || !input.value.trim()) return;

  const code = input.value.trim();

  if (!authToken) {
    showToast('Please sign in to apply a promo code', 'error');
    return;
  }

  try {
    const res  = await fetch(`${API}/promo/apply`, {
      method:  'POST',
      headers: getHeaders(),
      body:    JSON.stringify({ code, cartTotal: getCartTotal() + promoDiscount })
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.message, 'error'); return; }

    appliedPromo  = data.code;
    promoDiscount = data.discount;
    updateCartUI();
    showToast(data.message, 'success');
  } catch {
    showToast('Failed to apply promo code', 'error');
  }
  input.value = '';
}

// ==========================================================================
// CHECKOUT — Step 1: choose payment method → Step 2: fill details +
// (for wallet payments) scan QR & upload payment screenshot → places
// the real order in MongoDB. Rating is required; screenshot required
// for everything except Pay on Delivery.
// ==========================================================================
async function handleCheckoutClick() {
  if (!cart.length) return;

  if (!authToken) {
    showToast('Please sign in to checkout', 'error');
    toggleCartDrawer();
    switchTab('auth');
    return;
  }

  const method = await showPaymentMethodModal();
  if (!method) return;

  // Prefill phone/email/address from the user's profile
  let profile = {};
  try {
    const res = await fetch(`${API}/auth/me`, { headers: getHeaders() });
    if (res.ok) profile = await res.json();
  } catch { /* prefill is best-effort, ignore failure */ }

  showOrderDetailsModal(method, profile);
}

const QR_IMAGES = {
  esewa:  { src: 'images/qr/esewa-qr.png',  label: 'eSewa',  color: '#60bb46' },
  khalti: { src: 'images/qr/khalti-qr.png', label: 'Khalti', color: '#5c2d91' },
  imepay: { src: 'images/qr/imepay-qr.png', label: 'IME Pay', color: '#ed1c24' }
};

function showOrderDetailsModal(method, profile) {
  const needsScreenshot = method !== 'cod';
  const isCOD = method === 'cod';
  const qr = QR_IMAGES[method];

  const overlay = document.createElement('div');
  overlay.id = 'order-details-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';
  overlay.innerHTML = `
    <div style="background:var(--bg-card);border-radius:16px;padding:28px;max-width:460px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.4);max-height:90vh;overflow-y:auto;">
      <h3 style="margin:0 0 4px;color:var(--text-primary);font-size:19px;">Complete Your Order</h3>
      <p style="color:var(--text-secondary);font-size:12.5px;margin-bottom:18px;">
        Order Total: <strong class="accent-text-blue" id="od-total-display">Rs. ${getCartTotal().toLocaleString()}</strong>
        &bull; Paying via ${(QR_IMAGES[method]?.label || 'Pay on Delivery')}
      </p>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Phone Number *</label>
          <input id="od-phone" type="tel" value="${profile.phone || ''}" required
            style="width:100%;padding:10px 12px;margin-top:4px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);font-size:13px;">
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Email (game will be sent here) *</label>
          <input id="od-email" type="email" value="${profile.email || ''}" required
            style="width:100%;padding:10px 12px;margin-top:4px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);font-size:13px;">
        </div>

        ${isCOD ? `
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Delivery Address *</label>
          <input id="od-address" type="text" value="${profile.address || ''}" required
            style="width:100%;padding:10px 12px;margin-top:4px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);font-size:13px;">
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Delivery Location *</label>
          <div style="display:flex;gap:10px;margin-top:6px;">
            <label style="flex:1;display:flex;align-items:center;gap:6px;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:12.5px;color:var(--text-primary);cursor:pointer;">
              <input type="radio" name="od-delivery-zone" value="99" checked onchange="updateOrderTotalDisplay()"> Inside Kathmandu Valley — Rs. 99
            </label>
            <label style="flex:1;display:flex;align-items:center;gap:6px;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:12.5px;color:var(--text-primary);cursor:pointer;">
              <input type="radio" name="od-delivery-zone" value="299" onchange="updateOrderTotalDisplay()"> Outside Valley — Rs. 299
            </label>
          </div>
        </div>` : ''}

        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Rate Your Experience *</label>
          <div class="fb-rating-stars" id="od-rating-stars" style="margin-top:4px;">
            <input type="radio" name="od-rating-val" id="od-star5" value="5" checked><label for="od-star5"><i class="fas fa-star"></i></label>
            <input type="radio" name="od-rating-val" id="od-star4" value="4"><label for="od-star4"><i class="fas fa-star"></i></label>
            <input type="radio" name="od-rating-val" id="od-star3" value="3"><label for="od-star3"><i class="fas fa-star"></i></label>
            <input type="radio" name="od-rating-val" id="od-star2" value="2"><label for="od-star2"><i class="fas fa-star"></i></label>
            <input type="radio" name="od-rating-val" id="od-star1" value="1"><label for="od-star1"><i class="fas fa-star"></i></label>
          </div>
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Feedback (optional)</label>
          <textarea id="od-feedback" rows="2" placeholder="Anything you'd like to tell us?"
            style="width:100%;padding:10px 12px;margin-top:4px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);font-size:13px;resize:vertical;"></textarea>
        </div>

        ${needsScreenshot ? `
        <div style="border-top:1px solid var(--border-color);padding-top:14px;margin-top:4px;">
          <p style="font-size:12.5px;color:var(--text-primary);font-weight:700;margin-bottom:8px;">
            <i class="fas fa-qrcode" style="color:${qr.color};"></i> Scan & Pay with ${qr.label}
          </p>
          <div style="display:flex;justify-content:center;background:white;border-radius:10px;padding:14px;margin-bottom:10px;">
            <img src="${qr.src}" alt="${qr.label} QR Code" style="max-width:180px;width:100%;"
              onerror="this.outerHTML='<div style=\\'padding:30px;text-align:center;color:#888;font-size:12px;\\'><i class=\\'fas fa-qrcode\\' style=\\'font-size:40px;display:block;margin-bottom:8px;\\'></i>QR code image not added yet.<br>Admin: place it at public/images/qr/${method}-qr.png</div>'">
          </div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Upload Payment Screenshot *</label>
          <input id="od-screenshot" type="file" accept="image/*" required
            style="width:100%;padding:8px;margin-top:4px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;">
          <img id="od-screenshot-preview" style="display:none;max-width:100%;border-radius:8px;margin-top:8px;border:1px solid var(--border-color);">
        </div>` : ''}
      </div>

      <div style="display:flex;gap:10px;margin-top:22px;">
        <button onclick="document.getElementById('order-details-overlay').remove()"
          style="flex:1;padding:12px;border:1px solid var(--border-color);background:transparent;color:var(--text-secondary);border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">
          Cancel
        </button>
        <button id="od-submit-btn" onclick="submitOrderDetails('${method}')"
          style="flex:2;padding:12px;border:none;background:var(--color-blue);color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;">
          <i class="fas fa-check"></i> Confirm Order
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const fileInput = document.getElementById('od-screenshot');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const preview = document.getElementById('od-screenshot-preview');
        preview.src = reader.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }
}

function updateOrderTotalDisplay() {
  const zoneInput = document.querySelector('input[name="od-delivery-zone"]:checked');
  const deliveryFee = zoneInput ? Number(zoneInput.value) : 0;
  const display = document.getElementById('od-total-display');
  if (display) display.innerText = `Rs. ${(getCartTotal() + deliveryFee).toLocaleString()}`;
}

async function submitOrderDetails(method) {
  const phone    = document.getElementById('od-phone').value.trim();
  const email    = document.getElementById('od-email').value.trim();
  const addressEl = document.getElementById('od-address');
  const address  = addressEl ? addressEl.value.trim() : '';
  const rating   = document.querySelector('input[name="od-rating-val"]:checked')?.value;
  const feedback = document.getElementById('od-feedback').value.trim();
  const fileInput = document.getElementById('od-screenshot');
  const btn = document.getElementById('od-submit-btn');

  if (!phone || !email) { showToast('Phone and email are required', 'error'); return; }
  if (!rating)           { showToast('Please rate your experience to continue', 'error'); return; }

  let deliveryCharge = 0;
  if (method === 'cod') {
    if (!address) { showToast('Delivery address is required', 'error'); return; }
    const zoneInput = document.querySelector('input[name="od-delivery-zone"]:checked');
    deliveryCharge = zoneInput ? Number(zoneInput.value) : 99;
  }

  let screenshotBase64 = null;
  if (method !== 'cod') {
    const file = fileInput?.files[0];
    if (!file) { showToast('Please upload your payment screenshot', 'error'); return; }
    screenshotBase64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

  try {
    const res  = await fetch(`${API}/orders`, {
      method:  'POST',
      headers: getHeaders(),
      body:    JSON.stringify({
        items:         cart.map(i => ({ productId: i.productId, name: i.name, price: i.price, image: i.image, qty: i.qty })),
        promoCode:     appliedPromo,
        paymentMethod: method,
        customerEmail:    email,
        customerPhone:    phone,
        customerAddress:  address,
        customerRating:   Number(rating),
        customerFeedback: feedback,
        deliveryCharge:   deliveryCharge,
        paymentScreenshot: screenshotBase64
      })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check"></i> Confirm Order';
      return;
    }

    // Clear cart + close modals
    cart = [];
    appliedPromo  = null;
    promoDiscount = 0;
    localStorage.removeItem('norisxgg_cart');
    updateCartUI();
    toggleCartDrawer();
    document.getElementById('order-details-overlay')?.remove();

    showThankYouModal();
    setTimeout(() => switchTab('orders'), 2200);
  } catch {
    showToast('Failed to place order. Try again.', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Confirm Order';
  }
}

function showThankYouModal() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = `
    <div style="background:var(--bg-card);border-radius:16px;padding:40px 32px;max-width:380px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <i class="fas fa-circle-check" style="font-size:56px;color:#10b981;margin-bottom:16px;"></i>
      <h3 style="color:var(--text-primary);margin-bottom:8px;">Thank you for buying from our website!</h3>
      <p style="color:var(--text-secondary);font-size:13.5px;">Your order is on the way. We'll email your game/code shortly — you'll also get a notification here once it's sent.</p>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 4000);
}

function showPaymentMethodModal() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:var(--bg-card);border-radius:16px;padding:32px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
        <h3 style="margin:0 0 8px;color:var(--text-primary);font-size:20px;">Select Payment Method</h3>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:24px;">Choose how you'd like to pay. You'll confirm your details and payment proof next.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          ${[['esewa','eSewa','#60bb46'],['khalti','Khalti','#5c2d91'],['imepay','IME Pay','#ed1c24'],['cod','Pay on Delivery','#0088ff']].map(([val,lbl,clr]) => `
            <button onclick="document.body.removeChild(document.getElementById('pm-overlay'));document.body._pmResolve('${val}');"
              style="padding:14px;border:2px solid ${clr};border-radius:10px;background:transparent;color:var(--text-primary);cursor:pointer;font-weight:600;font-size:13px;transition:all .2s;"
              onmouseover="this.style.background='${clr}';this.style.color='white';"
              onmouseout="this.style.background='transparent';this.style.color='var(--text-primary)';">
              ${lbl}
            </button>`).join('')}
        </div>
        <button onclick="document.body.removeChild(document.getElementById('pm-overlay'));document.body._pmResolve(null);"
          style="width:100%;padding:10px;border:none;background:transparent;color:var(--text-muted);cursor:pointer;font-size:13px;">
          Cancel
        </button>
      </div>`;
    overlay.id = 'pm-overlay';
    document.body._pmResolve = resolve;
    document.body.appendChild(overlay);
  });
}

// ==========================================================================
// MY ORDERS TAB
// ==========================================================================
async function renderOrdersTab() {
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:30px;color:var(--color-blue);"></i><p>Loading orders...</p></div>';

  try {
    const res    = await fetch(`${API}/orders/mine`, { headers: getHeaders() });
    const orders = await res.json();

    if (!orders.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
          <i class="fas fa-box-open" style="font-size:50px;color:var(--text-muted);margin-bottom:16px;"></i>
          <h3 style="color:var(--text-primary);">No orders yet</h3>
          <p style="color:var(--text-secondary);">Start shopping to see your orders here.</p>
          <button class="add-cart-btn" onclick="switchTab('shop')" style="margin-top:16px;padding:12px 24px;">Browse Shop</button>
        </div>`;
      return;
    }

    const statusColor = { pending:'#f59e0b', processing:'#3b82f6', completed:'#10b981', cancelled:'#ef4444' };
    container.innerHTML = orders.map(order => `
      <div class="order-card" style="background:var(--bg-card);border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid var(--border-color);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-size:12px;color:var(--text-muted);">ORDER ID</span>
            <p style="font-size:13px;font-weight:700;color:var(--text-primary);font-family:monospace;">#${order._id.slice(-8).toUpperCase()}</p>
          </div>
          <div style="text-align:right;">
            <span style="background:${statusColor[order.status]};color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">
              ${order.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div style="border-top:1px solid var(--border-color);padding-top:12px;">
          ${order.items.map(item => `
            <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);margin-bottom:4px;">
              <span>${item.name} &times; ${item.qty}</span>
              <span>Rs. ${(item.price * item.qty).toLocaleString()}</span>
            </div>`).join('')}
          ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#10b981;"><span>Promo (${order.promoCode})</span><span>-Rs. ${order.discount}</span></div>` : ''}
          ${order.deliveryCharge > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);"><span>Delivery Fee</span><span>Rs. ${order.deliveryCharge}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;font-weight:700;color:var(--text-primary);margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color);">
            <span>Total</span>
            <span class="accent-text-blue">Rs. ${order.total.toLocaleString()}</span>
          </div>
        </div>
        <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
          <span style="font-size:12px;color:var(--text-muted);">${new Date(order.createdAt).toLocaleString()} &bull; ${order.paymentMethod.toUpperCase()}</span>
          <span style="font-size:12px;font-weight:600;color:${order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'};">${order.paymentStatus.toUpperCase()}</span>
        </div>
      </div>`).join('');
  } catch {
    container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:40px;">Failed to load orders.</p>';
  }
}

// ==========================================================================
// FORM: FEEDBACK — saves to MongoDB
// ==========================================================================
async function handleFeedbackSubmit(e) {
  e.preventDefault();
  const name    = document.getElementById('fb-name').value;
  const email   = document.getElementById('fb-email').value;
  const rating  = document.querySelector('input[name="fb-rating-val"]:checked')?.value;
  const message = document.getElementById('fb-message').value;

  try {
    const res  = await fetch(`${API}/feedback`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, rating: Number(rating), message })
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.message, 'error'); return; }

    document.getElementById('fb-success-msg').style.display = 'flex';
    document.getElementById('store-feedback-form').reset();
    showToast('Feedback submitted! Thank you.');
    setTimeout(() => { document.getElementById('fb-success-msg').style.display = 'none'; }, 4000);
  } catch {
    showToast('Failed to submit feedback. Try again.', 'error');
  }
}

// ==========================================================================
// FORM: SIGN IN — real API call
// ==========================================================================
async function handleSignInSubmit(e) {
  e.preventDefault();
  const identifier = document.getElementById('si-username').value;
  const password   = document.getElementById('si-password').value;
  const btn        = e.target.querySelector('button[type="submit"]');

  btn.disabled    = true;
  btn.textContent = 'SIGNING IN...';

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ identifier, password })
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.message, 'error'); return; }

    saveUserState({ _id: data._id, username: data.username, email: data.email, role: data.role }, data.token);
    document.getElementById('si-success-msg').style.display = 'flex';
    showToast(`Welcome back, ${data.username}!`);

    // Merge server cart
    if (data.cart && data.cart.length > 0) {
      data.cart.forEach(si => {
        const local = cart.find(i => i.name === si.name);
        if (local) local.qty = Math.max(local.qty, si.qty);
        else cart.push(si);
      });
      saveCart();
    }

    setTimeout(() => {
      document.getElementById('si-success-msg').style.display = 'none';
      document.getElementById('signin-form').reset();
      switchTab('home');
    }, 1500);
  } catch {
    showToast('Login failed. Check server connection.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'SIGN IN';
  }
}

// ==========================================================================
// FORM: REGISTER — real API call
// ==========================================================================
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email    = document.getElementById('reg-email').value;
  const phone    = document.getElementById('reg-phone').value;
  const address  = document.getElementById('reg-address').value;
  const country  = document.getElementById('reg-country').value;
  const postal   = document.getElementById('reg-postal').value;
  const password = document.getElementById('reg-pass').value;
  const passConf = document.getElementById('reg-pass-conf').value;
  const btn      = e.target.querySelector('button[type="submit"]');

  if (password !== passConf) { showToast('Passwords do not match!', 'error'); return; }
  if (password.length < 6)   { showToast('Password must be at least 6 characters', 'error'); return; }

  btn.disabled    = true;
  btn.textContent = 'CREATING...';

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, email, phone, address, country, postal, password })
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.message, 'error'); return; }

    // Auto-login after register
    saveUserState({ _id: data._id, username: data.username, email: data.email, role: data.role }, data.token);
    document.getElementById('reg-success-msg').style.display = 'flex';
    showToast(`Account created! Welcome, ${data.username}!`);

    setTimeout(() => {
      document.getElementById('reg-success-msg').style.display = 'none';
      document.getElementById('register-form').reset();
      switchTab('home');
    }, 2000);
  } catch {
    showToast('Registration failed. Check server connection.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'CREATE ACCOUNT';
  }
}

// ==========================================================================
// FORGOT PASSWORD — calls API
// ==========================================================================
async function forgotPasswordAlert() {
  const email = prompt('Enter your registered email to receive a reset link:');
  if (!email) return;

  try {
    const res  = await fetch(`${API}/auth/forgot-password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email })
    });
    const data = await res.json();
    showToast(data.message, res.ok ? 'success' : 'error');
  } catch {
    showToast('Failed to send reset email.', 'error');
  }
}
function syncCarouselPrices() {
  document.querySelectorAll('.carousel-slide').forEach(slide => {
    const btn = slide.querySelector('.slide-buy-btn');
    if (!btn) return;
    const productName = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if (!productName) return;
    const product = products.find(p => p.name === productName);
    if (!product) return;
    const curr = slide.querySelector('.current-price');
    const orig = slide.querySelector('.original-price');
    if (curr) curr.textContent = `Rs. ${product.price.toLocaleString()}`;
    if (orig && product.originalPrice) orig.textContent = `Rs. ${product.originalPrice.toLocaleString()}`;
  });
}