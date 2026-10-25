import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RotateCcw, LifeBuoy, ArrowRight } from 'lucide-react';

export default function PaymentFailure() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reason = params.get('reason');

  return (
    <div className="container-page flex flex-col items-center py-16 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-red-100 text-red-600">
        <XCircle className="h-10 w-10" />
      </span>
      <h1 className="mt-6 text-3xl font-bold">Payment failed</h1>
      <p className="mt-2 max-w-md text-ink-muted">
        {reason || "We couldn't complete the payment for this order. Your cart and address are still saved — nothing was charged."}
      </p>

      {id && (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-2 text-sm text-ink-soft">
          Order reference: <span className="font-mono font-medium text-ink">#{id}</span>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={() => navigate('/checkout')} className="btn-primary">
          <RotateCcw className="h-4 w-4" /> Retry payment
        </button>
        <button onClick={() => navigate('/dashboard/orders')} className="btn-outline">
          View my orders <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={() => navigate('/contact')} className="btn-ghost">
          <LifeBuoy className="h-4 w-4" /> Contact support
        </button>
      </div>
    </div>
  );
}
