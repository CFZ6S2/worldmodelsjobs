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
Represents registered users and their subscription status.

- `uid`: string (Firebase Auth UID)
- `email`: string
- `subscription_status`: string (active, trialing, canceled, past_due)
- `stripe_customer_id`: string
- `stripe_subscription_id`: string
- `plan`: string (basic, pro, premium)
- `created_at`: timestamp

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
