# PDF Layer / Crop Box Investigation

## Summary

This repository relies on `@cantoo/pdf-lib` for PDF loading and embedding, with the main flow implemented in `src/book.js` and `src/utils/pdf.js`. The code appears to use only the base page content and a single crop box value, which makes it vulnerable to PDFs that contain additional modifiers, annotations, overlays, or non-trivial page box definitions.

## Key files

- `package.json`
  - Dependency: `@cantoo/pdf-lib` (PDF parsing/embedding library)
- `src/book.js`
  - `openpdf(file)` loads the PDF with `PDFDocument.load(this.input)`
  - `fixBlankPages()` checks `page.node.Contents()` to detect blank pages
  - `createpages()` embeds source pages via `embedPagesInNewPdf(this.currentdoc)` and then redraws them onto new pages
  - `writepages()` and `draw_block_onto_page()` apply output layout by embedding pages again and drawing them with `currPage.drawPage(page, {...})`
  - `displayPreview()` shows the generated PDF preview from the output PDF
- `src/utils/pdf.js`
  - `embedPagesInNewPdf(sourcePdf, pageNumbers)` calls `newPdf.embedPdf(sourcePdf, pageNumbers)`
  - This is the core place where source pages are re-materialized into the working document
- `src/utils/layout.js`
  - `calculateDimensions(book)` uses `book.cropbox.width` and `book.cropbox.height` as the source PDF dimensions
  - `calculateLayout(book)` then uses those values to place and scale pages
- `src/utils/renderUtils.js`
  - `updatePageLayoutInfo(info)` displays `pdf_source_dimensions` and `pdf_page_dimensions` based on the crop box + calculated scale values

## Observations relevant to the reported bug

1. **PDF parsing is centralized through pdf-lib**
   - The repository has no alternate parser or fallback for non-standard PDFs.
   - `@cantoo/pdf-lib` may not fully support optional content groups, annotations, transparency groups, flattened form fields, or other layered content.

2. **Page dimensions come from a single crop box value**
   - `fixBlankPages()` stores `this.cropbox = page.getCropBox()` for the first non-empty page.
   - `calculateDimensions()` uses `cropbox.width` and `cropbox.height` to determine layout and scaling.
   - If the PDF includes a different page box (`MediaBox`, `TrimBox`, etc.) or if the crop box is set by a viewer, the resulting interpreted page size can be wrong.

3. **Embedding pages may discard non-base-layer content**
   - `embedPagesInNewPdf()` simply calls `newPdf.embedPdf(sourcePdf, pageNumbers)`.
   - The later layout uses `currPage.drawPage(page, ...)` to place embedded pages.
   - If a PDF has visual marks in annotations/overlays or if content is layered in a way pdf-lib does not preserve on embed, those marks can be lost.

4. **Flattened/linearized PDFs appear to work as a workaround**
   - Flattening likely merges all visible content into the base page content stream.
   - That makes the document easier for `pdf-lib` to interpret correctly.
   - This strongly suggests the current bug is due to unsupported layer/content features in the PDF parser rather than a pure layout math error.

5. **Potential false blank-page detection**
   - `fixBlankPages()` uses `page.node.Contents()` only.
   - If a page's visible marks are implemented via annotations or separate content objects rather than page contents, they may be treated as blank or ignored.

## Likely root causes

- `@cantoo/pdf-lib` is probably the main source of the limitation.
  - It may not preserve or interpret all page layers, crop box variants, overlays, or annotation content during `load()` and `embedPdf()`.
- The code uses a single `cropbox` from the first page and does not handle different page boxes or page-specific boxes robustly.
- The bug report describes incorrectly interpreted dimensions and missing border/markup elements, which is consistent with a parser that only uses base page content and ignores other PDF objects.

## Recommended next-investigation areas

- Confirm whether `pdf-lib` supports the PDF features used by the problematic file:
  - `MediaBox`, `CropBox`, `TrimBox`, `ArtBox`, `BleedBox`
  - Annotations / markup objects
  - Optional content groups (OCGs)
  - Transparency groups or XObject overlays
- Add diagnostics around loaded page box values and compare them to viewer-reported sizes.
- Consider adding a fallback that uses `page.getMediaBox()` or checks alternate page boxes when `getCropBox()` seems wrong.
- If the underlying library is insufficient, document the workaround clearly in the UI and/or move to a more robust PDF parser.

## Suggested quick fix for the repo

- Add a visible note in the UI and error output recommending PDF flattening/linearization as a workaround.
- Instrument the page import flow to log and display both source page box sizes and the interpreted dimensions.
- If possible, update the code to verify that `cropbox` is not null and that page dimensions align with `page.getSize()` or `getMediaBox()` before layout.

## Files to inspect first for a proper fix

- `src/book.js`
- `src/utils/pdf.js`
- `src/utils/layout.js`
- `src/utils/renderUtils.js`
- `package.json`

