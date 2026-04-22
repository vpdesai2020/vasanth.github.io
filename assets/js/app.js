import { initAnimations } from "./animations.js";

const appElement = document.getElementById("app");
const navLinksElement = document.getElementById("nav-links");
const mobileNavLinksElement = document.getElementById("mobile-nav-links");
const footerElement = document.getElementById("site-footer");
const resumeLinkElement = document.getElementById("nav-resume-link");
const brandElement = document.querySelector(".brand");
const navToggleElement = document.getElementById("nav-toggle");
const mobileNavElement = document.getElementById("mobile-nav");
const mobileNavCloseElement = document.getElementById("mobile-nav-close");

const state = {
  cleanupCallbacks: [],
  typewriterTimer: 0,
  sceneObserver: null,
  sceneHandle: null
};

const ICONS = {
  download:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.29a1 1 0 0 1 1.4 1.41l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.41L11 12.59V4a1 1 0 0 1 1-1zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/></svg>',
  mail:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4zm0 2h16l-8 5-8-5zm0 8V9.24l7.46 4.66a1 1 0 0 0 1.08 0L20 9.24V16H4z"/></svg>',
  phone:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79a15.54 15.54 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.31.56 3.58.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.4 21 3 13.6 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.27.19 2.46.56 3.58a1 1 0 0 1-.24 1.01l-2.2 2.2z"/></svg>',
  location:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5.26-7 13-7 13S5 14.26 5 9a7 7 0 0 1 7-7zm0 9.5A2.5 2.5 0 1 0 12 6a2.5 2.5 0 0 0 0 5.5z"/></svg>',
  calendar:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1zm13 8H4v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8zM5 6a1 1 0 0 0-1 1v1h16V7a1 1 0 0 0-1-1H5z"/></svg>',
  arrow:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.17 5.17a1 1 0 0 1 1.41 0l6.25 6.25a1 1 0 0 1 0 1.41l-6.25 6.25a1 1 0 1 1-1.41-1.41L17.71 13H4a1 1 0 1 1 0-2h13.71l-4.54-4.59a1 1 0 0 1 0-1.41z"/></svg>',
  external:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7a1 1 0 1 1-2 0V6.41l-9.29 9.3a1 1 0 0 1-1.42-1.42L17.59 5H14a1 1 0 1 1 0-2zM5 5h5a1 1 0 1 1 0 2H6v11h11v-4a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>',
  linkedin:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>',
  default:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>'
};

function cleanupSite() {
  state.cleanupCallbacks.forEach((cleanup) => cleanup());
  state.cleanupCallbacks = [];

  if (state.typewriterTimer) {
    window.clearTimeout(state.typewriterTimer);
    state.typewriterTimer = 0;
  }

  if (state.sceneObserver) {
    state.sceneObserver.disconnect();
    state.sceneObserver = null;
  }

  if (state.sceneHandle) {
    state.sceneHandle.destroy();
    state.sceneHandle = null;
  }
}

