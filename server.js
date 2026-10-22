const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const products = [
  { id: 1, name: "AeroPods Pro Wireless Earbuds", category: "Electronics", price: 2499, originalPrice: 4999, rating: 4.5, reviews: 1284, badge: "BESTSELLER", color: "#e8e2ff", image: "🎧", description: "Immersive sound, active noise cancellation and all-day comfort." },
  { id: 2, name: "PixelView 55-inch 4K Smart TV", category: "Electronics", price: 32999, originalPrice: 54999, rating: 4.4, reviews: 863, badge: "32% OFF", color: "#deefff", image: "📺", description: "Cinematic 4K picture with built-in streaming and rich sound." },
  { id: 3, name: "Everyday Classic Sneakers", category: "Fashion", price: 1799, originalPrice: 3599, rating: 4.2, reviews: 2156, badge: "HOT DEAL", color: "#fff0dc", image: "👟", description: "Lightweight everyday sneakers made for all-day adventures." },
  { id: 4, name: "Luna Minimal Analog Watch", category: "Fashion", price: 1299, originalPrice: 2999, rating: 4.3, reviews: 947, badge: "58% OFF", color: "#fce4e9", image: "⌚", description: "A timeless minimalist design, perfect for every occasion." },
  { id: 5, name: "BrewBuddy Compact Coffee Maker", category: "Home", price: 3499, originalPrice: 5999, rating: 4.6, reviews: 634, badge: "TOP RATED", color: "#e2f3e9", image: "☕", description: "Your favorite fresh-brewed coffee, ready in just a few minutes." },
  { id: 6, name: "CloudSoft Reversible Comforter", category: "Home", price: 1899, originalPrice: 3299, rating: 4.1, reviews: 512, badge: "43% OFF", color: "#f4e8dc", image: "🛏️", description: "Soft, breathable comfort for restful nights in every season." },
  { id: 7, name: "FlexFit Smart Fitness Band", category: "Electronics", price: 2199, originalPrice: 4499, rating: 4.0, reviews: 1763, badge: "LIMITED DEAL", color: "#e1ebff", image: "⌚", description: "Track your activity, sleep and heart rate throughout the day." },
  { id: 8, name: "ColorPop Everyday Backpack", category: "Fashion", price: 999, originalPrice: 1999, rating: 4.4, reviews: 1088, badge: "50% OFF", color: "#fcebdc", image: "🎒", description: "A roomy, durable daypack with pockets for all your essentials." },
  { id: 9, name: "FreshMix Personal Blender", category: "Home", price: 1599, originalPrice: 2799, rating: 4.2, reviews: 429, badge: "VALUE PICK", color: "#e5f3df", image: "🥤", description: "Blend smoothies straight into a travel cup in seconds." },
  { id: 10, name: "SoundWave Portable Speaker", category: "Electronics", price: 1899, originalPrice: 3499, rating: 4.3, reviews: 792, badge: "46% OFF", color: "#eee3ff", image: "🔊", description: "Take big, balanced sound anywhere with a pocket-sized speaker." },
  { id: 11, name: "Soft Knit Weekend Hoodie", category: "Fashion", price: 1199, originalPrice: 2299, rating: 4.5, reviews: 687, badge: "NEW ARRIVAL", color: "#e5edf0", image: "🧥", description: "A cozy, easygoing layer in a soft cotton-blend knit." },
  { id: 12, name: "Sunrise Ceramic Table Lamp", category: "Home", price: 1499, originalPrice: 2499, rating: 4.1, reviews: 341, badge: "40% OFF", color: "#fff0d4", image: "💡", description: "Warm ambient lighting and a clean ceramic finish for your space." }
];

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(value));
}

function serveStatic(request, response) {
  const pathname = new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname;
  let requestedPath;
  try {
    requestedPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }
  const filePath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);

  if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      const status = error.code === "ENOENT" ? 404 : 500;
      if (status === 500) console.error("Unable to read static file:", error);
      response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(status === 404 ? "Not found" : "Internal server error");
      return;
    }
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(contents);
  });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16_384) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname;

  if (request.method === "GET" && pathname === "/api/products") {
    sendJson(response, 200, { products });
    return;
  }

  if (request.method === "POST" && pathname === "/api/orders") {
    let order;
    try {
      order = await readJson(request);
    } catch (error) {
      if (!response.destroyed) sendJson(response, 400, { error: error.message });
      return;
    }

    if (!order || typeof order !== "object" || Array.isArray(order)) {
      sendJson(response, 400, { error: "Order details must be a JSON object." });
      return;
    }
    const customerName = typeof order.customerName === "string" ? order.customerName.trim() : "";
    const items = Array.isArray(order.items) ? order.items : [];
    if (!customerName || customerName.length > 80 || items.length === 0 || items.length > 50) {
      sendJson(response, 400, { error: "Enter your name and add between 1 and 50 products." });
      return;
    }

    const normalizedItems = [];
    for (const item of items) {
      const product = products.find((candidate) => candidate.id === Number(item.productId));
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        sendJson(response, 400, { error: "Your cart contains an invalid product or quantity." });
        return;
      }
      normalizedItems.push({ productId: product.id, name: product.name, quantity, unitPrice: product.price });
    }

    const total = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    sendJson(response, 201, {
      order: { id: randomUUID(), customerName, items: normalizedItems, total, createdAt: new Date().toISOString() }
    });
    return;
  }

  if (pathname.startsWith("/api/")) {
    sendJson(response, 404, { error: "API endpoint not found" });
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }
  serveStatic(request, response);
});

server.listen(PORT, () => {
  console.log(`Shopkart is running at http://localhost:${PORT}`);
});