import { Truck, Package, Tag, Star, ShieldCheck, Bell, Gift, Info, ClipboardCheck, UserPlus } from 'lucide-react';

// Maps a serializable icon key (stored in Redux state) to a lucide icon + color tone.
export const NOTIF_META = {
  truck: { Icon: Truck, tone: 'bg-emerald-100 text-emerald-600' },
  box: { Icon: Package, tone: 'bg-purple-100 text-purple-600' },
  tag: { Icon: Tag, tone: 'bg-pink-100 text-pink-600' },
  star: { Icon: Star, tone: 'bg-amber-100 text-amber-600' },
  shield: { Icon: ShieldCheck, tone: 'bg-blue-100 text-blue-600' },
  bell: { Icon: Bell, tone: 'bg-amber-100 text-amber-600' },
  gift: { Icon: Gift, tone: 'bg-emerald-100 text-emerald-600' },
  approval: { Icon: ClipboardCheck, tone: 'bg-amber-100 text-amber-600' },
  admin: { Icon: UserPlus, tone: 'bg-brand-100 text-brand-600' },
  info: { Icon: Info, tone: 'bg-slate-100 text-slate-600' },
};

export const notifMeta = (key) => NOTIF_META[key] || NOTIF_META.info;
