/**
 * Read Document Tool
 * Extract text content from binary document formats (xlsx, csv, docx, pdf).
 *
 * @module @framers/agentos-ext-cli-executor
 */

import { extname } from 'node:path';
import type { ITool, JSONSchemaObject, ToolExecutionContext, ToolExecutionResult } from '@framers/agentos';
import type { ShellService } from '../services/shellService.js';
import type { DocumentReadResult } from '../types.js';

type DetectedFormat = 'xlsx' | 'csv' | 'docx' | 'pdf';

const EXTENSION_FORMAT_MAP: Record<string, DetectedFormat> = {
  '.xlsx': 'xlsx',
  '.xls': 'xlsx',
  '.csv': 'csv',
  '.tsv': 'csv',
  '.docx': 'docx',
  '.pdf': 'pdf',
};

/**
 * Escape pipe characters for markdown table cells.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Convert sheet rows to a markdown table string.
 */
function toMarkdownTable(headers: string[], rows: any[][], sheetName: string, totalRows: number, maxRows: number): string {
  const truncated = totalRows > maxRows;
  const countLabel = truncated
    ? `(showing ${maxRows} of ${totalRows} rows)`
    : `(${totalRows} rows)`;

  const lines: string[] = [];
  lines.push(`## Sheet: ${sheetName} ${countLabel}`);
  lines.push(`| ${headers.map(escapeCell).join(' | ')} |`);
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
  for (const row of rows) {
    lines.push(`| ${row.map(escapeCell).join(' | ')} |`);
  }
  return lines.join('\n');
}

// ── Format-specific parsers ─────────────────────────────────────────────────

async function parseXlsx(
  buffer: Buffer,
  opts: { sheet?: string; maxRows: number },
): Promise<Pick<DocumentReadResult, 'content' | 'structured' | 'metadata'>> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const sheetNames = opts.sheet
    ? workbook.SheetNames.filter((n) => n === opts.sheet)
    : workbook.SheetNames;

  if (opts.sheet && sheetNames.length === 0) {
    throw new Error(
      `Sheet "${opts.sheet}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`,
    );
  }

  const contentParts: string[] = [];
  const structuredSheets: NonNullable<DocumentReadResult['structured']>['sheets'] = [];

  for (const name of sheetNames) {
    const ws = workbook.Sheets[name];
    const jsonRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    if (jsonRows.length === 0) continue;

    const headers = (jsonRows[0] || []).map(String);
    const dataRows = jsonRows.slice(1);
    const totalRows = dataRows.length;
    const truncated = totalRows > opts.maxRows;
    const displayRows = dataRows.slice(0, opts.maxRows);

    contentParts.push(toMarkdownTable(headers, displayRows, name, totalRows, opts.maxRows));

    structuredSheets!.push({
      name,
      headers,
      rows: displayRows,
      rowCount: totalRows,
      truncated,
    });
  }

  return {
    content: contentParts.join('\n\n'),
    structured: { sheets: structuredSheets },
    metadata: { sheetNames: workbook.SheetNames },
  };
}

async function parseCsv(
  buffer: Buffer,
  opts: { maxRows: number },
): Promise<Pick<DocumentReadResult, 'content' | 'structured' | 'metadata'>> {
  // Use xlsx to parse CSV for consistent handling of quoted fields, delimiters, etc.
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0] || 'Sheet1';
  const ws = workbook.Sheets[sheetName];
  const jsonRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

  if (jsonRows.length === 0) {
    return { content: '(empty CSV file)', structured: { sheets: [] } };
  }

  const headers = (jsonRows[0] || []).map(String);
  const dataRows = jsonRows.slice(1);
  const totalRows = dataRows.length;
  const truncated = totalRows > opts.maxRows;
  const displayRows = dataRows.slice(0, opts.maxRows);

  return {
    content: toMarkdownTable(headers, displayRows, 'CSV', totalRows, opts.maxRows),
    structured: {
      sheets: [{
        name: 'CSV',
        headers,
        rows: displayRows,
        rowCount: totalRows,
        truncated,
      }],
    },
  };
}

async function parseDocx(
  buffer: Buffer,
): Promise<Pick<DocumentReadResult, 'content' | 'metadata'>> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return {
    content: result.value,
    metadata: result.messages.length > 0
      ? { warnings: result.messages.map((m: any) => m.message) }
      : undefined,
  };
}

