'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, FileText, FolderOpen, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn, pct } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { BookOpen } from 'lucide-react';
import { SUBJECT_ICONS, subjectTone } from '@/lib/registry';
import type { SubjectCard as SubjectCardData } from '@/lib/types';

export function SubjectTile({ icon, color, className, size = 'md' }: { icon: string; color: string; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = SUBJECT_ICONS[icon] ?? BookOpen;
  const tone = subjectTone(color);
  const dims = size === 'sm' ? 'size-9 [&_svg]:size-[18px]' : size === 'lg' ? 'size-14 [&_svg]:size-7' : 'size-11 [&_svg]:size-[22px]';
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-xl', tone.tile, tone.text, dims, className)}>
      <Icon />
    </span>
  );
}

export function SubjectCard({
  subject,
  href,
  showProgress = true,
  guest = false,
}: {
  subject: SubjectCardData;
  href: string;
  showProgress?: boolean;
  /** Signed-out visitors on the landing page: the CTA invites them to sign up. */
  guest?: boolean;
}) {
  const t = useT('subjects');
  const tc = useT('common');
  const tone = subjectTone(subject.color);
  const progress = pct(subject.completed_units, subject.unit_count);
  return (
    <Link href={href} className="group block rounded-xl outline-offset-4">
      <Card className="relative flex h-full flex-col overflow-hidden p-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-input group-hover:shadow-[var(--shadow-pop)]">
        {subject.image_url ? (
          <div className="relative h-28 w-full bg-muted">
            <Image src={subject.image_url} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
          </div>
        ) : (
          <div aria-hidden className={cn('h-1.5 w-full', tone.solid)} />
        )}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start gap-3.5">
            <SubjectTile icon={subject.icon} color={subject.color} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold tracking-tight">{subject.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{tc('count.unit', { count: subject.unit_count })}</p>
            </div>
          </div>
          <p className="mt-3.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
            {subject.description || t('card.fallback')}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Layers className="size-3.5" />{tc('count.unit', { count: subject.unit_count })}</span>
            <span className="inline-flex items-center gap-1.5"><FileText className="size-3.5" />{tc('count.summary', { count: subject.summary_count })}</span>
            <span className="inline-flex items-center gap-1.5"><FolderOpen className="size-3.5" />{tc('count.file', { count: subject.resource_count })}</span>
          </div>
          {showProgress && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t('card.unitsProgress', { done: subject.completed_units, total: subject.unit_count })}
                </span>
                <span className="font-semibold tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" barClassName={tone.solid} aria-label={t('card.progressAria', { title: subject.title })} />
            </div>
          )}
          <div className="mt-auto pt-5">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {guest ? t('card.signUp') : t('card.explore')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
