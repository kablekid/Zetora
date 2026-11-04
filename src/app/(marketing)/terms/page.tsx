import type { Metadata } from 'next';
import { ProsePage } from '@/components/marketing/prose-page';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The rules for using Zetora.',
  alternates: { canonical: '/terms' },
};

// NOTE for the site owner: a plain-language starting point — review before launch.
export default function TermsPage() {
  return (
    <ProsePage title="Terms of service" updated="1 January 2026" intro="By creating an account or using Zetora you agree to these terms.">
      <section>
        <h2>Using Zetora</h2>
        <ul>
          <li>Zetora is for your personal study. Keep your login details private and don’t share your account.</li>
          <li>Provide accurate information when you register.</li>
          <li>Don’t attempt to access other students’ data, interfere with the service, or bypass security or exam timers.</li>
          <li>Don’t copy, resell or redistribute Zetora materials without permission.</li>
        </ul>
      </section>
      <section>
        <h2>Content</h2>
        <p>Summaries, questions and documents are provided to help you study. We work to keep them accurate, but they may contain mistakes and are not a substitute for your teachers or official textbooks. Sample or demonstration content is clearly labelled and is not an official syllabus.</p>
      </section>
      <section>
        <h2>Results and progress</h2>
        <p>Scores and analytics reflect your activity on Zetora only. They are a study aid and do not predict or guarantee any official examination result.</p>
      </section>
      <section>
        <h2>Availability</h2>
        <p>We aim to keep Zetora available but cannot promise uninterrupted service. We may update, change or remove features and content.</p>
      </section>
      <section>
        <h2>Suspension</h2>
        <p>We may suspend accounts that break these terms or put the platform or other students at risk.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We may update these terms. If we make important changes we will let you know in the app.</p>
      </section>
    </ProsePage>
  );
}
