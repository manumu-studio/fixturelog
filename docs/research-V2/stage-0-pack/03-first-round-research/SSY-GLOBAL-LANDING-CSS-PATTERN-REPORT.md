SSY Global — Full CSS Pattern Report
Here is a complete breakdown of every design system layer used on the SSY landing page, ready for you to replicate.

1. Typography
Font Families
The page uses a two-font system — a display serif for headings and a sans-serif for body/UI:

Role	Font	Stack
Headings	HCo Chronicle Display	"HCo Chronicle Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif
Body / UI	Soehne	Soehne, ui-sans-serif, system-ui, sans-serif
Wide Caps (nav, labels)	Soehne Breit	"Soehne Breit", ui-sans-serif, system-ui, sans-serif
HCo Chronicle Display and Soehne/Soehne Breit are licensed fonts from Hoefler&Co and Klim Type Foundry respectively. You can approximate with Playfair Display (serif) and Inter (sans) from Google Fonts.

Font Weights in Use
font-light → 300
font-normal → 400 (default heading weight — Chronicle Display looks elegant at 400)
font-semibold → 600
font-bold → 700 (used for nav labels, footer category headings)
Type Scale (CSS custom properties — fluid/viewport-based above 960px)
All sizing uses a custom --unit-* scale. Above 960px, units become fluid (clamp()-based viewport units):

css
/* Static below 960px */
--unit-12: 12px;
--unit-16: 16px;
--unit-20: 20px;
--unit-24: 24px;
--unit-32: 32px;
--unit-40: 40px;
--unit-48: 48px;
--unit-64: 64px;
--unit-88: 88px;
--unit-96: 96px;

/* Fluid above 960px (scales with viewport) */
@media (min-width: 960px) {
  --unit-16: clamp(1px, calc(16 / 16 * (1vw * 1.25)), ...);
  /* etc for all units */
}
@media (min-width: 1280px) {
  --unit-16: clamp(1px, calc(16 / 16 * 1vw), ...);
}
Heading Sizes (applied via Tailwind-style classes)
Class	Computed size (desktop)	Use
text-96 / sm:text-96	~95px	H1 hero
text-64 / sm:text-64	~63px	H2 section headings
text-48 / sm:text-48	~47px	H2 quotes/CTAs
text-40	~40px	H3 CTA headings
text-32	~32px	H3 medium
text-24 / sm:text-24	~24px	News card titles
text-20	~20px	Small headings, card titles mobile
text-16	~16px	Body, nav links, footer
text-12	~12px	Category labels, nav uppercase
Line Heights
Custom leading-* classes using a ratio system:

leading-1 = 1.1 (tight, used on all big headings)
leading-3 = 1.3
leading-4 = 1.4
leading-5 = 1.5 (standard body)
leading-6 = 1.6
Letter Spacing
tracking-widest → 0.1em — exclusively on uppercase Soehne Breit labels (nav, footer headings, category tags)
2. Colour Palette
Exactly 5 brand colours defined as CSS custom properties on :root:

css
:root {
  --color-white:         #ffffff;
  --color-white-hover:   #f3f3f3;
  --color-black:         #0d0d0d;  /* near-black for body text */

  --color-blue-100:      #00e2fd;  /* Cyan / accent — announcement bar, section backgrounds */
  --color-blue-100-hover:#02b5ca;

  --color-blue-200:      #0087cb;  /* Mid blue — footer category headings */
  --color-blue-300:      #163e9f;  /* Cobalt — less used */

  --color-blue-400:      #000061;  /* Deep navy — primary brand, headings, nav, buttons */
  --color-blue-400-hover:#000043;
}
Colour Usage Map
Section	Background	Text
Announcement ticker	
#00e2fd (blue-100)	
#0d0d0d (black)
Navigation	Transparent → white on scroll	
#000061 (blue-400)
Hero	White / transparent	
#000061
About section	
#00e2fd (cyan)	
#000061
Services list	White	
#000061
Quote/testimonial	
#00e2fd (cyan)	
#000061
News section	
#000061 (deep navy)	White
News cards	White	
#0d0d0d (black)
Research section	
#00e2fd (cyan)	
#000061
CTA "Get in touch"	
#000061 + gradient overlay	White
Footer	White	
#0d0d0d
3. Layout & Grid System
A custom 12-column Bootstrap-style flex grid, with Tailwind utility classes layered on top.

css
/* Container */
.container {
  width: 100%;
  max-width: 100%;
  padding-left: var(--unit-20);   /* 20px mobile */
  padding-right: var(--unit-20);
}
@media (min-width: 960px) {
  .container {
    padding-left: var(--unit-40);  /* 40px tablet+ */
    padding-right: var(--unit-40);
  }
}

/* Row */
.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: calc(var(--unit-10) * -1);
  margin-right: calc(var(--unit-10) * -1);
}
@media (min-width: 960px) {
  .row {
    margin-left: calc(var(--unit-12) * -1);
    margin-right: calc(var(--unit-12) * -1);
  }
}

