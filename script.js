// Coffee and Laptop — Dormant Revenue Calculator
// Ported from the Claude Design component. All state is in memory; nothing is stored.

(function () {
  "use strict";

  // Fixed, conservative assumptions (were editable props in the design).
  var LIFT_POINTS = 3;        // start-rate lift from faster follow-up, in percentage points
  var REACTIVATION_RATE = 2;  // % of the dormant list that can be reactivated

  var lift = LIFT_POINTS / 100;
  var react = REACTIVATION_RATE / 100;

  // Input state (defaults match the markup).
  var state = { tuition: 15000, inquiries: 40, rate: 8, dormant: 500 };

  // Clamp bounds per field (min/max used when coercing input).
  var bounds = {
    tuition: [1000, 80000],
    inquiries: [1, 1000],
    rate: [1, 50],
    dormant: [0, 20000]
  };

  var usd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  // Compute target figures from current inputs.
  // Note: matches the design exactly — the "current rate" input is collected
  // for context but does not feed the recovery math.
  function targets() {
    var t = state.tuition, inq = state.inquiries, dorm = state.dormant;
    var ongoing = inq * 12 * lift * t;
    var onetime = dorm * react * t;
    return {
      ongoing: ongoing,
      onetime: onetime,
      total: ongoing + onetime,
      students: inq * 12 * lift + dorm * react
    };
  }

  // DOM handles for the animated result figures.
  var out = {
    ongoing: document.getElementById("r-ongoing"),
    onetime: document.getElementById("r-onetime"),
    total: document.getElementById("r-total"),
    students: document.getElementById("r-students"),
    tuition: document.getElementById("r-tuition")
  };

  var disp = targets(); // currently displayed (animated) values
  var raf = null;

  function paint(d) {
    out.ongoing.textContent = usd.format(Math.round(d.ongoing));
    out.onetime.textContent = usd.format(Math.round(d.onetime));
    out.total.textContent = usd.format(Math.round(d.total));
    out.students.textContent = String(Math.round(d.students)) + " students";
    out.tuition.textContent = usd.format(state.tuition);
  }

  // Ease from the current displayed values toward the new targets over 500ms.
  function animate() {
    var from = { ongoing: disp.ongoing, onetime: disp.onetime, total: disp.total, students: disp.students };
    var to = targets();
    var t0 = performance.now();
    var dur = 500;
    if (raf) cancelAnimationFrame(raf);

    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3); // cubic ease-out
      disp = {
        ongoing: from.ongoing + (to.ongoing - from.ongoing) * e,
        onetime: from.onetime + (to.onetime - from.onetime) * e,
        total: from.total + (to.total - from.total) * e,
        students: from.students + (to.students - from.students) * e
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
  ["tuition", "inquiries", "rate", "dormant"].forEach(function (key) {
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
          showNote("Thanks, I have your email and will be in touch. Prefer to reach me now? hello@coffeeandlaptopconsulting.com");
        } else {
          showNote("Something went wrong. Please email me directly at hello@coffeeandlaptopconsulting.com.");
        }
      }).catch(function () {
        showNote("Something went wrong. Please email me directly at hello@coffeeandlaptopconsulting.com.");
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

  // Paint initial figures.
  paint(disp);
})();
