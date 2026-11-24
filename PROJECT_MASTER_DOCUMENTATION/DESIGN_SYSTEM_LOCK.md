# Design System Lock Specification

> **STATUS:** IMMUTABLE / LOCKED  
> **RULE:** No visual, structural, typographic, or behavioral design changes are permitted without explicit user instruction. All new UI work must follow these exact tokens and rules.

---

## 1. Color Palette & Surface Tokens

### A. Core Base Colors
- **Main Background:** `#05050b` (Deep obsidian/violet black)
- **Background Radial Glow:** `radial-gradient(circle at 50% -22%, rgba(112, 82, 255, .17), transparent 34rem), #05050b`
- **Primary Text:** `#f5f3ff` (Ultra-light violet white)
- **Heading Text (Solid):** `#ffffff`
- **Muted / Subtitle Text:** `#f0eff9` or `rgba(255, 255, 255, .72)`
- **Secondary Muted Text:** `#bdb6d6` or `rgba(255, 255, 255, .5)`
- **Disabled / Tertiary Text:** `rgba(255, 255, 255, .32)`

### B. Glass Surfaces & Card Backdrops
- **Header Shell Surface:**
  ```css
  background:
    linear-gradient(112deg, rgba(255, 255, 255, .075), rgba(255, 255, 255, .018) 42%, rgba(130, 106, 208, .055)),
    rgba(20, 19, 30, .68);
  -webkit-backdrop-filter: blur(34px) saturate(175%);
  backdrop-filter: blur(34px) saturate(175%);
  box-shadow:
    0 18px 45px rgba(0, 0, 0, .3),
    inset 0 1px 0 rgba(255, 255, 255, .08),
    inset 0 -1px 0 rgba(255, 255, 255, .015);
  ```
- **Standard Card Glass:**
  ```css
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  ```
- **Card Hover Surface:**
  ```css
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(145, 120, 255, 0.35);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  ```

### C. Signature Gradients
- **Primary Heading Gradient:**
  ```css
  background: linear-gradient(90deg, #fff 0%, #f7f4ff 42%, #c8bbff 70%, #8b63ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  ```
- **Alternate Section Heading Gradient (`site-typography.css`):**
  ```css
  background: linear-gradient(92deg, #ffffff 0%, #d4ccff 24%, #846aff 75%, #b09eff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  ```
- **Accent Emphasis Gradient (for `em`, `.rmp-seo-accent`, `.grad`):**
  ```css
  background: linear-gradient(90deg, #dcd3ff 0%, #ad96ff 52%, #7957f5 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-style: normal;
  ```
- **Brand Logo Text Gradient:**
  ```css
  background: linear-gradient(100deg, #f7f5fb 15%, #bdb6d6 48%, #f7f5fb 78%);
  background-size: 180% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  ```
- **Skeleton Shimmer Gradient:**
  ```css
  background: linear-gradient(110deg, rgba(255,255,255,.045) 8%, rgba(145,120,255,.13) 18%, rgba(255,255,255,.045) 33%);
  background-size: 220% 100%;
  animation: rmp-news-skeleton-shimmer 1.35s linear infinite;
  ```

### D. Accent & Status Colors
- **Brand Accent Purple:** `#7052ff`
- **Vibrant Violet:** `#8b63ff`
- **Deep Indigo / Glow:** `#7957f5`
- **Success / Verified Green:** `#3dd598` / `#22c55e`
- **Warning / Orange:** `#ffb347` / `#f59e0b`
- **Danger / Soft Red:** `#ff6577` / `#ef4444`

---

## 2. Typography & Font Hierarchy

### A. Font Families
- **Primary Interface Font:** `'Plus Jakarta Sans', 'DM Sans', sans-serif`
- **Navigation & Subhead Font:** `'DM Sans', sans-serif`
- **Brand & Display Font:** `'Manrope', sans-serif`

