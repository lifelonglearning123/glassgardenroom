import { FINANCE_TEXT, RANGES, gbp, issuedAt, quoteRef, rearText, totals, ukDate, validUntil, type Photo, type Quote, type RangeKey } from '@/lib/quote';
import AcceptBox from './AcceptBox';

const COVER_FALLBACK: Record<RangeKey, string> = {
  bronze: '/library/bordeaux.jpg',
  silver: '/library/stretton-pigato.jpg',
  gold: '/library/toulouse.jpg',
};

/** The standard wording and photo for each range. Kept together so it can become editable later. */
const RANGE_COPY: Record<RangeKey, {
  image: string;
  headline: string;
  sub: string;
  intro: string;
  details: [string, string][];
}> = {
  bronze: {
    image: '/library/bordeaux.jpg',
    headline: 'Practical All-Weather Shelter',
    sub: 'The polycarbonate and aluminium veranda',
    intro: 'A robust, high-performance architectural canopy providing cost-effective weather protection.',
    details: [
      ['Specification', 'Structural-grade aluminium framework; impact-resistant multi-wall polycarbonate roof panels; integrated invisible guttering down the support posts.'],
      ['Ideal for', 'Sheltering hot tubs, outdoor kitchens or patio dining areas.'],
    ],
  },
  silver: {
    image: '/library/stretton-giallo.jpg',
    headline: 'Light-Filled Glass Roof Living',
    sub: 'The glass roof aluminium veranda',
    intro: 'Premium architectural aesthetics with an 8.8mm laminated glass canopy that softens rain noise and floods your home with daylight.',
    details: [
      ['Specification', 'Heavy-duty reinforced slimline aluminium frame; premium 8.8mm high-transparency laminated safety glass.'],
      ['Available upgrades', 'Integrated rafter LED lighting and premium heating units.'],
    ],
  },
  gold: {
    image: '/library/hero-inside-view.jpg',
    headline: 'Elite Architectural Luxury',
    sub: 'The all-season glass garden room',
    intro: 'A fully enclosed glass sanctuary designed to seal out cold draughts, crosswinds, snow and rain, extending your outdoor living from early spring to late autumn.',
    details: [
      ['Specification', 'Extra heavy-duty structural aluminium frame; 8.8mm high-transparency laminated safety glass roof; fully glazed sides and front with high-strength safety glass and ultra-smooth multi-track sliding doors, or aluminium walls.'],
      ['Climate upgrades', 'High-efficiency infra-red heaters, integrated ambient LED lighting and premium air conditioning units are available as bespoke extras.'],
      ['Ideal for', 'A modern garden lounge, home workspace, or evening entertaining and relaxing.'],
    ],
  },
};

const RANGE_ORDER: RangeKey[] = ['bronze', 'silver', 'gold'];

function Footer({ page }: { page: number }) {
  return (
    <footer className="sheet-foot">
      <span><strong>Glass Garden Rooms Ltd</strong> · www.glassgardenrooms.net · 024 7510 2899</span>
      <span>{page}</span>
    </footer>
  );
}

function Selected({ range, current }: { range: RangeKey; current: RangeKey }) {
  return range === current ? <span className="your-pick">Your selection</span> : null;
}

