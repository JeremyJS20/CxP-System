# Design System: High-Density B2B SaaS



## 1. Visual Theme & Atmosphere

The design language is **immersive, production-grade SaaS, and dual-themed** — establishing an hyper-functional "High-Density SaaS" presence — supporting both a deep-navy dark mode and a clean, clinical light mode. The brand identity draws from THE WORKSPACE's signature palette: deep navy anchors authority, while cyan-to-teal gradients evoke digital trust and technological precision.

**Dark Mode:** A deep-space navy void punctuated by glassmorphic surfaces and cyan-tinted luminescence. Subtle radial gradients bleed from the canvas edges — a faint cyan aurora at the top and a whisper of teal at the bottom — preventing the dark background from feeling lifeless while keeping focus on content.

**Light Mode:** A bright, airy canvas with soft grey undertones, where glass surfaces become frosted white panels with subtle shadows instead of glows. The cyan/teal accents remain vibrant against the light backdrop, and navy text grounds the hierarchy with authority.

Every surface floats with frosted-glass translucency (dark) or soft elevation shadows (light), reinforced by precise borders. The density is **focused and minimal** — high-density spacing, consistent spacing, and a clear visual hierarchy that channels attention.

The aesthetic philosophy: **"The High-Density SaaS — hyper-functional precision with zero distractions."**

The UI embraces hyper-functional minimalism, using High-Density Grids and microscopic precision to maximize data visibility and keyboard-first navigation.



## 2. Theme Architecture

Themes are implemented via CSS custom properties on the `:root` selector, toggled by a `data-theme` attribute on `<html>`:

```html
<html data-theme="light">  <!-- or "dark" -->
```

**Default:** Light mode. Dark mode activates via `[data-theme="dark"]` override block.

**System preference detection:** On first load, respect `prefers-color-scheme: dark` media query. Persist user's manual choice in `localStorage`.

```css
:root { /* light theme tokens */ }

[data-theme="dark"] { /* dark theme overrides */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark theme overrides */ }
}
```

**Theme Toggle:** A minimal icon button (sun/moon) positioned in the top-right corner of the glass card header, using Ghost button styling.

> **Optional — Tailwind CSS Integration:** If your project architecture supports Tailwind CSS 4, the design tokens defined in this document can be bridged into Tailwind's utility system via `@theme`. See **Section 13: Tailwind CSS 4 Integration** for the full mapping strategy, critical gotchas, and component class conventions. All Tailwind-specific guidance in this document is **optional** and does not alter the core design system — projects using vanilla CSS custom properties remain fully compliant.



## 3. Color Palette & Roles



### Brand Colors (Theme-Invariant)

These core THE WORKSPACE brand colors remain constant across both themes:

| Descriptive Name | Hex | Functional Role |
|---|---|---|
| The Platform Navy | `#1B2A4A` | Brand anchor — logo, key headings in light mode |
| Deep Teal | `#0D6B7A` | Upper gradient terminus, deep accent |
| Medium Teal | `#0E8E9A` | Primary CTA gradient end, success glow source |
| Bright Cyan | `#00B4D8` | Primary accent — CTAs, success states, active indicators |
| Light Cyan | `#48CAE4` | Highlight accents, informational states, secondary glow |



### Surfaces — Dark Theme

| Token | Value | Functional Role |
|---|---|---|
| `--surface-base` | `#0A1628` | Base canvas — deepest background layer |
| `--surface-card` | `rgba(13, 25, 50, 0.70)` | Primary card background with 70% opacity for glass effect |
| `--surface-elevated` | `rgba(27, 42, 74, 0.50)` | Elevated interactive surfaces (focused inputs, hovered ghosts) |
| `--surface-inset` | `rgba(255, 255, 255, 0.04)` | Subtle glass tint for inset containers, inputs, ghost buttons |
| `--surface-border` | `rgba(255, 255, 255, 0.08)` | Hairline borders on glass surfaces |
| `--surface-overlay` | `rgba(5, 10, 25, 0.85)` | Modal overlay |



