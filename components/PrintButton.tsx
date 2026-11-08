'use client';

export default function PrintButton() {
  return (
    <button className="btn primary small" onClick={() => window.print()}>
      Download PDF
    </button>
  );
}
