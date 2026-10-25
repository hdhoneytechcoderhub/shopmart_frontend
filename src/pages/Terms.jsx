import Breadcrumbs from '../components/common/Breadcrumbs';

const SECTIONS = [
  {
    title: '1. Acceptance of terms',
    body: 'By accessing or using ShopMart, you agree to be bound by these terms. If you do not agree, please refrain from using our service.',
  },
  {
    title: '2. Use of the service',
    body: 'You agree to use the store for lawful purposes only and not to misuse, disrupt, or attempt to gain unauthorised access to any part of the platform.',
  },
  {
    title: '3. Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorised use.',
  },
  {
    title: '4. Pricing & availability',
    body: 'All prices are listed in Indian Rupees (INR) and may change without notice. Products are subject to availability, and we reserve the right to limit quantities.',
  },
  {
    title: '5. Orders',
    body: 'Placing an order constitutes an offer to purchase. We reserve the right to accept or decline any order, including for reasons of stock, pricing errors, or suspected fraud.',
  },
  {
    title: '6. Returns & refunds',
    body: 'Returns and refunds are governed by our return policy. Please review product pages and the FAQ for category-specific conditions.',
  },
  {
    title: '7. Intellectual property',
    body: 'All content on this site — including logos, text, and images — is the property of ShopMart or its licensors and may not be used without permission.',
  },
  {
    title: '8. Limitation of liability',
    body: 'ShopMart is not liable for indirect or consequential damages arising from the use of our service, to the maximum extent permitted by law.',
  },
  {
    title: '9. Changes to terms',
    body: 'We may revise these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.',
  },
];

export default function Terms() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Terms of Service' }]} />

      <header className="mt-6 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: June 2026</p>
        <p className="mt-3 text-ink-muted">
          Please read these terms carefully before using ShopMart. They govern your access to and use of our store.
        </p>
      </header>

      <div className="mt-8 max-w-3xl space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold text-ink">{s.title}</h2>
            <p className="mt-1 text-ink-muted">{s.body}</p>
          </section>
        ))}
        <p className="border-t border-slate-200 pt-6 text-sm text-ink-muted">
          For questions about these terms, contact <a className="link" href="mailto:legal@shopmart.com">legal@shopmart.com</a>.
        </p>
      </div>
    </div>
  );
}
