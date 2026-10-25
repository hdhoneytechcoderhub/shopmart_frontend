import Breadcrumbs from '../components/common/Breadcrumbs';

const SECTIONS = [
  {
    title: '1. Information we collect',
    body: 'We collect information you provide directly — such as your name, email, phone number, shipping address, and order details — as well as limited technical data like device and usage information to improve our service.',
  },
  {
    title: '2. How we use your information',
    body: 'Your information helps us process orders, provide customer support, personalise your experience, send important account and order updates, and — with your consent — share relevant offers.',
  },
  {
    title: '3. Sharing of information',
    body: 'We share data only with trusted partners necessary to fulfil your order, such as payment processors and delivery providers. We never sell your personal information to third parties.',
  },
  {
    title: '4. Payment security',
    body: 'Payments are handled by secure, PCI-compliant gateways. We do not store complete card details on our servers.',
  },
  {
    title: '5. Cookies',
    body: 'We use cookies and similar technologies to keep you signed in, remember your cart, and understand how our store is used. You can control cookies through your browser settings.',
  },
  {
    title: '6. Your rights',
    body: 'You may access, update, or request deletion of your personal data at any time from your account settings or by contacting our support team.',
  },
  {
    title: '7. Changes to this policy',
    body: 'We may update this policy periodically. Material changes will be communicated through the site or by email where appropriate.',
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Privacy Policy' }]} />

      <header className="mt-6 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: June 2026</p>
        <p className="mt-3 text-ink-muted">
          Your privacy matters to us. This policy explains what we collect, how we use it, and the choices you have.
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
          Questions about your privacy? Reach us at <a className="link" href="mailto:privacy@shopmart.com">privacy@shopmart.com</a>.
        </p>
      </div>
    </div>
  );
}