function registerCleanup(callback) {
  state.cleanupCallbacks.push(callback);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function icon(name) {
  return ICONS[name] || ICONS.default;
}

function formatDateRange(startDate, endDate) {
  return `${escapeHtml(startDate)} - ${escapeHtml(endDate)}`;
}

function getCounterParts(value) {
  const match = String(value).match(/^([^0-9]*)([0-9]+\.?[0-9]*)(.*)$/);

  if (!match) {
    return {
      prefix: "",
      number: 0,
      decimals: 0,
      suffix: String(value)
    };
  }

  const num = Number(match[2]);
  const decimals = match[2].includes(".") ? (match[2].split(".")[1] || "").length : 0;
  return {
    prefix: match[1],
    number: num,
    decimals: decimals,
    suffix: match[3]
  };
}

function buildNavItems(profile) {
  return [
    { id: "hero", label: "Home" },
    { id: "about", label: profile.about.title },
    { id: "skills", label: profile.skills.title },
    { id: "experience", label: profile.experience.title },
    { id: "education", label: profile.education.title },
    { id: "certifications", label: profile.certifications.title },
    { id: "awards", label: profile.awards.title },
    { id: "publications", label: profile.publications.title },
    { id: "contact", label: profile.contact.title }
  ];
}

function renderNavLinks(items, mobile = false) {
  return items
    .map(
      (item) => `
        <li>
          <a
            href="#${escapeAttribute(item.id)}"
            data-nav-link="${escapeAttribute(item.id)}"
          >
            <span>${escapeHtml(item.label)}</span>
            ${mobile ? icon("arrow") : ""}
          </a>
        </li>
      `
    )
    .join("");
}

function renderSectionHeader(title, description, kicker) {
  return `
    <div class="section-header reveal">
      <p class="section-kicker">${escapeHtml(kicker)}</p>
      <h2 class="section-title">${escapeHtml(title)}</h2>
      <p class="section-description">${escapeHtml(description)}</p>
    </div>
  `;
}

function renderSocialLink(link) {
  const isExternal = /^https?:\/\//.test(link.url);
  return `
    <li>
      <a
        class="icon-link"
        href="${escapeAttribute(link.url)}"
        ${isExternal ? 'target="_blank" rel="noreferrer"' : ""}
      >
        ${icon(link.icon)}
        <span>${escapeHtml(link.platform)}</span>
      </a>
    </li>
  `;
}

function renderHero(profile) {
  const latestRole = profile.experience.positions[0];
  const latestCertification = profile.certifications.items[0];
  const specialtyList = profile.skills.categories
    .slice(0, 3)
    .map((category) => `<li>${escapeHtml(category.name)}</li>`)
    .join("");

  const socialLinksMarkup = profile.hero.socialLinks.map(renderSocialLink).join("");

  return `
    <section id="hero" class="section hero glass-panel reveal is-visible" data-nav-section="hero">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="section-kicker">${escapeHtml(profile.hero.greeting)}</p>
          <h1 class="hero-title">${escapeHtml(profile.hero.name)}</h1>
          <p class="hero-subtitle">
            <span class="typewriter">
              <span class="sr-only">Current roles</span>
              <span id="typewriter-text" class="typewriter-text">${escapeHtml(profile.hero.roles[0] || "")}</span>
              <span class="cursor" aria-hidden="true"></span>
            </span>
          </p>
          <p class="hero-bio">${escapeHtml(profile.hero.shortBio)}</p>

          <div class="hero-badges">
            ${profile.certifications.items
              .filter((c) => c.badge)
              .map(
                (c) => `
                  <a href="${escapeAttribute(c.credlyUrl || "#")}" target="_blank" rel="noreferrer" title="${escapeAttribute(c.name)}">
                    <img class="hero-badge-img" src="${escapeAttribute(c.badge)}" alt="${escapeAttribute(c.name)}" loading="lazy" width="44" height="44">
                  </a>`
              )
              .join("")}
          </div>

          <div class="hero-meta">
            <div class="meta-pill">
              ${icon("location")}
              <span>${escapeHtml(profile.hero.location)}</span>
            </div>
            <a class="meta-pill" href="mailto:${escapeAttribute(profile.hero.email)}">
              ${icon("mail")}
              <span>${escapeHtml(profile.hero.email)}</span>
            </a>
            <a class="meta-pill" href="https://www.linkedin.com/in/vpdesai/" target="_blank" rel="noreferrer">
              ${icon("linkedin")}
              <span>LinkedIn</span>
            </a>
          </div>

          <div class="hero-actions">
            <a class="button button-primary" href="./${escapeAttribute(profile.meta.resumeFile)}" download>
              ${icon("download")}
              <span>Download Resume</span>
            </a>
            <a class="button button-secondary" href="#contact">
              ${icon("arrow")}
              <span>Contact</span>
            </a>
          </div>
        </div>

        <aside class="hero-panel surface-card reveal" data-delay="1">
          <div class="panel-block">
            <span class="panel-label">Current role</span>
            <span class="panel-strong">${escapeHtml(latestRole.role)}</span>
            <span class="detail-copy">${escapeHtml(latestRole.company)} in ${escapeHtml(latestRole.location)}</span>
          </div>

          <div class="panel-block">
            <span class="panel-label">Latest certification</span>
            <span class="panel-strong">${escapeHtml(latestCertification.name)}</span>
            <span class="detail-copy">${escapeHtml(latestCertification.issuer)}${latestCertification.year ? `, ${escapeHtml(latestCertification.year)}` : ""}</span>
          </div>

          <div class="panel-block">
            <span class="panel-label">Focus areas</span>
            <ul class="hero-list">
              ${specialtyList}
            </ul>
          </div>

          <div class="panel-block">
            <span class="panel-label">Career span</span>
            <span class="detail-copy">
              ${escapeHtml(profile.about.highlightStats[0].value)} of experience across clinical data engineering, automation, and modern cloud platforms.
            </span>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderAbout(profile) {
  const statCards = profile.about.highlightStats
    .map((stat, index) => {
      const counter = getCounterParts(stat.value);
      return `
        <div class="stat-card reveal" data-delay="${(index % 3) + 1}">
          <span
            class="stat-value"
            data-count-prefix="${escapeAttribute(counter.prefix)}"
            data-count-to="${counter.number}"
            data-count-decimals="${counter.decimals}"
            data-count-suffix="${escapeAttribute(counter.suffix)}"
          >
            ${escapeHtml(stat.value)}
          </span>
          <span class="stat-label">${escapeHtml(stat.label)}</span>
        </div>
      `;
    })
    .join("");

  const paragraphs = profile.about.paragraphs
    .map((paragraph) => `<p class="body-copy">${escapeHtml(paragraph)}</p>`)
    .join("");

  return `
    <section id="about" class="section glass-panel" data-nav-section="about">
      ${renderSectionHeader(profile.about.title, "Clinical, regulatory, and engineering background.", "Profile")}
      <div class="about-grid">
        <div class="content-stack reveal">
          ${paragraphs}
          ${profile.about.languages && profile.about.languages.length ? `
            <div class="languages-row">
              <span class="panel-label">Languages</span>
              <div class="chip-list">
                ${profile.about.languages.map(l => `<span class="chip">${escapeHtml(l.name)} <span class="chip-sub">${escapeHtml(l.level)}</span></span>`).join("")}
              </div>
            </div>
          ` : ""}
        </div>
        <div class="stat-grid">
          ${statCards}
        </div>
      </div>
    </section>
  `;
}

function renderSkills(profile) {
  const cards = profile.skills.categories
    .map(
      (category) => `
        <article class="skill-card surface-card">
          <h3>${escapeHtml(category.name)}</h3>
          <ul class="chip-list">
            ${category.items
              .map((item) => `<li class="chip">${escapeHtml(item)}</li>`)
              .join("")}
          </ul>
        </article>
      `
    )
    .join("");

  return `
    <section id="skills" class="section glass-panel" data-nav-section="skills">
      ${renderSectionHeader(profile.skills.title, "Technical depth across clinical programming, cloud, and compliance.", "Capabilities")}
      <div class="skills-carousel">
        <div class="skills-track">
          ${cards}
        </div>
        <div class="skills-track" aria-hidden="true">
          ${cards}
        </div>
      </div>
    </section>
  `;
}

function renderExperience(profile) {
  const items = profile.experience.positions
    .map(
      (position, index) => `
        <div class="timeline-item">
          <article class="timeline-card surface-card reveal" data-reveal="${index % 2 === 0 ? "left" : "right"}">
            <p class="timeline-period">${formatDateRange(position.startDate, position.endDate)}</p>
            <h3 class="timeline-role">${escapeHtml(position.role)}</h3>
            <p class="card-meta">${position.companyUrl ? `<a class="company-link" href="${escapeAttribute(position.companyUrl)}" target="_blank" rel="noreferrer">${escapeHtml(position.company)}</a>` : escapeHtml(position.company)}</p>
            <p class="timeline-location">${escapeHtml(position.location)}</p>
            <ul class="bullet-list">
              ${position.highlights
                .map((highlight) => `<li>${escapeHtml(highlight)}</li>`)
                .join("")}
            </ul>
          </article>
        </div>
      `
    )
    .join("");

  return `
    <section id="experience" class="section glass-panel" data-nav-section="experience">
      ${renderSectionHeader(profile.experience.title, "From bioinformatics research to technical leadership across clinical data platforms.", "Timeline")}
      <div class="timeline">
        ${items}
      </div>
    </section>
  `;
}

function renderEducation(profile) {
  return `
    <section id="education" class="section glass-panel" data-nav-section="education">
      ${renderSectionHeader(profile.education.title, "Biotechnology and bioinformatics foundation.", "Foundation")}
      <div class="card-grid">
        ${profile.education.degrees
          .map(
            (degree, index) => `
              <article class="card-item surface-card reveal" data-delay="${(index % 3) + 1}">
                <p class="eyebrow">${escapeHtml(degree.year)}</p>
                <h3>${escapeHtml(degree.degree)}</h3>
                <p class="detail-copy">${degree.institutionUrl ? `<a class="company-link" href="${escapeAttribute(degree.institutionUrl)}" target="_blank" rel="noreferrer">${escapeHtml(degree.institution)}</a>` : escapeHtml(degree.institution)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderCertifications(profile) {
  const cards = profile.certifications.items
    .map(
      (item) => `
        <article class="cert-card surface-card">
          ${item.badge ? `
            <a class="cert-badge-link" href="${escapeAttribute(item.credlyUrl || "#")}" target="_blank" rel="noreferrer" aria-label="Verify on Credly">
              <img class="cert-badge" src="${escapeAttribute(item.badge)}" alt="${escapeAttribute(item.name)}" loading="lazy" width="120" height="120">
            </a>
          ` : ""}
          <div class="cert-info">
            <p class="eyebrow">${escapeHtml(item.issuer)}</p>
            <h3>${escapeHtml(item.name)}</h3>
            <p class="detail-copy">${item.year ? escapeHtml(item.year) : "Ongoing learning"}</p>
            ${item.credlyUrl ? `<a class="cert-verify" href="${escapeAttribute(item.credlyUrl)}" target="_blank" rel="noreferrer">Verify on Credly →</a>` : ""}
          </div>
        </article>
      `
    )
    .join("");

  return `
    <section id="certifications" class="section glass-panel" data-nav-section="certifications">
      ${renderSectionHeader(profile.certifications.title, "Data engineering, ML, and analytics credentials.", "Credentials")}
      <div class="cert-carousel">
        <div class="cert-track">
          ${cards}
        </div>
        <div class="cert-track" aria-hidden="true">
          ${cards}
        </div>
      </div>
    </section>
  `;
}

function renderAwards(profile) {
  return `
    <section id="awards" class="section glass-panel" data-nav-section="awards">
      ${renderSectionHeader(profile.awards.title, "Delivery, automation, and performance impact.", "Recognition")}
      <div class="card-grid">
        ${profile.awards.items
          .map(
            (item, index) => `
              <article class="card-item surface-card reveal" data-delay="${(index % 3) + 1}">
                <p class="eyebrow">${escapeHtml(item.org)}</p>
                <h3>${escapeHtml(item.title)}</h3>
                <p class="detail-copy">${item.date ? escapeHtml(item.date) : "Date not specified"}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPublications(profile) {
  return `
    <section id="publications" class="section glass-panel" data-nav-section="publications">
      ${renderSectionHeader(profile.publications.title, "Selected research connecting bioinformatics to present-day engineering.", "Research")}
      <div class="card-grid">
        ${profile.publications.items
          .map(
            (item, index) => `
              <article class="card-item surface-card reveal" data-delay="${(index % 3) + 1}">
                <p class="eyebrow">${escapeHtml(item.journal)}</p>
                <h3>${escapeHtml(item.title)}</h3>
                <p class="detail-copy">${item.date ? escapeHtml(item.date) : "Date not specified"}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderContact(profile) {
  return `
    <section id="contact" class="section glass-panel" data-nav-section="contact">
      <div class="contact-grid">
        <div class="content-stack reveal">
          <p class="section-kicker">Connect</p>
          <h2 class="section-title">${escapeHtml(profile.contact.title)}</h2>
          <p class="body-copy">${escapeHtml(profile.contact.intro)}</p>
          <p class="body-copy">${escapeHtml(profile.contact.availability)}</p>
          <div class="contact-actions">
            <a class="button button-primary" href="mailto:${escapeAttribute(profile.hero.email)}">
              ${icon("mail")}
              <span>Email Vasant</span>
            </a>
            <a class="button button-secondary" href="tel:${escapeAttribute(profile.hero.phone.replace(/\s+/g, ""))}">
              ${icon("phone")}
              <span>Call</span>
            </a>
          </div>
        </div>

        <aside class="contact-panel surface-card reveal" data-delay="1">
          <div>
            <p class="eyebrow">Direct contact</p>
            <ul class="contact-list">
              <li>
                <a class="contact-link" href="mailto:${escapeAttribute(profile.hero.email)}">${escapeHtml(profile.hero.email)}</a>
              </li>
              <li>
                <a class="contact-link" href="tel:${escapeAttribute(profile.hero.phone.replace(/\s+/g, ""))}">${escapeHtml(profile.hero.phone)}</a>
              </li>
              <li>${escapeHtml(profile.hero.location)}</li>
            </ul>
          </div>

          <div>
            <p class="eyebrow">Professional profile</p>
            <a class="icon-link" href="https://www.linkedin.com/in/vpdesai/" target="_blank" rel="noreferrer">
              ${icon("linkedin")}
              <span>LinkedIn</span>
            </a>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderFooter(profile) {
  const siteUrl = encodeURIComponent("https://vpdesai2020.github.io");
  const badgeUrl = `https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=${siteUrl}&count_bg=%230a0e1c&title_bg=%230a0e1c&icon=&icon_color=%2300f5d4&title=visitors&edge_flat=true`;

  return `
    <div class="footer-shell">
      <p>${escapeHtml(profile.footer.copyright)}</p>
      <span class="visitor-badge">
        <img src="${badgeUrl}" alt="Visitors" loading="lazy" onerror="this.style.display='none'" />
      </span>
    </div>
  `;
}

function setMetaContent(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.setAttribute("content", value || "");
  }
}

function applySeo(profile) {
  document.title = `${profile.meta.siteTitle} | ${profile.meta.tagline}`;
  setMetaContent("meta-description", profile.hero.shortBio);
  setMetaContent("meta-og-title", profile.meta.siteTitle);
  setMetaContent("meta-og-description", profile.hero.shortBio);
  setMetaContent("meta-og-url", window.location.href);
  setMetaContent("meta-twitter-title", profile.meta.siteTitle);
  setMetaContent("meta-twitter-description", profile.hero.shortBio);
  setMetaContent("meta-og-image", profile.meta.ogImage || "");
  setMetaContent("meta-twitter-image", profile.meta.ogImage || "");
  setMetaContent(
    "meta-twitter-card",
    profile.meta.ogImage ? "summary_large_image" : "summary"
  );

  const faviconElement = document.getElementById("dynamic-favicon");
  if (faviconElement && profile.meta.favicon) {
    faviconElement.setAttribute("href", profile.meta.favicon);
  }
}

function startTypewriter(roles) {
  const textElement = document.getElementById("typewriter-text");

  if (!textElement || !roles.length) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    textElement.textContent = roles[0];
    return;
  }

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  /* Human-like random jitter ±30% around base speed */
  function jitter(base) {
    return base * (0.7 + Math.random() * 0.6);
  }

  function tick() {
    const currentRole = roles[roleIndex];

    if (!isDeleting) {
      charIndex += 1;
      textElement.textContent = currentRole.slice(0, charIndex);

      if (charIndex === currentRole.length) {
        isDeleting = true;
        state.typewriterTimer = window.setTimeout(tick, 2200);
        return;
      }
    } else {
      charIndex -= 1;
      textElement.textContent = currentRole.slice(0, charIndex);

      if (charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        state.typewriterTimer = window.setTimeout(tick, 400);
        return;
      }
    }

    const delay = isDeleting ? jitter(35) : jitter(80);
    state.typewriterTimer = window.setTimeout(tick, delay);
  }

  tick();
}

function closeMobileMenu() {
  mobileNavElement.classList.remove("is-open");
  mobileNavElement.setAttribute("aria-hidden", "true");
  navToggleElement.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

function openMobileMenu() {
  mobileNavElement.classList.add("is-open");
  mobileNavElement.setAttribute("aria-hidden", "false");
  navToggleElement.setAttribute("aria-expanded", "true");
  document.body.classList.add("menu-open");
}

function initNavigation() {
  function onToggleClick() {
    const expanded = navToggleElement.getAttribute("aria-expanded") === "true";
    if (expanded) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function onMobileClick(event) {
    const link = event.target.closest("a");
    if (link) {
      closeMobileMenu();
    }

    if (event.target === mobileNavElement) {
      closeMobileMenu();
    }
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  }

  function onNavClick(event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link) {
      return;
    }

    const target = document.querySelector(link.getAttribute("href"));
    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", link.getAttribute("href"));
  }

  navToggleElement.addEventListener("click", onToggleClick);
  mobileNavCloseElement.addEventListener("click", closeMobileMenu);
  mobileNavElement.addEventListener("click", onMobileClick);
  document.addEventListener("keydown", onKeyDown);
  navLinksElement.addEventListener("click", onNavClick);
  mobileNavLinksElement.addEventListener("click", onNavClick);

  registerCleanup(() => {
    navToggleElement.removeEventListener("click", onToggleClick);
    mobileNavCloseElement.removeEventListener("click", closeMobileMenu);
    mobileNavElement.removeEventListener("click", onMobileClick);
    document.removeEventListener("keydown", onKeyDown);
    navLinksElement.removeEventListener("click", onNavClick);
    mobileNavLinksElement.removeEventListener("click", onNavClick);
  });
}

function initSceneObserver() {
  const heroSection = document.getElementById("hero");
  const canvas = document.getElementById("helix-canvas");

  if (!heroSection || !canvas) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    document.body.classList.add("scene-fallback");
    return;
  }

  state.sceneObserver = new IntersectionObserver(
    async (entries) => {
      const [entry] = entries;

      if (!entry || !entry.isIntersecting || state.sceneHandle) {
        return;
      }

      state.sceneObserver.disconnect();
      state.sceneObserver = null;

      try {
        const module = await import("./three-scene.js");
        state.sceneHandle = await module.initThreeScene({
          canvas,
          prefersReducedMotion: false
        });
      } catch {
        document.body.classList.add("scene-fallback");
      }
    },
    {
      rootMargin: "500px 0px",
      threshold: 0
    }
  );

  state.sceneObserver.observe(heroSection);
}

function renderSite(profile) {
  const navItems = buildNavItems(profile);

  navLinksElement.innerHTML = renderNavLinks(navItems);
  mobileNavLinksElement.innerHTML = renderNavLinks(navItems, true);
  appElement.innerHTML = [
    renderHero(profile),
    renderAbout(profile),
    renderSkills(profile),
    renderExperience(profile),
    renderEducation(profile),
    renderCertifications(profile),
    renderAwards(profile),
    renderPublications(profile),
    renderContact(profile)
  ].join("");
  footerElement.innerHTML = renderFooter(profile);

  resumeLinkElement.setAttribute("href", `./${profile.meta.resumeFile}`);
  brandElement.textContent = profile.meta.siteTitle;
  applySeo(profile);
}

function renderError(error) {
  const runningFromFile = window.location.protocol === "file:";
  const note = runningFromFile
    ? "This usually happens when opening the site directly from the file system. Serve the folder with a small static server so fetch() can read data/profile.json."
    : "Check that data/profile.json exists and is valid JSON, then try again.";

  appElement.innerHTML = `
    <section class="error-shell glass-panel">
      <p class="section-kicker">Load error</p>
      <h1>The portfolio data could not be loaded.</h1>
      <p>${escapeHtml(note)}</p>
      <p class="detail-copy">${escapeHtml(error.message || "Unknown error")}</p>
      <div class="error-actions">
        <button class="button button-primary" id="retry-button" type="button">
          ${icon("arrow")}
          <span>Retry</span>
        </button>
      </div>
    </section>
  `;

  const retryButton = document.getElementById("retry-button");
  if (retryButton) {
    retryButton.addEventListener("click", bootstrap, { once: true });
  }
}

async function loadProfile() {
  const response = await fetch("./data/profile.json", {
    cache: "no-cache"
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Auto-compute total years of experience from the earliest position startDate.
 * Parses "Mon YYYY" format, calculates monthly precision.
 * - Stats card: precise decimal (7.6+) — data visualization needs accuracy
 * - Prose (bio, paragraphs, meta): rounded whole number (7+) — reads naturally
 */
function computeExperienceYears(profile) {
  const monthMap = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const positions = profile.experience && profile.experience.positions;
  if (!positions || !positions.length) return;

  // Find the earliest start date
  let earliest = Infinity;
  for (const pos of positions) {
    const parts = (pos.startDate || "").split(" ");
    if (parts.length === 2 && monthMap[parts[0]] !== undefined) {
      const d = new Date(Number(parts[1]), monthMap[parts[0]], 1);
      if (d.getTime() < earliest) earliest = d.getTime();
    }
  }
  if (earliest === Infinity) return;

  const now = new Date();
  const startDate = new Date(earliest);
  const totalMonths = (now.getFullYear() - startDate.getFullYear()) * 12
    + (now.getMonth() - startDate.getMonth());
  if (totalMonths < 12) return;

  // Precise decimal for stats card (7.6+)
  const precise = Math.floor((totalMonths / 12) * 10) / 10;
  // Rounded whole number for prose (7+)
  const rounded = Math.floor(totalMonths / 12);

  const preciseTag = `${precise}+`;
  const roundedTag = `${rounded}+`;
  const yearsRegex = /[\d.]+\+\s*years/g;

  // Prose: use rounded (7+) — reads naturally in sentences
  if (profile.hero && profile.hero.shortBio) {
    profile.hero.shortBio = profile.hero.shortBio.replace(yearsRegex, `${roundedTag} years`);
  }
  if (profile.about && profile.about.paragraphs) {
    profile.about.paragraphs = profile.about.paragraphs.map(
      (p) => p.replace(yearsRegex, `${roundedTag} years`)
    );
  }

  // Stats card: use precise decimal (7.6+) — data needs accuracy
  if (profile.about && profile.about.highlightStats && profile.about.highlightStats.length) {
    const yearsStat = profile.about.highlightStats.find(
      (s) => /years?\s*experience/i.test(s.label)
    );
    if (yearsStat) yearsStat.value = preciseTag;
  }
}

async function bootstrap() {
  cleanupSite();

  try {
    const profile = await loadProfile();
    computeExperienceYears(profile);
    renderSite(profile);
    initNavigation();
    registerCleanup(initAnimations());
    startTypewriter(profile.hero.roles || []);
    initSceneObserver();
    initBackToTop();
    closeMobileMenu();
  } catch (error) {
    renderError(error);
  }
}

function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 600) {
        btn.classList.add("is-visible");
      } else {
        btn.classList.remove("is-visible");
      }
      ticking = false;
    });
  }

  function onClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", onClick);
  registerCleanup(() => {
    window.removeEventListener("scroll", onScroll);
    btn.removeEventListener("click", onClick);
  });
}

bootstrap();
