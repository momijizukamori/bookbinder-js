// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { PDFDocument, PDFEmbeddedPage, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Signatures } from './signatures.js';
import { WackyImposition } from './wacky_imposition.js';
import { PAGE_LAYOUTS, PAGE_SIZES } from './constants.js';
import { updatePageLayoutInfo } from './utils/renderUtils.js';
import JSZip from 'jszip';
import { loadConfiguration } from './utils/formUtils.js';
import { drawFoldlines, drawCropmarks, drawSpineMarks } from './utils/drawing.js';
import { calculateDimensions, calculateLayout } from './utils/layout.js';

// Some JSDoc typedefs we use multiple places
/**
 * @typedef PageInfo
 * @type {object}
 * @property {string|number} info - page # or 'b'
 * @property {boolean} isSigStart
 * @property {boolean} isSigEnd
 */

/**
 * @typedef Position
 * @type {object}
 * @property {number} rotation - Rotation in degrees
 * @property {number} sx - x scale factor (where 1.0 is 100%)
 * @property {number} sy - y scale factor (where 1.0 is 100%)
 * @property {number} x - x position
 * @property {number} y - y position
 * @property {number[]} [spineMarkTop]: spineMarkTop,
 * @property {number[]} [spineMarkBottom]: spineMarkBottom,
 * @property {boolean} [isLeftPage]: isLeftPage,
 */

export class Book {
  /** @param { import("./models/configuration.js").Configuration } configuration */
  constructor(configuration) {
    /** @type {string | null} */
    this.inputpdf = null; //  string with pdf filepath

    this.managedDoc = null; // original PDF with the pages rotated per source_rotation - use THIS for laying out pages

    this.signatureconfig = [];

    /** @type {boolean} */
    this.spineoffset = false;

    this.input = null; //  opened pdf file
    this.currentdoc = null; //  uploaded PDF [Itext PDFReader object] untouched by source_rotation - use managedDoc for layout
    this.pagecount = null;
    this.cropbox = null;

    this.orderedpages = []; //  ordered list of page numbers (consecutive)
    this.rearrangedpages = []; //  reordered list of page numbers (signatures etc.)
    this.filelist = []; //  list of ouput filenames and path
    this.zip = null;

    this.update(configuration);
  }

  /** @param { import("./models/configuration.js").Configuration } configuration */
  update(configuration) {
    /** @type {boolean} */
    this.duplex = configuration.printerType === 'duplex';
    this.duplexrotate = configuration.rotatePage;
    this.paper_rotation_90 = configuration.paperRotation90;
    /** @type {number[]} */
    this.papersize = PAGE_SIZES[configuration.paperSize];
    if (configuration.paperRotation90) {
      this.papersize = [this.papersize[1], this.papersize[0]];
    }

    this.source_rotation = configuration.sourceRotation;
    this.print_file = configuration.printFile;
    this.page_scaling = configuration.pageScaling;
    this.page_positioning = configuration.pagePositioning;
    this.flyleafs = configuration.flyleafs;
    this.cropmarks = configuration.cropMarks;
    this.pdfEdgeMarks = configuration.pdfEdgeMarks;
    this.cutmarks = configuration.cutMarks;
    this.format = configuration.sigFormat;
    if (configuration.sigFormat === 'standardsig') {
      this.sigsize = configuration.sigLength;
    }
    this.customsig = this.format === 'customsig';
    if (this.customsig) {
      this.signatureconfig = configuration.customSigLength;
    }

    const pageLayout = PAGE_LAYOUTS[configuration.pageLayout];

    this.page_layout = pageLayout;
    this.per_sheet = pageLayout.per_sheet;
    this.pack_pages = configuration.wackySpacing === 'wacky_pack';
    this.fore_edge_padding_pt = configuration.foreEdgePaddingPt;

    this.padding_pt = {
      top: configuration.topEdgePaddingPt,
      bottom: configuration.bottomEdgePaddingPt,
      binding: configuration.bindingEdgePaddingPt,
      fore_edge: configuration.mainForeEdgePaddingPt,
    };
  }

