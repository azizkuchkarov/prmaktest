"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  School,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import type { RegisterIntroIcon } from "@/components/auth/register-intro-content";

export const REGISTER_INTRO_ICONS: Record<RegisterIntroIcon, LucideIcon> = {
  school: School,
  barChart3: BarChart3,
  trophy: Trophy,
  graduationCap: GraduationCap,
  users: Users,
  userCog: UserCog,
  bookOpen: BookOpen,
};

export function RegisterIntroIconView({
  name,
  className,
}: {
  name: RegisterIntroIcon;
  className?: string;
}) {
  const Icon = REGISTER_INTRO_ICONS[name];
  return <Icon className={className} aria-hidden />;
}
