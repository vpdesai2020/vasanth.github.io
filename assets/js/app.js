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
  cleanupCallbacks: []
};

const ICONS = {
  download:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.29a1 1 0 0 1 1.4 1.41l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.41L11 12.59V4a1 1 0 0 1 1-1zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/></svg>',
  mail:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4zm0 2h16l-8 5-8-5zm0 8V9.24l7.46 4.66a1 1 0 0 0 1.08 0L20 9.24V16H4z"/></svg>',
  phone:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79a15.54 15.54 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.31.56 3.58.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.4 21 3 13.6 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.27.19 2.46.56 3.58a1 1 0 0 1-.24 1.01l-2.2 2.2z"/></svg>',
  arrow:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.17 5.17a1 1 0 0 1 1.41 0l6.25 6.25a1 1 0 0 1 0 1.41l-6.25 6.25a1 1 0 1 1-1.41-1.41L17.71 13H4a1 1 0 1 1 0-2h13.71l-4.54-4.59a1 1 0 0 1 0-1.41z"/></svg>',
  linkedin:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>'
};

function cleanupSite() {
  state.cleanupCallbacks.forEach((cleanup) => cleanup());
  state.cleanupCallbacks = [];

}

function registerCleanup(callback) {
  state.cleanupCallbacks.push(callback);
}

function preferredScrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
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
  return ICONS[name] || "";
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
    { id: "projects", label: profile.projects.title },
    { id: "experience", label: profile.experience.title },
    { id: "certifications", label: profile.certifications.title },
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

