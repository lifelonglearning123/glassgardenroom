'use client';

import { useEffect } from 'react';

/** "Download PDF" uses the browser's Save as PDF. With auto, the print dialog opens as soon as images load. */
export default function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const go = () => setTimeout(() => window.print(), 300);
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  }, [auto]);

  return (
    <button className="btn primary small" onClick={() => window.print()}>
      Download PDF
    </button>
  );
}
