'use client';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  ArrowLeft, Bold, Eye, EyeOff, Heading2, Heading3, Highlighter, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Redo2,
  Save, Send, Sigma, Strikethrough, Table2, Underline, Undo2, Unlink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Callout, CALLOUT_VARIANTS, MathBlock, MathInline } from './extensions';
import { saveSummaryAction, unpublishSummaryAction } from '@/lib/actions/admin';
import { createClient } from '@/lib/supabase/client';
import { resizeImage } from '@/lib/image';
import { MEDIA_BUCKET } from '@/lib/constants';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

type Dlg = null | 'link' | 'image' | 'math';

function Tb({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 [&_svg]:size-4', active && 'bg-primary-soft text-primary')}
    >
      {children}
    </button>
  );
}
const Sep = () => <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />;

export function SummaryEditor({
  unitId, unitTitle, subjectTitle, subjectSlug, initialHtml, status,
}: {
  unitId: string; unitTitle: string; subjectTitle: string; subjectSlug: string; initialHtml: string; status: 'none' | 'draft' | 'published';
}) {
  const router = useRouter();
  const [dlg, setDlg] = useState<Dlg>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();
  const [current, setCurrent] = useState(status);
  const [mathEdit, setMathEdit] = useState<{ pos: number | null; latex: string; block: boolean } | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true, // keep toolbar active-states and table controls live
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } } }),
      TableKit.configure({ table: { resizable: false } }),
      Image.configure({ inline: false }),
      Highlight,
      Placeholder.configure({ placeholder: 'Start writing the unit summary… Use the toolbar for headings, lists, tables, formulas and highlighted boxes.' }),
      Callout, MathInline, MathBlock,
    ],
    content: initialHtml || '',
    editorProps: { attributes: { class: 'summary-prose editor-surface min-h-[28rem] px-4 py-5 outline-none sm:px-8 sm:py-8', 'aria-label': 'Summary content' } },
    onUpdate: () => setDirty(true),
  });

  // Click a formula in the document to edit it.
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ pos: number | undefined; latex: string; block: boolean }>).detail;
      setMathEdit({ pos: d.pos ?? null, latex: d.latex, block: d.block });
      setDlg('math');
    };
    window.addEventListener('zetora-edit-math', h);
    return () => window.removeEventListener('zetora-edit-math', h);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const save = useCallback((publish: boolean) => {
    if (!editor) return;
    const html = editor.isEmpty ? '' : editor.getHTML();
    startSave(async () => {
      const res = await saveSummaryAction(unitId, html, publish);
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? 'Saved');
      setDirty(false);
      setCurrent(res.data!.status);
      router.refresh();
    });
  }, [editor, unitId, router]);

  if (!editor) return <div className="h-96 animate-pulse rounded-xl bg-muted" />;

  const inTable = editor.isActive('table');

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="icon-sm" aria-label="Back to summaries"><Link href="/admin/summaries"><ArrowLeft /></Link></Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{subjectTitle}</p>
          <h1 className="truncate text-lg font-bold tracking-tight">{unitTitle}</h1>
        </div>
        <Badge variant={current === 'published' ? 'success' : current === 'draft' ? 'warning' : 'muted'}>{current === 'none' ? 'Not started' : current === 'published' ? 'Published' : 'Draft'}</Badge>
        {dirty && <Badge variant="muted">Unsaved changes</Badge>}
        <div className="flex flex-wrap gap-2">
          {current === 'published' && (
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => startSave(async () => { const r = await unpublishSummaryAction(unitId); if (!r.ok) return void toast.error(r.error); toast.success(r.message ?? 'Unpublished'); setCurrent('draft'); router.refresh(); })}><EyeOff /> Unpublish</Button>
          )}
          {current === 'published' && (
            <Button asChild variant="ghost" size="sm"><Link href={`/subjects/${subjectSlug}/units/${unitId}?tab=summary`} target="_blank"><Eye /> View as student</Link></Button>
          )}
          <Button variant="outline" onClick={() => save(false)} loading={saving}><Save /> Save draft</Button>
          <Button onClick={() => save(true)} loading={saving}><Send /> {current === 'published' ? 'Update published' : 'Publish'}</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="sticky top-16 z-10 bg-card/95 backdrop-blur">
        <div className="no-scrollbar flex items-center gap-0.5 overflow-x-auto border-b p-1.5" role="toolbar" aria-label="Formatting">
          <Tb label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 /></Tb>
          <Tb label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 /></Tb>
          <Sep />
          <Tb label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 /></Tb>
          <Tb label="Subheading" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 /></Tb>
          <Sep />
          <Tb label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></Tb>
          <Tb label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></Tb>
          <Tb label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline /></Tb>
          <Tb label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough /></Tb>
          <Tb label="Highlight important text" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter /></Tb>
          <Sep />
          <Tb label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></Tb>
          <Tb label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></Tb>
          <Tb label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></Tb>
          <Sep />
          <Tb label="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 /></Tb>
          <Tb label="Insert image" onClick={() => setDlg('image')}><ImagePlus /></Tb>
          <Tb label="Insert formula" onClick={() => { setMathEdit(null); setDlg('math'); }}><Sigma /></Tb>
          <Tb label={editor.isActive('link') ? 'Remove link' : 'Add link'} active={editor.isActive('link')} onClick={() => (editor.isActive('link') ? editor.chain().focus().unsetLink().run() : setDlg('link'))}>{editor.isActive('link') ? <Unlink /> : <Link2 />}</Tb>
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b bg-muted/40 px-2.5 py-2" role="toolbar" aria-label="Highlighted boxes">
          <span className="shrink-0 pr-1 text-xs font-medium text-muted-foreground">Boxes:</span>
          {CALLOUT_VARIANTS.map((v) => (
            <button key={v.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setCallout(v.id).run()}
              className={cn('h-8 shrink-0 rounded-md border bg-card px-2.5 text-xs font-medium transition-colors hover:border-input hover:bg-muted', editor.isActive('callout', { variant: v.id }) && 'border-primary bg-primary-soft text-primary')}>
              {v.label}
            </button>
          ))}
          {editor.isActive('callout') && (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().unsetCallout().run()} className="h-8 shrink-0 rounded-md px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted">Remove box</button>
          )}
          {inTable && (
            <>
              <Sep />
              {[
                ['Add row below', () => editor.chain().focus().addRowAfter().run()],
                ['Add column', () => editor.chain().focus().addColumnAfter().run()],
                ['Delete row', () => editor.chain().focus().deleteRow().run()],
                ['Delete column', () => editor.chain().focus().deleteColumn().run()],
                ['Delete table', () => editor.chain().focus().deleteTable().run()],
              ].map(([label, fn]) => (
                <button key={label as string} type="button" onMouseDown={(e) => e.preventDefault()} onClick={fn as () => void} className="h-8 shrink-0 rounded-md border bg-card px-2.5 text-xs font-medium hover:bg-muted">{label as string}</button>
              ))}
            </>
          )}
        </div>
        </div>

        <EditorContent editor={editor} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Tip: students see exactly this layout. Click any formula to edit it. Use “Save draft” while you work and “Publish” when it is ready.</p>

      {dlg === 'link' && <LinkDialog editor={editor} onClose={() => setDlg(null)} />}
      {dlg === 'image' && <ImageDialog editor={editor} unitId={unitId} onClose={() => setDlg(null)} />}
      {dlg === 'math' && <MathDialog editor={editor} edit={mathEdit} onClose={() => { setDlg(null); setMathEdit(null); }} />}
    </div>
  );
}

