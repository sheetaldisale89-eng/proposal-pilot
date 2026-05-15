import { supabase } from './supabase';
import * as pdfjs from 'pdfjs-dist';

// Set worker from CDN (most reliable)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export async function extractTextFromPdf(storagePath: string): Promise<string> {
  try {
    // Download PDF from Supabase Storage
    const { data, error } = await supabase.storage
      .from('rfp-files')
      .download(storagePath);

    if (error) throw error;
    if (!data) throw new Error('No PDF data returned');

    // Convert blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();

    // Extract text with PDF.js
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (err) {
    console.error('PDF extraction error:', err);
    throw new Error(`PDF extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}