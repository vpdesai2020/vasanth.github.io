function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function formatCounterValue(element, currentValue) {
  const prefix = element.dataset.countPrefix || "";
  const suffix = element.dataset.countSuffix || "";
  const decimals = Number(element.dataset.countDecimals || "0");
  const display = decimals > 0 ? currentValue.toFixed(decimals) : String(currentValue);
  return `${prefix}${display}${suffix}`;
}

function setCounterToFinal(element) {
  const target = Number(element.dataset.countTo || "0");
  element.textContent = formatCounterValue(element, target);
}

function animateCounter(element) {
  const target = Number(element.dataset.countTo || "0");
  if (!target || element.dataset.countAnimated === "true") {
    setCounterToFinal(element);
    return;
  }

  element.dataset.countAnimated = "true";
  const decimals = Number(element.dataset.countDecimals || "0");
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = easeOutCubic(progress);
    const current = decimals > 0
      ? Math.round(target * eased * Math.pow(10, decimals)) / Math.pow(10, decimals)
      : Math.round(target * eased);
    element.textContent = formatCounterValue(element, current);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      setCounterToFinal(element);
    }
  }

  requestAnimationFrame(tick);
}

function initRevealObserver(reducedMotion) {
  const revealElements = [...document.querySelectorAll(".reveal")];

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return () => {};
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.18
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));

  return () => revealObserver.disconnect();
}

function initCounterObserver(reducedMotion) {
  const counters = [...document.querySelectorAll("[data-count-to]")];

  if (reducedMotion || !("IntersectionObserver" in window)) {
    counters.forEach(setCounterToFinal);
    return () => {};
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.55
    }
  );

  counters.forEach((counter) => counterObserver.observe(counter));

  return () => counterObserver.disconnect();
}

function initActiveSectionObserver() {
  const navLinks = [...document.querySelectorAll("[data-nav-link]")];
  const sections = [...document.querySelectorAll("section[data-nav-section]")];

  if (!navLinks.length || !sections.length) {
    return () => {};
  }

  const setActiveLink = (sectionId) => {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.navLink === sectionId);
      link.setAttribute(
        "aria-current",
        link.dataset.navLink === sectionId ? "page" : "false"
      );
    });
  };

  if (!("IntersectionObserver" in window)) {
    setActiveLink(sections[0].id);
    return () => {};
  }

  const navObserver = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

      if (visibleSections[0]) {
        setActiveLink(visibleSections[0].target.id);
      }
    },
    {
      rootMargin: "-42% 0px -42% 0px",
      threshold: [0.15, 0.4, 0.7]
    }
  );

  sections.forEach((section) => navObserver.observe(section));
  setActiveLink(window.location.hash.replace("#", "") || sections[0].id);

  return () => navObserver.disconnect();
}

export function initAnimations() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cleanups = [
    initRevealObserver(reducedMotion),
    initCounterObserver(reducedMotion),
    initActiveSectionObserver()
  ];

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