### B. Type Scale
| Element | Desktop Size | Mobile Size (`<= 640px`) | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| **H1 Hero Title** | `clamp(38px, 5.4vw, 62px)` | `36px` | 800 / 600 | 1.04 – 1.08 | `-0.052em` to `-0.04em` |
| **H2 Section Heading** | `clamp(36px, 3.35vw, 54px)` | `36px` | 800 / 600 | 1.08 | `-0.052em` |
| **H3 Card Heading** | `20px – 24px` | `18px – 20px` | 700 | 1.25 | `-0.025em` |
| **Intro / Lead Paragraph** | `18px` | `16px` | 600 | 1.58 – 1.62 | Normal |
| **Body Text** | `15px – 16px` | `14px – 15px` | 400 – 500 | 1.50 – 1.60 | Normal |
| **Caption / Meta Text** | `12px – 13px` | `12px` | 500 – 600 | 1.40 | Normal |
| **Kicker / Eyebrow** | `12px – 13px` | `11px – 12px` | 700 / 800 | 1.20 | `0.08em` (Uppercase) |

---

## 3. Border Radiuses & Sizing Hierarchy

- **Header Pill Shell:** `21px`
- **Interactive Pills / Badges / Chips:** `999px` (fully rounded)
- **Primary Action Buttons:** `12px` – `14px` (or `999px` for glow pills)
- **Cards & Data Tables:** `16px` – `24px`
- **Input Fields & Textareas:** `12px` – `14px`
- **Dropdown Panels:** `18px` – `20px`
- **Modal Dialogs:** `24px`

---

## 4. Component Styles

### A. Buttons
1. **Glow / Primary Button (`.glow-btn`):**
   - Background: `linear-gradient(135deg, #7052ff, #8b63ff)`
   - Color: `#ffffff`
   - Border radius: `12px` – `999px`
   - Box shadow: `0 0 24px rgba(112, 82, 255, .45)`
   - Hover state: Brightness increase, slight upward translation (`translateY(-1px)`), expanded box shadow.
2. **Outline / Secondary Button (`.outline-btn`):**
   - Background: `rgba(255, 255, 255, .05)`
   - Border: `1px solid rgba(255, 255, 255, .15)`
   - Color: `#f5f3ff`
   - Hover state: Background `rgba(255, 255, 255, .10)`, border-color `rgba(255, 255, 255, .3)`.
3. **Login / Account Button (`.login-button`):**
   - Background: `rgba(255, 255, 255, .08)`
   - Border: `1px solid rgba(255, 255, 255, .14)`
   - Hover state: Subtle glow, white text.

### B. Form Inputs & Search Fields
- Background: `rgba(255, 255, 255, .04)`
- Border: `1px solid rgba(255, 255, 255, .12)`
- Color: `#ffffff`
- Placeholder: `rgba(255, 255, 255, .4)`
- Focus state: `outline: 0; border-color: #8b63ff; box-shadow: 0 0 0 3px rgba(139, 99, 255, .25);`

### C. Tables & Directory Grids
- Background: Glass container with `border: 1px solid rgba(255, 255, 255, .08)`
- Row borders: `1px solid rgba(255, 255, 255, .04)`
- Header row: Uppercase, `12px`, tracking `0.06em`, muted color `rgba(255, 255, 255, .5)`
- Row hover: `background: rgba(255, 255, 255, .03)`

### D. Market Switcher (`.market-switch`)
- Dual segment pill: `Prop Firm` vs `Broker`
- Indicator: Absolute sliding indicator with smooth `transform` transition
- Active tab text: `#ffffff`, bold; inactive tab: `rgba(255, 255, 255, .6)`

---

## 5. Breakpoints & Responsive Behavior

- **Mobile Breakpoint:** `max-width: 640px`
  - Navigation collapses to mobile drawer icon (`MenuIcon`).
  - Search transforms into full-width overlay modal.
  - Headings shrink to fixed `36px` to prevent layout overflow.
  - Multi-column grids collapse to single-column cards.
- **Tablet Breakpoint:** `max-width: 1024px`
  - Header actions tighten; some secondary labels hidden.
  - Dropdowns adapt to click-toggle instead of hover.
- **Desktop Maximum Container:** `max-width: 1440px` (padded `24px` horizontally)
- **Standard Content Width:** `max-width: 1280px`

---

## 6. Prohibited Visual Modifications

Under this design system lock:
- NEVER switch to a light theme or introduce light backgrounds.
- NEVER replace the primary fonts (`Plus Jakarta Sans`, `DM Sans`, `Manrope`).
- NEVER remove the signature violet/purple gradient styling from headings.
- NEVER alter spacing around headers, sections, or table cells.
- NEVER replace Lucide or custom SVG icons with third-party icon libraries.
- NEVER modify border radiuses or remove glassmorphism effects.
