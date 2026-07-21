// C+L Systems — Dormant Revenue Calculator ("The CALC")
// Pure client-side, in-memory. No storage, no backend.
// Every displayed figure is computed live from the user's own inputs plus a
// single visible, user-controlled recovery rate. There are no hidden assumptions.

(function () {
  "use strict";

  // Input state (defaults match the markup).
  var state = { tuition: 15000, inquiries: 40, rate: 8, dormant: 500, recovery: 10 };

  // Clamp bounds per field [min, max].
  var bounds = {
    tuition: [1000, 80000],
    inquiries: [1, 1000],
    rate: [1, 50],
    dormant: [0, 20000],
    recovery: [5, 20]
  };

  var usd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  // All math is pure arithmetic on the inputs.
  //   T = tuition, M = inquiries/mo, S = start rate (decimal),
  //   D = dormant inquiries, R = recovery rate (decimal, user-controlled)
  function targets() {
    var T = state.tuition, M = state.inquiries, D = state.dormant;
    var S = state.rate / 100, R = state.recovery / 100;

    var annualInquiryValue = M * 12 * T;              // the pool (pure math)
    var currentEnrollmentRevenue = M * 12 * S * T;    // context (pure math)
    var recoverableOngoing = M * 12 * S * R * T;      // user-controlled slice
    var recoverableDormant = D * S * R * T;           // one-time, user-controlled

    return {
      annualInquiryValue: annualInquiryValue,
      currentEnrollmentRevenue: currentEnrollmentRevenue,
      recoverableOngoing: recoverableOngoing,
      recoverableDormant: recoverableDormant,
      yearOneOpportunity: recoverableOngoing + recoverableDormant,
      recoverableStarts: (M * 12 * S * R) + (D * S * R)
    };
  }

  var el = {
    inquiryvalue: document.getElementById("r-inquiryvalue"),
    current: document.getElementById("r-current"),
    ongoing: document.getElementById("r-ongoing"),
    dormant: document.getElementById("r-dormant"),
    yearone: document.getElementById("r-yearone"),
    ongoingInline: document.getElementById("r-ongoing-inline"),
    dormantInline: document.getElementById("r-dormant-inline"),
    starts: document.getElementById("r-starts"),
    tuition: document.getElementById("r-tuition")
  };
  var rateSpans = document.querySelectorAll(".rate-live");

  var disp = targets(); // currently displayed (animated) values
  var raf = null;

  function paint(d) {
    el.inquiryvalue.textContent = usd.format(Math.round(d.annualInquiryValue));
    el.current.textContent = usd.format(Math.round(d.currentEnrollmentRevenue));
    el.ongoing.textContent = usd.format(Math.round(d.recoverableOngoing));
    el.dormant.textContent = usd.format(Math.round(d.recoverableDormant));
    el.yearone.textContent = usd.format(Math.round(d.yearOneOpportunity));
    el.ongoingInline.textContent = usd.format(Math.round(d.recoverableOngoing));
    el.dormantInline.textContent = usd.format(Math.round(d.recoverableDormant));
    el.starts.textContent = d.recoverableStarts.toFixed(1);
    el.tuition.textContent = usd.format(state.tuition);
    // Live recovery-rate readout in the surrounding copy.
    for (var i = 0; i < rateSpans.length; i++) rateSpans[i].textContent = state.recovery;
  }

  // Ease from the current displayed values toward the new targets over 500ms.
  function animate() {
    var from = {
      annualInquiryValue: disp.annualInquiryValue,
      currentEnrollmentRevenue: disp.currentEnrollmentRevenue,
      recoverableOngoing: disp.recoverableOngoing,
      recoverableDormant: disp.recoverableDormant,
      yearOneOpportunity: disp.yearOneOpportunity,
      recoverableStarts: disp.recoverableStarts
    };
    var to = targets();
    var t0 = performance.now();
    var dur = 500;
    if (raf) cancelAnimationFrame(raf);

    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3); // cubic ease-out
      disp = {
        annualInquiryValue: from.annualInquiryValue + (to.annualInquiryValue - from.annualInquiryValue) * e,
        currentEnrollmentRevenue: from.currentEnrollmentRevenue + (to.currentEnrollmentRevenue - from.currentEnrollmentRevenue) * e,
        recoverableOngoing: from.recoverableOngoing + (to.recoverableOngoing - from.recoverableOngoing) * e,
        recoverableDormant: from.recoverableDormant + (to.recoverableDormant - from.recoverableDormant) * e,
        yearOneOpportunity: from.yearOneOpportunity + (to.yearOneOpportunity - from.yearOneOpportunity) * e,
        recoverableStarts: from.recoverableStarts + (to.recoverableStarts - from.recoverableStarts) * e
      };
      paint(disp);
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  function setField(key, raw) {
    var v = Number(raw);
    if (!isFinite(v)) return;
    var b = bounds[key];
    v = Math.max(b[0], Math.min(b[1], v));
    state[key] = v;

    // Keep the paired number field and slider in sync.
    var num = document.querySelector('[data-field="' + key + '"]');
    var range = document.querySelector('[data-range="' + key + '"]');
    if (num && num.value !== String(v)) num.value = v;
    if (range) range.value = v;

    animate();
  }

  // Wire up every number field and slider by its data-field / data-range key.
  ["tuition", "inquiries", "rate", "dormant", "recovery"].forEach(function (key) {
    var num = document.querySelector('[data-field="' + key + '"]');
    var range = document.querySelector('[data-range="' + key + '"]');
    if (num) num.addEventListener("input", function (e) { setField(key, e.target.value); });
    if (range) range.addEventListener("input", function (e) { setField(key, e.target.value); });
  });

  // Email fallback capture via Netlify Forms.
  // Submits over AJAX so the visitor stays on the page and sees the inline note.
  var emailForm = document.getElementById("contact-form");
  var emailInput = document.getElementById("in-email");
  var emailBtn = document.getElementById("email-submit");
  var emailNote = document.getElementById("email-note");

  function showNote(msg) {
    emailNote.textContent = msg;
    emailNote.style.display = "block";
  }

  if (emailForm) {
    emailForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!/.+@.+\..+/.test(emailInput.value)) {
        showNote("Enter a valid email address first.");
        return;
      }
      emailBtn.disabled = true;
      showNote("Sending...");
      var body = new URLSearchParams(new FormData(emailForm)).toString();
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body
      }).then(function (res) {
        if (res.ok) {
          emailForm.reset();
          showNote("Thanks, I have your email and will be in touch. Prefer to reach me now? hello@candlsystems.com");
        } else {
          showNote("Something went wrong. Please email me directly at hello@candlsystems.com.");
        }
      }).catch(function () {
        showNote("Something went wrong. Please email me directly at hello@candlsystems.com.");
      }).finally(function () {
        emailBtn.disabled = false;
      });
    });
  }
  if (emailInput) {
    emailInput.addEventListener("input", function () {
      emailNote.textContent = "";
      emailNote.style.display = "none";
    });
  }

  // Paint initial figures from live inputs.
  paint(disp);
})();
