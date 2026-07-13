# 🛒 Grocery List Organizer

> An intelligent grocery list application that automatically organizes shopping lists by store department, making grocery shopping faster, more efficient, and far less frustrating.

---

# Overview

Walking through a grocery store with a randomly ordered shopping list wastes time.

Many grocery list applications simply store items in the order they were entered, forcing shoppers to repeatedly backtrack through the store because produce, dairy, frozen foods, and household items are scattered throughout the list.

Grocery List Organizer solves this problem by automatically categorizing every item into its appropriate grocery department, allowing users to shop in a logical order that follows the layout of most grocery stores.

Instead of spending time reorganizing a shopping list manually, users can focus on shopping efficiently.

---

# The Problem

Traditional shopping lists have several common problems:

- Items appear in random order
- Users frequently forget products
- Families struggle to keep shared shopping lists updated
- Shopping takes longer because customers revisit aisles multiple times
- Existing grocery apps often contain unnecessary complexity while still lacking practical organization

Although grocery shopping is something millions of people do every week, many apps still overlook one simple improvement:

**Organizing the list the same way people actually walk through a store.**

---

# The Solution

Grocery List Organizer automatically groups shopping items into store departments as they are added.

Rather than creating one long unorganized checklist, the application builds an optimized shopping list that minimizes unnecessary walking and improves the overall shopping experience.

The application is designed around simplicity, speed, and practical usability.

---

# Current Features

## Automatic Department Sorting

Items are automatically placed into categories such as:

- Produce
- Dairy
- Meat & Seafood
- Frozen Foods
- Bakery
- Pantry
- Snacks
- Beverages
- Household Supplies
- Health & Beauty
- Miscellaneous

No manual organization required.

---

## Intelligent Categorization

The application recognizes grocery items and places them into the appropriate department automatically.

This creates a shopping list that more closely follows the natural flow of a grocery store.

Categorization happens in three tiers, in order, so the Claude API is only ever used as a last resort:

1. **Local keyword match** — a built-in dictionary in `index.html` handles common items instantly, for free, with no network call.
2. **Local cache** — any item Claude has classified before is remembered in the browser's `localStorage` (keyed by a normalized form of the item name), so the same item is never sent to the API twice.
3. **Claude API (Cloudflare Worker)** — only items that miss both of the above are sent, and every unrecognized item from a single "Sort" click is batched into **one** request rather than one request per item. If the Worker or the API is unreachable, those items simply fall back to "Uncategorized" — the app never breaks.

The app still works with zero setup using just the local keyword dictionary (Tier 1). The AI tier is optional and only activates once the Cloudflare Worker is deployed and `CATEGORIZE_ENDPOINT` in `index.html` points to it — see [AI Setup](#ai-categorization-setup) below.

---

## Simple List Management

Users can:

- Add grocery items
- Remove items
- Organize shopping lists
- Quickly view departments
- Reduce duplicate shopping trips

---

## Lightweight Design

The application runs entirely inside the browser without requiring:

- User accounts
- Downloads
- Installation
- Internet connectivity after loading

Everything is designed to be quick and accessible.

---

# Why I Built This

This project began with a simple observation.

Every grocery list I created eventually became disorganized.

Even after writing everything down, I still found myself walking back and forth across the store because items were scattered randomly throughout the list.

I wanted a shopping list that organized itself.

Rather than creating another note-taking application, I focused on solving a specific everyday problem through automation.

The result is a lightweight application that improves a routine task by eliminating unnecessary manual organization.

---

# Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript (ES6)
- Cloudflare Workers (serverless proxy for AI categorization)
- Claude API (Haiku model) for classifying items the local keyword dictionary doesn't recognize

The frontend (`index.html`) remains a lightweight browser-based application with no build step and no database. The only backend piece is a small Cloudflare Worker whose sole job is to hold the Anthropic API key server-side and forward batched classification requests — the Worker is optional and only needed if you want AI-assisted categorization.

---

# AI Categorization Setup

AI categorization runs through a Cloudflare Worker so the Anthropic API key is never exposed in the browser. This is the only part of the project that requires installation/deployment steps.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure your API key for local development

```bash
cp .env.example .dev.vars
# then edit .dev.vars and paste your real key:
# ANTHROPIC_API_KEY=sk-ant-...
```

`.dev.vars` is gitignored and is what `wrangler dev` reads locally. Never commit a real key.

## 3. Run the Worker locally

```bash
npm run dev
```

This starts the Worker at `http://127.0.0.1:8787`, which matches the default `CATEGORIZE_ENDPOINT` already set in `index.html`. Open `index.html` directly in a browser to test end-to-end against the local Worker.

## 4. Set the production secret

```bash
npx wrangler login
npm run secret:put
```

This prompts for the key and stores it as an encrypted Worker secret — it is never written to disk or committed.

## 5. Deploy the Worker

```bash
npm run deploy
```

Wrangler prints your Worker's URL (e.g. `https://aisle-order-proxy.<your-subdomain>.workers.dev`). Update `CATEGORIZE_ENDPOINT` near the top of the `<script>` block in `index.html` to `https://aisle-order-proxy.<your-subdomain>.workers.dev/categorize`, then redeploy/host `index.html` wherever you like (it's still a static file).