function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState('https://');
  const valid = /^https?:\/\/[^\s]+\.[^\s]+$/i.test(url);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add link</DialogTitle><DialogDescription>Select the text first, then paste the web address.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!valid) return; editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); onClose(); }} className="space-y-4">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Web address" inputMode="url" autoFocus />
          <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!valid}>Add link</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImageDialog({ editor, unitId, onClose }: { editor: Editor; unitId: string; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [busy, setBusy] = useState(false);
  async function insert() {
    if (!file) return;
    setBusy(true);
    try {
      const { blob, ext, type } = await resizeImage(file, 1400, 0.82);
      const path = `summaries/${unitId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await createClient().storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000' });
      if (error) throw new Error(error.message);
      editor.chain().focus().setImage({ src: `${env.supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`, alt: alt.trim() }).run();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Insert image</DialogTitle><DialogDescription>Images are resized automatically so pages load quickly on slow connections.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="Image file" />
          <div>
            <label htmlFor="alt" className="mb-1.5 block text-sm font-medium">Description for screen readers</label>
            <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Graph of y = x squared" />
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={insert} loading={busy} disabled={!file}>Insert</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SNIPPETS: [string, string][] = [
  ['Fraction', '\\frac{a}{b}'], ['Square root', '\\sqrt{x}'], ['Power', 'x^{2}'], ['Subscript', 'x_{1}'],
  ['Sum', '\\sum_{i=1}^{n} i'], ['Limit', '\\lim_{x\\to 0}\\frac{\\sin x}{x}'], ['Integral', '\\int_a^b f(x)\\,dx'], ['Arrow', 'A \\rightarrow B'],
];

function MathDialog({ editor, edit, onClose }: { editor: Editor; edit: { pos: number | null; latex: string; block: boolean } | null; onClose: () => void }) {
  const [latex, setLatex] = useState(edit?.latex ?? '');
  const [block, setBlock] = useState(edit?.block ?? false);
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!preview.current) return;
    try { katex.render(latex || '\\text{Preview appears here}', preview.current, { throwOnError: false, displayMode: block, strict: 'ignore' }); } catch { preview.current.textContent = latex; }
  }, [latex, block]);

  function apply() {
    const value = latex.trim();
    if (!value) return;
    if (edit && edit.pos != null) {
      const pos = edit.pos;
      editor.chain().focus().command(({ tr }) => { tr.setNodeMarkup(pos, undefined, { latex: value }); return true; }).run();
    } else if (block) {
      // Trailing paragraph keeps the cursor OUT of the formula node, so the next insert can't replace it.
      editor.chain().focus().insertContent([{ type: 'mathBlock', attrs: { latex: value } }, { type: 'paragraph' }]).run();
    }
    else editor.chain().focus().insertMathInline(value).run();
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{edit ? 'Edit formula' : 'Insert formula'}</DialogTitle><DialogDescription>Type LaTeX, for example <code className="rounded bg-muted px-1">\frac{'{a}{b}'}</code>. A live preview is shown below.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <Textarea value={latex} onChange={(e) => setLatex(e.target.value)} rows={3} className="font-mono text-sm" aria-label="LaTeX formula" autoFocus spellCheck={false} />
          <div className="flex flex-wrap gap-1.5">
            {SNIPPETS.map(([label, s]) => <button key={label} type="button" onClick={() => setLatex((l) => (l ? `${l} ${s}` : s))} className="rounded-md border bg-card px-2 py-1 text-xs hover:bg-muted">{label}</button>)}
          </div>
          {!edit && (
            <div className="flex gap-2" role="radiogroup" aria-label="Formula style">
              {[[false, 'Inline (inside a sentence)'], [true, 'Display (own line)']].map(([v, l]) => (
                <button key={String(v)} type="button" role="radio" aria-checked={block === v} onClick={() => setBlock(v as boolean)} className={cn('h-9 rounded-lg border px-3 text-xs font-medium', block === v ? 'border-primary bg-primary-soft text-primary' : 'hover:bg-muted')}>{l as string}</button>
              ))}
            </div>
          )}
          <div className="min-h-16 overflow-x-auto rounded-lg border bg-muted/40 p-4 text-center" aria-live="polite"><div ref={preview} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={apply} disabled={!latex.trim()}>{edit ? 'Update formula' : 'Insert formula'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
