import { Benefits } from "@/components/landing/Benefits";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingSupport247 } from "@/components/landing/LandingSupport247";
import { ParentMonitoring } from "@/components/landing/ParentMonitoring";
import { Ranking } from "@/components/landing/Ranking";
import { Subjects } from "@/components/landing/Subjects";
import { TestSchedule } from "@/components/landing/TestSchedule";
import { getAdminSiteSettingsCached, isKabinetSupportReady } from "@/lib/admin-site-settings";

export default async function Home() {
  const siteSettings = await getAdminSiteSettingsCached();
  const supportConfigured = isKabinetSupportReady(siteSettings.supportTelegramChatId);

  return (
    <>
      <LandingHeader />
      <main className="flex-1 min-w-0 w-full overflow-x-clip">
        <Hero />
        <Benefits />
        <HowItWorks />
        <Ranking />
        <ParentMonitoring />
        <Subjects />
        <TestSchedule />
        <FinalCTA />
      </main>
      <LandingFooter />
      <LandingSupport247 supportConfigured={supportConfigured} />
    </>
  );
}