  /**
   * Populates [this.currentdoc] from user's file system
   * @param {File} file input file
   */
  async openpdf(file) {
    this.inputpdf = file.name;
    this.input = await file.arrayBuffer(); //fs.readFileSync(filepath);
    this.currentdoc = await PDFDocument.load(this.input);
    //TODO: handle pw-protected PDFs
    const pages = this.currentdoc.getPages();
    this.cropbox = null;

    //FIXME: dumb hack because you can't embed blank pdf pages without errors.
    pages.forEach((page) => {
      if (!page.node.Contents()) {
        page.drawLine({
          start: { x: 25, y: 75 },
          end: { x: 125, y: 175 },
          opacity: 0.0,
        });
      } else {
        if (!this.cropbox) {
          const cropBox = page.getCropBox();
          const bleedBox = page.getBleedBox();
          const trimBox = page.getTrimBox();
          const artBox = page.getArtBox();
          console.log(
            `\n\tCropBox [${cropBox}]`,
            `\n\tBleedBox [${bleedBox}]`,
            `\n\tTrimBox [${trimBox}]`,
            `\n\tArtBox [${artBox}]`
          );
          this.cropbox = page.getCropBox();
        }
      }
    });
  }

  /**
   * Populates [this.orderedpages] (array [0, 1, ... this.page_sheets * # of sheets])
   */
  createpagelist() {
    this.pagecount = this.currentdoc.getPageCount();
    this.orderedpages = Array.from({ length: this.pagecount }, (x, i) => i);

    for (let i = 0; i < this.flyleafs; i++) {
      this.orderedpages.unshift('b');
      this.orderedpages.unshift('b');

      this.orderedpages.push('b');
      this.orderedpages.push('b');
    }

    //      padding calculations if needed
    const pagetotal = this.orderedpages.length;

    //     calculate how many sheets of paper the output document needs
    let sheets = Math.floor(pagetotal / this.per_sheet);

    //      pad out end of document if necessary
    if (pagetotal % this.per_sheet > 0) {
      sheets += 1;
      const padding = sheets * this.per_sheet - pagetotal;
      for (let i = 0; i < padding; i++) {
        this.orderedpages.push('b');
      }
    }
    console.log(`Calculated pagecount [${this.pagecount}] and ordered pages: ${this.orderedpages}`);
  }

