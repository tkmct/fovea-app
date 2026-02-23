const state = {
  token: "",
  user: null,
  products: [],
  cart: []
};

function $(id) {
  return document.getElementById(id);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1600);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

function renderProducts() {
  const container = $("product-list");
  container.innerHTML = "";
  if (state.products.length === 0) {
    container.textContent = "No products";
    return;
  }

  for (const product of state.products) {
    const row = document.createElement("div");
    row.className = "product-row";
    row.innerHTML = `
      <div>
        <strong>${product.name}</strong>
        <span class="pill">${product.category}</span>
      </div>
      <div>
        $${product.price}
        <button data-product-id="${product.id}" aria-label="Add ${product.name}">Add</button>
      </div>
    `;
    row.querySelector("button")?.addEventListener("click", () => addToCart(product.id));
    container.appendChild(row);
  }
}

function renderCart() {
  const container = $("cart-items");
  container.innerHTML = "";
  if (state.cart.length === 0) {
    container.textContent = "Cart is empty";
    return;
  }

  for (const item of state.cart) {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>${item.name}</div>
      <div>$${item.price}</div>
    `;
    container.appendChild(row);
  }
}

function updateAuthState() {
  const authState = $("auth-state");
  if (!state.user) {
    authState.textContent = "Not signed in";
    return;
  }
  authState.textContent = `Signed in as ${state.user.name} (${state.user.role})`;
}

async function refreshProducts() {
  const query = $("search-query").value.trim();
  const category = $("category-filter").value;
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);

  const data = await api(`/api/products?${params.toString()}`);
  state.products = data.items || [];
  renderProducts();
}

function addToCart(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;
  state.cart.push(product);
  renderCart();
  showToast(`${product.name} added to cart`);
}

async function submitRegister(event) {
  event.preventDefault();
  const payload = {
    name: $("register-name").value,
    email: $("register-email").value,
    password: $("register-password").value,
    role: $("register-role").value
  };

  try {
    await api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
    showToast("Account created");
    $("login-email").value = payload.email;
    $("login-password").value = payload.password;
  } catch (error) {
    showToast(error.message);
  }
}

async function submitLogin(event) {
  event.preventDefault();
  const payload = {
    email: $("login-email").value,
    password: $("login-password").value
  };
  try {
    const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
    state.token = data.token;
    state.user = data.user;
    updateAuthState();
    showToast("Signed in");
  } catch (error) {
    showToast(error.message);
  }
}

async function submitCheckout() {
  if (!state.token) {
    showToast("Please sign in first");
    return;
  }
  if (state.cart.length === 0) {
    showToast("Cart is empty");
    return;
  }

  try {
    const data = await api("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        token: state.token,
        items: state.cart,
        couponCode: $("coupon-code").value,
        shippingSpeed: $("shipping-speed").value
      })
    });
    $("checkout-result").textContent = `Order ${data.orderId} completed. Total: $${data.total}`;
    state.cart = [];
    renderCart();
    showToast("Checkout complete");
  } catch (error) {
    $("checkout-result").textContent = `Checkout failed: ${error.message}`;
    showToast(error.message);
  }
}

async function submitSupport(event) {
  event.preventDefault();
  if (!state.token) {
    showToast("Sign in required");
    return;
  }
  const payload = {
    token: state.token,
    topic: $("support-topic").value,
    detail: $("support-detail").value
  };
  try {
    await api("/api/support", { method: "POST", body: JSON.stringify(payload) });
    showToast("Ticket created");
    $("support-topic").value = "";
    $("support-detail").value = "";
    await refreshTickets();
  } catch (error) {
    showToast(error.message);
  }
}

async function refreshTickets() {
  const list = $("ticket-list");
  if (!state.token) {
    list.innerHTML = "";
    return;
  }
  try {
    const data = await api(`/api/support?token=${encodeURIComponent(state.token)}`);
    list.innerHTML = "";
    for (const item of data.items || []) {
      const li = document.createElement("li");
      li.className = "ticket-row";
      li.innerHTML = `<span>${item.topic}</span><span>${new Date(item.createdAt).toLocaleTimeString()}</span>`;
      list.appendChild(li);
    }
  } catch (error) {
    showToast(error.message);
  }
}

function bindEvents() {
  $("register-form").addEventListener("submit", submitRegister);
  $("login-form").addEventListener("submit", submitLogin);
  $("search-products").addEventListener("click", refreshProducts);
  $("checkout-submit").addEventListener("click", submitCheckout);
  $("support-form").addEventListener("submit", submitSupport);
  $("refresh-tickets").addEventListener("click", refreshTickets);
}

async function init() {
  bindEvents();
  updateAuthState();
  renderCart();
  await refreshProducts();
}

init().catch((error) => {
  showToast(error.message);
});
