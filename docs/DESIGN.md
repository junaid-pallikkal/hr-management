# Design rules

## Tokens

- Define everything once in `tailwind.config.js` and `index.css`: font, text sizes, colors, radius, spacing, shadows.
- Use only these tokens. Never hard-code a color, font size or shadow in a component.
- One primary color, one background, one text color.
- One corner radius. One spacing scale.
- Build mobile first, then scale up to desktop.

## Colour theme

Soft indigo on a lavender background. Defined once in `src/index.css`. Light only: the app has no dark mode.

| Token | Color | Use |
|---|---|---|
| `bg` | #f2f3ff | Page background |
| `surface` | #ffffff | Cards, sidebar, popups |
| `soft` | #eceefc | Inputs, hover, empty areas |
| `fg` | #1c2040 | Main text |
| `muted` | #6f7597 | Helper text, inactive items |
| `primary` | #4f67e8 | Buttons, links, active menu, banner |
| `success` | #0f8a66 | Done, hired, verified |
| `warning` | #c2610c | Waiting, interview |
| `danger` | #d92d20 | Delete, rejected |

- Status colors appear as a 10% tint behind text of the same color.
- Corner radius is 12px everywhere. Pills (badges, avatars) are fully round.
- Dashboards start with a banner in the primary color. The active menu item has a soft primary background and a bar on the left edge.

## Typography

- Font: Plus Jakarta Sans, loaded once, globally.
- Only these sizes:

| Use | Size |
|---|---|
| Page title | 20px |
| Section title | 16px |
| Body and buttons | 14px |
| Helper and small text | 12px |

- Weights: 400, 500, 600 only.

## Icons

- Library: `lucide-react` only. One icon size across the app.
- Use icons for edit, delete, add, view, download.
- Every icon-only button has a tooltip that says what it does.

## Layout and style

- Flat cards. Never put a card inside another card. Use spacing, dividers or sections instead.
- Borderless. Separate things with soft shadows and spacing, not borders.
- A small set of shadow levels, defined once.
- Exception: popups and modals use a divider line between header, body and footer.
