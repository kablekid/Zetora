export const editor = {
  placeholder: 'Start writing the unit summary… Use the toolbar for headings, lists, tables, formulas and highlighted boxes.',
  contentAria: 'Summary content', backAria: 'Back to summaries',
  status: { none: 'Not started', published: 'Published', draft: 'Draft' }, unsaved: 'Unsaved changes',
  unpublish: 'Unpublish', unpublished: 'Unpublished', viewAsStudent: 'View as student', saveDraft: 'Save draft', publish: 'Publish', updatePublished: 'Update published',
  toolbar: 'Formatting', undo: 'Undo', redo: 'Redo', heading: 'Heading', subheading: 'Subheading', bold: 'Bold', italic: 'Italic', underline: 'Underline',
  strike: 'Strikethrough', highlight: 'Highlight important text', bullets: 'Bulleted list', numbers: 'Numbered list', quote: 'Quote',
  insertTable: 'Insert table', insertImage: 'Insert image', insertFormula: 'Insert formula', removeLink: 'Remove link', addLink: 'Add link',
  boxesToolbar: 'Highlighted boxes', boxes: 'Boxes:', removeBox: 'Remove box',
  callouts: { definition: 'Definition', note: 'Note', key: 'Key concept', example: 'Example', warning: 'Watch out' },
  table: { addRow: 'Add row below', addCol: 'Add column', delRow: 'Delete row', delCol: 'Delete column', delTable: 'Delete table' },
  tip: 'Tip: students see exactly this layout. Click any formula to edit it. Use “Save draft” while you work and “Publish” when it is ready.',
  link: { title: 'Add link', description: 'Select the text first, then paste the web address.', address: 'Web address', add: 'Add link' },
  image: {
    title: 'Insert image', description: 'Images are resized automatically so pages load quickly on slow connections.', file: 'Image file',
    alt: 'Description for screen readers', altPlaceholder: 'e.g. Graph of y = x squared', insert: 'Insert',
  },
  math: {
    editTitle: 'Edit formula', insertTitle: 'Insert formula',
    description: 'Type LaTeX, for example <code>\\frac{a}{b}</code>. A live preview is shown below.', aria: 'LaTeX formula', styleAria: 'Formula style',
    inline: 'Inline (inside a sentence)', display: 'Display (own line)', preview: 'Preview appears here', update: 'Update formula', editHint: 'Click to edit formula',
    snippets: { fraction: 'Fraction', sqrt: 'Square root', power: 'Power', subscript: 'Subscript', sum: 'Sum', limit: 'Limit', integral: 'Integral', arrow: 'Arrow' },
  },
};
