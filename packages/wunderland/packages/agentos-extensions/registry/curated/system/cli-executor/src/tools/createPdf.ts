/**
 * Create PDF Tool
 * Generate real PDF files from text content.
 *
 * @module @framers/agentos-ext-cli-executor
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { ITool, JSONSchemaObject, ToolExecutionContext, ToolExecutionResult } from '@framers/agentos';

// ── Minimal PDF Writer ──────────────────────────────────────────────────────

interface PdfOptions {
  title?: string;
  author?: string;
  fontSize?: number;
  margin?: number;
  pageWidth?: number;
  pageHeight?: number;
}

/**
 * Generate a valid PDF 1.4 binary buffer from plain text content.
 *
 * Supports:
 * - Multi-page text layout with automatic pagination
 * - UTF-8 → WinAnsiEncoding (Latin-1 subset)
 * - Configurable margins, font size, page dimensions
 * - Document metadata (Title, Author, CreationDate)
 */
function generatePdf(text: string, opts: PdfOptions = {}): Buffer {
  const fontSize = opts.fontSize ?? 12;
  const margin = opts.margin ?? 72; // 1 inch
  const pageW = opts.pageWidth ?? 612; // US Letter
  const pageH = opts.pageHeight ?? 792;
  const lineHeight = fontSize * 1.4;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;
  const linesPerPage = Math.floor(usableH / lineHeight);

  // Approximate characters per line (Helvetica average ~0.5 * fontSize)
  const avgCharWidth = fontSize * 0.5;
  const charsPerLine = Math.floor(usableW / avgCharWidth);

  // Word-wrap text into lines
  const rawLines = text.split('\n');
  const wrapped: string[] = [];
  for (const raw of rawLines) {
    if (raw.length === 0) {
      wrapped.push('');
      continue;
    }
    let remaining = raw;
    while (remaining.length > 0) {
      if (remaining.length <= charsPerLine) {
        wrapped.push(remaining);
        break;
      }
      // Find last space within charsPerLine
      let breakAt = remaining.lastIndexOf(' ', charsPerLine);
      if (breakAt <= 0) breakAt = charsPerLine;
      wrapped.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt).trimStart();
    }
  }

  // Paginate
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += linesPerPage) {
    pages.push(wrapped.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push(['']);

  // ── Build PDF objects ──────────────────────────────────────────────────

  const objects: string[] = [];
  const offsets: number[] = [];
  let nextObj = 1;

  const addObj = (content: string): number => {
    const id = nextObj++;
    objects.push(`${id} 0 obj\n${content}\nendobj\n`);
    return id;
  };

  // Escape PDF string: backslash, parens, non-ASCII → octal
  const pdfStr = (s: string): string => {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      const ch = s[i];
      if (ch === '\\' || ch === '(' || ch === ')') {
        out += '\\' + ch;
      } else if (code < 32 || code > 126) {
        // Replace non-printable / non-ASCII with '?'
        out += '?';
      } else {
        out += ch;
      }
    }
    return out;
  };

  // 1: Catalog
  const catalogId = addObj(`<< /Type /Catalog /Pages 2 0 R >>`);

  // 2: Pages (placeholder — will be rewritten)
  const pagesIdx = objects.length;
  addObj('PLACEHOLDER');

  // 3: Font
  const fontId = addObj(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`,
  );

  // Create page objects + content streams
  const pageObjIds: number[] = [];

  for (const pageLines of pages) {
    // Build content stream
    const streamLines: string[] = [];
    streamLines.push('BT');
    streamLines.push(`/F1 ${fontSize} Tf`);
    // Start at top-left with margin
    let y = pageH - margin - fontSize;
    streamLines.push(`${margin} ${y.toFixed(1)} Td`);
    for (let i = 0; i < pageLines.length; i++) {
      if (i > 0) {
        streamLines.push(`0 ${(-lineHeight).toFixed(1)} Td`);
      }
      streamLines.push(`(${pdfStr(pageLines[i])}) Tj`);
    }
    streamLines.push('ET');
    const stream = streamLines.join('\n');

    const streamId = addObj(
      `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    );

    const pageId = addObj(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
        `/Contents ${streamId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    );
    pageObjIds.push(pageId);
  }

  // Rewrite Pages object with correct Kids
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  objects[pagesIdx] = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjIds.length} >> \nendobj\n`;

  // Info dictionary
  const now = new Date();
  const dateStr = `D:${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const infoParts = [`/CreationDate (${dateStr})`];
  if (opts.title) infoParts.push(`/Title (${pdfStr(opts.title)})`);
  if (opts.author) infoParts.push(`/Author (${pdfStr(opts.author)})`);
  infoParts.push(`/Producer (Wunderland AgentOS)`);
  const infoId = addObj(`<< ${infoParts.join(' ')} >>`);

  // ── Serialize ──────────────────────────────────────────────────────────

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1');
    pdf += objects[i] + '\n';
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${nextObj}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 0; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${nextObj} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

// ── Tool ─────────────────────────────────────────────────────────────────────

export class CreatePdfTool implements ITool {
  public readonly id = 'cli-create-pdf-v1';
  public readonly name = 'create_pdf';
  public readonly displayName = 'Create PDF';
  public readonly description =
    'Create a real PDF document from text content. Use this instead of file_write when the user asks for a PDF file.';
  public readonly category = 'system';
  public readonly hasSideEffects = true;

  public readonly inputSchema: JSONSchemaObject = {
    type: 'object',
    required: ['path', 'content'],
    properties: {
      path: {
        type: 'string',
        description: 'Output file path (should end in .pdf)',
      },
      content: {
        type: 'string',
        description: 'Text content to include in the PDF',
      },
      title: {
        type: 'string',
        description: 'PDF document title (metadata)',
      },
      author: {
        type: 'string',
        description: 'PDF document author (metadata)',
      },
      fontSize: {
        type: 'number',
        description: 'Font size in points (default: 12)',
      },
    },
    additionalProperties: false,
  };

  async execute(
    input: {
      path: string;
      content: string;
      title?: string;
      author?: string;
      fontSize?: number;
    },
    _context: ToolExecutionContext,
  ): Promise<ToolExecutionResult<{ path: string; pages: number; bytes: number }>> {
    try {
      const outPath = resolve(input.path);
      const pdfBuffer = generatePdf(input.content, {
        title: input.title,
        author: input.author,
        fontSize: input.fontSize,
      });

      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(outPath, pdfBuffer);

      // Count pages from the generated content
      const pageCount = (pdfBuffer.toString('latin1').match(/\/Type \/Page\b/g) || []).length;

      return {
        success: true,
        output: {
          path: outPath,
          pages: pageCount,
          bytes: pdfBuffer.length,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  validateArgs(input: Record<string, any>): { isValid: boolean; errors?: any[] } {
    const errors: string[] = [];
    if (!input.path || typeof input.path !== 'string') errors.push('path is required (string)');
    if (input.content === undefined || input.content === null) errors.push('content is required');
    return errors.length === 0 ? { isValid: true } : { isValid: false, errors };
  }
}
