import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingFooter } from '@/components/marketing/footer';
import { getUser } from '@/lib/auth';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader signedIn={Boolean(user)} />
      <main id="main" className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
