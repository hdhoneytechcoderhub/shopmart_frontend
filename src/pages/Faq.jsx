import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';

const FAQS = [
  {
    group: 'Orders & Shipping',
    items: [
      { q: 'How long does delivery take?', a: 'Most orders are delivered within 3–6 business days. You’ll receive tracking details by email and SMS once your order ships.' },
      { q: 'Do you offer free shipping?', a: 'Yes — orders above ₹999 ship free. Orders below that carry a flat ₹79 shipping fee, shown clearly at checkout.' },
      { q: 'Can I track my order?', a: 'Absolutely. Head to your dashboard under “Orders”, open any order, and you’ll see live tracking updates.' },
    ],
  },
  {
    group: 'Returns & Refunds',
    items: [
      { q: 'What is your return policy?', a: 'Most items can be returned within 7 days of delivery, provided they’re unused and in original packaging. Some categories may have exceptions noted on the product page.' },
      { q: 'How do refunds work?', a: 'Once we receive and inspect your return, refunds are processed to your original payment method within 5–7 business days.' },
    ],
  },
  {
    group: 'Payments & Account',
    items: [
      { q: 'Which payment methods do you accept?', a: 'We accept credit and debit cards, UPI, net banking, and cash on delivery on eligible orders.' },
      { q: 'Is it safe to save my card?', a: 'We never store full card details on our servers. Payments are processed through secure, PCI-compliant gateways.' },
      { q: 'Do I need an account to shop?', a: 'You can browse freely, but an account is needed to place orders, track them, and save your wishlist.' },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-ink">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-ink-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-ink-muted">{a}</p>}
    </div>
  );
}

export default function Faq() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]} />

      <header className="mt-6 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Frequently asked questions</h1>
        <p className="mt-3 text-ink-muted">
          Everything you need to know about ordering, shipping, returns, and your account.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {FAQS.map((section) => (
          <section key={section.group}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-700">{section.group}</h2>
            <div className="card px-6">
              {section.items.map((item) => (
                <FaqItem key={item.q} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl bg-slate-100 p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-card">
          <LifeBuoy className="h-6 w-6" />
        </span>
        <h3 className="font-display text-lg font-bold text-ink">Still have questions?</h3>
        <p className="max-w-md text-sm text-ink-muted">Our support team is happy to help with anything we haven’t covered here.</p>
        <Link to="/contact" className="btn-primary mt-1">Contact support</Link>
      </div>
    </div>
  );
}
