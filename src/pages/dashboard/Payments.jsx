import { useEffect, useState } from 'react';
import { CreditCard, Plus, Trash2, Star, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { accountService } from '../../services/accountService';
import { mockPaymentMethods } from '../../services/mockAccount';
import EmptyState from '../../components/common/EmptyState';

export default function Payments() {
  const [methods, setMethods] = useState([]);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let active = true;
    accountService.getPaymentMethods()
      .then((data) => { if (active) setMethods(Array.isArray(data) ? data : []); })
      .catch((err) => { if (active && !err?.response) { setMethods(mockPaymentMethods); setDemo(true); } });
    return () => { active = false; };
  }, []);

  const remove = (m) => {
    setMethods((list) => list.filter((x) => x.id !== m.id));
    toast.success('Payment method removed');
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Payment methods</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage your saved cards and UPI IDs.</p>
        </div>
        <button onClick={() => toast('Adding cards is available once a payment gateway is connected.')} className="btn-primary">
          <Plus className="h-4 w-4" /> Add method
        </button>
      </div>

      {demo && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Demo data shown — real payment methods appear once a gateway is connected.
        </p>
      )}

      <div className="mt-6">
        {methods.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment methods"
            description="Add a card or UPI ID for faster checkout."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {methods.map((m) => (
              <div key={m.id} className="card flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  {m.type === 'UPI' ? <Smartphone className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  {m.type === 'UPI' ? (
                    <>
                      <p className="font-semibold text-ink">UPI</p>
                      <p className="text-sm text-ink-muted">{m.vpa}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-ink">{m.brand} •••• {m.last4}</p>
                      <p className="text-sm text-ink-muted">Expires {m.expiry}</p>
                    </>
                  )}
                  {m.isDefault && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                      <Star className="h-3.5 w-3.5 fill-brand-600 text-brand-600" /> Default
                    </span>
                  )}
                </div>
                <button onClick={() => remove(m)} className="btn-ghost h-9 w-9 p-0 text-red-600 hover:bg-red-50" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
