import test from "node:test";
import assert from "node:assert/strict";
import { startServer } from "../src/server.js";

async function request(baseUrl, path, init = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  const data = await res.json();
  return { status: res.status, data };
}

test("register -> login -> checkout flow", async () => {
  const port = 3901;
  const server = startServer({ port });
  const baseUrl = `http://localhost:${port}`;

  try {
    const register = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "QA User",
        email: "qa@example.com",
        password: "secret123",
        role: "manager"
      })
    });
    assert.equal(register.status, 201);

    const login = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "qa@example.com", password: "secret123" })
    });
    assert.equal(login.status, 200);
    assert.ok(login.data.token);

    const products = await request(baseUrl, "/api/products?category=plan");
    assert.equal(products.status, 200);
    assert.ok(Array.isArray(products.data.items));
    assert.ok(products.data.items.length > 0);

    const checkout = await request(baseUrl, "/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        token: login.data.token,
        items: [products.data.items[0]],
        couponCode: "WELCOME10",
        shippingSpeed: "standard"
      })
    });

    assert.equal(checkout.status, 201);
    assert.ok(checkout.data.orderId);
    assert.equal(typeof checkout.data.total, "number");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
