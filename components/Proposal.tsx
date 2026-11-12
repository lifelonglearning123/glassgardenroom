import { RANGES, gbp, issuedAt, quoteRef, rearText, totals, ukDate, validUntil, type Photo, type Quote, type RangeKey } from '@/lib/quote';
import AcceptBox from './AcceptBox';
import { DEFAULT_TEMPLATE, RANGE_ORDER, paragraphs, type ProposalTemplate } from '@/lib/template';

const COVER_FALLBACK: Record<RangeKey, string> = {
  bronze: '/library/bordeaux.jpg',
  silver: '/library/stretton-pigato.jpg',
  gold: '/library/toulouse.jpg',
};


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

function PointList({ points }: { points: { title: string; text: string }[] }) {
  const shown = points.filter((p) => p.title || p.text);
  if (!shown.length) return null;
  return (
    <ul className="ticks">
      {shown.map((p, i) => (
        <li key={i}>{p.title && <strong>{p.title}. </strong>}{p.text}</li>
      ))}
    </ul>
  );
}

export default function Proposal({
  quote: q,
  photos,
  acceptUrl,
  acceptQr,
  template: tpl = DEFAULT_TEMPLATE,
}: {
  quote: Quote;
  photos: Photo[];
  /** Standard wording and photos; edited on the Proposal wording page. */
  template?: ProposalTemplate;
  /** Full web address of the one-click accept page, printed in the PDF. */
  acceptUrl?: string;
  /** QR code (SVG markup) for acceptUrl, printed in the PDF. */
  acceptQr?: string;
}) {
  const t = totals(q.pricing);
  const range = q.spec.range;
  const chosen = tpl.ranges[range];
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
        <h2>{tpl.stepsHeading}</h2>
        <ol className="steps">
          {tpl.steps.filter((st) => st.title || st.text).map((st, i) => (
            <li key={i}>{st.title && <strong>{st.title}. </strong>}{st.text}</li>
          ))}
        </ol>
      </div>
      <div className="cta">
        <h3>{tpl.ctaHeading}</h3>
        <p>{tpl.ctaText}</p>
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
          <h1>{tpl.coverTitle}</h1>
          <p className="kicker">{tpl.coverKicker}</p>
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
            <h2>{tpl.aboutHeading}</h2>
            {paragraphs(tpl.aboutBody).map((para, i) => <p key={i}>{para}</p>)}
            {tpl.aboutSubheading && <h3>{tpl.aboutSubheading}</h3>}
            <PointList points={tpl.aboutPoints} />
          </div>
          <div className="about-image" style={{ backgroundImage: `url("${tpl.aboutImage}")` }} />
        </div>

        <div className="feature">
          <div className="feature-image" style={{ backgroundImage: `url("${chosen.image}")` }} />
          <p className="eyebrow">Your selection</p>
          <h2>{chosen.headline}</h2>
          <h3>{RANGES[range].tier} Range: {chosen.sub}</h3>
          <p>{chosen.intro}</p>
          <PointList points={chosen.details} />
        </div>
        <Footer page={2} />
      </section>

      {/* 3. All three ranges */}
      <section className="sheet">
        <p className="eyebrow">Our ranges</p>
        <h2>Choose Your Ideal Project</h2>
        {RANGE_ORDER.map((r) => (
          <div key={r} className={`range-card ${r === range ? 'is-chosen' : ''}`}>
            <div className="range-img" style={{ backgroundImage: `url("${tpl.ranges[r].image}")` }} />
            <div>
              <h3>{RANGES[r].tier} Range <Selected range={r} current={range} /></h3>
              <p className="sub">{tpl.ranges[r].sub}</p>
              <p>{tpl.ranges[r].intro}</p>
              {tpl.ranges[r].details.filter((d) => d.title || d.text).slice(0, 2).map((d, i) => (
                <p key={i} className="small">{d.title && <strong>{d.title}: </strong>}{d.text}</p>
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
        <h2>{tpl.pricingHeading}</h2>
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
          <strong>Spread the cost.</strong> {tpl.financeText}
        </p>
        <p className="small muted">
          {tpl.terms}
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
