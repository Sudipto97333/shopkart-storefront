const state = { products: [], category: "All", query: "", sort: "featured", cart: readSavedCart(), favorites: new Set() };
const productGrid = document.querySelector("#product-grid");
const cartDrawer = document.querySelector("#cart-drawer");
const drawerBackdrop = document.querySelector("#drawer-backdrop");
const toast = document.querySelector("#toast");
let toastTimer;

function readSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("shopkart-cart") || "[]");
    return Array.isArray(saved) ? saved.filter((item) => Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch {
    return [];
  }
}
function saveCart() { localStorage.setItem("shopkart-cart", JSON.stringify(state.cart)); }
function formatPrice(value) { return `₹${Number(value).toLocaleString("en-IN")}`; }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
function getVisibleProducts() {
  const query = state.query.trim().toLowerCase();
  let visible = state.products.filter((product) =>
    (state.category === "All" || product.category === state.category) &&
    (!query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query))
  );
  if (state.sort === "price-low") visible = [...visible].sort((a, b) => a.price - b.price);
  if (state.sort === "price-high") visible = [...visible].sort((a, b) => b.price - a.price);
  if (state.sort === "rating") visible = [...visible].sort((a, b) => b.rating - a.rating);
  return visible;
}
function renderProducts() {
  const visible = getVisibleProducts();
  document.querySelector("#section-title").innerHTML = state.query
    ? "Search results <span>✳</span>"
    : state.category === "All" ? "Today's happy finds <span>✳</span>" : `${escapeHtml(state.category)} finds <span>✳</span>`;
  document.querySelector("#result-count").textContent = state.query
    ? `${visible.length} ${visible.length === 1 ? "lovely find" : "lovely finds"} for “${state.query}”.`
    : state.category === "All" ? "Handpicked picks at hard-to-resist prices." : `${visible.length} thoughtful picks, just for you.`;
  if (!visible.length) {
    productGrid.innerHTML = `<div class="empty-state">No finds for “${escapeHtml(state.query)}” just yet. Try another search.</div>`;
    return;
  }
  productGrid.innerHTML = visible.map((product) => {
    const discount = Math.round((1 - product.price / product.originalPrice) * 100);
    const favorite = state.favorites.has(product.id);
    return `<article class="product-card">
      <div class="product-art" style="background:${product.color}">
        <span class="product-badge">${escapeHtml(product.badge)}</span>
        <button class="wishlist-button${favorite ? " selected" : ""}" type="button" data-favorite="${product.id}" aria-label="${favorite ? "Remove from" : "Add to"} wishlist">${favorite ? "♥" : "♡"}</button>
        <span class="product-emoji" aria-hidden="true">${product.image}</span>
      </div>
      <div class="product-info">
        <div class="product-category">${escapeHtml(product.category)}</div>
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <div class="rating-line"><span class="rating-pill">${product.rating.toFixed(1)} ★</span><span class="stars">★★★★★</span><span class="review-count">(${product.reviews.toLocaleString("en-IN")})</span></div>
        <div class="price-line"><span class="current-price">${formatPrice(product.price)}</span><span class="original-price">${formatPrice(product.originalPrice)}</span><span class="discount">${discount}% off</span></div>
        <div class="card-bottom"><span class="delivery-label">✦ Free delivery</span><button class="add-button" type="button" data-add="${product.id}">Add to cart&nbsp; +</button></div>
      </div>
    </article>`;
  }).join("");
}
function cartTotal() {
  return state.cart.reduce((total, item) => {
    const product = state.products.find((candidate) => candidate.id === item.id);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
}
function renderCart() {
  state.cart = state.cart.filter((item) => state.products.some((product) => product.id === item.id));
  const count = state.cart.reduce((total, item) => total + item.quantity, 0);
  const cartCount = document.querySelector("#cart-count");
  cartCount.textContent = String(count);
  cartCount.setAttribute("aria-label", `${count} items in cart`);
  document.querySelector("#drawer-item-count").textContent = `(${count})`;
  document.querySelector("#cart-subtotal").textContent = formatPrice(cartTotal());
  document.querySelector("#checkout-total").textContent = formatPrice(cartTotal());
  const empty = state.cart.length === 0;
  document.querySelector("#cart-empty").classList.toggle("visible", empty);
  document.querySelector("#cart-footer").classList.toggle("hidden", empty);
  document.querySelector("#cart-items").innerHTML = state.cart.map((item) => {
    const product = state.products.find((candidate) => candidate.id === item.id);
    return `<div class="cart-row">
      <div class="cart-row-art" style="background:${product.color}">${product.image}</div>
      <div><h3 class="cart-row-name">${escapeHtml(product.name)}</h3><span class="cart-row-price">${formatPrice(product.price)} each</span>
        <div class="quantity-control"><button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-quantity="${product.id}" data-change="1" aria-label="Increase quantity">+</button></div>
      </div>
      <button class="remove-item" type="button" data-remove="${product.id}" aria-label="Remove ${escapeHtml(product.name)}">×</button>
    </div>`;
  }).join("");
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}
function setCartOpen(open) {
  cartDrawer.classList.toggle("open", open);
  drawerBackdrop.classList.toggle("open", open);
  cartDrawer.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
  if (open) document.querySelector("#close-cart").focus();
}

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    const id = Number(addButton.dataset.add);
    const item = state.cart.find((entry) => entry.id === id);
    if (item) item.quantity += 1;
    else state.cart.push({ id, quantity: 1 });
    saveCart();
    renderCart();
    const product = state.products.find((entry) => entry.id === id);
    showToast(`${product.name} is in your cart. Good choice!`);
  }
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const id = Number(favoriteButton.dataset.favorite);
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    renderProducts();
  }
});
document.querySelector("#cart-items").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) {
    const item = state.cart.find((entry) => entry.id === Number(quantityButton.dataset.quantity));
    if (item) {
      item.quantity += Number(quantityButton.dataset.change);
      if (item.quantity <= 0) state.cart = state.cart.filter((entry) => entry !== item);
    }
    saveCart();
    renderCart();
  }
  if (removeButton) {
    state.cart = state.cart.filter((item) => item.id !== Number(removeButton.dataset.remove));
    saveCart();
    renderCart();
  }
});
document.querySelector("#category-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  state.query = "";
  document.querySelector("#search-input").value = "";
  document.querySelectorAll(".category-link").forEach((link) => link.classList.toggle("active", link === button));
  renderProducts();
  document.querySelector("#products-section").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  state.query = document.querySelector("#search-input").value;
  state.category = "All";
  document.querySelectorAll(".category-link").forEach((link) => link.classList.toggle("active", link.dataset.category === "All"));
  renderProducts();
  document.querySelector("#products-section").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelector("#sort-select").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderProducts();
});
document.querySelector("#cart-button").addEventListener("click", () => setCartOpen(true));
document.querySelector("#close-cart").addEventListener("click", () => setCartOpen(false));
drawerBackdrop.addEventListener("click", () => setCartOpen(false));
document.querySelector("#continue-shopping").addEventListener("click", () => setCartOpen(false));
document.querySelector("#shop-now").addEventListener("click", () => document.querySelector("#products-section").scrollIntoView({ behavior: "smooth" }));
document.querySelector("#account-button").addEventListener("click", () => showToast("Account sign-in is coming soon. Stay tuned!"));
document.querySelector("#checkout-button").addEventListener("click", () => {
  setCartOpen(false);
  document.querySelector("#checkout-dialog").showModal();
  document.querySelector("#customer-name").focus();
});
document.querySelector("#close-checkout").addEventListener("click", () => document.querySelector("#checkout-dialog").close());
document.querySelector("#checkout-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.cart.length) return;
  const form = event.currentTarget;
  const submitButton = form.querySelector(".checkout-button");
  submitButton.disabled = true;
  submitButton.textContent = "Placing your order…";
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: document.querySelector("#customer-name").value,
        items: state.cart.map(({ id, quantity }) => ({ productId: id, quantity }))
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "We couldn't place your order.");
    state.cart = [];
    saveCart();
    renderCart();
    document.querySelector("#checkout-dialog").close();
    form.reset();
    showToast(`Order placed! Your reference is ${result.order.id.slice(0, 8).toUpperCase()}.`);
  } catch (error) {
    showToast(error.message || "Something went wrong. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Place my order <span>→</span>';
  }
});
document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  showToast("You're on the list. Good things are coming!");
  event.currentTarget.reset();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer.classList.contains("open")) setCartOpen(false);
});
async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error(`Product service returned ${response.status}.`);
    const result = await response.json();
    if (!Array.isArray(result.products)) throw new Error("Product service returned an invalid catalog.");
    state.products = result.products;
    renderProducts();
    renderCart();
  } catch (error) {
    productGrid.innerHTML = `<div class="empty-state">We couldn't load the good stuff. Please refresh to try again.</div>`;
    showToast(error.message || "Unable to load products.");
  }
}
loadProducts();
