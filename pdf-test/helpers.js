import { comparePdfToSnapshot } from 'pdf-visual-diff';
import { PDFDocument } from '@cantoo/pdf-lib';
import { readFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { Book } from '../src/book.js';
import path from 'node:path';
import { testCases } from './pdfTestCases.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function comparePDF(filename, snapshot) {
  return comparePdfToSnapshot(filename, __dirname, snapshot);
}

async function generateTestPDF(configuration, filename) {
  const book = new Book(configuration);
  book.inputpdf = filename;
  const filepath = path.join(__dirname, '/../docs', filename);
  book.input = await readFile(filepath);
  book.currentdoc = await PDFDocument.load(book.input.toString('base64'));
  book.filename = filename;
  await book.createpages();
  let previewPdf = null;

  if (
    book.format == 'perfect' ||
    book.format == 'booklet' ||
    book.format == 'standardsig' ||
    book.format == 'customsig'
  ) {
    const signatures = [{}];
    previewPdf = await book.generateClassicFiles(true, signatures);
  } else if (book.format == 'a9_3_3_4') {
    previewPdf = await book.buildSheets(book.filename, book.book.a9_3_3_4_builder());
  } else if (book.format == 'a10_6_10s') {
    previewPdf = await book.buildSheets(book.filename, book.book.a10_6_10s_builder());
  } else if (book.format == 'a_4_8s') {
    previewPdf = await book.buildSheets(book.filename, book.book.a_4_8s_builder());
  } else if (book.format == 'a_3_6s') {
    previewPdf = await book.buildSheets(book.filename, book.book.a_3_6s_builder());
  } else if (book.format == 'A7_2_16s') {
    previewPdf = await book.buildSheets(book.filename, book.book.a7_2_16s_builder());
  } else if (book.format == '1_3rd') {
    previewPdf = await book.buildSheets(book.filename, book.book.page_1_3rd_builder());
  } else if (book.format == '8_zine') {
    previewPdf = await book.buildSheets(book.filename, book.book.page_8_zine_builder());
  } else return previewPdf;
  return previewPdf;
}

export async function runTestCase(caseName) {
  const { input, config } = testCases[caseName];
  const file = await generateTestPDF(config, input);
  const data = await file.save();
  return comparePDF(Buffer.from(data), `${caseName}.pdf`);
}
