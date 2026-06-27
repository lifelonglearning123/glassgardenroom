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
});
