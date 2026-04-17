# Firebase Firestore Schema Definition

## Collection: `posts`
Represents the aggregated and filtered messages.

- `id`: string (auto-generated or unique message ID)
- `text`: string (cleaned message content)
- `city`: string (extracted city)
- `category`: string (extracted category: VIP, Standard, Event)
- `age`: string (optional)
- `source`: string (telegram / whatsapp)
- `is_premium`: boolean (default: true)
- `created_at`: timestamp

## Collection: `users`
Represents registered users and their unified subscription status.

**Source of Truth Documentation:**
* **`worldmodels.premium`**: Primary boolean used by the frontend and Auth Custom Claims to grant or deny access to the internal platform features.
* **`subscriptionStatus`**: Commercial status exactly mirroring Stripe lifecycle (`active`, `past_due`, `canceled`, `trialing`, `inactive`).
* **`membership.type`**: User-facing plan nomenclature (`free` or `premium`) used for display logic or dashboard branding.

- `uid`: string (Firebase Auth UID)
- `email`: string
- `alias`: string
- `gender`: string
- `userRole`: string
- `signupSource`: string
- `profileType`: string
- `reputation`: string
- `createdAt`: timestamp
- `lastActivity`: timestamp
- `subscriptionStatus`: string ('active', 'inactive', 'canceled', 'past_due')
- `stripeCustomerId`: string | null
- `membership`: object { type: 'free' | 'premium', expiresAt: timestamp | null }
- `worldmodels`: object { premium: boolean, liveFeed: boolean, badge: boolean, expiryDate: timestamp | null }

## Collection: `config`
General app configuration.
- `maintenance_mode`: boolean
- `featured_cities`: array[string]

## Collection: `profiles`
Model profiles for applications.

- `userId`: string (UID)
- `fullName`: string
- `bio`: string
- `measurements`: object { height, weight, bust, waist, hips }
- `experience`: string
- `pricing`: object { hourly, daily }
- `photos`: array[string] (URLs)
- `primaryPhotoIndex`: number
- `isPublic`: boolean
- `updated_at`: timestamp

## Collection: `applications`
Submissions made by models to specific posts.

- `postId`: string
- `modelId`: string (userId)
- `status`: string (pending, accepted, rejected)
- `modelSnapshot`: object (snapshot of profile at time of application)
- `created_at`: timestamp
