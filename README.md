# Shopkart

Shopkart is a full-stack demo storefront for browsing everyday finds across electronics, fashion, and home essentials. It pairs a responsive shopping experience with a small Node.js API for the product catalog and demo order checkout.

## Features

- Browse a curated demo catalog and filter by category.
- Search products and sort by price or customer rating.
- Add products to a cart, adjust quantities, and keep the cart between visits with browser storage.
- Preview a wishlist during the current session.
- Place a demo order with server-side product and quantity validation. No payment is collected.
- Use the responsive storefront on desktop and mobile screens.

## Tech stack

- **Frontend:** HTML, CSS, and vanilla JavaScript
- **Backend:** Node.js built-in HTTP server
- **Storage:** Browser `localStorage` for the cart; catalog and demo orders are held in memory

## Run locally

**Requirements:** Node.js 18 or newer.

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

To use a different port:

```powershell
$env:PORT = 4000
npm start
```

## API

### `GET /api/products`

Returns the demo product catalog.

### `POST /api/orders`

Creates a demo order. The server validates the customer name, product IDs, and quantities, then returns an order reference and total. Orders are not saved after the server restarts, and checkout does not process payments.

Example request:

```json
{
  "customerName": "Alex Sharma",
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

## Project structure

```text
.
├── public/
│   ├── app.js       # Storefront interactions and API requests
│   ├── index.html   # Storefront markup
│   └── styles.css   # Responsive styling
├── package.json
└── server.js        # Static file server and demo API
```

## Demo limitations

This project is a storefront demo, not a production commerce system. Sign-in and newsletter forms show client-side demo messages, and there is no payment provider, database, or persistent order storage.
