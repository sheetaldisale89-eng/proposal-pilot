import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_CHARS = 24000;

const PRIORITY_KEYWORDS = [
  'scope', 'annexure', 'eligibility', 'evaluation',
  'criteria', 'deliverable', 'submission', 'technical',
  'financial', 'marks', 'weightage', 'mandatory',
];

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}

function buildPageText(items: TextItem[]): string {
  if (items.length === 0) return '';

  const lineMap = new Map<number, TextItem[]>();
  for (const item of items) {
    if (!item.str) continue;
    const y = Math.round(item.transform[5] / 2) * 2;
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y)!.push(item);
  }

  const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

  const lines: string[] = [];
  for (const y of sortedYs) {
    const lineItems = lineMap.get(y)!.sort((a, b) => a.transform[4] - b.transform[4]);

    const totalWidth = lineItems.reduce((sum, it) => sum + (it.width || 0), 0);
    const xSpan = lineItems.length > 1
      ? lineItems[lineItems.length - 1].transform[4] - lineItems[0].transform[4]
      : 0;
    const isTableLike = lineItems.length >= 3 && xSpan > totalWidth * 1.5;

    if (isTableLike) {
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

function pageHasKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return PRIORITY_KEYWORDS.some(kw => lower.includes(kw));
}

function formatPageRanges(pageNumbers: number[]): string {
  if (pageNumbers.length === 0) return '';
  const sorted = [...pageNumbers].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    // Extract all pages
    const allPages: { pageNum: number; text: string }[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = buildPageText(textContent.items as TextItem[]);
      allPages.push({ pageNum: i, text });
    }

    // Phase 1: always include pages 1-10
    const includedSet = new Set<number>();
    for (const { pageNum } of allPages) {
      if (pageNum <= 10) includedSet.add(pageNum);
    }

    // Phase 2: add all keyword-matched pages
    for (const { pageNum, text } of allPages) {
      if (pageHasKeyword(text)) includedSet.add(pageNum);
    }

    // Phase 3: fill remaining budget with sequential pages not yet included
    let budget = MAX_CHARS - 200; // reserve space for the summary note
    const finalSections: string[] = [];
    const finalPageNums: number[] = [];

    // Add priority pages first
    for (const { pageNum, text } of allPages) {
      if (!includedSet.has(pageNum)) continue;
      const section = `=== PAGE ${pageNum} ===\n${text}`;
      if (budget - section.length >= 0) {
        finalSections.push(section);
        finalPageNums.push(pageNum);
        budget -= section.length + 2; // +2 for \n\n separator
      }
    }

    // Fill remaining budget with sequential pages not yet included
    for (const { pageNum, text } of allPages) {
      if (includedSet.has(pageNum)) continue;
      const section = `=== PAGE ${pageNum} ===\n${text}`;
      if (budget - section.length >= 0) {
        finalSections.push(section);
        finalPageNums.push(pageNum);
        budget -= section.length + 2;
      }
    }

    // Sort by page number for readability
    const sortedFinal = finalPageNums
      .map((num, i) => ({ num, section: finalSections[i] }))
      .sort((a, b) => a.num - b.num);

    const pageNote = `[Pages analyzed: ${formatPageRanges(sortedFinal.map(p => p.num))} of ${pdf.numPages} total]`;
    const body = sortedFinal.map(p => p.section).join('\n\n');
    const combined = `${pageNote}\n\n${body}`;

    // Final hard cap (should rarely trigger after budget accounting)
    if (combined.length > MAX_CHARS) {
      return combined.slice(0, MAX_CHARS) + `\n\n[Truncated. First ${MAX_CHARS.toLocaleString()} characters analyzed.]`;
    }
    return combined;
  } catch (err) {
    throw new Error(`PDF extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