### Surfaces — Light Theme

| Token | Value | Functional Role |
|---|---|---|
| `--surface-base` | `#F0F4F8` | Base canvas — soft cool grey |
| `--surface-card` | `rgba(255, 255, 255, 0.85)` | Primary card background — frosted white glass |
| `--surface-elevated` | `rgba(255, 255, 255, 0.95)` | Elevated interactive surfaces |
| `--surface-inset` | `rgba(27, 42, 74, 0.04)` | Subtle navy tint for inset containers |
| `--surface-border` | `rgba(27, 42, 74, 0.10)` | Hairline borders — navy-tinted for contrast |
| `--surface-overlay` | `rgba(27, 42, 74, 0.60)` | Modal overlay — navy wash |



### Accent Colors (Semantic — Both Themes)

| Token | Dark Value | Light Value | Functional Role |
|---|---|---|---|
| `--accent-primary` | `#00B4D8` | `#0E8E9A` | Primary CTA, success, active states |
| `--accent-primary-end` | `#0E8E9A` | `#0D6B7A` | Gradient terminus for primary buttons |
| `--accent-primary-dim` | `rgba(0, 180, 216, 0.12)` | `rgba(14, 142, 154, 0.10)` | Tinted backgrounds |
| `--accent-primary-glow` | `rgba(0, 180, 216, 0.25)` | `rgba(14, 142, 154, 0.15)` | Box-shadow halos (subtler in light) |
| `--accent-warning` | `#FBBF24` | `#F59E0B` | Warning states, manual review needed |
| `--accent-warning-end` | `#F59E0B` | `#D97706` | Warning gradient end |
| `--accent-warning-dim` | `rgba(251, 191, 36, 0.12)` | `rgba(245, 158, 11, 0.10)` | Warning tinted backgrounds |
| `--accent-warning-glow` | `rgba(251, 191, 36, 0.25)` | `rgba(245, 158, 11, 0.15)` | Warning glow |
| `--accent-error` | `#F87171` | `#EF4444` | Error states, rejection, failed verification |
| `--accent-error-end` | `#EF4444` | `#DC2626` | Error gradient end |
| `--accent-error-dim` | `rgba(248, 113, 113, 0.12)` | `rgba(239, 68, 68, 0.10)` | Error tinted backgrounds |
| `--accent-error-glow` | `rgba(248, 113, 113, 0.25)` | `rgba(239, 68, 68, 0.15)` | Error glow |
| `--accent-info` | `#48CAE4` | `#0D6B7A` | Informational states, loading spinners |
| `--accent-muted` | `#9CA3AF` | `#6B7280` | Muted/expired states, deactivated elements |



### Text Colors

| Token | Dark Value | Light Value | Functional Role |
|---|---|---|---|
| `--text-primary` | `#F9FAFB` | `#1B2A4A` | Headlines, values, body copy |
| `--text-secondary` | `#9CA3AF` | `#4B5563` | Subheadlines, labels, descriptions |
| `--text-tertiary` | `#6B7280` | `#9CA3AF` | Fine print, metadata labels, timestamps |
| `--text-inverse` | `#0A1628` | `#FFFFFF` | Text on bright CTA buttons |
| `--text-on-accent` | `#0A1628` | `#FFFFFF` | Text on accent-colored elements |



## 4. Typography Rules

**Font Family:** DM Sans — a geometric humanist sans-serif loaded from Google Fonts. Used for both display and body text, creating a unified, modern voice. Falls back to `system-ui → -apple-system → sans-serif`.

**Monospace:** JetBrains Mono (fallback: Fira Code → ui-monospace) — reserved exclusively for technical data values (session IDs, scores, raw JSON).

