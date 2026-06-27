// Seed script — pushes existing site content into Sanity.
// Usage:  cd studio && node --env-file=.env scripts/seed.mjs
// Requires: SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET, SANITY_WRITE_TOKEN (Editor token) in .env

import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const requireEnv = (key) => {
  const v = process.env[key];
  if (!v) {
    console.error(`✗ Missing env var: ${key}. Set it in studio/.env and re-run.`);
    process.exit(1);
  }
  return v;
};

const client = createClient({
  projectId: requireEnv('SANITY_STUDIO_PROJECT_ID'),
  dataset:   process.env.SANITY_STUDIO_DATASET ?? 'production',
  apiVersion: '2026-01-01',
  token:     requireEnv('SANITY_WRITE_TOKEN'),
  useCdn:    false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────

const log = (msg) => console.log(`  ${msg}`);
const ok  = (msg) => console.log(`✓ ${msg}`);

// Decode the URL-encoded image paths used in the legacy HTML.
const decodePath = (p) => decodeURIComponent(p.replace(/^\//, ''));

// Upload a file from the repo to Sanity's asset store.
async function uploadImage(relativePath, alt, caption) {
  const fullPath = path.join(REPO_ROOT, decodePath(relativePath));
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠ Missing image: ${relativePath}`);
    return null;
  }
  const buffer = fs.readFileSync(fullPath);
  const asset = await client.assets.upload('image', buffer, {
    filename: path.basename(fullPath),
  });
  log(`uploaded ${path.basename(fullPath)}`);
  return {
    _type: 'imageWithCaption',
    asset: { _type: 'reference', _ref: asset._id },
    alt,
    ...(caption ? { caption } : {}),
  };
}

// Build a Portable Text block.
const block = (text, style = 'normal', marks = []) => ({
  _type: 'block',
  _key:  cryptoKey(),
  style,
  markDefs: [],
  children: parseInlineMarks(text),
});

let _keyCounter = 0;
const cryptoKey = () => `k${Date.now().toString(36)}${(_keyCounter++).toString(36)}`;

// Tiny inline parser: supports *italic*, **bold**, _italicDisplay_
function parseInlineMarks(text) {
  // Very simple: splits on **bold**, *italic*, _italicDisplay_.
  const result = [];
  let cursor = 0;
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_)/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > cursor) {
      result.push({ _type: 'span', _key: cryptoKey(), text: text.slice(cursor, m.index), marks: [] });
    }
    const marks = [];
    let inner = '';
    if (m[2] !== undefined) { marks.push('strong'); inner = m[2]; }
    else if (m[3] !== undefined) { marks.push('em'); inner = m[3]; }
    else if (m[4] !== undefined) { marks.push('italicDisplay'); inner = m[4]; }
    result.push({ _type: 'span', _key: cryptoKey(), text: inner, marks });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) {
    result.push({ _type: 'span', _key: cryptoKey(), text: text.slice(cursor), marks: [] });
  }
  if (result.length === 0) {
    result.push({ _type: 'span', _key: cryptoKey(), text, marks: [] });
  }
  return result;
}

const p   = (text) => block(text, 'normal');
const h2  = (text) => block(text, 'h2');
const h3  = (text) => block(text, 'h3');
const quote = (text) => block(text, 'blockquote');
const lede  = (text) => block(text, 'lede');
const li  = (text, listItem = 'bullet') => ({ ...block(text), listItem });

// Refs
const ref = (id) => ({ _type: 'reference', _ref: id });

// ─── Image upload plan ────────────────────────────────────────────────────

console.log('\n─── Uploading images ───');
const IMG = {};
IMG.logo       = await uploadImage('Brand/glassgardenroom.co-logo.svg', 'Glass Garden Rooms');
IMG.heroPoster = await uploadImage('images/69af57437c270219ab46766e.jpeg', 'Premium glass garden room with chandelier-style lighting at a modern wood-clad home');
IMG.provence   = await uploadImage('images/68c299cb43ec1c230ea3109a.jpeg', 'Anthracite aluminium veranda over a stone-paved patio with corner sofa, brick home behind');
IMG.bordeaux   = await uploadImage('images/69935c6a6bac24658ed28f95.jpeg', 'A compact polycarbonate veranda over a small patio with garden pond');
IMG.premium    = await uploadImage('images/glass garden room Toulouse Glass Garden Room.jpg', 'A fully enclosed glass garden room with anthracite frame, set against a modern white house');
IMG.hup        = await uploadImage('images/69935d816bac2409fbd2cdd5.png', 'hup! brochure showing conservatory transformations and the hup! extension system');
IMG.singleCarport = await uploadImage('images/69931cd51a38a0e65b65cf24.jpeg', 'Single-bay aluminium carport with anthracite frame');
IMG.doubleCarport = await uploadImage('images/69af5ac0ace64743f2f64f40.jpg', 'Aerial view of a double-span aluminium roof with concealed gutters');
IMG.journalGlassPoly = await uploadImage('images/glass garden room 2.JPG', 'Glass roof veranda with afternoon light');
IMG.journalRiver     = await uploadImage('images/69af5ac0ace64743f2f64f40.jpg', 'Aerial view of an aluminium veranda glass roof');
IMG.journalAlu       = await uploadImage('images/glass garden room 3.jpg', 'Premium fully-enclosed glass garden room beside a swimming pool');

// ─── Products ─────────────────────────────────────────────────────────────

console.log('\n─── Creating products ───');
const products = [
  {
    _id: 'product-provence',
    _type: 'product',
    name: 'The Provence',
    slug: { current: 'the-provence', _type: 'slug' },
    category: 'veranda',
    catalogueNumber: '№ 01',
    strapline: 'A glass-roofed veranda for everyday use. 8.8mm laminated glass, integrated gutters, four colour finishes.',
    fromPrice: { amount: 4000, displayPrefix: 'from £' },
    heroImage: IMG.provence,
  },
  {
    _id: 'product-bordeaux',
    _type: 'product',
    name: 'The Bordeaux',
    slug: { current: 'the-bordeaux', _type: 'slug' },
    category: 'veranda',
    catalogueNumber: '№ 02',
    strapline: '16mm triple-wall polycarbonate. Honest value, faster lead time, often in stock.',
    fromPrice: { amount: 4000, displayPrefix: 'from £' },
    heroImage: IMG.bordeaux,
  },
  {
    _id: 'product-premium-glass-room',
    _type: 'product',
    name: 'The Premium Glass Room',
    slug: { current: 'premium-glass-room', _type: 'slug' },
    category: 'glass-room',
    catalogueNumber: '№ 01',
    strapline: 'A fully-enclosed extension of your home. 10mm safety-glass sliders, 360-degree views, year-round comfort.',
    fromPrice: { amount: 18000, displayPrefix: 'from £' },
    heroImage: IMG.premium,
  },
  {
    _id: 'product-hup',
    _type: 'product',
    name: 'The hup! System',
    slug: { current: 'hup-system', _type: 'slug' },
    category: 'glass-room',
    catalogueNumber: '№ 02',
    strapline: 'A genuine extension, five times faster than masonry. Super-insulated walls, glass or solid roof.',
    fromPrice: undefined,
    heroImage: IMG.hup,
  },
  {
    _id: 'product-single-carport',
    _type: 'product',
    name: 'Single Carport',
    slug: { current: 'single-carport', _type: 'slug' },
    category: 'carport',
    catalogueNumber: '№ 01',
    strapline: 'A clean, single-bay shelter for one vehicle. 18mm polycarbonate roof, integrated gutter.',
    fromPrice: { amount: 2500, displayPrefix: 'from £' },
    heroImage: IMG.singleCarport,
  },
  {
    _id: 'product-double-carport',
    _type: 'product',
    name: 'Double Carport',
    slug: { current: 'double-carport', _type: 'slug' },
    category: 'carport',
    catalogueNumber: '№ 02',
    strapline: 'A wider span for two vehicles or a generous covered approach.',
    fromPrice: { amount: 4200, displayPrefix: 'from £' },
    heroImage: IMG.doubleCarport,
  },
];

for (const prod of products) {
  await client.createOrReplace(prod);
  log(`product ${prod.name}`);
}
ok(`${products.length} products`);

// ─── Testimonials ────────────────────────────────────────────────────────

console.log('\n─── Creating testimonials ───');
const testimonials = [
  { _id: 'testimonial-david-taylor',   customerName: 'David Taylor',  location: 'Nottingham', rating: 5, featured: true,  quote: 'Outstanding from quote to completion. The glass roof veranda exceeded all our expectations.', date: '2026-04-12' },
  { _id: 'testimonial-sarah-johnson',  customerName: 'Sarah Johnson', location: 'Leicester',  rating: 5, featured: true,  quote: 'Absolutely stunning veranda — the installation was seamless and professional. Our garden has been completely transformed.', date: '2026-03-22' },
  { _id: 'testimonial-emma-williams',  customerName: 'Emma Williams', location: 'Coventry',   rating: 5, featured: true,  quote: 'Best investment we made for our home. Beautiful craftsmanship and attention to detail throughout.', date: '2026-03-08' },
  { _id: 'testimonial-john-d',         customerName: 'John D.',       location: 'Oxford',     rating: 5, featured: false, quote: 'The installation was fast and flawless. Our garden room looks amazing.', date: '2026-02-18' },
  { _id: 'testimonial-lisa-m',         customerName: 'Lisa M.',       location: 'Bristol',    rating: 5, featured: false, quote: 'Professional team, no mess left behind. Highly recommend.', date: '2026-02-04' },
  { _id: 'testimonial-robert-k',       customerName: 'Robert K.',     location: 'Solihull',   rating: 5, featured: false, quote: 'From start to finish, everything was handled perfectly.', date: '2026-01-21' },
];

for (const t of testimonials) {
  await client.createOrReplace({ _type: 'testimonial', ...t });
  log(`testimonial ${t.customerName}`);
}
ok(`${testimonials.length} testimonials`);

// ─── Journal posts ───────────────────────────────────────────────────────

console.log('\n─── Creating journal posts ───');
const posts = [
  {
    _id: 'journal-glass-or-polycarbonate',
    title: 'Glass or polycarbonate? An honest comparison.',
    slug: 'glass-or-polycarbonate',
    publishedAt: '2026-05-08T09:00:00Z',
    author: 'Glass Garden Rooms',
    volumeNumber: 'Vol. 01',
    excerpt: "Both are good. They're good at different things. Here's the unvarnished case for each, and when we'd quietly steer a customer one way or the other.",
    heroImage: IMG.journalGlassPoly,
    body: [
      p("We get this question on almost every quote: *should I have glass or polycarbonate on the roof?* And the honest answer is, it depends — but probably less than you'd think on price, and rather more than you'd expect on what you actually want the veranda to *feel* like."),
      p("This is the conversation we'd have with you over a cup of tea on the patio, written down so you can have it without the cup of tea."),
      h2("The case for glass."),
      p("Glass is the quiet one. 8mm laminated glass gives you a roof that lets the sky in without much fuss. It doesn't yellow. It doesn't ripple. Rain on it sounds like rain, not popcorn."),
      p("Acoustically and visually, glass is the closer-to-architecture choice. If your veranda will sit alongside a modern extension, or if you'd like to leave the lights off in the evening and watch the moon, glass is what we'd recommend."),
      quote("Glass is the quiet one — rain on it sounds like rain, not popcorn."),
      h2("The case for polycarbonate."),
      p("Polycarbonate is the practical one. It's lighter, which means we can sometimes span further between posts; it's much cheaper, which means a wider veranda for the same budget; and modern multi-wall opal polycarbonate has come a long way — it now blocks most direct sun, which means a cooler space underneath in July."),
      p("If you're shading a patio you actually use to *eat* on, polycarbonate is often the right answer. The slight diffusion is a feature, not a bug."),
      h2("So when do we recommend which?"),
      li("**Choose glass** if the veranda is part of a sightline from inside the house, if you have a view worth keeping, or if year-round visual quietness matters more to you than the price difference."),
      li("**Choose polycarbonate** if you'd rather have a bigger, cooler, shadier space; if the patio gets brutal afternoon sun; or if you'd like to spend the saving on better lighting, blinds, or a wider span."),
      li("**Honestly?** About 60% of our customers choose glass. About 40% choose polycarbonate and never regret it. We've never had a customer call back saying they wished they'd chosen the other one."),
      h2("And the things people overthink."),
      p("**Cleaning.** Glass is self-cleaning by virtue of being smooth and sloped. Polycarbonate is fine with a soft brush twice a year."),
      p("**Hail.** Both are graded for UK weather. Laminated glass is genuinely tougher than people imagine — it's not a greenhouse pane."),
      p("**Heat.** Glass roofs warm a space faster than polycarbonate ones. If you have a south-facing patio, that's either a feature (April) or a problem (August). Solar-control glass and / or fabric blinds solve this — ask us when we quote."),
      p("Whichever you choose, the frame is the same: powder-coated aluminium, corners, no maintenance worth mentioning. The roof is just the bit you look at most."),
    ],
  },
  {
    _id: 'journal-the-river-house',
    title: 'The River House — borrowing a view.',
    slug: 'the-river-house',
    publishedAt: '2026-03-21T09:00:00Z',
    author: 'Glass Garden Rooms',
    volumeNumber: 'Vol. 01',
    excerpt: "A glass garden room set inches from the meadow's edge in Cambridgeshire — and what it taught us about the things you don't put in the brochure.",
    heroImage: IMG.journalRiver,
    body: [
      p("Some projects you remember not for what you built, but for *where* you built it. The River House is one of those."),
      p("A glass garden room, 5.4 × 3.6 metres, set inches from the meadow's edge with a slow Cambridgeshire river beyond it. Four days on site, three of which were perfectly weathered, one of which was less so."),
      h2("Why the client chose glass."),
      p("They didn't want a building. They wanted a place to sit and *look*. 10mm tempered glass sliders on three sides, an 8.8mm laminated glass roof, and a single anthracite frame holding it all in place."),
      p("The view does most of the work. Our job was to get out of its way."),
      quote("They didn't want a building. They wanted a place to sit and look."),
      h2("What we learned."),
      p("Sites this close to water need careful base prep — we ran a deeper footing than usual and a moisture barrier under the slab. The kind of detail that doesn't go in the brochure but matters in February."),
      p("The other thing — and this is the bit we say to every glass-room client — is that a glass roof in a meadow gets *dirty*. Not unpleasantly, just leaves and pollen. We specified self-cleaning glass, which gets you about 80% of the way; the other 20% is a soft brush twice a year."),
      h2("Where it sits now."),
      p("Six months later it's the room they spend most evenings in. They tell us they read more, and that the river noise is the best thing about it."),
      p("If you have a view worth keeping — coastal, riverside, woodland — talk to us. Half the design is in the frame; the other half is in figuring out what the view wants."),
    ],
  },
  {
    _id: 'journal-why-aluminium',
    title: 'Why we build in aluminium, not timber.',
    slug: 'why-aluminium',
    publishedAt: '2026-02-02T09:00:00Z',
    author: 'Glass Garden Rooms',
    volumeNumber: 'Vol. 01',
    excerpt: "A short defence of a quiet metal — why aluminium suits English weather, English gardens, and a customer who'd rather not be re-staining a frame next spring.",
    heroImage: IMG.journalAlu,
    body: [
      p("We get asked this a lot, and our answer is fairly unromantic: it's the right material for the job. That's it."),
      p("But \"right for the job\" deserves unpacking, because we know the assumption is often that timber is the *premium* choice and aluminium is the *cheaper* one. That isn't true any more, and probably never was."),
      h2("The case for aluminium."),
      p("6063-T6 aluminium is light, doesn't rot, doesn't warp, doesn't need re-staining, and powder-coats beautifully. A well-coated frame holds its colour for decades — we're still seeing 20-year-old verandas in the Midlands looking exactly as they did the day they went in."),
      p("It also lets us go *thinner*. A timber rafter that spans a 4-metre veranda is chunky. An aluminium one carries the same load at half the visual weight. That matters when the whole point of a veranda is to let the sky in."),
      h2("What people miss about timber."),
      p("Beautiful when it's new. Demanding after that. Most timber verandas need re-staining or oiling every 2–3 years to keep the warranty. Most owners don't, and the frame gets a bit greyer and a bit cracked each season."),
      p("There's a romantic version of this — patinated oak that softens into the garden — and we get it. But realistically, very few people want a maintenance job they didn't ask for."),
      quote("Most timber verandas need re-staining every 2–3 years. Most owners don't."),
      h2("And the climate angle."),
      p("Aluminium is among the most recyclable materials on the planet — 75% of all aluminium ever produced is still in use. The frames we install are themselves typically 60–80% recycled content."),
      p("Timber is renewable but only when sourced well. The good stuff is expensive; the cheap stuff often isn't from where the brochure says it is."),
      h2("So why do we still get asked?"),
      p("Honestly, because timber *looks* warm in a photograph. We understand that. But the photograph is taken on day one. The frame is there for thirty years. We'd rather you have something quiet and beautiful for the long run."),
    ],
  },
];

for (const post of posts) {
  await client.createOrReplace({
    _id: post._id,
    _type: 'journalPost',
    title: post.title,
    slug: { current: post.slug, _type: 'slug' },
    publishedAt: post.publishedAt,
    author: post.author,
    volumeNumber: post.volumeNumber,
    excerpt: post.excerpt,
    heroImage: post.heroImage,
    body: post.body,
  });
  log(`post "${post.title}"`);
}
ok(`${posts.length} journal posts`);

// ─── Site Settings (singleton) ───────────────────────────────────────────

console.log('\n─── Creating site settings ───');
await client.createOrReplace({
  _id: 'siteSettings',
  _type: 'siteSettings',
  businessName: 'Glass Garden Rooms',
  phone: '024 7510 2899',
  email: 'info@glassgardenrooms.net',
  address: {
    line1: 'Unit 25, Centenary Business Centre',
    town: 'Nuneaton',
    county: 'Warwickshire',
    postcode: 'CV11 6RY',
    mapUrl: 'https://www.google.com/maps?q=Centenary+Business+Centre,+Hammond+Close,+Nuneaton+CV11+6RY&output=embed',
  },
  showroomHours: [
    { _key: cryptoKey(), days: 'Monday – Friday', hours: '8am – 6pm' },
    { _key: cryptoKey(), days: 'Saturday',        hours: 'Closed' },
    { _key: cryptoKey(), days: 'Sunday',          hours: 'Closed' },
  ],
  masthead: {
    logo: IMG.logo,
    nav: [
      { _key: cryptoKey(), label: 'Products',     href: '/products/' },
      { _key: cryptoKey(), label: 'Installation', href: '/installation/' },
      { _key: cryptoKey(), label: 'Finance',      href: '/finance/' },
      { _key: cryptoKey(), label: 'Journal',      href: '/journal/' },
      { _key: cryptoKey(), label: 'Visit',        href: '/contact/' },
    ],
    ctaLabel: 'Request a quote',
    ctaHref: '/contact/',
  },
  footer: {
    tagline: 'A family of designers, makers and installers based in Nuneaton — building quiet, well-made aluminium architecture across the Midlands and beyond.',
    columns: [
      { _key: cryptoKey(), heading: 'Catalogue', links: [
        { _key: cryptoKey(), label: 'Verandas',       href: '/verandas/' },
        { _key: cryptoKey(), label: 'Garden Rooms',   href: '/garden-rooms/' },
        { _key: cryptoKey(), label: 'Carports',       href: '/carports/' },
        { _key: cryptoKey(), label: 'All Products',   href: '/products/' },
        { _key: cryptoKey(), label: 'Brochure (PDF)', href: '/assets/glass-garden-rooms-brochure.pdf' },
      ]},
      { _key: cryptoKey(), heading: 'Service', links: [
        { _key: cryptoKey(), label: 'Installation', href: '/installation/' },
        { _key: cryptoKey(), label: 'Finance',      href: '/finance/' },
        { _key: cryptoKey(), label: 'FAQ',          href: '/faq/' },
        { _key: cryptoKey(), label: 'Contact',      href: '/contact/' },
      ]},
    ],
    legalLine: '© 2026 Glass Garden Rooms Ltd · Co. No. 15487442',
  },
  defaultSeo: {
    title: 'Glass Garden Rooms — Bespoke Aluminium Verandas',
    description: 'Family-run UK manufacturer of bespoke aluminium verandas, glass garden rooms and carports. Expert installation, transparent pricing, 5-year warranty. Showroom in Nuneaton, Warwickshire.',
  },
});
ok('site settings');

// ─── Home Page (singleton) ───────────────────────────────────────────────

console.log('\n─── Creating home page ───');
await client.createOrReplace({
  _id: 'homePage',
  _type: 'homePage',
  cinematicHero: {
    posterImage: IMG.heroPoster,
    metaLabels: [
      'Vol. 01 — Spring / Summer 2026',
      'Aluminium · Glass · Light',
      '№ 04918',
    ],
    headline: [block('Bring the _outdoors_ in.')],
    lede: 'Bespoke aluminium verandas and glass garden rooms — designed, manufactured and installed by a family of craftspeople in Warwickshire.',
    ctas: [
      { _key: cryptoKey(), label: 'Explore the collection', href: '/products/', variant: 'btn-bone' },
      { _key: cryptoKey(), label: 'Instant Price', href: 'https://configurator.alfresko.co.uk/?dealerId=0c65eea4-80d9-4a26-b81f-0ef4e0659bd9', variant: 'btn-outline-bone', external: true },
      { _key: cryptoKey(), label: 'Book a free survey', href: '/contact/', variant: 'btn-outline-bone' },
    ],
    creditLine: '— Photographed in Solihull, March 2026.\nAnthracite frame, 8.8mm laminated glass.',
  },
  tickertape: [
    'Bespoke aluminium verandas',
    '5-year structural warranty',
    'Family-run since 2014',
    'Installed across the Midlands and beyond',
    '0% APR finance available',
    '4–6 week lead time',
    'NHBC accepted',
  ],
  usps: [
    { _key: cryptoKey(), number: 'i.',   title: 'Made for British weather', body: '6063-T6 aluminium with AkzoNobel powder coatings. Engineered to last decades, not seasons.' },
    { _key: cryptoKey(), number: 'ii.',  title: 'Five-year guarantee',      body: 'Comprehensive cover on all structural components. Ten years on selected carport ranges.' },
    { _key: cryptoKey(), number: 'iii.', title: 'Transparent pricing',      body: 'Fair, year-round prices. No fictional sales, no inflated quotes — just honest numbers.' },
    { _key: cryptoKey(), number: 'iv.',  title: 'Family-run, hands-on',     body: "From your first survey to the final handover, you'll deal with the people who built it." },
  ],
  featuredProducts: [
    { _key: cryptoKey(), ...ref('product-provence') },
    { _key: cryptoKey(), ...ref('product-premium-glass-room') },
    { _key: cryptoKey(), ...ref('product-single-carport') },
  ],
  featuredTestimonials: [
    { _key: cryptoKey(), ...ref('testimonial-david-taylor') },
    { _key: cryptoKey(), ...ref('testimonial-sarah-johnson') },
    { _key: cryptoKey(), ...ref('testimonial-emma-williams') },
  ],
  journalTeaser: {
    heading: 'From the Journal',
    autoPopulate: true,
  },
  seo: {
    title: 'Glass Garden Rooms — Bespoke Aluminium Verandas & Glass Garden Rooms',
    description: 'Family-run UK manufacturer of bespoke aluminium verandas, glass garden rooms and carports. Expert installation, transparent pricing, 5-year warranty. Showroom in Nuneaton, Warwickshire.',
  },
});
ok('home page');

// ─── FAQ (singleton) ─────────────────────────────────────────────────────

console.log('\n─── Creating FAQ ───');
const faqAnswer = (text) => [p(text)];
await client.createOrReplace({
  _id: 'faq',
  _type: 'faq',
  intro: {
    breadcrumb: '— Journal & FAQ',
    volumeLabel: 'Vol. 01',
    lastUpdated: '2026-04-01',
    headline: [block('Common _questions,_ straight answers.')],
    lede: "Everything we're most often asked — about quoting, installation, materials and finance. If something isn't here, send us a WhatsApp on 07398 224061 and we'll come back the same day.",
  },
  sections: [
    {
      _key: cryptoKey(),
      _type: 'faqSection',
      number: '№ 01',
      title: 'Quotes & payment',
      meta: 'Reply within 2 working days',
      items: [
        { _key: cryptoKey(), _type: 'faqItem', question: 'How long does it take to get a quote, and what should I send you?', answer: faqAnswer("We aim to reply to all enquiries within 2 working days — most are answered the same day. To make our quote as accurate as possible, please send us the width and projection you'd like, your roof preference (glass or polycarbonate), wall-mounted or freestanding, side walls or sliding doors, and photos of the area including the wall and ground.") },
        { _key: cryptoKey(), _type: 'faqItem', question: 'How can I contact you?', answer: faqAnswer('Email info@glassgardenrooms.net, call our office on 024 7510 2899, or WhatsApp 07398 224061.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'Do you offer supply-only options?', answer: faqAnswer("Yes — we can arrange delivery without installation. Get in touch and we'll talk you through it.") },
        { _key: cryptoKey(), _type: 'faqItem', question: 'How can I pay?', answer: faqAnswer("We accept bank transfers, cheques, cash, and credit/debit card payments. We don't accept American Express. Finance is also available — see our finance page.") },
        { _key: cryptoKey(), _type: 'faqItem', question: 'What deposit do I need to pay?', answer: faqAnswer('Typically 25–50%, depending on the complexity of your project.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'Can I see your products before deciding?', answer: faqAnswer('Of course — visit our Nuneaton showroom by appointment (Monday to Thursday 8am–3pm, Friday 8am–1pm). Or our surveyor will bring physical samples to your home.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'When is your "Sale" on?', answer: faqAnswer('Unlike many of our competitors, we offer clear and fair pricing all year round — instead of inflating costs to offer a "sales" price. Promotional codes (like our Spring Deal) are genuine reductions on already-honest prices.') },
      ],
    },
    {
      _key: cryptoKey(),
      _type: 'faqSection',
      number: '№ 02',
      title: 'Installation',
      meta: 'Lead time 4–6 weeks',
      items: [
        { _key: cryptoKey(), _type: 'faqItem', question: 'Do you offer installation?', answer: faqAnswer('Yes. Our installation teams are experienced installers with extensive industry experience. All are approved and vetted installation partners of Glass Garden Rooms Ltd.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'What areas are covered by your free home design and consultancy visit?', answer: faqAnswer("We cover most of the Midlands and beyond as standard. Outside that, we offer a remote WhatsApp survey for anywhere in Mainland UK — we'll discuss your project in detail and give you an idea of the price.") },
        { _key: cryptoKey(), _type: 'faqItem', question: 'How long does a site survey last?', answer: faqAnswer("Anywhere from 45 minutes to 2 hours. The survey and consultation is one of the most important stages of your project — we won't rush it.") },
        { _key: cryptoKey(), _type: 'faqItem', question: 'How long does installation take?', answer: faqAnswer("A veranda typically takes 1–2 days. A glass garden room takes 3–6 days. We'll never rush — it takes as long as it needs to be done correctly.") },
        { _key: cryptoKey(), _type: 'faqItem', question: 'How long after I order will it be fitted?', answer: faqAnswer("Our standard lead time is 4–6 weeks. Many popular verandas are in stock and can be installed faster. Lead times vary with seasonal demand — we'll confirm at the time of enquiry.") },
        { _key: cryptoKey(), _type: 'faqItem', question: 'Do I need planning permission?', answer: faqAnswer("Generally, planning permission isn't required. We always recommend checking your local regulations — and we'll guide you through it on your survey.") },
        { _key: cryptoKey(), _type: 'faqItem', question: 'Do you handle electrical connections?', answer: faqAnswer('Yes — our installation team integrates first-fix electrical works, and we work with qualified electricians for second-fix and certification.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'What guarantees are included?', answer: faqAnswer('All our installations and products are warranty-backed — five years on structure as standard. Full details are in our terms and conditions.') },
      ],
    },
    {
      _key: cryptoKey(),
      _type: 'faqSection',
      number: '№ 03',
      title: 'Features & options',
      meta: 'Materials · Finishes',
      items: [
        { _key: cryptoKey(), _type: 'faqItem', question: 'What are your verandas and glass garden rooms made from?', answer: faqAnswer('High-quality 6063-T6 aluminium — for strength, durability, and a long-lasting premium look. Coated with AkzoNobel powder paint to keep its finish for decades.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'What glass do you use for the roof?', answer: faqAnswer('8.8mm laminated safety glass on all glazed roof systems — meeting industry standards for impact resistance and safety.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'What polycarbonate do you use?', answer: faqAnswer('A very strong 16mm triple-wall polycarbonate in Clear or Opal (Opaque) as standard. Opal Solar Control or Ultra-Clear are available as upgrades.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'What colours do you offer?', answer: faqAnswer('Black, Dark Grey, Traffic White and Cream as standard. Custom RAL colours are available on request.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'Can we add lighting?', answer: faqAnswer('Absolutely. LED lighting is an optional extra in all our verandas and glass garden rooms. We recommend specifying it at design stage rather than retrofitting.') },
        { _key: cryptoKey(), _type: 'faqItem', question: 'Can you supply heating?', answer: faqAnswer('Yes — a range of freestanding and wall-mounted electric and infrared heaters designed for outdoor use. Place electric heaters at least 350mm from any glass or polycarbonate to prevent tension points or cracks. Never use open-fire, gas or propane heat sources beneath a veranda or inside a glass room.') },
        { _key: cryptoKey(), _type: 'faqItem', question: "What's the difference between a veranda and a pergola?", answer: faqAnswer('A veranda is typically attached to a building with a single-sloped roof (we offer freestanding versions too). A pergola — attached or freestanding — has a flat roof made of aluminium louvres or laminated glass; the louvres rotate open or closed, manually or by motor.') },
      ],
    },
  ],
  seo: {
    title: 'Journal & FAQ | Glass Garden Rooms',
    description: "Quotes, installation, materials and finance — answers to the questions we're most often asked about our verandas, glass garden rooms and carports.",
  },
});
ok('FAQ');

// ─── Simple page singletons ──────────────────────────────────────────────

console.log('\n─── Creating simple pages ───');

await client.createOrReplace({
  _id: 'productsPage',
  _type: 'productsPage',
  pageHead: {
    breadcrumb: '— Catalogue, Vol. 01',
    label: 'The Collection 2026',
    headline: [block('The _catalogue._')],
    lede: 'A small, considered range of aluminium architecture — every piece engineered for British weather, built to last decades, and priced honestly all year round.',
  },
  categoryOrder: ['veranda', 'glass-room', 'carport'],
  seo: {
    title: 'The Catalogue — Glass Garden Rooms',
    description: 'Browse the full Glass Garden Rooms collection — verandas, glass garden rooms, carports and accessories. From £2,500.',
  },
});
ok('products page');

await client.createOrReplace({
  _id: 'installationPage',
  _type: 'installationPage',
  pageHead: {
    breadcrumb: '— Service / Installation',
    label: 'Approved & vetted teams',
    headline: [block('Installed by the people who _built_ it.')],
    lede: 'Every Glass Garden Rooms project is fitted by an approved installation team — vetted, trained, and accountable to us. Minimal disruption, careful workmanship, and a tidy site at the end.',
  },
  steps: [
    { _key: cryptoKey(), number: 'i.',   title: 'Survey & preparation',    body: [p('Free on-site survey (45 min – 2 hrs). Ground levelling, base prep, planning paperwork where needed. Remote WhatsApp surveys available outside the Midlands.')] },
    { _key: cryptoKey(), number: 'ii.',  title: 'Structure assembly',      body: [p('Aluminium frame and roof installed with weatherproof seals. Foundation anchoring. Electrical first-fix integrated where required.')] },
    { _key: cryptoKey(), number: 'iii.', title: 'Accessories & finishing', body: [p('Sliding doors, motorised blinds, LED lighting, infrared heating — fitted and tested. Final adjustments and snagging.')] },
    { _key: cryptoKey(), number: 'iv.',  title: 'Handover & aftercare',    body: [p('Full walk-through, maintenance notes, written 5-year warranty in your inbox. We tidy up before we leave.')] },
  ],
  seo: {
    title: 'Installation — Hassle-free, in 1–6 days | Glass Garden Rooms',
    description: 'Professional installation of verandas, glass garden rooms and carports across the Midlands and the UK. 4-step process, 1–6 day install, 5-year warranty.',
  },
});
ok('installation page');

await client.createOrReplace({
  _id: 'financePage',
  _type: 'financePage',
  pageHead: {
    breadcrumb: '— Service / Finance',
    label: '0% APR available',
    headline: [block('A garden room, in monthly _chapters._')],
    lede: 'Spread your investment across 12, 24 or 36 months — including a genuine 0% APR option on selected plans. No early-repayment penalties, no hidden fees, no waiting to start your project.',
  },
  legal: [p('Glass Garden Rooms Ltd (Co. No. 15487442) is an introducer-appointed representative of Ideal Sales Solutions Ltd, trading as Ideal4Finance. Ideal Sales Solutions Ltd is authorised and regulated by the Financial Conduct Authority (FRN 703401). Finance is subject to status and the rate offered is always provisional and depends upon your personal circumstances, the loan amount and the term.')],
  seo: {
    title: 'Finance — 12, 24 or 36 months | Glass Garden Rooms',
    description: 'Spread your veranda or garden room over 12, 24 or 36 months. 0% APR on selected plans. Live calculator. FCA-regulated finance via Ideal4Finance.',
  },
});
ok('finance page');

await client.createOrReplace({
  _id: 'contactPage',
  _type: 'contactPage',
  pageHead: {
    breadcrumb: '— Visit & Contact',
    label: 'Free consultation · No obligation',
    headline: [block('Begin with a _conversation._')],
    lede: "Send us a message, give us a call, or visit our Nuneaton showroom by appointment. We'll come back with an honest quote and an unhurried plan — no pressure, no salesman tricks.",
  },
  formBlock: {
    heading: 'Request a quote',
    successMessage: "Thank you — your enquiry is with us. We'll reply within 2 working days.",
  },
  seo: {
    title: 'Visit & Contact | Glass Garden Rooms',
    description: 'Visit our Nuneaton showroom by appointment, or send us a message. Phone 024 7510 2899, WhatsApp 07398 224061. Reply within 2 working days.',
  },
});
ok('contact page');

console.log('\n✓ Seed complete. Open the Studio and verify everything looks right.');
