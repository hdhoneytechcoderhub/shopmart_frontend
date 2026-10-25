import Spinner from './Spinner';

export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-muted">
      <Spinner className="text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
