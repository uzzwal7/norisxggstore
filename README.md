# 🎮 norisxgg store — Full Stack Setup Guide

## 🩹 Latest Fixes (this update)

- **Fixed a real CSS bug** that was making every page section (Home, Shop, Offer, etc.) appear stacked on top of each other on the same page, and made the carousel look frozen. The CSS split-into-files process had accidentally cut a comment block across two files, which broke the stylesheet and silently dropped the tab-switching rules. Fixed and verified.
- **Checkout — address & delivery fee**: Address and delivery-zone selection now only appear for **Pay on Delivery**. Choosing "Inside Kathmandu Valley" adds Rs. 99, "Outside Valley" adds Rs. 299 — automatically added to the order total. Digital wallet payments (eSewa/Khalti/IME Pay) skip the address step entirely since delivery is by email.
- **Admin dashboard now refreshes itself** every time you click into it (previously it only loaded once when you first opened the panel, so it could show stale numbers after you deleted/updated something).
- **Users can now delete their own notifications** — a small × button on each one.
- **Mobile navigation fixed** — Home/Shop/Offer/About/My Orders previously just disappeared on phones with no way to reach them. They now live inside the ⋮ three-dot menu on small screens, while desktop keeps the full top nav bar.
- **Light theme contrast improved** — borders, shadows, and card edges are now more visible at high screen brightness, so sections don't blend together.
- **Security hardening**:
  - Added `helmet` (security HTTP headers) and `express-mongo-sanitize` (blocks NoSQL injection attempts in login/search fields)
  - Login, Register, and Forgot Password now have a stricter rate limit (10 attempts / 15 min) to block password brute-forcing
  - Passwords now require at least one letter and one number, in addition to the 6-character minimum
  - Fixed a stored-XSS vulnerability: customer-submitted text (feedback, names, order notes) is now HTML-escaped before being displayed, both on the public site and in the admin panel — previously a malicious customer could have submitted a feedback message containing a script that ran in your (the admin's) browser when you viewed it
  - Passwords were already bcrypt-hashed and never returned by the API — that part was already safe

---

## What's Included

| Layer | Tech | Purpose |
|-------|------|---------|
| Backend | Node.js + Express | REST API server |
| Templating | EJS | Renders the site from small, separate files |
| Database | MongoDB + Mongoose | Products, users, orders, notifications |
| Auth | JWT + bcryptjs | Secure login & sessions |
| Email | Nodemailer + Gmail | Password reset emails |
| Admin | Separate `/admin` panel | Manage everything without touching code |

---

## 📁 Project Structure — Where To Edit What

This is the part that matters most for you: **every section of the site is its own small file.**

```
norisxgg-store/
├── server.js                    ← Starts everything (rarely needs editing)
├── config/
│   └── carouselSlides.js        ← ✏️ EDIT THIS to add/change homepage carousel slides
│
├── views/                       ← The HTML, split into small pieces
│   ├── index.ejs                ← The shell that glues every piece together
│   ├── partials/
│   │   ├── head.ejs             ← <title>, fonts, which CSS files load
│   │   ├── header.ejs           ← ✏️ Navbar, logo, search, notification bell
│   │   ├── carousel.ejs         ← Homepage slider (reads config/carouselSlides.js)
│   │   ├── cart-drawer.ejs      ← The slide-out shopping cart panel
│   │   └── footer.ejs           ← ✏️ Footer, contact links, payment badges
│   └── pages/
│       ├── home.ejs             ← ✏️ Homepage: categories, top sellers, feedback form
│       ├── shop.ejs             ← ✏️ Shop page layout (sidebar + product grid)
│       ├── offer.ejs            ← ✏️ Offers page
│       ├── about.ejs            ← ✏️ About Us page
│       ├── auth.ejs             ← ✏️ Sign In / Register forms
│       └── orders.ejs           ← My Orders page
│
├── public/
│   ├── app.js                   ← All frontend logic (cart, checkout, login, etc.)
│   ├── css/                     ← Styling, split per section
│   │   ├── 01-base.css          ← Colors, fonts, core variables
│   │   ├── 02-header.css        ← ✏️ Navbar styling
│   │   ├── 03-carousel.css      ← ✏️ Homepage slider styling
│   │   ├── 04-home.css          ← Homepage sections
│   │   ├── 05-shop.css          ← Shop page
│   │   ├── 06-offers.css        ← Offers page
│   │   ├── 07-about.css         ← About page
│   │   ├── 08-auth.css          ← Sign In / Register
│   │   ├── 09-cart.css          ← Cart drawer
│   │   ├── 10-footer-toast.css  ← Footer + notifications
│   │   ├── 11-responsive.css    ← Mobile responsiveness
│   │   └── 12-user-dropdown.css ← Logged-in user menu
│   └── images/
│       ├── carousel/             ← 🖼️ PUT YOUR CAROUSEL IMAGES HERE
│       └── qr/                   ← 🖼️ PUT YOUR PAYMENT QR CODES HERE
│
├── models/                      ← Database schemas (User, Product, Order, etc.)
├── controllers/                 ← Backend logic
├── routes/                      ← API endpoints
├── admin/index.html             ← Admin panel (self-contained)
└── createAdmin.js               ← Script to make yourself an admin
```

**Rule of thumb:** want to change how something *looks*? Edit the matching CSS file.
Want to change *what's on the page*? Edit the matching `.ejs` file. You almost
never need to touch `server.js` or `views/index.ejs`.

---

## 🎠 How To Add/Change Carousel Slides

1. Open `config/carouselSlides.js`
2. Copy one slide object, paste it as a new entry, edit the text/price/button
3. Drop your image into `public/images/carousel/` (any size, but square works best)
4. Set `image: 'images/carousel/yourfile.jpg'` in that slide's config

That's it — no HTML editing needed. The carousel automatically shows however
many slides are in that file, and **only appears on the Home tab** (not Shop,
Offers, etc.) since it now lives inside `views/pages/home.ejs`.

If you haven't added an image yet, a fallback icon shows instead so the page
never looks broken.

---

## 💳 How The New Checkout Flow Works

1. Customer adds items to cart → clicks **Proceed to Checkout**
2. Picks a payment method: eSewa / Khalti / IME Pay / Pay on Delivery
3. A form appears asking for: **phone, email, delivery address, a 1–5 star
   rating (required), and optional feedback**
4. If they picked a digital wallet, they see your **QR code** and must
   **upload a screenshot of their payment** before the order can be placed
5. They see a "Thank you, your order is on the way!" message
6. The order — including their screenshot — lands in your **Admin → Orders** page

### Setting up your QR codes
Put 3 image files into `public/images/qr/`:
- `esewa-qr.png`
- `khalti-qr.png`
- `imepay-qr.png`

(Generate these from your eSewa/Khalti/IME Pay merchant app — they all have a
"show my QR" option.)

---

## 🔧 How You (Admin) Fulfill an Order

1. Go to **Admin → Orders**, click the ✏️ edit icon on any order
2. You'll see: customer's email, phone (tap to open WhatsApp), address, their
   star rating, optional feedback, and their **payment screenshot**
3. Manually send the game/account/code to their email
4. Click **Notify Customer** → write something like *"Your game ID has been
   sent to your email"* or *"There was an issue, we'll contact you"* → Send.
   It instantly appears as a notification (bell icon) on their account.
5. Once done, change **Order Status** to `completed`
6. A **Delete Order** button now appears — use it to clean up old completed orders

---

## 🔔 Notifications (Customer Side)

Once logged in, customers see a bell icon in the header. Any message you send
them from the Orders page shows up there with a red unread badge.

---

## ⭐ Real Ratings (No More Fake Numbers)

The "X / 5 based on Y reviews" text on the Home and About pages now pulls
**real numbers** from the Feedback collection — calculated live from whatever
customers actually submit through the feedback form. No more hardcoded "4.8/5".

---

## 🛠️ STEP 1: Install Prerequisites

You need 2 things installed on your PC:

1. **Node.js** (v18+) → https://nodejs.org (download LTS version)
2. **MongoDB Community Server** → https://www.mongodb.com/try/download/community
   - During install, choose "Install as a Service" — it'll run automatically in the background.
   - Alternative: use a free cloud database at https://www.mongodb.com/cloud/atlas (no local install needed).

---

## 🛠️ STEP 2: Install Project Dependencies

Open a terminal inside the `norisxgg-store` folder and run:

```bash
npm install
```

---

## 🛠️ STEP 3: Configure Environment Variables

1. Copy `.env.example` and rename the copy to `.env`
2. Fill in:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/norisxgg_store
JWT_SECRET=pick_any_long_random_string_here_2026
JWT_EXPIRE=7d
EMAIL_USER=ujjwalshiwakoti7@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
NODE_ENV=development
```

**Gmail App Password (for password reset emails):**
1. https://myaccount.google.com/security → enable 2-Step Verification
2. https://myaccount.google.com/apppasswords → create one, copy the 16-character code
3. Paste it as `EMAIL_PASS` (no spaces)

If using MongoDB Atlas instead of local MongoDB, replace `MONGODB_URI` with your Atlas connection string.

---

## 🛠️ STEP 4: Start the Server

```bash
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
✅ Database seeded with 18 products
🚀 norisxgg store server running on http://localhost:5000
```

- **Your store:** http://localhost:5000
- **Admin panel:** http://localhost:5000/admin

---

## 🔧 Creating Your First Admin Account

1. Register a normal account at http://localhost:5000
2. Run:
```bash
node createAdmin.js your@email.com
```
3. Log in at http://localhost:5000/admin with that same email + password

---

## 🌍 Going Live (Worldwide Access)

Right now this only runs on your PC (`localhost`). For a real public launch:
- **Backend hosting:** Render, Railway, or Fly.io (free tiers available)
- **Database:** MongoDB Atlas (free tier, 512MB)

This gives you a public URL like `https://norisxgg.onrender.com`. Tell me when
you're ready and I'll walk you through deploying.

---

## ⚠️ Before You Launch (Security Checklist)

- [ ] Change `JWT_SECRET` in `.env` to a long random string
- [ ] Never commit your `.env` file to GitHub
- [ ] Real eSewa/Khalti API integration (auto-verified payments) isn't connected
      yet — for now, you verify payment manually from the uploaded screenshot.
      Tell me when you're ready to wire up real payment gateway APIs.

---

## 📡 API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/forgot-password` | Send reset email |
| GET | `/api/products` | List all games (supports `?category=&search=&sort=`) |
| POST | `/api/orders` | Place an order (requires login, rating, screenshot if not COD) |
| GET | `/api/orders/mine` | Your order history |
| DELETE | `/api/orders/:id` | Admin: delete a completed/cancelled order |
| POST | `/api/feedback` | Submit a review |
| GET | `/api/feedback/stats` | Real average rating + count (public) |
| POST | `/api/promo/apply` | Validate a promo code |
| POST | `/api/notifications` | Admin: send a message to a customer |
| GET | `/api/notifications/mine` | Your notifications |
| GET | `/api/admin/dashboard` | Admin stats |

---

## 🆘 If Something Doesn't Work

- **"MongoDB Connected" never shows** → MongoDB isn't running. Check Services (Windows) for "MongoDB Server", or check your Atlas connection string.
- **Products don't appear** → Check browser console (F12) for errors; confirm the server terminal shows no crash.
- **Admin login says "Access denied"** → Run `node createAdmin.js` first.
- **Carousel shows fallback icons instead of your images** → Check the filename in `public/images/carousel/` matches exactly what's set in `config/carouselSlides.js`.
- **QR code shows a placeholder message** → Add the matching file to `public/images/qr/`.