/* All direct children get gutter padding */
.row > * {
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  padding-left: var(--unit-10);
  padding-right: var(--unit-10);
}

/* Column widths (12-col system) */
.col-2  { flex: 0 0 auto; width: 16.6667%; }
.col-3  { flex: 0 0 auto; width: 25%; }
.col-4  { flex: 0 0 auto; width: 33.3333%; }
.col-6  { flex: 0 0 auto; width: 50%; }
.col-10 { flex: 0 0 auto; width: 83.3333%; }
.col-12 { flex: 0 0 auto; width: 100%; }

/* Offset */
.offset-2 { margin-left: 16.6667%; }
.offset-6 { margin-left: 50%; }
The page is full-width — .container runs 100% wide; the grid just provides internal padding. There is no max-width cap on the wrapper.

4. Spacing System
Spacing uses the same --unit-* custom property scale via Tailwind-style utility classes:

pt-16, pt-20, pt-32, pt-40, pt-48, pt-64, pt-104, pt-160
pb-20, pb-24, pb-32, pb-40, pb-56, pb-64, pb-80, pb-96
py-16, py-20, py-32, py-40, py-56, py-96, py-128
px-16, px-20, px-24
Key section paddings observed:

Hero top: pt-160 → sm:pt-320 (very large — the heading floats high up)
Content sections: typically py-64 to py-128
Compact row: py-32 to py-56
CTA banner: generous py-96 to py-128
Footer: pt-32 pb-80 top row, pb-64 sm:pb-96 bottom row
5. Responsive Breakpoints
css
/* xs  */ @media (min-width: 400px)  { ... }
/* sm  */ @media (min-width: 510px)  { ... }
/* md  */ @media (min-width: 640px)  { ... }
/* lg  */ @media (min-width: 960px)  { ... }  /* main "desktop" breakpoint */
/* xl  */ @media (min-width: 1280px) { ... }  /* fluid units kick in */
/* 2xl */ @media (min-width: 1400px) { ... }
/* 3xl */ @media (min-width: 1600px) { ... }
/* 4xl */ @media (min-width: 2560px) { ... }
The CSS uses sm: as the prefix for 960px (not 640px as in standard Tailwind), and md: for 1280px+. This is a custom Tailwind config.

6. Component Patterns
Announcement Ticker Bar
css
background-color: #00e2fd;     /* cyan */
padding: 0 var(--unit-40);
position: relative;
z-index: 20;
/* Content is a sliding/rotating marquee with prev/next arrows */
font-size: var(--unit-16);
color: #0d0d0d;
Navigation Header
css
position: sticky;             /* sticks on scroll */
top: var(--unit-56);          /* below ticker */
background: transparent;      /* transitions to white on scroll */
transition: color, background 0.2s;
color: #000061;
padding: var(--unit-32) var(--unit-40);
z-index: 40;
Nav links use Soehne Breit, font-bold, uppercase, text-12, tracking-widest. The logo scales up with scale-[2.57] on desktop via a CSS transform.

Primary Button (.btn)
css
.btn {
  display: inline-block;
  padding: var(--unit-12) var(--unit-40);
  font-size: var(--unit-16);
  line-height: 1.5;
  color: #ffffff;
  background-color: #000061;
  border-radius: 9999px;        /* fully pill-shaped */
  cursor: pointer;
  text-decoration: none !important;
  transition: 0.3s;
}
Button Variants
.btn-arrow-* — adds a → icon via ::after pseudo-element, right-padded to var(--unit-72) (vs standard var(--unit-40))
.btn-outline-* — background: transparent; border: 1px solid [color]; transition: 0.3s
.bg-none — ghost/text-only button, no background, just right padding for arrow
Colour modifiers: -white, -blue-100, -blue-200, -blue-400 applied as .btn-arrow-white, .btn-arrow-blue-400, etc.
The "Navigator Login" pill in the nav is bg-blue-400 text-white rounded-full.

Services List Items
css
.services-item {
  border-top: 1px solid rgba(0, 0, 97, 0.2); /* blue-400 at 20% opacity */
  padding-top: var(--unit-16);
  padding-bottom: var(--unit-40);             /* sm: var(--unit-48) */
}
.services-item:last-child { padding-bottom: 0; }
Items are large serif links that act as a vertical accordion/list — classic editorial style.

News Cards
css
.news-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}
/* Category label (top-left badge) */
.news-card-label {
  background-color: #00e2fd;   /* cyan */
  color: #0d0d0d;
  font-size: var(--unit-12);
  font-family: "Soehne Breit", ...;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: var(--unit-6) var(--unit-12);
  position: absolute;
  top: 0; left: 0;
}
/* Card title */
.news-card h3 {
  font-size: var(--unit-20);   /* sm: var(--unit-24) */
  color: #0d0d0d;
  font-family: Soehne, ...;    /* sans-serif, NOT the serif */
  line-height: 1.5;
  margin-bottom: var(--unit-16);
}
/* "Read more →" link */
.news-card-readmore {
  color: #000061;
  font-size: var(--unit-16);
}
/* Date */
.news-card-date {
  color: #0d0d0d;
  font-size: var(--unit-14);
  margin-top: auto;             /* pushed to bottom of card */
  padding-top: var(--unit-20);
}
News cards are displayed in a 3-column slider on desktop. The news section background is 
#000061 (deep navy).

