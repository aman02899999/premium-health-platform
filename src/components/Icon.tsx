import {
  Activity,
  Award,
  Crown,
  Droplets,
  Dumbbell,
  Flame,
  HeartPulse,
  PieChart,
  Ruler,
  Salad,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Allow-list of icons the admin can pick by name.
export const ICONS: Record<string, LucideIcon> = {
  Activity,
  Award,
  Crown,
  Droplets,
  Dumbbell,
  Flame,
  HeartPulse,
  PieChart,
  Ruler,
  Salad,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  UserCheck,
  Users,
  Zap,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Dumbbell;
  return <C className={className} aria-hidden />;
}
