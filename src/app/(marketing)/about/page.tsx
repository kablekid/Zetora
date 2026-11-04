import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProsePage } from '@/components/marketing/prose-page';

export const metadata: Metadata = {
  title: 'About Zetora',
  description: 'Zetora is a learning platform built for Grade 12 remedial students in Ethiopia.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <ProsePage title="About Zetora" intro="Learn. Practice. Achieve. A focused place for Grade 12 remedial students to study, test themselves and track their progress.">
      <section>
        <h2>Why Zetora exists</h2>
        <p>Remedial students often study from scattered notes, photocopies and chat groups. It is hard to know what to read, what to practise, and whether you are improving.</p>
        <p>Zetora brings it together: organised subjects and units, clear summaries, PDF materials, interactive quizzes, timed exams and honest progress tracking — in one place that works well on a phone, even on a slow connection.</p>
      </section>
      <section>
        <h2>What you can do</h2>
        <ul>
          <li>Browse subjects and study unit by unit.</li>
          <li>Read well-formatted summaries with definitions, formulas and examples.</li>
          <li>Open learning materials and PDFs in the built-in viewer.</li>
          <li>Practise with quizzes and get instant feedback and explanations.</li>
          <li>Sit timed mock exams and review your results.</li>
          <li>See which topics are strong and which need more work.</li>
        </ul>
      </section>
      <section>
        <h2>Good to know</h2>
        <p>Zetora is an independent study platform. It is not run by, endorsed by or affiliated with any government body, university or examination authority. Content is prepared and maintained by the Zetora team.</p>
      </section>
      <Button asChild size="lg"><Link href="/register">Create your free account</Link></Button>
    </ProsePage>
  );
}
