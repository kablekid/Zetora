import type { Metadata } from 'next';
import { ProsePage } from '@/components/marketing/prose-page';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Zetora collects, uses and protects your information.',
  alternates: { canonical: '/privacy' },
};

// NOTE for the site owner: this is a plain-language starting point that matches
// what the app actually does today. Have it reviewed against the laws that apply
// to you before launch.
export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy policy" updated="1 January 2026" intro="We collect only what we need to run your learning account. We do not sell your data.">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your name, email address and password (stored securely by our authentication provider — we never see your password).</li>
          <li><strong>Optional profile details:</strong> school or institution, location and profile picture, if you choose to add them.</li>
          <li><strong>Learning activity:</strong> units you open and complete, bookmarks, quiz and exam answers, scores and timings.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To provide your dashboard, progress tracking and results.</li>
          <li>To send essential account emails such as email confirmation and password reset.</li>
          <li>To understand which content helps students, using aggregated activity.</li>
        </ul>
        <p>Administrators can see student accounts and activity in order to manage the platform and support students.</p>
      </section>
      <section>
        <h2>Cookies and storage</h2>
        <p>We use cookies that are strictly necessary to keep you signed in and to remember your light or dark theme. We do not use advertising or cross-site tracking cookies.</p>
      </section>
      <section>
        <h2>Where data is stored</h2>
        <p>Data is stored with our infrastructure provider (Supabase). Learning documents are kept in private storage and are only available to signed-in students through short-lived links.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>You can edit your profile at any time in Settings. To ask for your account and data to be deleted or exported, contact us{env.contactEmail ? <> at <a className="font-medium text-primary hover:underline" href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a></> : ' using the details on the Contact page'}.</p>
      </section>
      <section>
        <h2>Children</h2>
        <p>Zetora is designed for secondary-school students. If you are under 18, please use the platform with the knowledge of a parent or guardian.</p>
      </section>
    </ProsePage>
  );
}
