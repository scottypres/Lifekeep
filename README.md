# Lifekeep

**Your Life, Maintained.**

Lifekeep is a mobile app concept that consolidates all recurring maintenance responsibilities — home, vehicle, health, personal, and financial — into a single, intelligent system.

## What's Here

### `/docs`
- **Lifekeep-Business-Proposal.docx** — Full business proposal covering the product vision, market analysis, competitive landscape, revenue model (freemium + affiliate commerce + credit rewards), financial projections, technical architecture, and go-to-market strategy.

### `/prototypes`
- **lifekeep-app-prototype.jsx** — Interactive React prototype of the full app experience: onboarding flow, dashboard with maintenance score, item detail views, weekly digest, smart capture demo, and tab navigation. Rendered inside a phone frame.
- **vehicle-lookup.jsx** — Vehicle maintenance lookup demo with hardcoded database for six popular vehicles. Demonstrates the deterministic API lookup pattern (no AI required).
- **vehicle-lookup-api.jsx** — Dynamic vehicle lookup that works with any year/make/model via API. Generates full maintenance schedules and Amazon affiliate links automatically.

## The Concept

Most adults manage dozens of recurring obligations that don't fit into calendars or to-do lists — HVAC filters, oil changes, dental cleanings, passport renewals, tire rotations, smoke detector batteries. People either forget (costing money and safety) or carry the mental load silently (costing stress and time).

Existing apps solve fragments of this: vehicle apps ignore your house, home apps ignore your car, and productivity apps make you build everything from scratch. Lifekeep is the first app to combine all categories with:

- **AI-powered onboarding** — 2 questions, full starter kit generated
- **Voice/text smart capture** — "Got the oil changed at Jiffy Lube, 47k miles" → auto-parsed
- **Photo-to-product intelligence** — Snap a label, get exact replacement parts linked
- **Household sharing** — Both partners see what's due and who's handling it
- **Calm weekly digest** — One summary, not a dozen notifications
- **Affiliate commerce** — Exact parts linked at the moment of need, with credits back to the user

## Tech Stack (Planned)

- **Frontend:** React Native (iOS + Android)
- **Backend:** Node.js API + PostgreSQL
- **AI:** Claude API for voice/text parsing and photo label reading
- **Vehicle Data:** NHTSA VIN Decoder API + CarMD maintenance schedules
- **Product Links:** Amazon Product Advertising API + multi-retailer affiliate networks
- **Notifications:** Firebase Cloud Messaging
- **Email Digests:** Resend / Postmark

## Status

Early concept and prototyping phase. Business proposal complete. Interactive prototypes built. Next step: MVP development.
