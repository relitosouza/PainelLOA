---
name: Public Trust & Clarity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#424751'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737783'
  outline-variant: '#c2c6d3'
  surface-tint: '#255dad'
  primary: '#00346f'
  on-primary: '#ffffff'
  primary-container: '#004a99'
  on-primary-container: '#9bbdff'
  inverse-primary: '#abc7ff'
  secondary: '#00629d'
  on-secondary: '#ffffff'
  secondary-container: '#00a2fd'
  on-secondary-container: '#003558'
  tertiary: '#5f2200'
  on-tertiary: '#ffffff'
  tertiary-container: '#833301'
  on-tertiary-container: '#ffa77e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#abc7ff'
  on-primary-fixed: '#001b3f'
  on-primary-fixed-variant: '#00458f'
  secondary-fixed: '#cfe5ff'
  secondary-fixed-dim: '#98cbff'
  on-secondary-fixed: '#001d33'
  on-secondary-fixed-variant: '#004a77'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb694'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-mono:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for civic engagement, focusing on institutional transparency and public trust. The brand personality is authoritative yet approachable, stripping away unnecessary decoration to ensure that complex budgetary data remains the protagonist.

The design style follows a **Modern Corporate** aesthetic with a strong emphasis on **Accessibility**. It utilizes high-contrast typography, generous white space to reduce cognitive load, and a soft layering system that makes the digital portal feel like a reliable public service. The emotional response should be one of clarity, efficiency, and confidence in the provided information.

## Colors
This design system utilizes an institutional palette rooted in "Civic Blue" to establish authority. 

- **Primary:** A deep, stable blue used for navigation, primary actions, and branding.
- **Secondary:** A brighter blue for interactive elements and emphasis.
- **Surface & Backgrounds:** Pure white (#FFFFFF) is used for cards and content areas, while the Neutral light grey (#F8FAFC) provides subtle contrast for the main background.
- **Data Visualization:** A set of semantic colors is reserved strictly for departmental categorization (Health, Education, etc.) to ensure users can scan budgetary distributions intuitively.
- **Status Colors:** Standard success, warning, and error tokens follow WCAG AA contrast requirements against white backgrounds.

## Typography
The system relies exclusively on **Inter** for its exceptional legibility in data-dense environments. 

- **Hierarchy:** Use `display-lg` only for main dashboard landing stats. Headlines use semi-bold weights to create clear section breaks.
- **Data Legibility:** For financial figures, use the `data-mono` style which utilizes Inter's tabular lining features to ensure numbers align perfectly in tables and lists.
- **Readability:** Body text is kept at a comfortable 16px minimum to ensure accessibility for all age groups.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop to maintain readability of long-form data tables and reports, centered within the viewport.

- **Grid:** A 12-column grid with 24px gutters.
- **Rhythm:** All spacing (padding, margins) must be multiples of the 8px base unit.
- **Mobile Adaptivity:** On mobile, margins shrink to 16px. Cards stack vertically, and complex data tables should transition to "Summary Card" views or horizontal-scroll containers with clear indicators.

## Elevation & Depth
To maintain a clean, institutional feel, the design system uses **Tonal Layers** combined with **Ambient Shadows**.

- **Level 0 (Background):** The neutral grey surface.
- **Level 1 (Cards/Content):** White surfaces with a very soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)) and a 1px border (#E2E8F0).
- **Level 2 (Interactive/Hover):** When a user interacts with a card, the shadow deepens slightly, and the border color shifts to the primary blue.
- **Depth:** No heavy blurs or frosted glass are used; clarity and flat, structural integrity are prioritized to ensure performance and accessibility.

## Shapes
The design system adopts a **Rounded** philosophy to soften the "cold" nature of government data. 

- **Large Containers:** Cards and main content areas use `rounded-xl` (1.5rem / 24px) to create a friendly, modern frame.
- **Standard Elements:** Buttons, input fields, and chips use the base `rounded-lg` (1rem / 16px) to maintain a consistent language of approachability.
- **Data Points:** In bar charts and progress bars, use rounded caps to match the UI language.

## Components
- **Buttons:** Large touch targets (min 48px height). Primary buttons use solid institutional blue with white text. Secondary buttons use an outline style.
- **Interactive Chips:** Used for filtering departments (e.g., "Health", "Education"). Chips should include a small color-coded dot corresponding to the data palette.
- **Data Tables:** High-contrast rows with subtle zebra-striping. Header rows are pinned and use a slightly darker neutral tint. No vertical borders; only horizontal separators for a cleaner look.
- **Modern Cards:** Financial summaries are housed in cards with `rounded-xl` corners. They feature a prominent "Key Metric" in `headline-lg` and a supporting sparkline or trend indicator.
- **Search & Inputs:** Large, clear search bars with prominent icons. Focus states must be highly visible using a 2px secondary-blue ring.
- **Charts:** Donut and Bar charts should use the defined departmental colors. Tooltips must be high-contrast with clear, non-technical labels.
