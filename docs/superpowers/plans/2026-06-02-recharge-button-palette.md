# Recharge Button Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the billing recharge CTAs' saturated violet styling with a deep-navy and mint visual system.

**Architecture:** Keep both existing interactive buttons and their click handlers intact. Update only Tailwind utility classes in the billing header and wallet-card CTA so the visual refresh stays local to the existing components.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, lucide-react

---

### Task 1: Refresh The Recharge CTAs

**Files:**
- Modify: `src/app/dev-en/dashboard/billing/page.tsx`
- Modify: `src/app/dev-en/_components/account-wallet-strip.tsx`

- [ ] **Step 1: Update the billing-page CTA**

Replace the violet gradient and shadow with deep navy, a mint plus tile, and a
navy-teal hover shadow while preserving the existing label and click handler.

- [ ] **Step 2: Update the wallet-card CTA**

Use a light inverse button with a mint plus tile and navy text so the action
remains clear on the dark wallet card.

- [ ] **Step 3: Run static verification**

Run: `pnpm lint && pnpm build`

Expected: both commands exit with status `0`.

- [ ] **Step 4: Inspect the billing page**

Open the local billing page and confirm both recharge buttons remain legible,
balanced, and visually related to the wallet and trial cards.
