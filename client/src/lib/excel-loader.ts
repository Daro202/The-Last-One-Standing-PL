import * as XLSX from 'xlsx';
import { Question, RoundName } from './mock-data';

const VALID_ROUNDS: RoundName[] = ['WARM UP', 'SURVIVAL', 'MANDATORY', 'BATTLE'];
const VALID_TYPES = ['TRUE_FALSE', 'OPEN'] as const;
const REQUIRED_COLS = ['ID', 'ROUND', 'CATEGORY', 'TYPE', 'QUESTION', 'CORRECT_ANSWER', 'ACTIVE'];

export interface ParseResult {
  questions: Question[];
  categories: string[];
  errors: string[];
  warnings: string[];
}

function validateAndMap(data: Record<string, unknown>[]): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) {
    return { questions: [], categories: [], errors: ['The Excel file is empty.'], warnings: [] };
  }

  const cols = Object.keys(data[0]);
  const missing = REQUIRED_COLS.filter(c => !cols.includes(c));
  if (missing.length > 0) {
    return {
      questions: [],
      categories: [],
      errors: [`Missing required column(s): ${missing.join(', ')}.`],
      warnings: [],
    };
  }

  const seenIds = new Set<number>();
  const questions: Question[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    if (Number(row['ACTIVE']) !== 1) continue;

    const id = parseInt(String(row['ID'] ?? ''));
    if (isNaN(id)) { warnings.push(`Row ${rowNum}: invalid ID — skipped.`); continue; }
    if (seenIds.has(id)) { errors.push(`Row ${rowNum}: duplicated ID ${id}.`); continue; }

    const roundRaw = String(row['ROUND'] ?? '').trim().toUpperCase() as RoundName;
    if (!VALID_ROUNDS.includes(roundRaw)) {
      errors.push(`Row ${rowNum}: invalid ROUND "${row['ROUND']}" — must be one of: ${VALID_ROUNDS.join(', ')}.`);
      continue;
    }

    const typeRaw = String(row['TYPE'] ?? '').trim().toUpperCase();
    if (!VALID_TYPES.includes(typeRaw as typeof VALID_TYPES[number])) {
      errors.push(`Row ${rowNum}: invalid TYPE "${row['TYPE']}" — must be TRUE_FALSE or OPEN.`);
      continue;
    }

    const text = String(row['QUESTION'] ?? '').trim();
    if (!text) { errors.push(`Row ${rowNum}: empty question text.`); continue; }

    const answer = String(row['CORRECT_ANSWER'] ?? '').trim();
    if (!answer) { errors.push(`Row ${rowNum}: empty correct answer.`); continue; }

    const category = String(row['CATEGORY'] ?? '').trim() || 'General';
    const difficulty = row['DIFFICULTY'] ? String(row['DIFFICULTY']).trim() : undefined;

    seenIds.add(id);
    questions.push({ id, text, answer, type: typeRaw as 'TRUE_FALSE' | 'OPEN', round: roundRaw, category, difficulty });
  }

  if (questions.length === 0 && errors.length === 0) {
    errors.push('No active questions found (ACTIVE = 1) in the file.');
  }

  const categories = Array.from(new Set(questions.map(q => q.category))).sort();
  return { questions, categories, errors, warnings };
}

/** Parse an ArrayBuffer (e.g. from fetch response). */
export function parseExcelBuffer(buffer: ArrayBuffer): ParseResult {
  try {
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
    return validateAndMap(data);
  } catch {
    return { questions: [], categories: [], errors: ['Unreadable Excel file.'], warnings: [] };
  }
}

/** Parse a binary string (FileReader.readAsBinaryString). */
export function parseExcelBinaryString(bstr: string): ParseResult {
  try {
    const wb = XLSX.read(bstr, { type: 'binary' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
    return validateAndMap(data);
  } catch {
    return { questions: [], categories: [], errors: ['Unreadable Excel file.'], warnings: [] };
  }
}
