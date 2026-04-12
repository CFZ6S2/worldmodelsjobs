# Premium Feed SaaS — LuxFeed

A full-stack SaaS to aggregate, filter, and monetize messages from Telegram and WhatsApp channels. Includes AI classification, premium feed with paywall, Firebase auth, and Stripe subscriptions.

---

## Project Structure

```
premium-feed-saas/
├── collectors/
│   ├── telegram/          # Telethon userbot
│   └── whatsapp/          # whatsapp-web.js userbot
├── n8n/
│   └── workflow.json      # Import this into n8n
├── web/                   # Next.js web app
│   └── src/
│       ├── app/           # Pages: landing, login, register, feed, pricing
│       ├── context/       # AuthContext (Firebase)
│       ├── lib/           # firebase.ts, stripe.ts
│       └── api/           # /api/posts, /api/checkout, /api/webhook
├── docker-compose.yml
└── firebase_schema.md
```

---

## Quick Start on VPS

### 1. Clone and configure

```bash
git clone <your-repo> premium-feed-saas
cd premium-feed-saas
cp web/.env.local.example web/.env.local
# Edit web/.env.local with your Firebase and Stripe credentials
```

### 2. Configure environment (.env.local)

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project Settings |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks |
| `TELEGRAM_API_ID / API_HASH` | [my.telegram.org](https://my.telegram.org) |

### 3. Launch all services

```bash
docker compose up -d
```

This starts:
- **n8n** at `http://your-vps:5678`
- **Redis** (internal)
- **Telegram collector**
- **WhatsApp collector** (scan QR on first run)

### 4. Configure n8n

1. Open `http://your-vps:5678`
2. Go to **Workflows → Import**
3. Import `n8n/workflow.json`
4. Add your **OpenAI** and **Firebase** credentials in n8n
5. Activate the workflow

### 5. Launch the web app

```bash
cd web
npm run build
npm start
# Or for development:
npm run dev
```

---

## Stripe Setup

1. Create 3 products in Stripe Dashboard (Basic $9, Pro $29, Premium $79)
2. Copy the Price IDs into `.env.local`
3. Add a webhook endpoint in Stripe: `https://yourdomain.com/api/webhook`
4. Select events: `checkout.session.completed`, `customer.subscription.deleted`

---

## Firebase Setup

1. Enable **Firestore** and **Authentication (Email/Password)**
2. Create Firestore collections: `posts`, `users`
3. Set Firestore rules (authenticated read for posts):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{id} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

---

## Message Flow

```
Telegram / WhatsApp
       ↓
Collector → Webhook (n8n)
       ↓
n8n: Clean → Filter spam → AI Classify → Firebase
       ↓
Web Feed (real-time)
```

---

## Pages

| URL | Description |
|---|---|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/pricing` | Subscription plans |
| `/feed` | Premium feed (auth required) |
