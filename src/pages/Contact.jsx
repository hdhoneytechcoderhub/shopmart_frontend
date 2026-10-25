import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Spinner from '../components/common/Spinner';
import { isEmail, required } from '../utils/validators';

const DETAILS = [
  { icon: Mail, label: 'Email', value: 'support@shopmart.com', href: 'mailto:support@shopmart.com' },
  { icon: Phone, label: 'Phone', value: '+91 90000 12345', href: 'tel:+919000012345' },
  { icon: MapPin, label: 'Address', value: 'SG Highway, Ahmedabad, Gujarat 380015' },
  { icon: Clock, label: 'Hours', value: 'Mon–Sat, 9:00 AM – 7:00 PM IST' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!required(form.name)) next.name = 'Please enter your name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email';
    if (!required(form.message)) next.message = 'Please write a message';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    // No public contact endpoint in Phase 1 — simulate success.
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    toast.success('Thanks! We’ll get back to you shortly.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact Us' }]} />

      <header className="mt-6 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">We’d love to hear from you</h1>
        <p className="mt-3 text-ink-muted">
          Questions about an order, a product, or a partnership? Reach out and our team will respond as soon as possible.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Details */}
        <aside className="space-y-4">
          {DETAILS.map((d) => (
            <div key={d.label} className="card flex items-start gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <d.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink-muted">{d.label}</p>
                {d.href ? (
                  <a href={d.href} className="font-medium text-ink hover:text-brand-700">{d.value}</a>
                ) : (
                  <p className="font-medium text-ink">{d.value}</p>
                )}
              </div>
            </div>
          ))}
        </aside>

        {/* Form */}
        <div className="card p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" className="field" value={form.name} onChange={update} placeholder="Your name" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="field" value={form.email} onChange={update} placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
          </div>
          <div className="mt-4">
            <label className="label" htmlFor="subject">Subject</label>
            <input id="subject" name="subject" className="field" value={form.subject} onChange={update} placeholder="How can we help?" />
          </div>
          <div className="mt-4">
            <label className="label" htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={5} className="field resize-none" value={form.message} onChange={update} placeholder="Write your message…" />
            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
          </div>
          <button onClick={submit} disabled={submitting} className="btn-primary mt-5">
            {submitting ? <Spinner /> : <Send className="h-4 w-4" />}
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </div>
    </div>
  );
}
