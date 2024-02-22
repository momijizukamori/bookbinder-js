// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { BOOKLET_LAYOUTS } from './constants';

export class Signatures {
  // Takes a list of pagenumbers, splits them evenly, then rearranges the pages in each chunk.
  /**
   * Create a signature.
   * @param {number[]} pages - List of pages in a book.
   * @param {boolean} duplex - Whether both front and back sides go in the same file or not.
   * @param {number} per_sheet - number of pages per sheet (front and back combined)
   * @param {boolean} duplexrotate - whether to rotate alternating sheets or not.
   */

  constructor(pages, duplex, sigsize, per_sheet, duplexrotate) {
    this.sigsize = sigsize;
    this.duplex = duplex;
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

    //      Use the booklet class for each signature
    this.signaturepagelists.forEach((pagerange) => {
      const pagelistdetails = this.booklet(
        pagerange,
        this.duplex,
        this.per_sheet,
        this.duplexrotate
      );
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
   */
  booklet(pages, duplex, per_sheet, duplexrotate) {
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

      front_config.forEach((pnum) => {
        const page = block[pnum - 1]; //page layouts are 1-indexed, not 0-index
        pagelistdetails[0].push({
          info: page,
          isSigStart: front_start == 0 && pnum == 1,
          isSigEnd: front_start == 0 && pnum == block.length,
        });
      });

      const backlist = this.duplex ? 0 : 1;

      back_config.forEach((pnum) => {
        const page = block[pnum - 1];
        pagelistdetails[backlist].push({
          info: page,
          isSigStart: front_start == 0 && pnum == 1,
          isSigEnd: front_start == 0 && pnum == block.length,
        });
      });

      // Update all our counters
      front_start -= pageblock;
      front_end -= pageblock;
      back_start += pageblock;
      back_end += pageblock;
    }

    return pagelistdetails;
  }
}
