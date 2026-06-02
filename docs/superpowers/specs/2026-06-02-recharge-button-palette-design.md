# Recharge Button Palette Design

## Scope

Refresh the two visible recharge CTAs on the billing overview without changing
their click handlers, labels, or layout responsibilities:

- the primary recharge action in the billing page header
- the recharge action inside the dark wallet card

## Visual Direction

Use a restrained deep-navy palette with a small mint accent. The navy connects
the CTA to the wallet card; the mint highlight connects it to the trial card.
Avoid the previous saturated violet gradient.

The page-header action keeps the full treatment: navy gradient, mint plus tile,
subtle mint edge highlight, and a soft navy-teal shadow. The wallet-card action
uses a light inverse treatment so it remains legible against the dark card while
sharing the same mint accent.

## Behavior

Both buttons preserve their existing `onClick` handlers and labels. Hover,
active, and keyboard focus states remain visible.

## Verification

Run lint and a production build, then inspect the billing page in a browser.
