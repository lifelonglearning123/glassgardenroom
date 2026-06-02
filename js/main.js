// ==========================================================================
// GLASS GARDEN ROOMS — main.js
// ==========================================================================

// ---- GoHighLevel webhook ---------------------------------------------------
// Paste the inbound webhook URL from your GHL sub-account workflow here.
// Workflow → Add Trigger → "Inbound Webhook" → copy the URL.
// While this is empty, the form falls back to a "we'll be in touch" message
// without sending anywhere.
const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/K0VS3ggGZfq9zHkJIL9i/webhook-trigger/ae25295e-8684-436b-b9f0-be92f6782534';
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile menu ---------- */
  const masthead = document.querySelector('.masthead');
  const toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      masthead.classList.toggle('is-open');
      const expanded = masthead.classList.contains('is-open');
      toggle.setAttribute('aria-expanded', expanded);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      item.classList.toggle('is-open');
      const expanded = item.classList.contains('is-open');
      btn.setAttribute('aria-expanded', expanded);
    });
  });

  /* ---------- Finance calculator ---------- */
  const amount = document.getElementById('calc-amount');
  const term = document.getElementById('calc-term');
  if (amount && term) {
    const monthlyEl = document.getElementById('calc-monthly');
    const totalEl = document.getElementById('calc-total');
    const interestEl = document.getElementById('calc-interest');
    const amountLabel = document.getElementById('calc-amount-label');
    const termLabel = document.getElementById('calc-term-label');

    const update = () => {
      const principal = +amount.value;
      const months = +term.value;
      // Representative APR table — illustrative only
      const aprTable = { 12: 0.0, 24: 9.9, 36: 11.9, 48: 12.9, 60: 13.9 };
      const apr = aprTable[months] ?? 11.9;
      const r = (apr / 100) / 12;
      let monthly;
      if (r === 0) {
        monthly = principal / months;
      } else {
        monthly = (principal * r) / (1 - Math.pow(1 + r, -months));
      }
      const total = monthly * months;
      const interest = total - principal;

      const fmt = n => '£' + Math.round(n).toLocaleString('en-GB');
      monthlyEl.textContent = fmt(monthly);
      totalEl.textContent = fmt(total);
      interestEl.textContent = apr.toFixed(1) + '% APR';
      amountLabel.textContent = fmt(principal);
      termLabel.textContent = months + ' months';
    };
    amount.addEventListener('input', update);
    term.addEventListener('input', update);
    update();
  }

  /* ---------- Soft parallax on .moment-bg ---------- */
  const parallaxEls = document.querySelectorAll('.moment-bg');
  if (parallaxEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    const update = () => {
      parallaxEls.forEach(el => {
        const rect = el.parentElement.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        const offset = Math.max(-60, Math.min(60, -progress * 60));
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Tickertape duplicator (seamless loop) ---------- */
  document.querySelectorAll('.tickertape-track, .marquee-track').forEach(track => {
    if (track.dataset.duplicated) return;
    track.innerHTML += track.innerHTML;
    track.dataset.duplicated = '1';
  });

  /* ---------- Quote form → GoHighLevel webhook ---------- */
  const quoteForm = document.getElementById('quote-form');
  if (quoteForm) {
    const statusEl = document.getElementById('quote-status');
    const submitBtn = quoteForm.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    const showStatus = (msg, isError = false) => {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.classList.toggle('is-error', isError);
      statusEl.hidden = false;
    };

    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!quoteForm.reportValidity()) return;

      const fd = new FormData(quoteForm);
      const payload = {
        name:     fd.get('name'),
        phone:    fd.get('phone'),
        email:    fd.get('email'),
        product:  fd.get('product'),
        postcode: fd.get('postcode'),
        budget:   fd.get('budget'),
        message:  fd.get('message'),
        source:   'glassgardenrooms.net — quote form',
        page:     window.location.pathname,
        submitted_at: new Date().toISOString()
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        if (GHL_WEBHOOK_URL) {
          const res = await fetch(GHL_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        }
        // Success (or no webhook configured yet)
        quoteForm.reset();
        submitBtn.innerHTML = "Sent — we'll be in touch";
        showStatus("Thank you — your enquiry is with us. We'll reply within 2 working days.");
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
        showStatus("Something went wrong sending the form. Please call 024 7510 2899 or email info@glassgardenrooms.net.", true);
      }
    });
  }

  /* ---------- Mark current nav ---------- */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.primary-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('is-current');
    }
  });

  /* ---------- Quote wizard (4-step drawer) ---------- */
  initQuoteWizard();
});

