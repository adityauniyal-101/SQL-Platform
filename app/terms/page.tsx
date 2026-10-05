import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { H2, Mail, UL } from '@/components/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: `Terms of Use · ${SITE.name}` };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        These terms govern your use of {SITE.name} (the &quot;Service&quot;), run by {SITE.ownerName} (&quot;we&quot;,
        &quot;us&quot;). By using the Service you agree to them. If you do not agree, please do not use the Service.
      </p>

      <H2>1. The Service</H2>
      <p>
        The Service lets you practise SQL against sample datasets and take timed assessments set by instructors. It is provided
        free of charge for learning purposes. We may change, pause or discontinue any part of it at any time.
      </p>

      <H2>2. Acceptable use</H2>
      <p>You agree not to:</p>
      <UL>
        <li>
          attempt to break, overload or gain unauthorised access to the Service, its servers or its data, including through
          deliberately expensive or malicious queries;
        </li>
        <li>use bots or scripts to send large volumes of requests, or try to get around rate limits;</li>
        <li>attempt to access the admin area, or another person&apos;s assessment, without permission;</li>
        <li>cheat on assessments in ways your instructor has not allowed, or impersonate someone else when joining one;</li>
        <li>enter personal, confidential or unlawful content into the editor or name fields;</li>
        <li>use the Service in any way that breaks Indian law or any law that applies to you.</li>
      </UL>
      <p>We may block access, delete data or end your use of the Service if you break these terms.</p>

      <H2>3. Assessments and grading</H2>
      <p>
        Grading is automatic: your query&apos;s output is compared with the expected output. We work to keep this accurate, but
        automated grading can be wrong. Assessment results are informational. The instructor or institute running an assessment
        is responsible for how they use the results; please contact them first about any dispute.
      </p>

      <H2>4. Content and intellectual property</H2>
      <p>
        The questions, datasets, design and code of the Service belong to us or to the instructors who created them. You may use
        them for your own learning. You may not copy, republish or sell them without permission. You keep ownership of the SQL
        you write, and you give us permission to store and process it to run, grade and improve the Service.
      </p>

      <H2>5. No warranty</H2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, express or
        implied, including fitness for a particular purpose, accuracy or uninterrupted availability.
      </p>

      <H2>6. Limitation of liability</H2>
      <p>
        To the fullest extent permitted by law, we are not liable for any indirect, incidental or consequential loss, or for loss
        of data, marks, opportunities or profits, arising from your use of the Service. Our total liability for any claim
        relating to the Service is limited to ₹1,000 or the amount you paid us in the past 12 months, whichever is higher.
      </p>

      <H2>7. Privacy</H2>
      <p>
        Our <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link> explains what data we
        collect and how we use it.
      </p>

      <H2>8. Changes to these terms</H2>
      <p>
        We may update these terms and will change the &quot;Last updated&quot; date above. If you keep using the Service after a
        change, you accept the updated terms.
      </p>

      <H2>9. Governing law</H2>
      <p>
        These terms are governed by the laws of India. Courts in {SITE.jurisdictionCity}, India have exclusive jurisdiction over
        any dispute.
      </p>

      <H2>10. Contact</H2>
      <p>
        Questions about these terms: <Mail />.
      </p>
    </LegalPage>
  );
}
