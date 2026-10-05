import type { Metadata } from 'next';
import LegalPage, { H2, Mail, UL } from '@/components/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: `Contact · ${SITE.name}` };

export default function ContactPage() {
  return (
    <LegalPage title="Contact" showUpdated={false}>
      <p>
        {SITE.name} is run by {SITE.ownerName}, {SITE.location}. The quickest way to reach us is by email: <Mail />.
      </p>

      <H2>Write to us about</H2>
      <UL>
        <li>bugs, or a question that seems to grade incorrectly (include the question title and your query);</li>
        <li>privacy requests: seeing, correcting or deleting your data (see the Privacy Policy, section 7);</li>
        <li>security issues: if you found a vulnerability, please tell us privately before sharing it;</li>
        <li>institutes or instructors who want to use the platform.</li>
      </UL>

      <H2>Grievance officer</H2>
      <p>
        For complaints under India&apos;s IT Rules, 2021 and the DPDP Act, 2023, contact {SITE.ownerName} at <Mail />. We
        acknowledge complaints within 24 hours where possible and aim to resolve them within 15 days.
      </p>
    </LegalPage>
  );
}
