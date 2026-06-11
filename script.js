// ==========================================================================
// Commspur Collective — motion & interactions
// ==========================================================================

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Sticky header shadow ----------
  var header = document.querySelector(".site-header");

  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 10);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Mobile navigation ----------
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");

  function closeNav() {
    mainNav.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  navToggle.addEventListener("click", function () {
    var isOpen = mainNav.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", function (event) {
    if (!mainNav.contains(event.target) && !navToggle.contains(event.target)) {
      closeNav();
    }
  });

  // ---------- Seamless logo marquee ----------
  var track = document.getElementById("marqueeTrack");
  track.innerHTML += track.innerHTML;

  // ---------- Stat number count-up ----------
  function countUp(el) {
    var target = parseInt(el.textContent, 10);
    if (isNaN(target) || reducedMotion) return;
    var duration = 1400;
    var start = null;

    function tick(now) {
      if (!start) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(eased * target) + "%";
      if (progress < 1) requestAnimationFrame(tick);
    }

    el.textContent = "0%";
    requestAnimationFrame(tick);
  }

  // ---------- Scroll choreography (reveals, staggers, pops) ----------
  // Pre-assign cascade delays to staggered grid children.
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.transitionDelay = (i * 0.1).toFixed(2) + "s";
    });
  });

  var animated = document.querySelectorAll(".reveal, [data-stagger], .peep-pop");

  if ("IntersectionObserver" in window && !reducedMotion) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");

          if (entry.target.hasAttribute("data-stagger")) {
            entry.target.querySelectorAll(".stat-number").forEach(countUp);
          }

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -48px 0px" }
    );

    animated.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    animated.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  // ---------- Magnetic primary buttons ----------
  if (window.matchMedia("(pointer: fine)").matches && !reducedMotion) {
    document.querySelectorAll(".btn-yellow").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        var y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        btn.style.transform = "translate(" + (x * 6).toFixed(1) + "px, " + (y * 5).toFixed(1) + "px)";
      });

      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  // ---------- Big text ticker ----------
  var ticker = document.getElementById("tickerTrack");
  if (ticker) ticker.innerHTML += ticker.innerHTML;

  // ---------- GSAP choreography: split-text headlines & parallax ----------
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    nodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
          } else {
            var word = document.createElement("span");
            word.className = "word";
            var inner = document.createElement("span");
            inner.className = "word-inner";
            inner.textContent = part;
            word.appendChild(inner);
            frag.appendChild(word);
          }
        });
        el.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
        splitWords(node);
      }
    });
  }

  if (window.gsap && window.ScrollTrigger && !reducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // word-by-word headline reveals
    var headlines = document.querySelectorAll(
      ".hero h1, .challenge-copy h2, .section-head h2, .evidence-head h2, .cta-copy h2"
    );

    headlines.forEach(function (el) {
      splitWords(el);
      gsap.from(el.querySelectorAll(".word-inner"), {
        yPercent: 110,
        duration: 1.05,
        ease: "power4.out",
        stagger: 0.055,
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    // gentle parallax on the hero photo
    var heroPhoto = document.querySelector(".hero-photo");
    if (heroPhoto) {
      gsap.fromTo(
        heroPhoto,
        { yPercent: -4, scale: 1.06 },
        {
          yPercent: 4,
          scale: 1.06,
          ease: "none",
          scrollTrigger: { trigger: ".hero-media", start: "top bottom", end: "bottom top", scrub: true }
        }
      );
    }

    // brand elements drift slightly as you scroll past them
    [
      { sel: ".postcard-back", y: -26 },
      { sel: ".footer-figures img", y: -18 },
      { sel: ".spiral-watermark", y: -40 }
    ].forEach(function (item) {
      var el = document.querySelector(item.sel);
      if (!el) return;
      gsap.to(el, {
        y: item.y,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 }
      });
    });

  }

  // ---------- Contact form ----------
  var form = document.getElementById("contactForm");
  var formStatus = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        formStatus.textContent = "Please fill in your name, email, and message.";
        formStatus.style.color = "#a8392e";
        formStatus.classList.add("show");
        return;
      }

      var data = new FormData(form);
      var subject = encodeURIComponent(data.get("subject") || "Hello from " + (data.get("name") || "your website"));
      var body = encodeURIComponent(
        "Name: " + (data.get("name") || "") + "\n" +
        "Email: " + (data.get("email") || "") + "\n" +
        "Organization: " + (data.get("organization") || "") + "\n\n" +
        (data.get("message") || "")
      );

      window.location.href = "mailto:hello@commspur.co?subject=" + subject + "&body=" + body;

      formStatus.textContent = "Opening your mail app — thank you!";
      formStatus.style.color = "#4d8a4f";
      formStatus.classList.add("show");
      form.reset();
    });
  }
})();
