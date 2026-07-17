---
name: Digital Concierge
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#07006c'
  on-tertiary-container: '#7073ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
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
    letterSpacing: -0.01em
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
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system is engineered to project absolute reliability and enterprise-grade security for the Digital Guestbook System. The brand personality is professional, efficient, and welcoming without being overly casual. It targets corporate environments, luxury residential complexes, and secure facilities where trust is paramount.

The design style is **Corporate / Modern** with a focus on functional clarity. It utilizes a refined structural hierarchy, ample negative space, and precise alignment to create a sense of order. The emotional response should be one of "effortless security"—where the user feels guided and protected through every interaction.

## Colors
The palette is anchored by **Primary Deep Blue**, used for core navigation, headings, and high-priority actions to signal authority and stability. **Secondary Teal** is utilized as a sophisticated accent for interactive elements, progress indicators, and successful states, providing a modern contrast to the deep primary tones.

Neutral grays are systematically applied to define boundaries and background depths. We use a "cool gray" scale to maintain a crisp, clean aesthetic. Semantic colors for Success and Error are highly saturated to ensure immediate recognition during critical guest registration and validation flows.

## Typography
This design system utilizes **Inter** exclusively to leverage its exceptional legibility and systematic weight distribution. The type scale is built on a modular 8px grid to ensure vertical rhythm across all devices.

For TV displays and kiosks, use `headline-xl` for welcome screens to ensure readability from a distance. On mobile devices, type sizes automatically scale down to prevent horizontal scrolling, with `body-md` serving as the primary reading size for guest forms. Contrast ratios are strictly maintained at AA standards or higher.

## Layout & Spacing
The layout follows a **Fluid Grid** model with specific constraints for different hardware. 
- **Mobile (Up to 600px):** Single column layout with 16px margins. Touch targets are a minimum of 48px.
- **Desktop (1024px+):** 12-column grid with 24px gutters. Content is often centered in a "Card-in-Page" layout to prevent excessive line lengths.
- **TV/Kiosk:** High-margin layouts (80px+) to avoid "overscan" issues, with simplified navigation flows designed for rapid, glanceable information.

Spacing follows a strict 8pt grid system. All padding and margins must be multiples of 8 (e.g., 8, 16, 24, 32, 48, 64) to maintain visual consistency.

## Elevation & Depth
Hierarchy is established through **Tonal Layers** supplemented by **Ambient Shadows**. 
- **Level 0 (Background):** Primary background using `background_surface`.
- **Level 1 (Cards/Containers):** Pure white surfaces with a subtle 1px border (`#E2E8F0`) and a soft, highly diffused shadow (0px 4px 12px rgba(15, 23, 42, 0.05)).
- **Level 2 (Modals/Popovers):** Higher elevation with a more pronounced shadow (0px 10px 25px rgba(15, 23, 42, 0.1)) and a background overlay blur to focus user attention.

Interactive elements use a "lift" effect on hover, where the shadow deepens slightly and the element moves 1-2px upward.

## Shapes
The design system employs a **Rounded** (Level 2) shape language. This 0.5rem (8px) base radius strikes a balance between professional rigidity and modern approachability. 

Large containers like registration cards use `rounded-xl` (24px) to feel more inviting, while smaller elements like buttons and input fields stay at the 8px base to maintain a structured, organized appearance. Checkboxes and selection indicators use a smaller 4px radius to feel precise.

## Components
- **Buttons:** Primary buttons are solid Deep Blue with white text. Secondary buttons use a Teal outline or subtle ghost style. All buttons have 48px height for touch-readability.
- **Input Fields:** Clearly defined with a 1px border. Focus states use a 2px Teal ring. Validation states (Error/Success) must change both the border color and include a trailing icon for accessibility.
- **Data Tables:** Clean spacing with 16px vertical cell padding. Rows use subtle zebra-striping or a bottom-border only (`#F1F5F9`). Headers are `label-sm` in Deep Blue for maximum legibility.
- **Chips/Badges:** Used for guest status (e.g., "Checked In", "Awaiting Approval"). These use a "Soft-Fill" style—low opacity background with high-contrast text of the same hue.
- **Registration Cards:** Centered containers on desktop/tablet that group related form fields, using the Level 1 elevation style to separate the task from the background.
- **Validation Indicators:** Real-time feedback via small `label-sm` text below inputs, colored semantically to match the state.