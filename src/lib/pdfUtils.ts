import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_CHARS = 24000;

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}

function buildPageText(items: TextItem[]): string {
  if (items.length === 0) return '';

  // Group items into lines by their Y coordinate (rounded to nearest 2px)
  const lineMap = new Map<number, TextItem[]>();
  for (const item of items) {
    if (!item.str) continue;
    const y = Math.round(item.transform[5] / 2) * 2;
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y)!.push(item);
  }

  // Sort lines top-to-bottom (PDF Y axis is bottom-up, so higher Y = higher on page)
  const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

  const lines: string[] = [];
  for (const y of sortedYs) {
    const lineItems = lineMap.get(y)!.sort((a, b) => a.transform[4] - b.transform[4]);

    // Detect table-like rows: multiple items with significant X gaps
    const totalWidth = lineItems.reduce((sum, it) => sum + (it.width || 0), 0);
    const xSpan = lineItems.length > 1
      ? lineItems[lineItems.length - 1].transform[4] - lineItems[0].transform[4]
      : 0;
    const isTableLike = lineItems.length >= 3 && xSpan > totalWidth * 1.5;

    if (isTableLike) {
      // Preserve column alignment with padded spacing
      let row = '';
      let prevX = lineItems[0].transform[4];
      for (const item of lineItems) {
        const gap = item.transform[4] - prevX;
        const spaces = gap > 30 ? Math.max(2, Math.round(gap / 8)) : 1;
        row += ' '.repeat(spaces) + item.str;
        prevX = item.transform[4] + (item.width || item.str.length * 6);
      }
      lines.push(row.trim());
    } else {
      lines.push(lineItems.map(it => it.str).join(' ').trim());
    }
  }

  return lines.filter(Boolean).join('\n');
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pageSections: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = buildPageText(textContent.items as TextItem[]);
      pageSections.push(`=== PAGE ${i} ===\n${pageText}`);
    }

    const text = pageSections.join('\n\n').trim();

    if (text.length > MAX_CHARS) {
      return text.slice(0, MAX_CHARS) + `\n\n[Document truncated for analysis. First ${MAX_CHARS.toLocaleString()} characters analyzed.]`;
    }
    return text;
  } catch (err) {
    throw new Error(`PDF extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