Quote / Testimonial Block
Large serif quote at text-40 → sm:text-64 in 
#000061 on a 
#00e2fd (cyan) background. No quotation marks, just the raw italic-weight Chronicle Display text.

CTA "Get in Touch" Banner
css
background-color: #000061;
background-image: url("gradient-bg_04.png"); /* A diagonal blue gradient overlay */
background-size: cover;
background-position: center;
padding: var(--unit-96) var(--unit-40); /* sm: py-128 */
/* Layout: heading left, button right (flex row, items-center) */
7. Easing & Animation
A full named easing library defined as CSS custom properties:

css
:root {
  /* In */
  --ease-in-quad:   cubic-bezier(0.55, 0.085, 0.68, 0.53);
  --ease-in-cubic:  cubic-bezier(0.55, 0.055, 0.675, 0.19);
  --ease-in-quart:  cubic-bezier(0.895, 0.03, 0.685, 0.22);
  --ease-in-quint:  cubic-bezier(0.755, 0.05, 0.855, 0.06);
  --ease-in-expo:   cubic-bezier(0.95, 0.05, 0.795, 0.035);
  --ease-in-circ:   cubic-bezier(0.6, 0.04, 0.98, 0.335);

  /* Out */
  --ease-out-quad:  cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
  --ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-out-expo:  cubic-bezier(0.19, 1, 0.22, 1);
  --ease-out-circ:  cubic-bezier(0.075, 0.82, 0.165, 1);
}
Transitions: transition: 0.2s on nav hover states; transition: 0.3s on buttons and outlines
Image hover: .group-hover:scale-110 — hero and card images scale up gently via transform: scale(1.1) with overflow: hidden on the wrapper
Logo on desktop: Scaled up via md:scale-[2.57] CSS transform with origin-top-left
8. Footer
css
/* Footer structure */
footer .container {
  padding: 0 var(--unit-40);
}
/* Top row: logo + tagline (left), nav columns (right) */
footer .row-top {
  padding-top: var(--unit-32);
  padding-bottom: var(--unit-80);  /* sm: pb-40 pt-64 */
}
/* Footer nav headings */
footer h3 {
  font-family: "Soehne Breit", ...;
  font-size: var(--unit-16);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #0087cb;              /* blue-200 — only place this is used */
  margin-bottom: var(--unit-24);
  line-height: 1.4;
}
/* Footer links */
footer a {
  font-size: var(--unit-16);
  line-height: 1.5;
  color: #0d0d0d;
}
/* Copyright row */
footer .copyright {
  font-size: var(--unit-14);
  color: rgba(13,13,13,0.5);  /* muted black */
  padding-bottom: var(--unit-64);  /* sm: pb-96 */
}
9. Decorative Signature Element
The distinctive animated cyan wave/ribbon SVG across the hero is a Lottie animation (.lottie class) rendered as a canvas/SVG overlay. It uses the 
#00e2fd cyan and is absolutely positioned with z-index layering so it overlaps both the white above and the image below. This is the most distinctive brand element — it's a flowing double-sine wave in cyan with fine parallel lines.

Quick-Reference Summary Table
Token	Value
Heading font	HCo Chronicle Display (alt: Playfair Display)
Body font	Soehne (alt: Inter)
Label font	Soehne Breit (alt: Inter, wider tracking)
Primary navy	
#000061
Accent cyan	
#00e2fd
Mid blue	
#0087cb (footer labels only)
Body text	
#0d0d0d
Base font size	16px
Heading weight	400 (light, elegant)
Button radius	9999px (full pill)
Grid columns	12 (flex-based)
Gutter (mobile)	20px each side
Gutter (desktop)	40px each side
Main desktop breakpoint	960px
Fluid type starts	960px (viewport-relative units)

## FixtureLog Interpretation

- Use Playfair Display or Fraunces for the display-serif role; use Geist or a Soehne-like sans for body/UI. Do not use licensed SSY fonts directly.
- Use the report palette directly: `#ffffff`, `#0d0d0d`, `#00e2fd`, `#0087cb`, and `#000061`.
- Keep FixtureLog on a light editorial base with deep navy typography, cyan highlight bands, navy evidence sections, white cards, and pill CTAs.
- Adapt the cyan wave/ribbon into a FixtureLog marine route or laycan ribbon. Do not copy SSY's wave asset, logo, trademark treatment, or affiliation language.
- Use services-list rows and news-card/evidence-card patterns for FixtureLog workflow sections.
- Keep FixtureLog clearly labelled as an independent portfolio demo.


