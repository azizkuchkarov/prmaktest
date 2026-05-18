import { getCurrentStudent } from "@/lib/student-auth";
import { FinalCTABody } from "@/components/landing/FinalCTABody";

export async function FinalCTA() {
  const student = await getCurrentStudent();
  const href = student ? "/kabinet" : "/auth/royxatdan-otish";
  return <FinalCTABody href={href} />;
}