  /**
   * Populates [this.managedDoc] with potentially rotated pages
   *  & populates [this.book] with the correct Book instance
   */
  async createpages() {
    this.createpagelist();
    let pages;
    [this.managedDoc, pages] = await this.embedPagesInNewPdf(this.currentdoc);

    for (var i = 0; i < pages.length; ++i) {
      var page = pages[i];
      var newPage = this.managedDoc.addPage();
      var rotate90cw =
        this.source_rotation == '90cw' ||
        (this.source_rotation == 'out_binding' && i % 2 == 0) ||
        (this.source_rotation == 'in_binding' && i % 2 == 1);
      var rotate90ccw =
        this.source_rotation == '90ccw' ||
        (this.source_rotation == 'out_binding' && i % 2 == 1) ||
        (this.source_rotation == 'in_binding' && i % 2 == 0);
      if (this.source_rotation == 'none') {
        newPage.setSize(page.width, page.height);
        newPage.drawPage(page);
      } else if (rotate90ccw) {
        newPage.setSize(page.height, page.width);
        newPage.drawPage(page, {
          x: page.height,
          y: 0,
          rotate: degrees(90),
        });
      } else if (rotate90cw) {
        newPage.setSize(page.height, page.width);
        newPage.drawPage(page, {
          x: 0,
          y: page.width,
          rotate: degrees(-90),
        });
      } else {
        var e = new Error("??? what sorta' layout you think you're going to get?");
        console.error(e);
        throw e;
      }
      page.embed();
      this.cropbox = newPage.getCropBox();
    }

    console.log(
      'The updatedDoc doc has : ',
      this.managedDoc.getPages(),
      ' vs --- ',
      this.managedDoc.getPageCount()
    );

    switch (this.format) {
      case 'perfect':
      case 'booklet':
        if (this.format == 'perfect') {
          // Perfect bind is a special case where sig size is 1
          this.sigsize = 1;
        } else {
          // Booklets are a special case where sig size is the total book size
          this.sigsize = Math.ceil(this.orderedpages.length / this.per_sheet);
        }
        // Only generate aggragated file for perfectbound and booklets
        this.print_file = 'aggregated';
      /* falls through */
      case 'standardsig':
      case 'customsig':
        this.book = new Signatures(
          this.orderedpages,
          this.sigsize,
          this.per_sheet,
          this.duplexrotate
        );

        if (this.customsig) {
          this.book.setsigconfig(this.signatureconfig);
        } else {
          this.book.createsigconfig();
        }
        this.rearrangedpages = this.book.pagelistdetails;
        break;
      case 'a9_3_3_4':
      case 'a10_6_10s':
      case 'A7_2_16s':
      case '1_3rd':
      case '8_zine':
      case 'a_3_6s':
      case 'a_4_8s':
        this.book = new WackyImposition(
          this.orderedpages,
          this.duplex,
          this.format,
          this.pack_pages
        );
        break;
    }

    console.log('Created pages for : ', this.book);
    const dimensions = calculateDimensions(this);
    const positions = calculateLayout(this);

    updatePageLayoutInfo({
      dimensions,
      book: this.book,
      perSheet: this.per_sheet,
      papersize: this.papersize,
      cropbox: this.cropbox,
      managedDoc: this.managedDoc,
      positions,
    });
  }

