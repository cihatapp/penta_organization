# Penta Organizasyon

<p align="center">
  <strong>Professional Event Management Company</strong><br>
  Based in Antalya, Turkey | Serving Nationwide
</p>

<p align="center">
  <a href="https://www.pentaorganizasyon.com">Website</a> •
  <a href="https://instagram.com/pentaorganizasyon">Instagram</a>
</p>

---

## About

Penta Organizasyon is a professional event management company with **10+ years of experience** and **500+ successful events**. We've partnered with leading brands including Peugeot, Turkish Airlines (THY), Koç Holding, and Meta.

### Services

| Service | Description |
|---------|-------------|
| **Part-Time Staff Supply** | Professional hostesses, hosts, promoters, and event personnel |
| **Corporate Event Management** | Congresses, seminars, product launches, corporate meetings |
| **Stage & Technical Production** | Stage design, decoration, sound systems, lighting equipment |
| **VIP Transfer** | Luxury transportation and group shuttle services |

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **3D Graphics** | GLB models, Google Model-Viewer |
| **PWA** | Service Worker, Web App Manifest |
| **SEO** | Schema.org JSON-LD, Open Graph, Twitter Cards |
| **i18n** | Custom internationalization (TR/EN) |

---

## Project Structure

```
penta_organization/
│
├── 📄 HTML Pages
│   ├── index.html           # Homepage with hero animation
│   ├── about.html           # Company story & team
│   ├── services.html        # Service offerings
│   ├── portfolio.html       # Past events gallery
│   ├── careers.html         # Job opportunities
│   ├── contact.html         # Contact form & info
│   └── game.html            # Interactive experience
│
├── 🎨 assets/css/
│   ├── variables.css        # CSS custom properties (colors, spacing, etc.)
│   ├── reset.css            # Browser reset styles
│   ├── typography.css       # Font definitions & text styles
│   ├── layout.css           # Grid & flexbox layouts
│   ├── components.css       # Reusable UI components
│   ├── animations.css       # Keyframe animations
│   ├── snow.css             # Seasonal snow effect
│   ├── main.css             # Main stylesheet (imports all)
│   └── pages/               # Page-specific styles
│       ├── home.css
│       ├── about.css
│       ├── services.css
│       ├── portfolio.css
│       ├── careers.css
│       ├── contact.css
│       └── game.css
│
├── ⚡ assets/js/
│   ├── main.js              # Entry point, initializes modules
│   └── modules/
│       ├── navigation.js    # Header, mobile menu, scroll behavior
│       ├── theme.js         # Dark/light mode toggle
│       ├── i18n.js          # Language switching (TR/EN)
│       ├── animations.js    # Scroll-triggered animations
│       ├── forms.js         # Form validation & submission
│       ├── portfolio.js     # Portfolio filtering & lightbox
│       ├── game.js          # Interactive game logic
│       └── snow.js          # Seasonal snow particles
│
├── 🎮 assets/3d/
│   ├── home_animation.glb   # Homepage hero 3D animation
│   ├── logo_3d_just_icon.glb # 3D logo icon
│   ├── staff.glb            # Staff service illustration
│   ├── corparete_event.glb  # Corporate event illustration
│   ├── technical.glb        # Technical services illustration
│   ├── decoration.glb       # Decoration service illustration
│   └── transfer.glb         # Transfer service illustration
│
├── 🌍 assets/locales/
│   ├── tr.json              # Turkish translations
│   └── en.json              # English translations
│
├── 🖼️ assets/images/        # Images, icons, favicons
├── 🔤 assets/fonts/         # Custom web fonts
│
├── 📱 PWA Files
│   ├── manifest.json        # Web app manifest
│   ├── sw.js                # Service worker for offline support
│   └── favicon.ico          # Favicon
│
└── 🔍 SEO Files
    ├── robots.txt           # Search engine directives
    ├── sitemap.xml          # XML sitemap
    └── .htaccess            # Apache configuration
```

---

## Features

### User Experience
- **Responsive Design** — Optimized for mobile, tablet, and desktop
- **Theme Switching** — Dark and light mode support
- **Smooth Animations** — Scroll-triggered effects and micro-interactions
- **3D Elements** — Interactive 3D models on service pages

### Internationalization
- **Multi-language** — Full Turkish and English support
- **RTL Ready** — Prepared for right-to-left languages
- **URL-based Switching** — `?lang=en` query parameter support

### Performance
- **Progressive Web App** — Installable, works offline
- **Optimized Assets** — Compressed images and efficient loading
- **Service Worker** — Caches assets for faster subsequent visits

### SEO
- **Structured Data** — Schema.org markup for rich snippets
- **Open Graph** — Optimized social media sharing
- **Semantic HTML** — Proper heading hierarchy and landmarks
- **Local SEO** — Geo tags for Antalya region targeting

---

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local server for development (optional but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/penta_organization.git
   cd penta_organization
   ```

2. **Serve locally** (choose one)
   ```bash
   # Using npx
   npx serve .

   # Using Python
   python -m http.server 8000

   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## Contact

- **Website:** [pentaorganizasyon.com](https://www.pentaorganizasyon.com)
- **Email:** hello@pentaorganizasyon.com
- **Phone:** +90 530 913 79 75
- **Location:** Kepez, Antalya, Turkey

---

## License

All rights reserved © Penta Organizasyon
