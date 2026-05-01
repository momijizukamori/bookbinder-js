// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { BOOKLET_LAYOUTS } from './constants';

export class Signatures {
  // Takes a list of pagenumbers, splits them evenly, then rearranges the pages in each chunk.
  /**
   * Create a signature.
   * @param {number[]} pages - List of pages in a book.
   * @param {number} per_sheet - number of pages per sheet (front and back combined)
   * @param {boolean} duplexrotate - whether to rotate alternating sheets or not.
   */

  constructor(pages, sigsize, per_sheet, duplexrotate) {
    this.sigsize = sigsize;
    this.duplex = false;
    this.inputpagelist = pages;
    this.per_sheet = per_sheet || 4; // pages per sheet - default is 4.
    this.duplexrotate = duplexrotate || false;

    this.pagelistdetails = [];

    this.sheets = Math.ceil(pages.length / this.per_sheet);

    this.sigconfig = [];
    this.signaturepagelists = [];
  }
  setsigconfig(config) {
    this.sigconfig = config;

    const targetlength = this.inputpagelist.length;

    //	calculatelength given by multiplying config values by pages per sheet
    //	 and ensuring padding if longer than this.inputlist
    let total = 0;

    this.sigconfig.forEach((num) => (total += num * this.per_sheet));

    if (total > targetlength) {
      const diff = total - targetlength;
      const blanks = new Array(diff).fill('b');
      this.inputpagelist.push(...blanks);
    }
    this.pagelistdetails = [];
    this.signaturepagelists = [];

    this.splitpagelist();
  }
  createsigconfig() {
    this.sigconfig = this.generatesignatureindex();
    this.pagelistdetails = [];
    this.signaturepagelists = [];

    this.splitpagelist();
  }

  splitpagelist() {
    let point = 0;
    const splitpoints = [0];

    //      calculate the points at which to split the document
    this.sigconfig.forEach((number) => {
      point = point + number * this.per_sheet;
      splitpoints.push(point);
    });

    for (let i = 0; i < this.sigconfig.length; i++) {
      const start = splitpoints[i];
      const end = splitpoints[i + 1];

      const pagerange = this.inputpagelist.slice(start, end); // .reverse();
      this.signaturepagelists.push(pagerange);
    }

    const newsigs = [];

    // Use the appropriate imposition per signature
    this.signaturepagelists.forEach((pagerange, i) => {
      const pagelistdetails =
        this.per_sheet === 8
          ? this.quarto_booklet(pagerange, this.duplex, this.per_sheet, this.duplexrotate, i)
          : this.booklet(pagerange, this.duplex, this.per_sheet, this.duplexrotate, i);
      newsigs.push(pagelistdetails);
    });

    this.pagelistdetails = newsigs;
  }
  generatesignatureindex() {
    const preliminarytotal = Math.floor(this.sheets / this.sigsize);
    const modulus = this.sheets % this.sigsize;
    let signaturetotal = preliminarytotal;
    let flag = false;
    const result = [];

    if (modulus > 0) {
      //      need an extra signature
      signaturetotal += 1;
      flag = true;
    }

    //      calculate how many signatures are the full size and how many are one sheet short.
    let factor = signaturetotal - (this.sigsize - 1);
    factor += modulus - 1;

    for (let i = 0; i < signaturetotal; i++) {
      if (i >= factor && flag) {
        result.push(this.sigsize - 1);
      } else {
        result.push(this.sigsize);
      }
    }

    return result;
  }
  /**
   * Create a perfectbound book.
   * @param {number[]} pages - List of pages in a book.
   * @param {boolean} duplex - Whether both front and back sides go in the same file or not.
   * @param {number} per_sheet - number of pages per sheet (front and back combined)
   * @param {boolean} duplexrotate - whether to rotate alternating sheets or not.
   * @param {number} sig_num - signature number (0 indexed)
   */
  booklet(pages, duplex, per_sheet, duplexrotate, sig_num) {
    const pagelistdetails = duplex ? [[]] : [[], []];
    const { front, rotate, back } = BOOKLET_LAYOUTS[per_sheet];

    const center = pages.length / 2; // because of zero indexing, this is actually the first page after the center fold
    const pageblock = per_sheet / 2; // number of pages before and after the center fold, per sheet
    const front_config = front;
    const back_config = duplexrotate ? rotate : back;

    // The way the code works: we start with the innermost sheet of the signature (the only one with consecutive page numbers)
    // We then grab the the sections of pages that come on either side and reorder according to predefined page layout

    let front_start = center - pageblock;
    let front_end = center;
    let back_start = center;
    let back_end = center + pageblock;

    while (front_start >= 0 && back_end <= pages.length) {
      const front_block = pages.slice(front_start, front_end);
      const back_block = pages.slice(back_start, back_end);

      const block = [...front_block, ...back_block];

      console.log(
        `Looking front_config : block.length ${block.length} : given center ${center}, front_start ${front_start} - front_end ${front_end}, back_start ${back_start} - back_end ${back_end}, pages.length ${pages.length}`
      );
      front_config.forEach((pnum) => {
        const page = block[pnum - 1]; //page layouts are 1-indexed, not 0-index
        pagelistdetails[0].push({
          info: page,
          isSigStart: front_start == 0 && pnum == 1,
          isSigEnd: front_start == 0 && pnum == block.length,
          isSigMiddle: front_end == back_start && block.length / 2 + 1 == pnum,
          signatureNum: sig_num,
        });
        console.log(
          `  >> ${pnum}  :: ${page}  :: ${front_end == back_start && block.length / 2 + 1 == pnum}`
        );
      });

      const backlist = this.duplex ? 0 : 1;

      console.log(
        `Looking back_config : given center ${center}, front_start ${front_start} - front_end ${front_end}, back_start ${back_start} - back_end ${back_end}, pages.length ${pages.length}`
      );
      back_config.forEach((pnum) => {
        const page = block[pnum - 1];
        pagelistdetails[backlist].push({
          info: page,
          isSigStart: front_start == 0 && pnum == 1,
          isSigEnd: front_start == 0 && pnum == block.length,
          isSigMiddle: front_end == back_start && block.length / 2 + 1 == pnum,
          signatureNum: sig_num,
        });
        console.log(
          `  >> ${pnum}  :: ${page}  :: ${front_end == back_start && block.length / 2 + 1 == pnum}`
        );
      });

      // Update all our counters
      front_start -= pageblock;
      front_end -= pageblock;
      back_start += pageblock;
      back_end += pageblock;
    }

    return pagelistdetails;
  }

