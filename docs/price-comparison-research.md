# Lifekeep: Price Comparison & Affiliate Research
## ⭐ THE IMPERATIVES (Reference)

**#1 — Price comparison / deal finding (EXISTENTIAL)**
If the app doesn't find the best deals, people buy outside the app and the app loses its appeal.

**#2 — Scan accuracy / specificity (FIRST IMPRESSION)**
Wrong part specs = broken trust. Every recommendation must be exact.

**#3 — One-tap scan-to-purchase flow**
Minimum friction between "I need this" and "I bought it."

**#4 — Smart, non-annoying reminders**
Weekly digest, not 20 push notifications.

**#5 — Household sharing**
Emotional hook + organic growth engine.

---

## Multi-Retailer Price Comparison: The Options

### Approach A: Google Shopping API (RECOMMENDED for v1)

Google Shopping aggregates prices from thousands of retailers in one query. Several API providers offer access:

**SerpApi** — google-shopping-api
- Searches Google Shopping results programmatically
- Returns: product name, price, store, rating, link, image
- Multiple stores per product in a single query
- Pricing: ~$50/mo for 5,000 searches
- Best for: real-time price comparison across all retailers

**SearchApi** — Similar to SerpApi
- $40/mo for 10,000 searches ($4/1k)
- Supports price range filtering, sale items, free delivery filters
- Location-aware results

**Apify Google Shopping Scraper**
- $1.50/1,000 results (pay as you go)
- Returns prices from Amazon, Walmart, Home Depot, etc in one search
- JSON output, supports batch processing
- Also available via MCP for AI integration

**Why Google Shopping is ideal for Lifekeep:**
- One API call returns prices from 5-10+ retailers simultaneously
- No need to integrate each retailer separately
- Already includes affiliate-tagged links from retailers' own Google Shopping feeds
- User sees "20x20x1 MERV 11 filter" → prices from Amazon ($18), Home Depot ($16), Walmart ($15), Lowe's ($19), Filterbuy ($22)
- Cost: ~$0.004-$0.01 per comparison lookup

### Approach B: Individual Retailer APIs

**Amazon Product Advertising API**
- Commission: 1-4.5% (category dependent)
- Cookie: 24 hours
- Pros: Massive catalog, affiliate link generation built in
- Cons: Requires minimum qualifying sales to maintain access, no fitment verification
- Access: Need approved Amazon Associates account

**Home Depot Affiliate Program (via Impact Radius / FlexOffers)**
- Commission: 1-8% depending on category (up to 8% on home decor, 1% on appliances)
- Cookie: 24 hours (some sources say 30 days via Impact)
- Network: FlexOffers and Impact Radius
- Pros: 200,000+ products, strong brand trust, higher commissions than Amazon for home improvement
- Cons: Requires website for approval, no public product search API
- Key: For HVAC filters and home maintenance parts, Home Depot commissions are potentially much higher than Amazon

**Lowe's Affiliate Program (via CJ Affiliate / FlexOffers)**
- Commission: 2-20% (varies by category — some sources say up to 20%)
- Cookie: 1-day (short)
- Network: Commission Junction (CJ), also FlexOffers
- Pros: Strong DIY audience, complementary to Home Depot
- Cons: Very short cookie window, inconsistent commission rate info

**AutoZone Affiliate Program (via CJ)**
- Commission: 1.6% per sale
- Cookie: 30 days
- Pros: Strong brand for automotive parts, DIY-focused customer base
- Cons: Low commission rate

**Walmart Affiliate Program**
- Commission: 1-4% depending on category
- Cookie: 3 days
- Pros: Broad catalog, price-competitive with Amazon
- API: Available through Impact

**Other Automotive:**
- RockAuto: 0.02%/sale (very low but massive catalog with exact fitment)
- Advance Auto Parts: ~5% commission via CJ
- PartsGeek: $0.32 per purchase, 7-day cookie
- Discount Tire: Has affiliate program via CJ

### Approach C: Affiliate Networks as Aggregators

