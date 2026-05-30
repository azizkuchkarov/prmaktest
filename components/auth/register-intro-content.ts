import { EXAM_PROGRAM_LABELS } from "@/lib/exam-program";

export type RegisterIntroIcon =
  | "school"
  | "barChart3"
  | "trophy"
  | "graduationCap"
  | "users"
  | "userCog"
  | "bookOpen";

export type RegisterIntroStep = {
  icon: RegisterIntroIcon;
  title: string;
  text: string;
};

export const STUDENT_REGISTER_INTRO: RegisterIntroStep[] = [
  {
    icon: "school",
    title: "Maktablar dasturlari",
    text: `${EXAM_PROGRAM_LABELS.PRESIDENT_SCHOOL.title} — ${EXAM_PROGRAM_LABELS.PRESIDENT_SCHOOL.subtitle} ${EXAM_PROGRAM_LABELS.SPECIALIZED_SCHOOL.title} — ${EXAM_PROGRAM_LABELS.SPECIALIZED_SCHOOL.subtitle} ${EXAM_PROGRAM_LABELS.AL_XORAZMIY.title} — ${EXAM_PROGRAM_LABELS.AL_XORAZMIY.subtitle}`,
  },
  {
    icon: "barChart3",
    title: "Reytinglar",
    text: "Respublika, viloyat va sinf bo‘yicha reyting jadvali. Har bir testdan keyin ballingiz yangilanadi — o‘z o‘rningizni kuzatib boring.",
  },
  {
    icon: "trophy",
    title: "Turnirlar",
    text: "Admin belgilagan vaqtda maxsus turnirlarda qatnashing. Natijalar alohida turnir reytingida e’lon qilinadi — oddiy kabinet reytingidan mustaqil.",
  },
];

export const TEACHER_REGISTER_INTRO: RegisterIntroStep[] = [
  {
    icon: "graduationCap",
    title: "Virtual sinflar",
    text: "O‘z virtual sinflaringizni yarating: nom, tavsif va o‘quvchilarni bir joyda jamlang. Har bir sinf alohida boshqariladi.",
  },
  {
    icon: "users",
    title: "O‘quvchilarni boshqarish",
    text: "O‘quvchilar telefon raqamingiz orqali sinfga qo‘shilish so‘rovini yuboradi. Taklif yuboring, so‘rovlarni tasdiqlang yoki rad eting.",
  },
  {
    icon: "userCog",
    title: "Reytingni aniqlash",
    text: "Sinflaringiz bo‘yicha test natijalari va reyting jadvalini ko‘ring. Qaysi o‘quvchi qanday o‘sayotganini bir panelda kuzating.",
  },
];

export const STUDENT_ROLE_CARD = {
  icon: "bookOpen" as const,
  title: "Men oddiy o‘quvchiman",
  description: "Testlar, reyting va turnirlarda qatnashish uchun.",
  href: "/auth/royxatdan-otish/oquvchi",
};

export const TEACHER_ROLE_CARD = {
  icon: "graduationCap" as const,
  title: "Men o‘qituvchiman",
  description: "Virtual sinflar, o‘quvchilar va sinf reytingi uchun.",
  href: "/auth/royxatdan-otish/oqituvchi",
};