  /**
   * Quarto (8-up) imposition that allows folding the whole printed stack at once.
   * Because quarto pages are folded over the top, each sheet contains pages from both
   * the inner and outer "bands". This is very different from booklet/folio page arrangement,
   * which essentially only has a single "band" at a time.
   */
  quarto_booklet(pages, duplex, per_sheet, duplexrotate, sig_num) {
    // Quarto (8-up) special case:
    // - We need the printed stack (duplex, face-down) to fold as a whole into correct order.
    // - We treat each "layer" j (0 = innermost, increasing outward) and build one physical sheet per layer.
    // - For each layer we slice four 4-page "bands":
    //     innerFront:  pages just before the fold (top half, near center)
    //     innerBack:   pages just after the fold  (bottom half, near center)
    //     outerFront:  pages at the front edge    (top half, near edges)
    //     outerBack:   pages at the back edge     (bottom half, near edges)
    // - Then we choose TL/TR/BL/BR per side via a tiny index map that alternates by layer parity.
    // - We append layers in inner→outer order so the outermost sheet prints last and ends up on top (face-down).
    const pagelistdetails = duplex ? [[]] : [[], []];
    const center = pages.length / 2;
    const pagesPerBand = 4; // 2x2 per side
    const totalSheets = Math.floor(pages.length / per_sheet);

    // Helper to push a 4-page chunk with signature flags.
    // We put start/end marks on the back side of the outermost sheet
    // and `isSigMiddle` on the first back position for sewing marks.
    const pushWithFlags = (targetList, chunk, isBackSide, isOuterMost) => {
      for (let i = 0; i < chunk.length; i++) {
        targetList.push({
          info: chunk[i],
          isSigStart: isOuterMost && isBackSide && i === 0,
          isSigEnd: isOuterMost && isBackSide && i === chunk.length - 1,
          isSigMiddle: isBackSide && i === 0,
          signatureNum: sig_num,
        });
      }
    };

    // Build sheet sides from inner → outer; for each inner/outer layer pair,
    // emit two 4-page blocks per side in fixed order so the stack folds correctly.
    const layerPairs = Math.floor(totalSheets / 2);
    for (let j = layerPairs - 1; j >= 0; j--) {
      const isOuterMost = j === 0;

      // Inner bands adjacent to the fold
      const innerFront = pages.slice(center - (j + 1) * pagesPerBand, center - j * pagesPerBand);
      const innerBack = pages.slice(center + j * pagesPerBand, center + (j + 1) * pagesPerBand);

      // Outer bands at the edges
      const outerFront = pages.slice(j * pagesPerBand, (j + 1) * pagesPerBand);
      const outerBack = pages.slice(
        pages.length - (j + 1) * pagesPerBand,
        pages.length - j * pagesPerBand
      );

      // Rows per side within a sheet (TL,TR,BL,BR), fixed index patterns:
      // Front rows (two blocks per layer)
      const frontRowA = [innerBack[3], innerFront[0], outerBack[0], outerFront[3]];
      const frontRowB = [innerBack[1], innerFront[2], outerBack[2], outerFront[1]];
      // Back rows (two blocks per layer)
      const backRowA = [outerBack[1], outerFront[2], innerBack[2], innerFront[1]];
      const backRowB = [outerBack[3], outerFront[0], innerBack[0], innerFront[3]];

      const backIndex = this.duplex ? 0 : 1;
      pushWithFlags(pagelistdetails[0], frontRowA, false, isOuterMost);
      pushWithFlags(pagelistdetails[0], frontRowB, false, isOuterMost);
      pushWithFlags(pagelistdetails[backIndex], backRowA, true, isOuterMost);
      pushWithFlags(pagelistdetails[backIndex], backRowB, true, isOuterMost);
    }

    return pagelistdetails;
  }
}
