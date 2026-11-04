import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';

export const CALLOUT_VARIANTS = [
  { id: 'definition', label: 'Definition' },
  { id: 'note', label: 'Note' },
  { id: 'key', label: 'Key concept' },
  { id: 'example', label: 'Example' },
  { id: 'warning', label: 'Watch out' },
] as const;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant: string) => ReturnType;
      unsetCallout: () => ReturnType;
    };
    mathInline: { insertMathInline: (latex: string) => ReturnType };
    mathBlock: { insertMathBlock: (latex: string) => ReturnType };
  }
}

/** Definition / note / key-concept / example / warning boxes. */
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: 'note',
        parseHTML: (el) => el.getAttribute('data-variant') || 'note',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
  },
  addCommands() {
    return {
      setCallout: (variant) => ({ commands, editor }) => {
        if (editor.isActive('callout')) return commands.updateAttributes('callout', { variant });
        return commands.wrapIn('callout', { variant });
      },
      unsetCallout: () => ({ commands }) => commands.lift('callout'),
    };
  },
});

function renderMath(dom: HTMLElement, latex: string, display: boolean) {
  try {
    katex.render(latex || '\\square', dom, { throwOnError: false, displayMode: display, strict: 'ignore' });
  } catch {
    dom.textContent = latex;
  }
}

function mathNode(name: 'mathInline' | 'mathBlock') {
  const block = name === 'mathBlock';
  const dataType = block ? 'math-block' : 'math';
  return Node.create({
    name,
    group: block ? 'block' : 'inline',
    inline: !block,
    atom: true,
    selectable: true,
    draggable: false,
    addAttributes() {
      return {
        latex: {
          default: '',
          parseHTML: (el) => el.getAttribute('data-latex') ?? '',
          renderHTML: (attrs) => ({ 'data-latex': attrs.latex }),
        },
      };
    },
    parseHTML() {
      return [{ tag: `${block ? 'div' : 'span'}[data-type="${dataType}"]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return [block ? 'div' : 'span', mergeAttributes(HTMLAttributes, { 'data-type': dataType })];
    },
    addNodeView() {
      return ({ node, getPos }) => {
        const dom = document.createElement(block ? 'div' : 'span');
        dom.setAttribute('data-type', dataType);
        dom.setAttribute('role', 'button');
        dom.setAttribute('tabindex', '0');
        dom.setAttribute('title', 'Click to edit formula');
        renderMath(dom, node.attrs.latex, block);
        const open = () => {
          const pos = typeof getPos === 'function' ? getPos() : undefined;
          window.dispatchEvent(new CustomEvent('zetora-edit-math', { detail: { pos, latex: node.attrs.latex, block } }));
        };
        dom.addEventListener('click', open);
        dom.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') open(); });
        return {
          dom,
          update(updated) {
            if (updated.type.name !== name) return false;
            renderMath(dom, updated.attrs.latex, block);
            return true;
          },
        };
      };
    },
    addCommands() {
      return block
        ? ({ insertMathBlock: (latex: string) => ({ commands }: { commands: { insertContent: (c: unknown) => boolean } }) => commands.insertContent({ type: 'mathBlock', attrs: { latex } }) } as never)
        : ({ insertMathInline: (latex: string) => ({ commands }: { commands: { insertContent: (c: unknown) => boolean } }) => commands.insertContent({ type: 'mathInline', attrs: { latex } }) } as never);
    },
  });
}

export const MathInline = mathNode('mathInline');
export const MathBlock = mathNode('mathBlock');