async function initQuoteWizard() {
  // Inject the partial. If already present (e.g. inlined for SSR), skip the fetch.
  let panel = document.getElementById('quote-wizard');
  if (!panel) {
    try {
      const res = await fetch('partials/quote-wizard.html', { cache: 'no-cache' });
      if (!res.ok) return;
      const html = await res.text();
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      document.body.appendChild(wrap.firstElementChild);
      panel = document.getElementById('quote-wizard');
    } catch (_) { return; }
  }
  if (!panel) return;

  const form     = panel.querySelector('#qw-form');
  const steps    = Array.from(panel.querySelectorAll('.qw-step'));
  const pills    = Array.from(panel.querySelectorAll('.qw-steps li'));
  const statusEl = panel.querySelector('#qw-status');
  const submitBtn = panel.querySelector('#qw-submit');

  let current = 1;
  const TOTAL = 4;

  const showStep = (n) => {
    steps.forEach(s => s.classList.toggle('is-active', s.dataset.step === String(n)));
    pills.forEach(p => {
      const v = +p.dataset.step;
      p.classList.toggle('is-current', v === n);
      p.classList.toggle('is-done', v < n);
    });
    current = n;
    const focusable = panel.querySelector('.qw-step.is-active input, .qw-step.is-active select, .qw-step.is-active textarea, .qw-step.is-active button');
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 250);
  };

  const validateStep = (n) => {
    const step = steps.find(s => s.dataset.step === String(n));
    if (!step) return true;
    const fields = step.querySelectorAll('input, select, textarea');
    let ok = true;
    fields.forEach(f => {
      f.classList.remove('is-invalid');
      if (!f.checkValidity()) {
        f.classList.add('is-invalid');
        ok = false;
      }
    });
    if (!ok) {
      const firstBad = step.querySelector('.is-invalid');
      if (firstBad) firstBad.focus();
    }
    return ok;
  };

  /* Open / close */
  const open = () => {
    panel.hidden = false;
    requestAnimationFrame(() => {
      panel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('qw-open');
    });
  };
  const close = () => {
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('qw-open');
    setTimeout(() => { panel.hidden = true; }, 500);
  };

  // Open triggers: any [data-open-quote] or href="#quote-wizard"
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-quote], a[href="#quote-wizard"]');
    if (trigger) {
      e.preventDefault();
      open();
    }
  });
  if (window.location.hash === '#quote-wizard') open();
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#quote-wizard') open();
  });

  // Close triggers
  panel.querySelectorAll('[data-qw-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') close();
  });

  /* Step navigation */
  panel.querySelectorAll('[data-qw-next]').forEach(b => b.addEventListener('click', () => {
    if (!validateStep(current)) return;
    if (current < TOTAL) showStep(current + 1);
  }));
  panel.querySelectorAll('[data-qw-prev]').forEach(b => b.addEventListener('click', () => {
    if (current > 1) showStep(current - 1);
  }));

  /* Conditional fields: data-show-when="name=value" */
  panel.querySelectorAll('[data-show-when]').forEach(el => {
    const [name, value] = el.dataset.showWhen.split('=');
    const watch = panel.querySelector(`[name="${name}"]`);
    if (!watch) return;
    const sync = () => { el.hidden = watch.value !== value; };
    watch.addEventListener('change', sync);
    sync();
  });

  /* Submit */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.source = 'glassgardenrooms.net — quote wizard';
    payload.page = window.location.pathname;
    payload.submitted_at = new Date().toISOString();

    submitBtn.disabled = true;
    const original = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending…';
    statusEl.hidden = true;
    statusEl.classList.remove('is-error');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error('HTTP ' + res.status + ' ' + text);
      }
      // Success — show success pane
      steps.forEach(s => s.classList.remove('is-active'));
      panel.querySelector('.qw-step-success').classList.add('is-active');
      pills.forEach(p => p.classList.add('is-done'));
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = original;
      statusEl.hidden = false;
      statusEl.classList.add('is-error');
      statusEl.textContent = "Something went wrong sending the form. Please call 024 7510 2899 or email info@glassgardenrooms.net.";
      console.error('[quote-wizard]', err);
    }
  });
}
