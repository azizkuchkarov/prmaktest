import type { KabinetBentoTest } from "@/components/kabinet/kabinet-bento-types";
import type { CatalogTestRowModel } from "@/lib/build-exam-catalog-sections";

/** Server va client: katalog qatorini `KabinetCatalogTestRow` uchun modelga aylantiradi */
export function catalogModelToKabinetRow(t: CatalogTestRowModel): KabinetBentoTest {
  const createdIso = typeof t.createdAt === "string" ? t.createdAt : t.createdAt.toISOString();
  return {
    id: t.id,
    title: t.title,
    subject: t.subject ?? "",
    description: t.description ?? "",
    durationMinutes: t.durationMinutes,
    priceSum: t.priceSum,
    questionsCount: t._count.questions,
    stage: "saralash",
    updatedAt: createdIso,
    createdAt: createdIso,
    completed: !!t.completed,
    catalogCategory: String(t.catalogCategory ?? "MATHEMATICS"),
    examSchoolProgram: t.examSchoolProgram,
    examTargetCohort: t.examTargetCohort,
    specializedSixTrack: t.specializedSixTrack,
  };
}
