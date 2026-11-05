export const materials = {
  filterLabel: 'Filter by subject', allSubjects: 'All subjects', upload: 'Upload material', wholeSubject: 'Whole subject',
  emptyTitle: 'No learning materials yet', emptyNoSubject: 'Create a subject first, then upload PDFs to it.',
  emptyBody: 'Upload PDFs, notes or reference images. Files are stored privately and only signed-in students can open them.',
  viewOnly: 'View only', meta: '{size} · uploaded {date} · {file}', previewAria: 'Preview {title}', editAria: 'Edit {title}',
  deleteBody: 'The file is permanently removed from storage and students can no longer open it.',
  errors: {
    type: 'Only PDF, PNG, JPG, WebP or plain-text files can be uploaded.', tooBig: 'That file is {size}. The limit is {max}.',
    empty: 'That file is empty.', notPdf: 'This does not look like a valid PDF file.', chooseFile: 'Choose a file to upload.',
    enterTitle: 'Enter a title.', chooseSubject: 'Choose a subject.', uploadFailed: 'Upload failed: {reason}',
  },
  dialog: {
    editTitle: 'Edit material', uploadTitle: 'Upload material',
    description: 'PDF, PNG, JPG, WebP or text, up to {max}. Stored privately — students open it through the in-app viewer.',
    replaceFile: 'Replace file', file: 'File', current: 'Current: {name} ({size})', title: 'Title', titlePlaceholder: 'e.g. Functions — worked examples',
    desc: 'Description', subject: 'Subject', unit: 'Unit', type: 'Type',
    kinds: { pdf: 'PDF document', note: 'Notes', reference: 'Reference document', image: 'Image' },
    allowDownload: 'Allow download', allowHint: 'Off = students can read it in the app but not save it.', published: 'Published',
    publishedHint: 'Visible to students once its subject and unit are published.', uploading: 'Uploading…', uploadBtn: 'Upload',
  },
};
