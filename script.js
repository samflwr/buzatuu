(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const transitionLayer = document.querySelector(".transition-layer");
  let lenisInstance;

  const setActiveNav = () => {
    const pathname = window.location.pathname;
    let activeKey = "home";
    if (pathname.includes("/work")) activeKey = "work";
    if (pathname.includes("/photography")) activeKey = "photography";
    if (pathname.includes("/about")) activeKey = "about";
    if (pathname.includes("/tutorials")) activeKey = "tutorials";
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const key = link.dataset.nav;
      if (key === activeKey) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const initPreloader = () => {
    const preloader = document.querySelector(".preloader");
    if (!preloader) {
      return;
    }

    const progressBar = preloader.querySelector(".preloader-bar span");
    const countEl = preloader.querySelector(".preloader-count");
    const statusEl = preloader.querySelector(".preloader-status");
    let cached = false;
    try {
      cached = sessionStorage.getItem("buzatu_loaded") === "true";
    } catch (err) {
      cached = false;
    }

    if (cached) {
      preloader.classList.add("is-hidden");
      return;
    }

    body.classList.add("is-loading");
    let progress = 0;
    let rafId;
    let finished = false;

    const updateUI = (value) => {
      const clamped = Math.min(100, Math.max(0, value));
      if (progressBar) {
        progressBar.style.transform = `scaleX(${clamped / 100})`;
      }
      if (countEl) {
        countEl.textContent = `${Math.round(clamped)}%`;
      }
      if (statusEl) {
        if (clamped < 40) {
          statusEl.textContent = "calibrating";
        } else if (clamped < 70) {
          statusEl.textContent = "aligning";
        } else if (clamped < 95) {
          statusEl.textContent = "charging";
        } else {
          statusEl.textContent = "ready";
        }
      }
    };

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      progress = 100;
      updateUI(progress);
      try {
        sessionStorage.setItem("buzatu_loaded", "true");
      } catch (err) {
        // ignore storage errors
      }
      setTimeout(() => {
        preloader.classList.add("is-hidden");
        body.classList.remove("is-loading");
        setTimeout(() => {
          if (preloader && preloader.parentElement) {
            preloader.remove();
          }
        }, 700);
      }, 450);
    };

    const tick = () => {
      progress = Math.min(progress + Math.random() * 6, 96);
      updateUI(progress);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const complete = () => {
      cancelAnimationFrame(rafId);
      finish();
    };

    window.addEventListener("load", complete, { once: true });
    window.addEventListener("pageshow", complete, { once: true });

    setTimeout(() => {
      cancelAnimationFrame(rafId);
      finish();
    }, 4200);

    if (document.readyState === "complete") {
      complete();
    }
  };

  const initLenis = () => {
    if (prefersReduced || !window.Lenis || lenisInstance) {
      return;
    }
    lenisInstance = new window.Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });

    const raf = (time) => {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  };

  const initCursor = () => {
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring || prefersReduced || !window.matchMedia("(hover: hover)").matches) {
      return;
    }

    let targetX = 0;
    let targetY = 0;

    const moveCursor = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.left = `${targetX}px`;
      dot.style.top = `${targetY}px`;
      if (window.gsap) {
        window.gsap.to(ring, {
          left: targetX,
          top: targetY,
          duration: 0.2,
          ease: "power3.out",
        });
      } else {
        ring.style.left = `${targetX}px`;
        ring.style.top = `${targetY}px`;
      }
    };

    document.addEventListener("mousemove", moveCursor);
    body.classList.add("cursor-ready");
  };

  const bindCursorTargets = (scope = document) => {
    const targets = scope.querySelectorAll(
      "a, button, .gallery-item, .work-card, .project-card, .result-card, .lesson-card, .tutorial-card"
    );
    targets.forEach((target) => {
      if (target.dataset.cursorBound) {
        return;
      }
      target.dataset.cursorBound = "true";
      target.addEventListener("mouseenter", () => body.classList.add("cursor-hover"));
      target.addEventListener("mouseleave", () => body.classList.remove("cursor-hover"));
    });
  };

  const initNav = () => {
    const toggle = document.querySelector(".nav-toggle");
    const overlay = document.querySelector(".nav-overlay");
    const closeBtn = document.querySelector(".nav-close");

    if (!toggle || !overlay) {
      return;
    }

    const openNav = () => {
      body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      overlay.setAttribute("aria-hidden", "false");
    };

    const closeNav = () => {
      body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      overlay.setAttribute("aria-hidden", "true");
    };

    toggle.addEventListener("click", () => {
      if (body.classList.contains("nav-open")) {
        closeNav();
      } else {
        openNav();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeNav);
    }

    overlay.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeNav();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNav();
      }
    });
  };

  const initScrollUI = () => {
    const progressBar = document.querySelector(".scroll-progress span");
    const scrollTopBtn = document.querySelector(".scroll-top");

    if (!progressBar && !scrollTopBtn) {
      return;
    }

    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? window.scrollY / height : 0;
      if (progressBar) {
        progressBar.style.transform = `scaleX(${progress})`;
      }
      if (scrollTopBtn) {
        if (window.scrollY > 400) {
          scrollTopBtn.classList.add("is-visible");
        } else {
          scrollTopBtn.classList.remove("is-visible");
        }
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    if (scrollTopBtn) {
      scrollTopBtn.addEventListener("click", () => {
        if (lenisInstance) {
          lenisInstance.scrollTo(0, { immediate: false });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }
  };

  const showToast = (message) => {
    const toast = document.querySelector(".toast");
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2400);
  };

  const initNewsletter = () => {
    document.querySelectorAll(".footer-form").forEach((form) => {
      if (form.dataset.bound) {
        return;
      }
      form.dataset.bound = "true";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("input");
        if (input) {
          input.value = "";
        }
        showToast("signal received. welcome to the archive.");
      });
    });
  };

  const loadFlexSearch = () => {
    if (window.FlexSearch) {
      return Promise.resolve();
    }
    if (window.__flexsearchLoading) {
      return window.__flexsearchLoading;
    }
    window.__flexsearchLoading = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/flexsearch@0.7.43/dist/flexsearch.bundle.min.js";
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
    return window.__flexsearchLoading;
  };

  const loadPrism = () => {
    if (window.Prism) {
      return Promise.resolve();
    }
    if (window.__prismLoading) {
      return window.__prismLoading;
    }
    window.__prismLoading = new Promise((resolve) => {
      const core = document.createElement("script");
      core.src = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js";
      core.onload = () => {
        const auto = document.createElement("script");
        auto.src = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js";
        auto.onload = () => {
          if (window.Prism && window.Prism.plugins && window.Prism.plugins.autoloader) {
            window.Prism.plugins.autoloader.languages_path =
              "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/";
          }
          resolve();
        };
        auto.onerror = () => resolve();
        document.head.appendChild(auto);
      };
      core.onerror = () => resolve();
      document.head.appendChild(core);
    });
    return window.__prismLoading;
  };

  const initTutorialSearch = (scope = document) => {
    const input = scope.querySelector("#tutorial-search");
    const resultsEl = scope.querySelector("#tutorial-results");
    const countEl = scope.querySelector("#tutorial-count");
    const filterButtons = Array.from(scope.querySelectorAll(".search-filters .filter-btn"));
    const searchForm = input ? input.closest("form") : null;

    if (!input || !resultsEl) {
      return;
    }
    if (input.dataset.bound) {
      return;
    }
    input.dataset.bound = "true";

    let records = [];
    let index;
    let activeFilter = "all";
    const languageLabel = {
      cpp: "c++",
      java: "java",
      python: "python",
      sql: "sql",
    };
    const allowedFilters = new Set(["all", ...Object.keys(languageLabel)]);

    const formatTags = (tags = []) => tags.map((tag) => `<span class="tag">${tag}</span>`).join("");

    const setFilterState = (value) => {
      filterButtons.forEach((btn) => {
        const isActive = (btn.dataset.filter || "all") === value;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    };

    const syncUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const query = input.value.trim();
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      if (activeFilter !== "all") {
        params.set("lang", activeFilter);
      } else {
        params.delete("lang");
      }
      const newQuery = params.toString();
      const basePath = window.location.pathname.replace(/\\/index\\.html$/, "/");
      const nextUrl = `${basePath}${newQuery ? `?${newQuery}` : ""}`;
      window.history.replaceState(null, "", nextUrl);
    };

    const applyUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("q");
      const lang = params.get("lang");
      if (query) {
        input.value = query;
      }
      if (lang && allowedFilters.has(lang)) {
        activeFilter = lang;
      }
      setFilterState(activeFilter);
    };

    const render = (items) => {
      if (!items.length) {
        resultsEl.innerHTML = '<div class="result-empty">nessun risultato. prova con "array", "classi", "join".</div>';
      } else {
        resultsEl.innerHTML = items
          .map(
            (item) => `
            <article class="result-card" data-language="${item.language}">
              <p class="result-meta">${languageLabel[item.language] || item.language} · ${item.level} · ${item.duration}</p>
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <div class="result-tags">${formatTags(item.tags)}</div>
              <a class="text-link" href="${item.url}">apri tutorial</a>
            </article>
          `
          )
          .join("");
      }
      bindCursorTargets(resultsEl);
      if (countEl) {
        countEl.textContent = `${items.length} tutorial trovati`;
      }
    };

    const applyFilter = (items) => {
      if (activeFilter === "all") {
        return items;
      }
      return items.filter((item) => item.language === activeFilter);
    };

    const runSearch = () => {
      const query = input.value.trim().toLowerCase();
      if (!query) {
        return applyFilter(records);
      }
      if (index) {
        const results = index.search(query, { enrich: true, limit: 50 });
        const ids = new Set();
        results.forEach((group) => {
          group.result.forEach((item) => ids.add(item.id));
        });
        const matched = records.filter((record) => ids.has(record.id));
        return applyFilter(matched);
      }
      const fallback = records.filter((record) => {
        const haystack = [record.title, record.description, record.content, ...(record.tags || [])]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
      return applyFilter(fallback);
    };

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter || "all";
        render(runSearch());
        setFilterState(activeFilter);
        syncUrl();
      });
    });

    input.addEventListener("input", () => {
      render(runSearch());
      syncUrl();
    });

    if (searchForm) {
      searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        render(runSearch());
        syncUrl();
      });
    }

    const match = window.location.pathname.match(/^(.*)\\/tutorials(\\/|$)/);
    const basePath = match ? match[1] : "";
    const indexUrl = `${basePath}/tutorials/search-index.json`;

    loadFlexSearch()
      .then(() => fetch(indexUrl))
      .then((response) => response.json())
      .then((data) => {
        records = data;
        if (window.FlexSearch) {
          index = new window.FlexSearch.Document({
            tokenize: "forward",
            document: {
              id: "id",
              index: ["title", "description", "tags", "content", "language"],
              store: ["title", "description", "url", "language", "level", "duration", "tags"],
            },
          });
          records.forEach((record) => index.add(record));
        }
        applyUrlState();
        render(runSearch());
      })
      .catch(() => {
        resultsEl.innerHTML = '<div class="result-empty">impossibile caricare i dati di ricerca.</div>';
      });
  };

  const initTutorialToc = (scope = document) => {
    const toc = scope.querySelector(".toc");
    const article = scope.querySelector(".tutorial-article");
    if (!toc || !article) {
      return;
    }
    if (toc.dataset.bound) {
      return;
    }
    toc.dataset.bound = "true";

    const links = Array.from(toc.querySelectorAll("a[href^='#']"));
    if (!links.length) {
      return;
    }

    const getTargetId = (link) => link.getAttribute("href").replace("#", "");
    const sections = links
      .map((link) => document.getElementById(getTargetId(link)))
      .filter(Boolean);

    if (!sections.length) {
      return;
    }

    const setActive = (id) => {
      links.forEach((link) => {
        const isActive = getTargetId(link) === id;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const updateFromScroll = () => {
      const offset = 160;
      let current = sections[0].id;
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top - offset <= 0) {
          current = section.id;
        }
      });
      setActive(current);
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActive(entry.target.id);
            }
          });
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      sections.forEach((section) => observer.observe(section));
    } else {
      updateFromScroll();
      window.addEventListener("scroll", updateFromScroll, { passive: true });
      window.addEventListener("resize", updateFromScroll);
    }

    links.forEach((link) => {
      link.addEventListener("click", () => {
        const id = getTargetId(link);
        setActive(id);
      });
    });
  };

  const initCodeHighlighting = (scope = document) => {
    const blocks = scope.querySelectorAll("pre code[class*='language-']");
    if (!blocks.length) {
      return;
    }
    loadPrism().then(() => {
      if (window.Prism) {
        window.Prism.highlightAllUnder(scope);
      }
    });
  };

  const reveal = (scope = document) => {
    if (!window.gsap || prefersReduced) {
      return;
    }
    const items = scope.querySelectorAll("[data-animate='reveal']");
    if (!items.length) {
      return;
    }
    window.gsap.fromTo(
      items,
      { opacity: 0, y: 26, scale: 0.98, filter: "blur(6px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.95,
        ease: "power3.out",
        stagger: 0.08,
      }
    );
  };

  const initScrollAccent = (scope = document) => {
    if (!window.gsap || !window.ScrollTrigger || prefersReduced) {
      return;
    }
    window.gsap.utils
      .toArray(
        scope.querySelectorAll(
          ".panel, .work-card, .tile, .project-card, .stat-card, .matrix-card, .series-card, .process-step, .lesson-card, .result-card, .tutorial-card"
        )
      )
      .forEach((card) => {
        window.gsap.fromTo(
          card,
          { boxShadow: "0 0 0 rgba(0,0,0,0)" },
          {
            boxShadow: "0 30px 90px rgba(58, 8, 13, 0.35)",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
            duration: 1,
            ease: "power2.out",
          }
        );
      });
  };

  const initFilters = (scope = document) => {
    const filterBar = scope.querySelector(".filter-bar");
    if (!filterBar) {
      return;
    }
    const buttons = filterBar.querySelectorAll(".filter-btn");
    const cards = scope.querySelectorAll(".work-card");
    if (!cards.length) {
      return;
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        buttons.forEach((btn) => btn.classList.remove("is-active"));
        button.classList.add("is-active");
        cards.forEach((card) => {
          const category = card.dataset.category || "";
          if (filter === "all" || category.includes(filter)) {
            card.classList.remove("is-hidden");
          } else {
            card.classList.add("is-hidden");
          }
        });
      });
    });
  };

  const initLightbox = (scope = document) => {
    const lightbox = document.querySelector(".lightbox");
    if (!lightbox) {
      return;
    }
    const image = lightbox.querySelector(".lightbox-image");
    const caption = lightbox.querySelector(".lightbox-caption");
    const close = lightbox.querySelector(".lightbox-close");
    const items = scope.querySelectorAll(".gallery-item");

    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
    };

    items.forEach((item) => {
      if (item.dataset.lightboxBound) {
        return;
      }
      item.dataset.lightboxBound = "true";
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        if (image && img) {
          image.src = item.dataset.full || img.src;
          image.alt = img.alt || "expanded photograph";
        }
        if (caption) {
          const cap = item.querySelector("figcaption");
          caption.textContent = cap ? cap.textContent : "";
        }
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
      });
    });

    if (!lightbox.dataset.bound) {
      lightbox.dataset.bound = "true";
      if (close) {
        close.addEventListener("click", closeLightbox);
      }
      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
          closeLightbox();
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeLightbox();
        }
      });
    }
  };

  const initPage = (scope = document) => {
    setActiveNav();
    reveal(scope);
    initScrollAccent(scope);
    initFilters(scope);
    initLightbox(scope);
    bindCursorTargets(scope);
    initNewsletter();
    initTutorialSearch(scope);
    initTutorialToc(scope);
    initCodeHighlighting(scope);
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  };

  const resetScrollTriggers = () => {
    if (!window.ScrollTrigger) {
      return;
    }
    window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  };

  const initBarba = () => {
    if (!window.barba) {
      return;
    }

    window.barba.init({
      transitions: [
        {
          async leave(data) {
            const done = this.async();
            resetScrollTriggers();
            if (window.gsap && data && data.current && data.current.container && !prefersReduced) {
              window.gsap.to(data.current.container, {
                opacity: 0,
                y: -12,
                duration: 0.35,
                ease: "power2.out",
              });
            }
            if (window.gsap && transitionLayer && !prefersReduced) {
              window.gsap.to(transitionLayer, {
                scaleY: 1,
                transformOrigin: "top",
                duration: 0.55,
                ease: "power2.inOut",
                onComplete: done,
              });
            } else {
              done();
            }
          },
          enter(data) {
            if (window.gsap && transitionLayer && !prefersReduced) {
              window.gsap.fromTo(
                transitionLayer,
                { scaleY: 1, transformOrigin: "bottom" },
                {
                  scaleY: 0,
                  duration: 0.7,
                  ease: "power2.inOut",
                }
              );
            }
            if (window.gsap && data && data.next && data.next.container && !prefersReduced) {
              window.gsap.fromTo(
                data.next.container,
                { opacity: 0, y: 18, filter: "blur(6px)" },
                {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  duration: 0.7,
                  delay: 0.1,
                  ease: "power3.out",
                }
              );
            }
            if (lenisInstance) {
              lenisInstance.scrollTo(0, { immediate: true });
            } else {
              window.scrollTo(0, 0);
            }
            initPage(data.next.container);
          },
        },
      ],
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initLenis();
    initCursor();
    initNav();
    initScrollUI();
    initNewsletter();
    initPage();
    initBarba();
  });
})();