## 6. Test it

- Sort a list of only common items (e.g. "milk, bananas, bread") — no network request should fire; everything resolves via the local keyword dictionary.
- Add an unusual item (e.g. "kombucha") and sort — the button should briefly show a "Checking 1 unfamiliar item with Claude…" loading state, then render the result.
- Sort the same list again — no request should fire for "kombucha" this time; it's now served from the `localStorage` cache.
- Stop the Worker (or point `CATEGORIZE_ENDPOINT` at a bad URL) and sort a list with an unknown item — it should still render, with that item landing in "Uncategorized" instead of the page breaking.

---

# Project Goals

The primary goals of this project are:

- Reduce grocery shopping time
- Eliminate unnecessary walking through stores
- Improve shopping organization
- Simplify list management
- Demonstrate practical automation solving an everyday problem

---

# Future Roadmap

## Phase 1 — Core Application ✅

- [x] Grocery list creation
- [x] Automatic department sorting
- [x] Responsive interface
- [x] Item management
- [x] Department organization

---

## Phase 2 — Smarter Categorization

- [x] AI-assisted categorization for items the local dictionary doesn't recognize (via Claude API + Cloudflare Worker)
- [ ] Expanded grocery database
- [ ] Better keyword recognition
- [ ] Multiple category suggestions
- [ ] Custom department assignments
- [ ] User-defined categories

---

## Phase 3 — Shared Shopping Lists

- [ ] Family accounts
- [ ] Shared shopping lists
- [ ] Real-time synchronization
- [ ] Item completion tracking
- [ ] Shopping collaboration

---

## Phase 4 — Shopping Intelligence

- [ ] Frequently purchased items
- [ ] Favorite products
- [ ] Shopping history
- [ ] Recently purchased items
- [ ] Purchase suggestions

---

## Phase 5 — Store Support

- [ ] Store-specific aisle layouts
- [ ] Custom aisle ordering
- [ ] Multiple saved stores
- [ ] Walmart layouts
- [ ] Costco layouts
- [ ] Target layouts
- [ ] H-E-B layouts
- [ ] Kroger layouts

---

## Phase 6 — AI Integration

Future versions may include an AI shopping assistant capable of:

- Building grocery lists from recipes
- Suggesting missing ingredients
- Meal-planning assistance
- Pantry management
- Shopping optimization
- Ingredient substitutions
- Nutrition recommendations
- Budget-conscious shopping suggestions

---

## Phase 7 — Mobile Applications

- [ ] Android application
- [ ] iPhone application
- [ ] Offline synchronization
- [ ] Voice item entry
- [ ] Barcode scanning
- [ ] Camera-based receipt scanning

---

## Phase 8 — Premium Features

- [ ] Cloud synchronization
- [ ] User accounts
- [ ] Cross-device support
- [ ] Household management
- [ ] Grocery spending analytics
- [ ] Shopping trends
- [ ] Budget tracking

---

# Potential Future Ideas

- Apple Reminders integration
- Google Tasks synchronization
- Alexa integration
- Siri shortcuts
- Google Assistant support
- Wear OS support
- Apple Watch companion app
- Smart recipe imports
- Automatic coupon matching
- Price comparison between stores
- Loyalty card integration
- Dark mode
- Accessibility improvements

---

# Installation

Clone the repository:

```bash
git clone https://github.com/prestonross979/grocery-list-organizer.git
```

Open `index.html` in any modern web browser.

No installation or external dependencies are required for local keyword-based sorting.

To enable AI-assisted categorization for items the local dictionary doesn't recognize, see [AI Categorization Setup](#ai-categorization-setup).

---

# Current Status

This project is under active development.

The current version focuses on demonstrating how practical automation can simplify one of the most common everyday tasks while providing a foundation for future smart shopping features.

---

# Long-Term Vision

The long-term vision is to evolve Grocery List Organizer into a complete shopping companion capable of organizing grocery trips from start to finish.

Future versions may combine intelligent grocery organization, AI-assisted meal planning, pantry management, budgeting tools, and real-time collaboration to create a seamless shopping experience for individuals and families.

The goal is not simply to replace a paper shopping list, but to build a smarter system that saves users time, reduces unnecessary effort, and improves everyday routines.
````
