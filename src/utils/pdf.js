import { PDFDocument } from 'pdf-lib';

/**
 * joins two pdfs together, alternating pages such that if
 * pdfA = [1, 2, 3] and pdfB = [A, B, C], the final pdf is
 * [1, A, 2, B, 3, C]
 * @param {PDFDocument} pdfA
 * @param {PDFDocument} pdfB
 * @returns {Promise<PDFDocument>}
 */
export async function interleavePages(pdfA, pdfB) {
  const mergedPdf = await PDFDocument.create();
  const pageCount = Math.max(pdfA.getPageCount(), pdfB.getPageCount());
  for (let i = 0; i < pageCount; i++) {
    const pageA = pdfA.getPage(i);
    if (pageA) mergedPdf.addPage((await mergedPdf.copyPages(pdfA, [i]))[0]);

    const pageB = pdfB.getPage(i);
    if (pageB) mergedPdf.addPage((await mergedPdf.copyPages(pdfB, [i]))[0]);
  }

  return mergedPdf;
}

/**
 * Generates a new PDF & embeds the prescribed pages of the source PDF into it
 * @param sourcePdf
 * @param {(string|number)[]} [pageNumbers] - an array of page numbers. Ex: [1,5,6,7,8,'b',10] or null to embed all pages from source
 *          NOTE: re-construction behavior kicks in if there's 'b's in the list
 *
 * @return {Promise<[PDFDocument, PDFEmbeddedPage[]]>} PDF with pages embedded, embedded page array
 */
export async function embedPagesInNewPdf(sourcePdf, pageNumbers) {
  const newPdf = await PDFDocument.create();
  const needsReSorting = pageNumbers != null && pageNumbers.includes('b');
  if (pageNumbers == null) {
    pageNumbers = Array.from(Array(sourcePdf.getPageCount()).keys());
  } else {
    pageNumbers = pageNumbers.filter((p) => {
      return typeof p === 'number';
    });
  }
  let embeddedPages = await newPdf.embedPdf(sourcePdf, pageNumbers);
  // what a gnarly little hack. Letting this sit for now --
  //   --- downstream code requires embeds to be in their 'correct' index possition
  //    but we want to only embed half the pages for the aggregate single sides
  //    thus we expand the embedded pages to allow those gaps to return. This is gross & dumb but whatever...
  if (needsReSorting) {
    embeddedPages = embeddedPages.reduce((acc, curVal, curI) => {
      acc[pageNumbers[curI]] = curVal;
      return acc;
    }, []);
  }
  return [newPdf, embeddedPages];
}