async function parsePdf(
  buffer: Buffer,
): Promise<Pick<DocumentReadResult, 'content' | 'metadata'>> {
  // pdf-parse has no types — import default export
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);
  return {
    content: result.text,
    metadata: {
      pages: result.numpages,
      info: result.info,
    },
  };
}

// ── Tool ─────────────────────────────────────────────────────────────────────

/**
 * Tool for reading binary document formats
 */
export class ReadDocumentTool implements ITool {
  public readonly id = 'cli-read-document-v1';
  /** Tool call name used by the LLM / ToolExecutor. */
  public readonly name = 'read_document';
  public readonly displayName = 'Read Document';
  public readonly description =
    'Read and extract text content from binary document formats: ' +
    '.xlsx/.xls (spreadsheets), .csv/.tsv (comma/tab-separated), ' +
    '.docx (Word documents), .pdf (PDFs). ' +
    'Returns structured text that can be analyzed. ' +
    'For plain text files (.txt, .md, .json, etc.), use file_read instead.';
  public readonly category = 'system';
  public readonly hasSideEffects = false;

  public readonly inputSchema: JSONSchemaObject = {
    type: 'object',
    required: ['path'],
    properties: {
      path: {
        type: 'string',
        description: 'File path to the document',
      },
      format: {
        type: 'string',
        enum: ['xlsx', 'csv', 'docx', 'pdf', 'auto'],
        default: 'auto',
        description: 'Document format. Auto-detected from extension if not specified.',
      },
      sheet: {
        type: 'string',
        description: 'For xlsx: specific sheet name to read. Reads all sheets if omitted.',
      },
      maxRows: {
        type: 'number',
        description: 'For xlsx/csv: maximum data rows to return per sheet (default: 500)',
      },
    },
    additionalProperties: false,
  };

  constructor(private shellService: ShellService) {}

  /**
   * Read and parse a document
   */
  async execute(
    input: {
      path: string;
      format?: string;
      sheet?: string;
      maxRows?: number;
    },
    _context: ToolExecutionContext,
  ): Promise<ToolExecutionResult<DocumentReadResult>> {
    try {
      // Detect format
      const ext = extname(input.path).toLowerCase();
      let format: DetectedFormat;

      if (input.format && input.format !== 'auto') {
        format = input.format as DetectedFormat;
      } else {
        const detected = EXTENSION_FORMAT_MAP[ext];
        if (!detected) {
          const supported = Object.keys(EXTENSION_FORMAT_MAP).join(', ');
          return {
            success: false,
            error: `Unsupported document format "${ext}". Supported: ${supported}. ` +
              (ext === '.doc'
                ? 'Legacy .doc format is not supported. Please convert to .docx first.'
                : 'For plain text files, use file_read instead.'),
          };
        }
        format = detected;
      }

      // Read file as buffer (enforces filesystem security)
      const { buffer, path: absolutePath, size } = await this.shellService.readFileBuffer(input.path);

      const maxRows = input.maxRows ?? 500;

      // Parse by format
      let parsed: Pick<DocumentReadResult, 'content' | 'structured' | 'metadata'>;

      switch (format) {
        case 'xlsx':
          parsed = await parseXlsx(buffer, { sheet: input.sheet, maxRows });
          break;
        case 'csv':
          parsed = await parseCsv(buffer, { maxRows });
          break;
        case 'docx':
          parsed = await parseDocx(buffer);
          break;
        case 'pdf':
          parsed = await parsePdf(buffer);
          break;
        default:
          return { success: false, error: `Unknown format: ${format}` };
      }

      return {
        success: true,
        output: {
          path: absolutePath,
          format,
          size,
          content: parsed.content,
          structured: parsed.structured,
          metadata: parsed.metadata,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate input
   */
  validateArgs(input: Record<string, any>): { isValid: boolean; errors?: any[] } {
    const errors: string[] = [];

    if (!input.path) {
      errors.push('Path is required');
    } else if (typeof input.path !== 'string') {
      errors.push('Path must be a string');
    }

    if (input.format && !['xlsx', 'csv', 'docx', 'pdf', 'auto'].includes(input.format)) {
      errors.push(`Invalid format "${input.format}". Must be one of: xlsx, csv, docx, pdf, auto`);
    }

    return errors.length === 0 ? { isValid: true } : { isValid: false, errors };
  }
}