export default function Proposal({
  quote: q,
  photos,
  acceptUrl,
  acceptQr,
}: {
  quote: Quote;
  photos: Photo[];
  /** Full web address of the one-click accept page, printed in the PDF. */
  acceptUrl?: string;
  /** QR code (SVG markup) for acceptUrl, printed in the PDF. */
  acceptQr?: string;
}) {
  const t = totals(q.pricing);
  const range = q.spec.range;
  const chosen = RANGE_COPY[range];
  const cover = photos[0]?.url ?? COVER_FALLBACK[range];
  const gallery = photos.length > 2 ? photos.slice(1) : photos;
  const location = [q.client.address, q.client.postcode].filter(Boolean).join(', ');
  const size = [q.spec.width && `${q.spec.width}mm wide`, q.spec.projection && `${q.spec.projection}mm projection`]
    .filter(Boolean)
    .join(' × ');
  const specSummary = [RANGES[range].tier + ' range', size, q.spec.colour].filter(Boolean).join(' · ');
  const notes = q.spec.notes.split('\n').map((n) => n.trim()).filter(Boolean);
  const specRows: [string, string][] = (
    [
      ['Project type', q.spec.productName],
      ['Width (approx.)', q.spec.width ? `${q.spec.width} mm` : ''],
      ['Projection (approx.)', q.spec.projection ? `${q.spec.projection} mm` : ''],
      ['Frame colour', q.spec.colour],
      ['Mounting', q.spec.freestanding ? 'Freestanding' : 'Wall-mounted to the house'],
      ['Roof', q.spec.roof],
      ['Left return', q.spec.leftReturn],
      ['Right return', q.spec.rightReturn],
      ['Front', q.spec.front],
      ['Rear', rearText(q.spec)],
    ] as [string, string][]
  ).filter(([, v]) => v);

  // Pricing and next steps share page 5; a long price list pushes next steps onto page 6.
  const extraPriceLines = q.pricing.upgrades.filter((u) => u.label || u.amount).length + (t.discount > 0 ? 1 : 0);
  const splitSteps = extraPriceLines > 3;
  const nextSteps = (
    <div className={`next-steps ${splitSteps ? 'own-page' : ''}`}>
      <div>
        <p className="eyebrow">Next steps</p>
        <h2>Securing Your Commission</h2>
        <ol className="steps">
          <li><strong>Accept your quote.</strong> Accept online in one click, or contact us to lock in pricing.</li>
          <li><strong>Technical site survey.</strong> An unhurried 45-minute site measurement and physical sample sign-off at your home.</li>
          <li><strong>Precision manufacture &amp; build.</strong> A 2–10 week manufacturing lead time depending on range. Verandas typically install in 1–2 days; glass garden rooms in 3–6 days.</li>
          <li><strong>Handover.</strong> A thorough clean and walkthrough of your project to ensure complete satisfaction.</li>
        </ol>
      </div>
      <div className="cta">
        <h3>Ready to move forward?</h3>
        <p>If you are happy with this specification, accept your proposal and we will be in touch to book your technical survey.</p>
        <AcceptBox token={q.token} acceptedAt={q.acceptedAt} acceptedBy={q.acceptedBy} clientName={q.client.name} />
        {acceptUrl && !q.acceptedAt && (
          <div className="print-accept print-only">
            {acceptQr && <div className="qr" dangerouslySetInnerHTML={{ __html: acceptQr }} />}
            <p>
              <strong>Happy to go ahead?</strong> Scan the code with your phone camera to accept in one click,
              or <a href={acceptUrl}>accept your quote online</a>.
            </p>
          </div>
        )}
        <ul className="contact">
          <li><strong>Call or WhatsApp:</strong> 024 7510 2899 / 07398 224061</li>
          <li><strong>Email:</strong> <a href="mailto:info@glassgardenrooms.net">info@glassgardenrooms.net</a></li>
          <li><strong>Showroom:</strong> Unit 25, Centenary Business Centre, Hammond Close, Nuneaton, CV11 6RY (visits by appointment)</li>
        </ul>
        <p className="small">Prepared by {q.preparedBy}, Glass Garden Rooms Ltd</p>
      </div>
    </div>
  );

  return (
    <div className="proposal">
      {/* 1. Cover */}
      <section className="sheet cover">
        <div className="cover-image" style={{ backgroundImage: `url("${cover}")` }} />
        <div className="cover-body">
          <img src="/Brand/glassgardenroom.co-logo.svg" alt="Glass Garden Rooms" className="logo" />
          <h1>A Bespoke Space for Your Home</h1>
          <p className="kicker">Custom Outdoor Living Proposal</p>
          <dl className="cover-meta">
            <dt>Prepared exclusively for</dt><dd>{q.client.name || '—'}</dd>
            {location && (<><dt>Project location</dt><dd>{location}</dd></>)}
            <dt>Date</dt><dd>{ukDate(issuedAt(q))}</dd>
            <dt>Quote number</dt><dd>{quoteRef(q)}</dd>
            <dt>Quote valid until</dt><dd>{ukDate(validUntil(q))}. This proposal and its pricing are guaranteed for {q.validDays} days.</dd>
          </dl>
        </div>
        <Footer page={1} />
      </section>

      {/* 2. About us + the range they chose */}
      <section className="sheet">
        <div className="about">
          <div>
            <p className="eyebrow">About us</p>
            <h2>Bringing the Outdoors In</h2>
            <p>
              Thank you for inviting <strong>Glass Garden Rooms Ltd</strong> to design your outdoor living solution.
              From our Nuneaton base, our family-run team is dedicated to supplying premium architectural aluminium
              structures across the Midlands and beyond.
            </p>
            <h3>Built to last decades, not seasons</h3>
            <ul className="ticks">
              <li><strong>Engineered excellence.</strong> Constructed using ultra-durable 6063-T6 structural aluminium.</li>
              <li><strong>Up to 15-year guarantee.</strong> Peace of mind with a comprehensive structural warranty on all chosen ranges.</li>
              <li><strong>Transparent principles.</strong> Honest numbers, clear-cut packages, and no high-pressure sales tactics.</li>
            </ul>
          </div>
          <div className="about-image" style={{ backgroundImage: 'url("/library/stretton-lighting.jpg")' }} />
        </div>

        <div className="feature">
          <div className="feature-image" style={{ backgroundImage: `url("${chosen.image}")` }} />
          <p className="eyebrow">Your selection</p>
          <h2>{chosen.headline}</h2>
          <h3>{RANGES[range].tier} Range: {chosen.sub}</h3>
          <p>{chosen.intro}</p>
          <ul className="ticks">
            {chosen.details.map(([k, v]) => (
              <li key={k}><strong>{k}.</strong> {v}</li>
            ))}
          </ul>
        </div>
        <Footer page={2} />
      </section>

      {/* 3. All three ranges */}
      <section className="sheet">
        <p className="eyebrow">Our ranges</p>
        <h2>Choose Your Ideal Project</h2>
        {RANGE_ORDER.map((r) => (
          <div key={r} className={`range-card ${r === range ? 'is-chosen' : ''}`}>
            <div className="range-img" style={{ backgroundImage: `url("${RANGE_COPY[r].image}")` }} />
            <div>
              <h3>{RANGES[r].tier} Range <Selected range={r} current={range} /></h3>
              <p className="sub">{RANGE_COPY[r].sub}</p>
              <p>{RANGE_COPY[r].intro}</p>
              {RANGE_COPY[r].details.slice(0, 2).map(([k, v]) => (
                <p key={k} className="small"><strong>{k}:</strong> {v}</p>
              ))}
            </div>
          </div>
        ))}
        <Footer page={3} />
      </section>

      {/* 4. Your project */}
      <section className="sheet">
        <p className="eyebrow">Designed for you</p>
        <h2>Your Project Specification</h2>
        <table className="spec-table">
          <tbody>
            {specRows.map(([k, v]) => (
              <tr key={k}><th>{k}</th><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
        {notes.length > 0 && (
          <ul className="notes">
            {notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        )}
        {gallery.length > 0 && (
          <>
            <h3>Similar projects we have installed</h3>
            <div className={`gallery n${Math.min(gallery.length, 4)}`}>
              {gallery.slice(0, 4).map((p) => (
                <div key={p.id} className="gallery-img" style={{ backgroundImage: `url("${p.url}")` }} role="img" aria-label={p.title} />
              ))}
            </div>
          </>
        )}
        <Footer page={4} />
      </section>

      {/* 5. Pricing + next steps. Grows onto a second printed page if a quote has many lines. */}
      <section className="sheet grows">
        <p className="eyebrow">Your personalised quotation</p>
        <h2>Tailored Project Costings</h2>
        <table className="price-table">
          <thead>
            <tr><th>Selected package options</th><th>Specification</th><th className="num">Investment</th></tr>
          </thead>
          <tbody>
            <tr className="tint"><td><strong>{q.spec.productName}</strong></td><td>{specSummary}</td><td className="num">{gbp(q.pricing.packageAmount)}</td></tr>
            {q.pricing.upgrades.filter((u) => u.label || u.amount).map((u) => (
              <tr key={u.id} className="tint"><td><strong>Optional upgrade</strong></td><td>{u.label}</td><td className="num">{gbp(u.amount)}</td></tr>
            ))}
            <tr className="tint">
              <td><strong>{q.pricing.installMode === 'professional' ? 'Professional site installation' : 'Supply only (DIY build)'}</strong></td>
              <td>{q.pricing.installMode === 'professional' ? q.pricing.installNote : 'Delivered ready for your own builder or DIY installation'}</td>
              <td className="num">{q.pricing.installMode === 'professional' ? gbp(t.install) : '—'}</td>
            </tr>
            <tr><td><strong>Delivery &amp; structural handover</strong></td><td>Final site inspection and signed warranty delivery</td><td className="num">Included</td></tr>
            <tr className="sum"><td><strong>Subtotal (inc. VAT)</strong></td><td /><td className="num"><strong>{gbp(t.subtotal)}</strong></td></tr>
            {t.discount > 0 && (
              <tr className="discount"><td><strong>Incentive discount applied</strong></td><td>{q.pricing.discountLabel}</td><td className="num">−{gbp(t.discount)}</td></tr>
            )}
            <tr className="grand"><td colSpan={2}>Total fixed project investment</td><td className="num">{gbp(t.total)}</td></tr>
          </tbody>
        </table>
        <p className="finance">
          <strong>Spread the cost.</strong> {FINANCE_TEXT}
        </p>
        <p className="small muted">
          Terms: deposit on order, interim payment prior to delivery, balance on completion of installation. All prices include VAT.
        </p>

        {!splitSteps && nextSteps}
        <Footer page={5} />
      </section>

      {/* 6. Next steps on their own page, only when the price list is long. */}
      {splitSteps && (
        <section className="sheet">
          {nextSteps}
          <Footer page={6} />
        </section>
      )}
    </div>
  );
}
