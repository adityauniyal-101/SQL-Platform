import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { H2, Mail, UL } from '@/components/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: `Privacy Policy · ${SITE.name}` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {SITE.name} (&quot;we&quot;, &quot;us&quot;) is run by {SITE.ownerName}, an individual based in {SITE.location}.
        This policy explains what personal data we collect when you use the site, why, and the choices you have. It is written
        with India&apos;s Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;) in mind.
      </p>

      <H2>1. The short version</H2>
      <UL>
        <li>You do not need an account to practise. We do not ask for your email or phone number.</li>
        <li>We store the SQL you run so the platform can grade it and so instructors can see how questions are going.</li>
        <li>If you join an assessment, we store the name you type in, your answers and your score, and share them with the instructor who runs that assessment.</li>
        <li>We do not sell your data, show ads, or use tracking or analytics cookies.</li>
      </UL>

      <H2>2. What we collect</H2>
      <UL>
        <li>
          <strong className="text-white">Practice queries.</strong> The SQL you run, the question it was for, whether it was
          correct, any error message, and the time. Practice attempts are stored without your name.
        </li>
        <li>
          <strong className="text-white">Assessment data.</strong> The name you enter when joining an assessment, the SQL you
          run for each question, your score, and start/submit times.
        </li>
        <li>
          <strong className="text-white">Technical data.</strong> Like almost every website, our hosting provider automatically
          records request logs (IP address, browser type, pages requested, time). We use these only to keep the service running
          and secure, for example to block abuse.
        </li>
        <li>
          <strong className="text-white">Data stored in your browser.</strong> We keep small preferences in your browser&apos;s
          local storage (for example, whether you have finished the guided tour, and your in-progress assessment). This stays on
          your device.
        </li>
      </UL>
      <p>Please do not type personal information (yours or anyone else&apos;s) into the SQL editor.</p>

      <H2>3. Why we use it</H2>
      <UL>
        <li>To run and grade your queries and show you results.</li>
        <li>To let the instructor who created an assessment see participants&apos; names, answers and scores.</li>
        <li>To understand which questions are hard and improve them (using aggregated practice data).</li>
        <li>To protect the service from abuse, attacks and overload (rate limiting, security logs).</li>
      </UL>
      <p>
        By using the site, and in particular by entering your name to join an assessment, you consent to this processing for these
        purposes. You can withdraw consent at any time by contacting us (see section 7); this does not affect processing that
        already happened.
      </p>

      <H2>4. Cookies</H2>
      <p>We use only strictly necessary cookies, so we do not show a cookie banner:</p>
      <UL>
        <li>
          <code className="text-gray-200">assessment_session</code>: keeps your assessment attempt tied to your browser so nobody
          else can submit or view it. Expires shortly after the assessment time limit.
        </li>
        <li>
          <code className="text-gray-200">admin_token</code>: used only for instructors who log in to the admin area. Expires
          after 8 hours.
        </li>
      </UL>

      <H2>5. Who we share it with</H2>
      <p>We do not sell or rent personal data. We share it only with:</p>
      <UL>
        <li>The instructor or institute running an assessment you join (your name, answers and score).</li>
        <li>
          Service providers that host the site for us: Render (application hosting) and Turso (database hosting). They process
          data on our behalf and may store it on servers outside India.
        </li>
        <li>Authorities, where we are legally required to.</li>
      </UL>

      <H2>6. How long we keep it</H2>
      <p>
        We keep practice attempts and assessment results while they are useful for learning and grading, and delete them when no
        longer needed or when you ask us to (where we can identify your data). Hosting logs are kept by our providers for a
        limited period under their own policies.
      </p>

      <H2>7. Your rights</H2>
      <p>Under the DPDP Act you can ask us to:</p>
      <UL>
        <li>tell you what personal data of yours we hold and how it is used;</li>
        <li>correct or update it;</li>
        <li>erase it (for example, delete an assessment submission made under your name);</li>
        <li>withdraw your consent;</li>
        <li>nominate another person to exercise these rights if you die or become incapacitated.</li>
      </UL>
      <p>
        Email <Mail /> with enough detail for us to find your data (for example, the assessment name, the name you used and the
        approximate date). We aim to respond within 30 days. If you are not satisfied with our response, you may complain to the
        Data Protection Board of India.
      </p>

      <H2>8. Children</H2>
      <p>
        The site is meant for students learning SQL, including through schools, colleges and bootcamps. If you are under 18,
        please use it only with the permission of a parent, guardian or your institute. We do not track users or show targeted
        advertising. If you believe a child has given us personal data without appropriate consent, contact us and we will
        delete it.
      </p>

      <H2>9. Security</H2>
      <p>
        We use reasonable safeguards: encrypted connections (HTTPS), read-only access to practice datasets, authentication for
        the admin area, and rate limiting. No system is perfectly secure; if a personal-data breach happens, we will notify
        affected users and the authorities as the law requires.
      </p>

      <H2>10. Changes</H2>
      <p>
        We may update this policy. We will change the &quot;Last updated&quot; date above, and for significant changes we will
        show a notice on the site.
      </p>

      <H2>11. Contact / grievance officer</H2>
      <p>
        {SITE.ownerName}, {SITE.location}. Email: <Mail />. See also our{' '}
        <Link href="/terms" className="text-blue-400 hover:text-blue-300">Terms of Use</Link>.
      </p>
    </LegalPage>
  );
}
