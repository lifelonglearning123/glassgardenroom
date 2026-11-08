import { gbp, quoteRef, totals, ukDate, validUntil, type Quote } from './quote';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function defaultEmailMessage(q: Quote): string {
  const first = q.client.name.split(' ')[0] || 'there';
  return (
    `Hi ${first},\n\n` +
    `Thank you for your time. As promised, here is your personalised proposal for your ${q.spec.productName.toLowerCase()}, ` +
    `including photos of similar projects we have installed.\n\n` +
    `If you are happy with everything, you can accept the proposal online or simply reply to this email ` +
    `and we will book your technical site survey.\n\n` +
    `Kind regards,\n${q.preparedBy}\nGlass Garden Rooms Ltd`
  );
}

export function defaultEmailSubject(q: Quote): string {
  return `Your Glass Garden Rooms proposal (quote ${quoteRef(q)})`;
}

export function emailHtml(q: Quote, message: string, link: string, appUrl: string): string {
  const t = totals(q.pricing);
  const paragraphs = message
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<!doctype html><html><body style="margin:0;background:#F4EFE6;font-family:Arial,Helvetica,sans-serif;color:#181612">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="background:#ffffff;padding:22px 28px 18px;border-bottom:3px solid #3F5039"><img src="${appUrl}/Brand/ggr-logo-email.png" alt="Glass Garden Rooms" height="40" style="height:40px"></td></tr>
<tr><td style="padding:28px 28px 8px;font-size:15px;line-height:1.6">${paragraphs}</td></tr>
<tr><td style="padding:8px 28px 4px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F1;border:1px solid #E8DFCD;border-radius:6px">
  <tr><td style="padding:16px 18px;font-size:14px">
    <div style="color:#8A8276;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Quote ${esc(quoteRef(q))}</div>
    <div style="font-size:18px;font-weight:bold;margin:4px 0">${esc(q.spec.productName)}</div>
    <div>Total fixed investment: <strong>${gbp(t.total)}</strong> inc. VAT</div>
    <div style="color:#8A8276;font-size:12px;margin-top:4px">Valid until ${ukDate(validUntil(q))}</div>
  </td></tr></table>
</td></tr>
<tr><td align="center" style="padding:22px 28px 30px">
  <a href="${link}" style="display:inline-block;background:#3F5039;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:bold;font-size:15px">View your proposal</a>
</td></tr>
<tr><td style="background:#FAF7F1;padding:16px 28px;font-size:12px;color:#8A8276;line-height:1.5">
Glass Garden Rooms Ltd · Unit 25, Centenary Business Centre, Hammond Close, Nuneaton, CV11 6RY<br>
024 7510 2899 · 07398 224061 · info@glassgardenrooms.net · www.glassgardenrooms.net
</td></tr>
</table></td></tr></table></body></html>`;
}
