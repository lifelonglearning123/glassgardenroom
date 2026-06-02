// ==========================================================================
// /api/lead — GHL contact creation handler
// Used by both server.js (local) and Vercel-style serverless deploys.
// ==========================================================================

const GHL_API = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

const isNonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

function buildNoteBody(p) {
  const L = [];
  L.push('— New quote wizard submission —');
  if (p.product)             L.push(`Product: ${p.product}`);
  if (p.width)               L.push(`Width: ${p.width}`);
  if (p.projection)          L.push(`Projection: ${p.projection}`);
  if (p.existing_structure)  L.push(`Existing structure: ${p.existing_structure}`);
  if (p.budget)              L.push(`Budget: ${p.budget}`);
  if (p.timeline)            L.push(`Desired completion: ${p.timeline}`);
  if (p.contactMethod)       L.push(`Preferred contact method: ${p.contactMethod}`);
  if (p.contactTime)         L.push(`Preferred contact time: ${p.contactTime}`);
  if (p.hearHow)             L.push(`How heard: ${p.hearHow}`);
  if (p.referrer)            L.push(`Referrer: ${p.referrer}`);
  if (p.message)             L.push(`Notes: ${p.message}`);
  L.push('');
  L.push(`Consent: ${p.consent === 'yes' ? 'yes' : 'no'}`);
  L.push(`Newsletter opt-in: ${p.newsletter === 'yes' ? 'yes' : 'no'}`);
  L.push(`Submitted: ${p.submitted_at || new Date().toISOString()}`);
  L.push(`Source: ${p.source || 'quote wizard'} · Page: ${p.page || '/'}`);
  return L.join('\n');
}

async function handleLead(payload) {
  const locationId = process.env.GHL_LOCATION_ID;
  const token      = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;

  if (!isNonEmpty(locationId) || !isNonEmpty(token)) {
    return { ok: false, status: 500, error: 'GHL credentials not configured. Set GHL_LOCATION_ID and GHL_PRIVATE_INTEGRATION_TOKEN in .env.local' };
  }
  if (!isNonEmpty(payload.email) && !isNonEmpty(payload.phone)) {
    return { ok: false, status: 400, error: 'email or phone is required' };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Version: GHL_VERSION,
  };

  // Compose tags
  const tags = ['quote-wizard'];
  if (payload.product)     tags.push(`product:${payload.product}`.slice(0, 60));
  if (payload.budget)      tags.push(`budget:${payload.budget}`.slice(0, 60));
  if (payload.hearHow)     tags.push(`source:${payload.hearHow}`.slice(0, 60));

  // 1) Upsert contact
  const contactBody = {
    locationId,
    firstName:  payload.firstName  || undefined,
    lastName:   payload.lastName   || undefined,
    email:      payload.email      || undefined,
    phone:      payload.phone      || undefined,
    address1:   [payload.address1, payload.address2].filter(Boolean).join(', ') || undefined,
    city:       payload.city       || undefined,
    postalCode: payload.postalCode || undefined,
    country:    'GB',
    source:     payload.source || 'glassgardenrooms.net — quote wizard',
    tags,
  };
  // Strip undefined to keep payload tidy
  Object.keys(contactBody).forEach(k => contactBody[k] === undefined && delete contactBody[k]);

  let contactId;
  try {
    const r1 = await fetch(`${GHL_API}/contacts/upsert`, {
      method: 'POST',
      headers,
      body: JSON.stringify(contactBody),
    });
    const j1 = await r1.json().catch(() => ({}));
    if (!r1.ok) {
      return { ok: false, status: r1.status, error: 'GHL contact upsert failed', detail: j1 };
    }
    contactId = j1.contact?.id || j1.id || j1.contactId;
    if (!contactId) {
      return { ok: false, status: 502, error: 'GHL returned no contact id', detail: j1 };
    }
  } catch (err) {
    return { ok: false, status: 502, error: 'Network error reaching GHL', detail: String(err) };
  }

  // 2) Attach a note with all the project-specific detail
  try {
    await fetch(`${GHL_API}/contacts/${contactId}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: buildNoteBody(payload) }),
    });
  } catch (_) {
    // Non-fatal — contact was already created.
  }

  return { ok: true, contactId };
}

// ----- Vercel-style serverless handler -----
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { payload = {}; }
  }
  payload = payload || {};
  const result = await handleLead(payload);
  res.statusCode = result.ok ? 200 : result.status || 500;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
};

module.exports.handleLead = handleLead;