**Impact Radius** — hosts Home Depot, Walmart, and hundreds more
**CJ Affiliate (Commission Junction)** — hosts Lowe's, AutoZone, Advance Auto
**FlexOffers** — hosts Home Depot, Lowe's, and many others
**ShareASale** — various home/auto retailers

These networks provide a single dashboard and API for tracking across multiple retailers. You join once, apply to individual merchants within the network.

### Approach D: Price Tracking / Historical Data

**CamelCamelCamel** — Amazon-only price history (no API, but browser extension)
**Keepa** — Amazon price tracking with API access
- $15-150/mo for API access
- Returns current price, historical price charts, price drop alerts
- Could show "this filter is currently $3 below its 90-day average — good time to buy"
- Amazon only

**PriceAPI.com** — Multi-retailer price monitoring
- Supports Amazon, Google Shopping, eBay, Idealo
- Returns real-time pricing data
- Enterprise-focused, pricing by request

---

## Recommended Implementation Strategy

### Phase 1 (MVP): Google Shopping + Amazon
- Use a Google Shopping API (SerpApi or Apify) as the primary price comparison engine
- One search returns prices across Amazon, Home Depot, Walmart, Lowe's, and specialty retailers
- Display results sorted by price with store logos
- For Amazon specifically, use Product Advertising API to generate affiliate links
- For other retailers, link directly to Google Shopping results (can still earn via retailer's own affiliate programs if set up)
- Cost: ~$0.005-$0.01 per product lookup, cached aggressively
- User experience: "20x20x1 MERV 11 air filter" → see 6 stores, tap cheapest one

### Phase 2: Direct Affiliate Integration
- Join Impact (Home Depot, Walmart) and CJ (Lowe's, AutoZone) affiliate networks
- Generate direct affiliate links per retailer instead of going through Google Shopping
- Higher commission rates than Google Shopping referrals
- Can display "Buy at Home Depot — $16.97 (earn $0.51 credit)" with exact pricing
- Track conversions per retailer for the credit rewards program

### Phase 3: Smart Deal Intelligence
- Integrate Keepa or build own price history for frequently recommended products
- Show "price trend" indicator: rising, falling, stable, all-time low
- Alert users when a product they need drops in price before their reminder fires
- "Your HVAC filter is due in 3 weeks — the 6-pack just dropped to its lowest price in 90 days"
- This is the killer feature that makes people buy through the app every time

---

## Commission Rate Summary

| Retailer | Commission | Cookie | Best For | Network |
|----------|-----------|--------|----------|---------|
| Amazon | 1-4.5% | 24hr | Everything | Amazon Associates |
| Home Depot | 1-8% | 24hr-30d | HVAC, plumbing, tools | Impact / FlexOffers |
| Lowe's | 2-20% | 1 day | DIY, appliances | CJ / FlexOffers |
| Walmart | 1-4% | 3 days | Price-competitive | Impact |
| AutoZone | 1.6% | 30 days | Auto parts | CJ |
| Advance Auto | ~5% | varies | Auto parts | CJ |
| Discount Tire | varies | varies | Tires | CJ |

**Key insight:** Home Depot at 8% on home decor/improvement items is significantly better than Amazon's 3-4.5% for the same products. For HVAC filters, home maintenance supplies, and plumbing parts, Home Depot affiliate links may be 2-3x more profitable than Amazon per sale. The price comparison feature should favor showing Home Depot links when their price is competitive.

---

## Cost Projections

At 10,000 active users, each getting ~2 price comparisons per month:
- Google Shopping API: 20,000 lookups × $0.005 = $100/mo
- With aggressive caching (same products looked up repeatedly): ~$30-50/mo
- Revenue from affiliate conversions at 15% click-through and 5% purchase rate:
  - 20,000 recommendations × 15% click × 5% buy × $20 avg × 3% commission = $900/mo
- Net margin on price comparison feature alone: $850-870/mo

The price comparison feature pays for itself many times over.