  /**
   * Calls the appropriate builder based on [this.format]
   *  to generate PDF & populate Previewer
   * @param {boolean} isPreview - if it's true we only generate preview content, if it's not true... we still
   *      generate preview content AND a downloadable zip
   */
  async createoutputfiles(isPreview) {
    const previewFrame = document.getElementById('pdf');
    previewFrame.style.display = 'none';
    let resultPDF = null;

    //  create a directory named after the input pdf and fill it with
    //  the signatures
    this.zip = new JSZip();
    var origFileName = this.inputpdf;
    origFileName = origFileName
      .replace(/[-\s,_]+/g, '_')
      .replace(/_*\.pdf/g, '')
      .toLowerCase();
    this.filename = origFileName;

    if (
      this.format == 'perfect' ||
      this.format == 'booklet' ||
      this.format == 'standardsig' ||
      this.format == 'customsig'
    ) {
      const generateAggregate = this.print_file != 'signatures';
      const generateSignatures = this.print_file != 'aggregated';
      const side1PageNumbers = new Set(
        this.rearrangedpages.reduce((accumulator, currentValue) => {
          const pageNums = currentValue[0].map((pageInfo) => pageInfo.info);
          return accumulator.concat(pageNums);
        }, [])
      );
      const [pdf0PageNumbers, pdf1PageNumbers] =
        !generateAggregate || this.duplex
          ? [null, null]
          : [
              Array.from(Array(this.managedDoc.getPageCount()).keys()).map((p) => {
                return side1PageNumbers.has(p) ? p : 'b';
              }),
              Array.from(Array(this.managedDoc.getPageCount()).keys()).map((p) => {
                return !side1PageNumbers.has(p) ? p : 'b';
              }),
            ];
      const [aggregatePdf0, embeddedPages0] = generateAggregate
        ? await this.embedPagesInNewPdf(this.managedDoc, pdf0PageNumbers)
        : [null, null];
      const [aggregatePdf1, embeddedPages1] =
        generateAggregate && !this.duplex
          ? await this.embedPagesInNewPdf(this.managedDoc, pdf1PageNumbers)
          : [null, null];
      const forLoop = async () => {
        for (let i = 0; i < this.rearrangedpages.length; i++) {
          const signature = this.rearrangedpages[i];
          console.log(signature);
          const sigName = `${this.filename}_signature${i}`;
          const [sigFront, sigBack] = await this.createSignatures({
            pageIndexDetails: signature,
            id: generateSignatures ? `${this.filename}_signature${i}` : null,
            isDuplex: this.duplex,
            fileList: this.filelist,
          });

          if (this.duplex) {
            // collate
            const sig = await this.collatePages(sigFront, sigBack);

            if (generateSignatures) {
              await sig.save().then((pdfBytes) => {
                this.zip.file(`signatures/${sigName}_duplex`, pdfBytes);
              });
            }

            if (generateAggregate) {
              const copiedPages = await aggregatePdf0.copyPages(sig, sig.getPageIndices());
              copiedPages.forEach((page) => aggregatePdf0.addPage(page));
            }
          } else {
            if (generateSignatures) {
              await sigFront.save().then((pdfBytes) => {
                this.zip.file(`signatures/${sigName}_side1`, pdfBytes);
              });
              await sigBack.save().then((pdfBytes) => {
                this.zip.file(`signatures/${sigName}_side2`, pdfBytes);
              });
            }

            if (generateAggregate) {
              const copiedPagesFront = await aggregatePdf0.copyPages(
                sigFront,
                sigFront.getPageIndices()
              );
              copiedPagesFront.forEach((page) => aggregatePdf0.addPage(page));

              const copiedPagesBack = await aggregatePdf1.copyPages(
                sigBack,
                sigBack.getPageIndices()
              );
              copiedPagesBack.forEach((page) => aggregatePdf1.addPage(page));
            }
          }
        }
      };
      await forLoop();

      if (aggregatePdf1 != null) {
        await aggregatePdf1.save().then((pdfBytes) => {
          if (!isPreview) this.zip.file(`${this.filename}_typeset_side2.pdf`, pdfBytes);
        });
      }
      if (aggregatePdf0 != null) {
        await aggregatePdf0.save().then((pdfBytes) => {
          if (!isPreview)
            this.zip.file(
              this.duplex ? `${this.filename}_typeset.pdf` : `${this.filename}_typeset_side1.pdf`,
              pdfBytes
            );
        });
      }
      var rotationMetaInfo =
        (this.paper_rotation_90 ? 'paper_rotated' : '') +
        (this.source_rotation == 'none' ? '' : `_${this.source_rotation}`);
      this.filename = `${origFileName}${rotationMetaInfo}`;
    } else if (this.format == 'a9_3_3_4') {
      resultPDF = await this.buildSheets(this.filename, this.book.a9_3_3_4_builder());
    } else if (this.format == 'a10_6_10s') {
      resultPDF = await this.buildSheets(this.filename, this.book.a10_6_10s_builder());
    } else if (this.format == 'a_4_8s') {
      resultPDF = await this.buildSheets(this.filename, this.book.a_4_8s_builder());
    } else if (this.format == 'a_3_6s') {
      resultPDF = await this.buildSheets(this.filename, this.book.a_3_6s_builder());
    } else if (this.format == 'A7_2_16s') {
      resultPDF = await this.buildSheets(this.filename, this.book.a7_2_16s_builder());
    } else if (this.format == '1_3rd') {
      resultPDF = await this.buildSheets(this.filename, this.book.page_1_3rd_builder());
    } else if (this.format == '8_zine') {
      resultPDF = await this.buildSheets(this.filename, this.book.page_8_zine_builder());
    }
    console.log('Attempting to generate preview for ', resultPDF);

    if (resultPDF != null) {
      const pdfDataUri = await resultPDF.saveAsBase64({ dataUri: true });
      const viewerPrefs = resultPDF.catalog.getOrCreateViewerPreferences();
      viewerPrefs.setHideToolbar(false);
      viewerPrefs.setHideMenubar(false);
      viewerPrefs.setHideWindowUI(false);
      viewerPrefs.setFitWindow(true);
      viewerPrefs.setCenterWindow(true);
      viewerPrefs.setDisplayDocTitle(true);

      previewFrame.style.width = `450px`;
      const height = (this.papersize[1] / this.papersize[0]) * 500;
      previewFrame.style.height = `${height}px`;
      previewFrame.style.display = '';
      previewFrame.src = pdfDataUri;
    }

    if (!isPreview) return this.saveZip();
    else return Promise.resolve(1);
  }