| Role | Size | Weight | Letter Spacing | Line Height |
|---|---|---|---|---|
| Headline (h1) | 1.625rem (26px) | 700 (Bold) | -0.02em (tight) | 1.25 |
| Subheadline | 0.9375rem (15px) | 400 (Regular) | Normal | 1.6 |
| Section Headers | 0.8125rem (13px) | 500-700 | 0.06-0.08em (wide) | Normal |
| Body / Labels | 0.8125rem (13px) | 500 | 0.02em | Normal |
| Data Values (mono) | 0.75rem (12px) | 400 | Normal | Normal |
| Micro Labels | 0.6875rem (11px) | 700 | 0.08em (very wide) | Normal |

Section headers and micro labels use `text-transform: uppercase` with generous letter-spacing, creating a "military briefing" quality that reinforces the security / verification theme.

**Responsive scaling:** Headlines shrink to 1.375rem (22px) below 480px viewport width.



## 5. Component Stylings



### Theme Toggle

* **Placement:** Top-right of the glass card, or in a fixed utility bar.
* **Style:** Ghost button, 36px square, centered sun (☀️) or moon (🌙) icon. In light mode shows moon icon (switch to dark); in dark mode shows sun icon (switch to light).
* **Transition:** `background-color 200ms ease, color 200ms ease`.
* **Behavior:** Toggles `data-theme` on `<html>`, persists to `localStorage`.



### Buttons

* **Primary (`.btn-primary`):** Compact, precise dimensions (minimum 28px height) with sharp, utilitarian corners (4px to 6px radius). Background is a 135° diagonal gradient from `--accent-primary` to `--accent-primary-end`. Text uses `--text-on-accent`. Surrounded by a compound box-shadow using `--accent-primary-glow`. On hover, glow intensifies and button lifts 1px. On press, it exhibits a highly tactile, physical response, scaling down instantly (0.98x). In **light mode**, glow is subtler and replaced with a soft drop shadow for natural elevation.
* **Primary Variants:** `.warning` swaps to warning gradient, `.error` to error gradient — each with matching glow/shadow colors. Error and warning variants in light mode use `--text-on-accent`.
* **Secondary (`.btn-secondary`):** Fully transparent background. `--text-secondary` that brightens to `--text-primary` on hover. Smaller padding (10px 20px), medium weight (500). No glow, no border.
* **Ghost (`.btn-ghost`):** `--surface-inset` background with `--surface-border` border. `--text-secondary` text, small size (13px). On hover, elevates to `--surface-elevated` with brightened text.
* **Full Width:** `.full-width` modifier stretches any button to 100% container width.



### Cards / Containers

* **Security Badges:** Exceptionally soft, pill-like corners (32px radius) utilizing rich Glassmorphism (70% backdrop with a heavy 24px blur). Inner icons sit in contrasting pristine white containers.
* **Glass Card (`.glass-card`):** `--surface-card` background with backdrop blur. In **dark mode**: 16px backdrop blur, `--surface-border` border, and a `::before` pseudo-element drawing a luminous gradient across the top edge (transparent → white 8% → transparent). In **light mode**: 12px backdrop blur, `--surface-border` border, plus a soft `box-shadow: 0 4px 24px rgba(27, 42, 74, 0.08)` for natural elevation. No luminous top edge in light mode. Generously rounded corners (20px radius). 32px internal padding.
* **Inset Panels:** `--surface-inset` background with `--surface-border` border. 12-16px radius.
* **Reason Banner (`.reason-banner`):** Uses `--accent-error-dim` background with `--accent-error` at 20% opacity border.



### Inputs / Forms

* **Text Input:** `--surface-inset` background, `--surface-border` border, 12px radius. On focus: border transitions to `--accent-primary` at 40% opacity, gains a 3px ring using `--accent-primary-glow`, and background deepens to `--surface-elevated`. Placeholder text in `--text-tertiary`. Smooth transition (350ms, custom ease-out).