function renderHero(profile) {
  const latestRole = profile.experience.positions[0];
  const [primaryRole, leadershipRole] = latestRole.role.split(" | ");
  const proofStats = profile.about.highlightStats
    .slice(0, 3)
    .map(
      (stat) => `
        <li>
          <strong>${escapeHtml(stat.value)}</strong>
          <span>${escapeHtml(stat.label)}</span>
        </li>
      `
    )
    .join("");

  return `
    <section id="hero" class="section hero reveal is-visible" data-nav-section="hero">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="hero-eyebrow">Clinical data engineering · ${escapeHtml(profile.hero.location)}</p>
          <h1 class="hero-title">${escapeHtml(profile.hero.name)}</h1>
          <div class="hero-position">
            <p class="hero-role">${escapeHtml(primaryRole)}</p>
            <p class="hero-company">${escapeHtml(leadershipRole || "Technical Lead")} · ${escapeHtml(latestRole.company)}</p>
          </div>
          <p class="hero-bio hero-bio-wide">I lead teams that turn complex clinical data into reliable, submission-ready systems across Python, cloud, and CDISC workflows.</p>
          <p class="hero-bio hero-bio-compact">I lead teams delivering reliable, submission-ready clinical data systems.</p>

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

          <ul class="hero-proof" aria-label="Career highlights">
            ${proofStats}
          </ul>
        </div>

        <aside class="pipeline-visual reveal" data-delay="1" aria-label="Clinical data delivery pipeline">
          <div class="pipeline-header">
            <span>Clinical data delivery system</span>
            <span class="pipeline-status"><i></i> Validated</span>
          </div>
          <details class="pipeline-details" open>
            <summary><span>Explore all stages</span><span>5-stage workflow</span></summary>
            <ol class="pipeline-flow">
              <li><span class="pipeline-index">01</span><div><strong>Capture</strong><small>EDC · CDMS · Documents</small></div></li>
              <li><span class="pipeline-index">02</span><div><strong>Quality</strong><small>Validation · Reconciliation</small></div></li>
              <li><span class="pipeline-index">03</span><div><strong>Standardize</strong><small>SDTM · ADaM · Metadata</small></div></li>
              <li><span class="pipeline-index">04</span><div><strong>Platform</strong><small>AWS · Iceberg · Databricks</small></div></li>
              <li><span class="pipeline-index">05</span><div><strong>Deliver</strong><small>Reporting · Submission · APIs</small></div></li>
            </ol>
          </details>
          <div class="pipeline-footer">
            <span>GxP</span><span>ALCOA+</span><span>ICH-GCP</span><span>21 CFR Part 11</span>
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

  const [leadParagraph, ...supportingParagraphs] = profile.about.paragraphs;
  const supportingCopy = supportingParagraphs
    .map((paragraph) => `<p class="body-copy">${escapeHtml(paragraph)}</p>`)
    .join("");
  const languages = profile.about.languages && profile.about.languages.length ? `
    <div class="languages-row">
      <span class="panel-label">Languages</span>
      <div class="chip-list">
        ${profile.about.languages.map((language) => `<span class="chip">${escapeHtml(language.name)} <span class="chip-sub">${escapeHtml(language.level)}</span></span>`).join("")}
      </div>
    </div>
  ` : "";

  return `
    <section id="about" class="section glass-panel" data-nav-section="about">
      ${renderSectionHeader(profile.about.title, "Clinical, regulatory, and engineering background.", "Profile")}
      <div class="about-grid">
        <div class="content-stack reveal">
          <p class="body-copy">${escapeHtml(leadParagraph)}</p>
          <details class="responsive-details" open>
            <summary>Background and languages</summary>
            <div class="responsive-details-body">
              ${supportingCopy}
              ${languages}
            </div>
          </details>
        </div>
        <div class="stat-grid">
          ${statCards}
        </div>
      </div>
    </section>
  `;
}

function renderSkills(profile) {
  const rows = profile.skills.categories
    .map(
      (category, index) => `
        <details class="competency-row reveal" open>
          <summary>
            <span class="competency-index">0${index + 1}</span>
            <h3>${escapeHtml(category.name)}</h3>
          </summary>
          <div class="competency-body">
            <p>${escapeHtml(category.evidence)}</p>
            <ul>
              ${category.items
                .map((item) => `<li class="chip">${escapeHtml(item)}</li>`)
                .join("")}
            </ul>
          </div>
        </details>
      `
    )
    .join("");

  return `
    <section id="skills" class="section glass-panel" data-nav-section="skills">
      ${renderSectionHeader(profile.skills.title, "Technical capabilities demonstrated through regulated data delivery.", "Capability evidence")}
      <div class="competency-matrix">
        <div class="competency-header" aria-hidden="true">
          <span>Area</span>
          <div class="competency-header-body">
            <span>Delivery evidence</span>
            <span>Methods and tools</span>
          </div>
        </div>
        ${rows}
      </div>
    </section>
  `;
}

function renderProjects(profile) {
  const projectTabs = profile.projects.items
    .map(
      (project, index) => `
        <button
          class="project-tab${index === 0 ? " is-active" : ""}"
          id="project-tab-${index}"
          type="button"
          role="tab"
          aria-selected="${index === 0 ? "true" : "false"}"
          aria-controls="project-panel-${index}"
          tabindex="${index === 0 ? "0" : "-1"}"
        >
          <span class="project-tab-index">0${index + 1}</span>
          <span class="project-tab-copy">
            <strong>${escapeHtml(project.title)}</strong>
            <small>${escapeHtml(project.context)}</small>
          </span>
          ${icon("arrow")}
        </button>
      `
    )
    .join("");

  const projectPanels = profile.projects.items
    .map(
      (project, index) => `
        <article
          class="project-panel"
          id="project-panel-${index}"
          role="tabpanel"
          aria-labelledby="project-tab-${index}"
          ${index === 0 ? "" : "hidden"}
        >
          <div class="project-panel-heading">
            <p class="eyebrow">Project 0${index + 1}</p>
            <h3>${escapeHtml(project.title)}</h3>
            <p class="detail-copy">${escapeHtml(project.context)}</p>
          </div>
          <div class="project-story">
            <div>
              <span class="project-label">Challenge</span>
              <p class="detail-copy">${escapeHtml(project.challenge)}</p>
            </div>
            <div>
              <span class="project-label">Approach</span>
              <p class="detail-copy">${escapeHtml(project.approach)}</p>
            </div>
          </div>
          <ul class="outcome-list">
            ${project.outcomes.map((outcome) => `<li>${escapeHtml(outcome)}</li>`).join("")}
          </ul>
          <ul class="project-tech" aria-label="Technologies used">
            ${project.technologies.map((technology) => `<li class="chip">${escapeHtml(technology)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
  const projectOptions = profile.projects.items
    .map((project, index) => `<option value="${index}">${escapeHtml(project.title)}</option>`)
    .join("");

  return `
    <section id="projects" class="section glass-panel" data-nav-section="projects">
      ${renderSectionHeader(profile.projects.title, profile.projects.intro, "Case studies")}
      <div class="project-explorer reveal">
        <label class="project-picker" for="project-select">
          <span>Choose a case study</span>
          <select id="project-select">${projectOptions}</select>
        </label>
        <div class="project-tabs" role="tablist" aria-label="Selected impact studies">
          ${projectTabs}
        </div>
        <div class="project-panels">
          ${projectPanels}
        </div>
      </div>
    </section>
  `;
}

function renderExperience(profile) {
  const items = profile.experience.positions
    .map((position) => {
      const [leadHighlight, ...additionalHighlights] = position.highlights;
      const [roleTitle, roleTrack] = position.role.split(" | ");
      return `
        <div class="timeline-item">
          <article class="timeline-card reveal">
            <div class="experience-meta">
              <p class="timeline-period">${formatDateRange(position.startDate, position.endDate)}</p>
              <p class="card-meta">${position.companyUrl ? `<a class="company-link" href="${escapeAttribute(position.companyUrl)}" target="_blank" rel="noreferrer">${escapeHtml(position.company)}</a>` : escapeHtml(position.company)}</p>
              <p class="timeline-location">${escapeHtml(position.location)}</p>
            </div>
            <div class="experience-title">
              <h3 class="timeline-role">
                <span>${escapeHtml(roleTitle)}</span>
                ${roleTrack ? `<span class="role-track">${escapeHtml(roleTrack)}</span>` : ""}
              </h3>
            </div>
            <div class="experience-evidence">
              <p class="timeline-lead">${escapeHtml(leadHighlight)}</p>
              ${additionalHighlights.length ? `
                <details class="timeline-details" open>
                  <summary>More contributions</summary>
                  <ul class="bullet-list">
                    ${additionalHighlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("")}
                  </ul>
                </details>
              ` : ""}
            </div>
          </article>
        </div>
      `;
    });
  const recentItems = items.slice(0, 2).join("");
  const earlierItems = items.slice(2).join("");

  return `
    <section id="experience" class="section glass-panel" data-nav-section="experience">
      ${renderSectionHeader(profile.experience.title, "From bioinformatics research to technical leadership across clinical data platforms.", "Timeline")}
      <div class="timeline">
        ${recentItems}
        ${earlierItems ? `
          <details class="earlier-roles" open>
            <summary>View ${items.length - 2} earlier roles</summary>
            <div class="timeline-earlier">${earlierItems}</div>
          </details>
        ` : ""}
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
          <span class="cert-mark" aria-hidden="true">${escapeHtml(item.issuer === "AWS" ? "AWS" : item.issuer.slice(0, 2).toUpperCase())}</span>
          <div class="cert-info">
            <p class="eyebrow">${escapeHtml(item.issuer)}</p>
            <h3>${escapeHtml(item.name)}</h3>
            ${item.year ? `<p class="detail-copy">${escapeHtml(item.year)}</p>` : ""}
            ${item.credlyUrl ? `<a class="cert-verify" href="${escapeAttribute(item.credlyUrl)}" target="_blank" rel="noreferrer">Verify on Credly →</a>` : ""}
          </div>
        </article>
      `
    );
  const featuredCards = cards.slice(0, 2).join("");
  const additionalCards = cards.slice(2).join("");

  return `
    <section id="certifications" class="section glass-panel" data-nav-section="certifications">
      ${renderSectionHeader(profile.certifications.title, "Data engineering, ML, and analytics credentials.", "Credentials")}
      <div class="certifications-list">
        <div class="cert-grid">${featuredCards}</div>
        ${additionalCards ? `
          <details class="mobile-collection cert-more" open>
            <summary>View ${cards.length - 2} additional certifications</summary>
            <div class="cert-grid">${additionalCards}</div>
          </details>
        ` : ""}
      </div>
    </section>
  `;
}

function renderAwards(profile) {
  return `
    <section id="awards" class="section glass-panel" data-nav-section="awards">
      ${renderSectionHeader(profile.awards.title, "Delivery, automation, and performance impact.", "Recognition")}
      <details class="mobile-collection" open>
        <summary>View ${profile.awards.items.length} awards</summary>
        <div class="card-grid">
          ${profile.awards.items
          .map(
            (item, index) => `
              <article class="card-item surface-card reveal" data-delay="${(index % 3) + 1}">
                <p class="eyebrow">${escapeHtml(item.org)}</p>
                <h3>${escapeHtml(item.title)}</h3>
                ${item.date ? `<p class="detail-copy">${escapeHtml(item.date)}</p>` : ""}
              </article>
            `
          )
            .join("")}
          </div>
          </details>
    </section>
  `;
}

function renderPublications(profile) {
  return `
    <section id="publications" class="section glass-panel" data-nav-section="publications">
      ${renderSectionHeader(profile.publications.title, "Selected bioinformatics research and publications.", "Research")}
      <div class="card-grid">
        ${profile.publications.items
          .map(
            (item, index) => `
              <article class="card-item surface-card reveal" data-delay="${(index % 3) + 1}">
                <p class="eyebrow">${escapeHtml(item.journal)}</p>
                <h3>${escapeHtml(item.title)}</h3>
                ${item.date ? `<p class="detail-copy">${escapeHtml(item.date)}</p>` : ""}
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
  return `
    <div class="footer-shell">
      <p>${escapeHtml(profile.footer.copyright)}</p>
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

function closeMobileMenu(restoreFocus = true) {
  const wasOpen = mobileNavElement.classList.contains("is-open");
  mobileNavElement.classList.remove("is-open");
  mobileNavElement.setAttribute("aria-hidden", "true");
  mobileNavElement.setAttribute("inert", "");
  navToggleElement.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");

  if (wasOpen && restoreFocus) {
    navToggleElement.focus();
  }
}

function openMobileMenu() {
  mobileNavElement.classList.add("is-open");
  mobileNavElement.setAttribute("aria-hidden", "false");
  mobileNavElement.removeAttribute("inert");
  navToggleElement.setAttribute("aria-expanded", "true");
  document.body.classList.add("menu-open");
  mobileNavCloseElement.focus();
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
      closeMobileMenu(false);
    }

    if (event.target === mobileNavElement) {
      closeMobileMenu();
    }
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      closeMobileMenu();
      return;
    }

    if (event.key === "Tab" && mobileNavElement.classList.contains("is-open")) {
      const focusableElements = [
        ...mobileNavElement.querySelectorAll('a[href], button:not([disabled])')
      ];
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
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
    document.dispatchEvent(new CustomEvent("portfolio:navigate", {
      detail: { sectionId: target.id }
    }));
    target.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
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

function initProjectTabs() {
  const tabList = document.querySelector(".project-tabs");
  if (!tabList) {
    return;
  }

  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const projectSelect = document.getElementById("project-select");

  function activateTab(nextTab, moveFocus = false) {
    tabs.forEach((tab) => {
      const isActive = tab === nextTab;
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      if (panel) panel.hidden = !isActive;
    });

    if (moveFocus) nextTab.focus();
    if (projectSelect) projectSelect.value = String(tabs.indexOf(nextTab));
  }

  function onClick(event) {
    const tab = event.target.closest('[role="tab"]');
    if (tab) activateTab(tab);
  }

  function onKeyDown(event) {
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    activateTab(tabs[nextIndex], true);
  }

  tabList.addEventListener("click", onClick);
  tabList.addEventListener("keydown", onKeyDown);
  function onSelectChange() {
    activateTab(tabs[Number(projectSelect.value)] || tabs[0]);
  }
  projectSelect?.addEventListener("change", onSelectChange);
  registerCleanup(() => {
    tabList.removeEventListener("click", onClick);
    tabList.removeEventListener("keydown", onKeyDown);
    projectSelect?.removeEventListener("change", onSelectChange);
  });
}

function initResponsiveDetails() {
  const compactViewport = window.matchMedia("(max-width: 900px)");
  const phoneViewport = window.matchMedia("(max-width: 640px)");
  const aboutDetails = document.querySelector(".responsive-details");
  const pipelineDetails = document.querySelector(".pipeline-details");
  const earlierRoles = document.querySelector(".earlier-roles");
  const mobileCollections = [...document.querySelectorAll(".mobile-collection")];
  const timelineDetails = [...document.querySelectorAll(".timeline-details")];
  const competencyDetails = [...document.querySelectorAll(".competency-row")];

  function syncDetails() {
    const compact = compactViewport.matches;
    if (aboutDetails) aboutDetails.open = !compact;
    if (pipelineDetails) pipelineDetails.open = !phoneViewport.matches;
    if (earlierRoles) earlierRoles.open = !phoneViewport.matches;
    mobileCollections.forEach((details) => { details.open = !phoneViewport.matches; });
    timelineDetails.forEach((details) => { details.open = !compact; });
    competencyDetails.forEach((details, index) => {
      details.open = !compact || index === 0;
    });
  }

  syncDetails();
  compactViewport.addEventListener("change", syncDetails);
  phoneViewport.addEventListener("change", syncDetails);
  registerCleanup(() => {
    compactViewport.removeEventListener("change", syncDetails);
    phoneViewport.removeEventListener("change", syncDetails);
  });
}

function renderSite(profile) {
  const navItems = buildNavItems(profile);

  navLinksElement.innerHTML = renderNavLinks(navItems);
  mobileNavLinksElement.innerHTML = renderNavLinks(navItems, true);
  appElement.innerHTML = [
    renderHero(profile),
    renderAbout(profile),
    renderSkills(profile),
    renderProjects(profile),
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
  const response = await fetch("./data/profile.json");

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function bootstrap() {
  cleanupSite();

  try {
    const profile = await loadProfile();
    renderSite(profile);
    initNavigation();
    initProjectTabs();
    initResponsiveDetails();
    registerCleanup(initAnimations());
    initBackToTop();
    closeMobileMenu(false);
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
    window.scrollTo({ top: 0, behavior: preferredScrollBehavior() });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", onClick);
  registerCleanup(() => {
    window.removeEventListener("scroll", onScroll);
    btn.removeEventListener("click", onClick);
  });
}

bootstrap();
