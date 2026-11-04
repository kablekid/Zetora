// Minimal, valid multi-page PDF generator for upload / viewer tests.
export function makePdf(pages = ['Hello from Zetora']) {
  const objs = [];
  const add = (body) => { objs.push(body); return objs.length; };
  const catalog = add('');            // 1
  const pagesObj = add('');           // 2
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'); // 3
  const kids = [];
  for (const text of pages) {
    const stream = `BT /F1 28 Tf 72 700 Td (${text.replace(/[()\\]/g, '')}) Tj ET\n0.3 0.3 0.8 rg 72 600 300 40 re f`;
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const page = add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 612 792] /Contents ${content} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`);
    kids.push(`${page} 0 R`);
  }
  objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objs[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}