  /**
   * Generates a new PDF & embeds the prescribed pages of the source PDF into it
   * @param sourcePdf
   * @param {(string|number)[]} [pageNumbers] - an array of page numbers. Ex: [1,5,6,7,8,'b',10] or null to embed all pages from source
   *          NOTE: re-construction behavior kicks in if there's 'b's in the list
   *
   * @return {Promise<[PDFDocument, PDFEmbeddedPage[]]>} PDF with pages embedded, embedded page array
   */
  async embedPagesInNewPdf(sourcePdf, pageNumbers) {
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

  async collatePages(pdfA, pdfB) {
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
   * Part of the Classic (non-Wacky) flow. Called by [createsignatures].
   *   (conditionally) populates the destPdf and (conditionally) generates the outname PDF
   *
   * @param {Object} config - object /w the following parameters:
   * @param {PageInfo[]} config.pageList : objects that contain 3 values: { isSigStart: boolean, isSigEnd: boolean, info: either the page number or 'b'}
   * @param {boolean} config.back : is 'back' of page  (boolean)
   * @param {boolean} config.alt : alternate pages (boolean)
   * @return reference to the new PDF created
   */
  async writepages(config) {
    const pagelist = config.pageList;
    const back = config.back;
    const filteredList = [];
    const blankIndices = [];
    pagelist.forEach((pageInfo, i) => {
      if (pageInfo.info != 'b') {
        filteredList.push(pageInfo.info);
      } else {
        blankIndices.push(i);
      }
    });
    const [outPDF, embeddedPages] = await this.embedPagesInNewPdf(this.managedDoc, filteredList);

    blankIndices.forEach((i) => embeddedPages.splice(i, 0, 'b'));

    let block_start = 0;
    const offset = this.per_sheet / 2;
    let block_end = offset;

    // const alt_folio = this.per_sheet == 4 && back;

    const positions = calculateLayout(this);

    let side2flag = back;

    while (block_end <= pagelist.length) {
      const sigDetails = config.pageList.slice(block_start, block_end);
      side2flag = this.draw_block_onto_page({
        outPDF: outPDF,
        embeddedPages: embeddedPages,
        block_start: block_start,
        block_end: block_end,
        sigDetails: sigDetails,
        papersize: this.papersize,
        positions: positions,
        cropmarks: this.cropmarks,
        pdfEdgeMarks: this.pdfEdgeMarks,
        cutmarks: this.cutmarks,
        alt: config.alt,
        side2flag: side2flag,
      });
      block_start += offset;
      block_end += offset;
    }

    if (printSignatures) {
      await outPDF.save().then((pdfBytes) => {
        this.zip.file(`signatures/${config.outname}`, pdfBytes);
      });
    }
  }
  /**
   *
   * @param {Object} config - object /w the following parameters:
   * @param {string|null} config.outname : name of pdf added to ongoing zip file. Ex: 'signature1duplex.pdf' (or null if no signature file needed)
   * @param {PageInfo[]} config.sigDetails : objects that contain 3 values: { isSigStart: boolean, isSigEnd: boolean, info: either the page number or 'b'}
   * @param {boolean} config.side2flag : is 'back' of page  (boolean)
   * @param {[number, number]} config.papersize : paper size (as [number, number])
   * @param {number} config.block_start: Starting page index
   * @param {number} config.block_end: Ending page index
   * @param {boolean} config.alt : alternate pages (boolean)
   * @param {boolean} config.cutmarks: whether to print cutmarks
   * @param {boolean} config.cropmarks: whether to print cropmarks
   * @param {boolean} config.pdfEdgeMarks: whether to print PDF edge marks
   * @param {Position[]} config.positions: list of page positions
   * @param {PDFDocument} [config.outPDF]: PDF to write to, in addition to PDF created w/ `outname` (or null)
   * @param {(PDFEmbeddedPage|string)[]} [config.embeddedPages] : pages already embedded in the `destPdf` to assemble in addition (or null)
   */

  draw_block_onto_page(config) {
    const sigDetails = config.sigDetails;
    const block_start = config.block_start;
    const block_end = config.block_end;
    const papersize = config.papersize;
    const outPDF = config.outPDF;
    const positions = config.positions;
    const foldmarks = config.cropmarks;
    const pdfEdgeMarks = config.pdfEdgeMarks;
    const cutmarks = config.cutmarks;
    const alt = config.alt;
    let side2flag = config.side2flag;

    const block = config.embeddedPages.slice(block_start, block_end);
    const currPage = outPDF.addPage(papersize);
    const cropLines = cutmarks ? drawCropmarks(papersize, this.per_sheet) : [];
    const foldLines = foldmarks
      ? drawFoldlines(side2flag, this.duplexrotate, papersize, this.per_sheet)
      : [];
    const drawLines = [...cropLines, ...foldLines];

    block.forEach((page, i) => {
      if (page == 'b' || page === undefined) {
        // blank page, move on.
      } else if (page instanceof PDFEmbeddedPage) {
        const { y, x, sx, sy, rotation } = positions[i];
        currPage.drawPage(page, {
          y,
          x,
          xScale: sx,
          yScale: sy,
          rotate: degrees(rotation),
        });
      } else {
        console.error('Unexpected type for page: ', page);
      }

      if (pdfEdgeMarks && (sigDetails[i].isSigStart || sigDetails[i].isSigEnd)) {
        drawLines.push(drawSpineMarks(sigDetails[i], positions[i]));
      }
    });

    drawLines.forEach((line) => {
      currPage.drawLine(line);
    });

    if (alt) {
      side2flag = !side2flag;
    }
    return side2flag;
  }

  /**
   * PDF builder base function for Classic (non-Wacky) layouts. Called by [createoutputfiles]
   *
   * @param {Object} config
   * @param {PageInfo[][]|PageInfo[]} config.pageIndexDetails : a nested list of objects.
   * @param config.embeddedPages : list of lists of embedded pages from source document ( [0] for duplex & front, [1] for backs -- value is null if no aggregate printing enabled)
   * @param {string} config.id : string dentifier for signature file name (null if no signature files to be generated)
   * @param {boolean} config.isDuplex : boolean
   * @param {string[]} config.fileList : list of filenames for sig filename to be added to (modifies list)
   */
  async createSignatures(config) {
    const pages = config.pageIndexDetails;
    //      duplex printers print both sides of the sheet,
    if (config.isDuplex) {
      const outduplex = printSignatures ? `${config.id}_duplex.pdf` : null;
      await this.writepages({
        outname: outduplex,
        pageList: pages[0],
        back: false,
        alt: true,
      });
      config.fileList[config.index] = outduplex;
    } else {
      //      for non-duplex printers we have two files, print the first, flip
      //      the sheets over, then print the second
      const outname1 = printSignatures ? `${config.id}_side1.pdf` : null;
      const outname2 = printSignatures ? `${config.id}_side2.pdf` : null;

      await this.writepages({
        outname: outname1,
        pageList: pages[0],
        back: false,
        alt: false,
      });
      const pdfBack = await this.writepages({
        pageList: pages[1],
        back: true,
        alt: false,
      });
      return [pdfFront, pdfBack];
  }

  bundleSettings() {
    const currentConfig = loadConfiguration();
    const settings =
      `Imposer settings: ${JSON.stringify(currentConfig, null, 2)}` +
      '\n\n' +
      `Link to the imposer with these settings: ${window.location.href}`;
    this.zip.file('settings.txt', settings);
  }

  saveZip() {
    console.log('Saving zip... ');
    this.bundleSettings();
    return this.zip.generateAsync({ type: 'blob' }).then((blob) => {
      console.log('  calling saveAs on ', this.filename);
      saveAs(blob, `${this.filename}_bookbinder.zip`);
    });
  }

  /**
   * @typedef Sheet
   * @type {object}
   * @property {string} num - page number from original doc
   * @property {boolean} isBlank - true renders it blank-- will override any `num` included,
   * @property {boolean} vFlip - true if rendered upside down (180 rotation)
   */

  /**
   * @callback LineMaker
   */

  /**
   * @callback SheetMaker
   * @param {number} pageCount
   * @returns {Sheet[]}
   */

  /**
   * @param {string} id - base for the final PDF name
   * @param {Object} builder
   * @param {SheetMaker} builder.sheetMaker: function that takes the page count as a param and returns an array of sheets
   * @param {LineMaker} builder.lineMaker: function that makes a function that generates trim lines for the PDF
   * @param {boolean} builder.isLandscape: true if we need to have largest dimension be width
   * @param {string} builder.fileNameMod: string to affix to exported file name (contains no buffer begin/end characters)
   * @param {boolean} builder.isPacked: boolean - true if white spaces goes on the outside, false if white space goes everywhere (non-binding edge)
   */
  async buildSheets(id, builder) {
    const sheets = builder.sheetMaker(this.pagecount);
    const lineMaker = builder.lineMaker();
    console.log('Working with the sheet descritpion: ', sheets);
    const outPDF = await PDFDocument.create();
    const outPDF_back = await PDFDocument.create();

    for (let i = 0; i < sheets.length; ++i) {
      const isFront = i % 2 == 0;
      const isFirst = i < 2;
      console.log('Trying to write ', sheets[i]);
      const targetPDF = this.duplex || isFront ? outPDF : outPDF_back;
      await this.write_single_page(
        targetPDF,
        builder.isLandscape,
        isFront,
        isFirst,
        sheets[i],
        lineMaker
      );
    }
    {
      console.log(`Trying to save to PDF ${builder.fileNameMod} w/ packing : ${this.pack_pages}`);
      const fileName = `${id}_${builder.fileNameMod}${this.duplex ? '' : '_fronts'}.pdf`;
      await outPDF.save().then((pdfBytes) => {
        console.log('Calling zip.file on ', fileName);
        this.zip.file(fileName, pdfBytes);
      });
      this.filelist.push(fileName);
    }
    if (!this.duplex) {
      console.log('Trying to save to PDF (back pages)');
      const fileName = `${id}_${builder.fileNameMod}_backs.pdf`;
      await outPDF_back.save().then((pdfBytes) => {
        console.log('Calling zip.file on ', fileName);
        this.zip.file(fileName, pdfBytes);
      });
      this.filelist.push(fileName);
    }
    console.log('buildSheets complete');
    return outPDF;
  }

  /**
   * Spits out a document of specificed `papersize` dimensions.
   * The 2 dimensional pagelist determines the size of the rendered pages.
   * The height of each rendered page is `papersize[1] / pagelist.length`.
   * The width of each rendered page is `papersize[0] / pagelist[x].length`.
   *
   * @param outPDF - the PDFDocument document we're appending a page to
   * @param {boolean} isLandscape - true if we need to have largest dimension be width
   * @param {boolean} isFront - true if front of page
   * @param {boolean} isFirst - true if this is the first (front/back) pair of sheets
   * @param {Sheet[][]} pagelist - a 2 dimensional array. Outer array is rows, nested array page objects.
   * @param {LineMaker} lineMaker - a function called to generate list of lines as described by PDF-lib.js's `PDFPageDrawLineOptions` object.
   *      Function takes as parameters:
   * @return
   */
  async write_single_page(outPDF, isLandscape, isFront, isFirst, pagelist, lineMaker) {
    const filteredList = [];
    console.log(pagelist);
    pagelist = pagelist.filter((r) => {
      // need second sheet to remain small even if there's room to expand
      return (
        !isFirst ||
        r.filter((c) => {
          return c.isBlank == false;
        }).length > 0
      );
    });
    console.log(pagelist);
    console.log(
      `Hitting that write_single_page : isPacked[${this.pack_pages}] || (front ${isFront}/ first ${isFirst}) [${pagelist.length},${pagelist[0].length}]`
    );
    pagelist.forEach((row) => {
      row.forEach((page) => {
        if (!page.isBlank) filteredList.push(page.num);
      });
    });
    if (filteredList.length == 0) {
      console.warn('All the pages are empty! : ', pagelist);
      return;
    }
    const embeddedPages = await outPDF.embedPdf(this.managedDoc, filteredList);
    // TODO : make sure the max dimen is correct here...
    const papersize = isLandscape
      ? [this.papersize[1], this.papersize[0]]
      : [this.papersize[0], this.papersize[1]];
    const curPage = outPDF.addPage(papersize);
    const sourcePage = embeddedPages.slice(0, 1)[0];
    const pageHeight = papersize[1] / pagelist.length;
    const pageWidth = papersize[0] / pagelist[0].length;
    const heightRatio = pageHeight / sourcePage.height;
    const widthRatio = pageWidth / (sourcePage.width + this.fore_edge_padding_pt);
    const pageScale = Math.min(heightRatio, widthRatio);
    const vGap = papersize[1] - sourcePage.height * pageScale * pagelist.length;
    const topGap = this.pack_pages ? vGap / 2.0 : vGap / (pagelist.length * 2);
    const hGap =
      papersize[0] -
      (sourcePage.width + this.fore_edge_padding_pt) * pageScale * pagelist[0].length;
    const leftGap = this.pack_pages ? hGap / 2.0 : hGap / pagelist[0].length;
    const printPageWidth = pageScale * sourcePage.width;
    const printPageHeight = pageScale * sourcePage.height;
    const printedForeEdgeGutter = pageScale * this.fore_edge_padding_pt;
    for (let row = 0; row < pagelist.length; ++row) {
      const y = sourcePage.height * pageScale * row;
      for (let i = 0; i < pagelist[row].length; ++i) {
        const x =
          (sourcePage.width + this.fore_edge_padding_pt) * pageScale * i +
          ((this.fore_edge_padding_pt * (i + 1)) % 2);
        const pageInfo = pagelist[row][i];
        if (pageInfo.isBlank) continue;
        const origPage = embeddedPages[filteredList.indexOf(pageInfo.num)];
        const hOffset = this.pack_pages ? leftGap : (1 + i - (i % 2)) * leftGap;
        const vOffset = this.pack_pages ? topGap : topGap + 2 * topGap * row;
        const positioning = {
          x:
            x +
            hOffset +
            (pageInfo.vFlip ? printPageWidth : 0) +
            printedForeEdgeGutter * ((i + 1) % 2),
          y: y + vOffset + (pageInfo.vFlip ? printPageHeight : 0),
          width: printPageWidth,
          height: printPageHeight,
          rotate: pageInfo.vFlip ? degrees(180) : degrees(0),
        };
        //console.log(" [",row,",",i,"] Given page info ", pageInfo, " now embedding at ", positioning);
        curPage.drawPage(origPage, positioning);
      }
    }
    lineMaker({
      isFront: isFront,
      gap: [leftGap, topGap],
      renderPageSize: [printPageWidth + printedForeEdgeGutter, printPageHeight],
      paperSize: papersize,
      isPacked: this.pack_pages,
    }).forEach((line) => {
      curPage.drawLine(line);
    });
  }
}
