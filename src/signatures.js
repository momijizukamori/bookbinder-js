// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 

import { BOOKLET_LAYOUTS } from './constants';

export class Signatures {

	// Takes a list of pagenumbers, splits them evenly, then rearranges the pages in each chunk.

	constructor(pages, duplex, sigsize, per_sheet, duplexrotate) {
		this.sigsize = sigsize;
		this.duplex = duplex;
		this.inputpagelist = pages;
		this.per_sheet = per_sheet || 4; // pages per sheet - default is 4.
		this.duplexrotate = duplexrotate || false;

		this.pagelist = [];

		this.sheets = Math.ceil(pages.length / this.per_sheet);

		this.sigconfig = [];
		this.signaturepagelists = [];

	}
	setsigconfig(config) {

		this.sigconfig = config;

		let targetlength = this.inputpagelist.length;

		//	calculatelength given by multiplying config values by pages per sheet
		//	 and ensuring padding if longer than this.inputlist
		let total = 0;

		this.sigconfig.forEach(num => total += num * this.per_sheet);

		if (total > targetlength) {

			let diff = total - targetlength;
			let blanks = new Array(diff).fill('b');
			this.inputpagelist.push(...blanks);
		}
		this.pagelist = [];
		this.signaturepagelists = [];

		this.splitpagelist();
	}
	createsigconfig() {

		this.sigconfig = this.generatesignatureindex();
		this.pagelist = [];
		this.signaturepagelists = [];

		this.splitpagelist();
	}

	splitpagelist() {
		let point = 0;
		let splitpoints = [0];

		//      calculate the points at which to split the document
		this.sigconfig.forEach(number => {
			point = point + (number * this.per_sheet);
			splitpoints.push(point);
		});


		for (let i = 0; i < this.sigconfig.length; i++) {
			let start = splitpoints[i];
			let end = splitpoints[i + 1];

			let pagerange = this.inputpagelist.slice(start, end); // .reverse();
			this.signaturepagelists.push(pagerange);
		}

		let newsigs = [];

		//      Use the booklet class for each signature
		this.signaturepagelists.forEach(pagerange => {
			let pagelist = this.booklet(pagerange, this.duplex, this.per_sheet, this.duplexrotate);
			newsigs.push(pagelist);
		});

		this.pagelist = newsigs;
	}
	generatesignatureindex() {

		let preliminarytotal = Math.floor(this.sheets / this.sigsize);
		let modulus = this.sheets % this.sigsize;
		let signaturetotal = preliminarytotal;
		let flag = false;
		let result = [];

		if (modulus > 0) {

			//      need an extra signature
			signaturetotal += 1;
			flag = true;
		}


		//      calculate how many signatures are the full size and how many are one sheet short.
		let factor = signaturetotal - (this.sigsize - 1);
		factor += (modulus - 1);

		for(let i = 0; i < signaturetotal; i++) {

			if (i >= factor && flag) {
				result.push(this.sigsize - 1);
			} else {
				result.push(this.sigsize);
			}
		}

		return result;
	}

	booklet(pages, duplex, per_sheet, duplexrotate) {
        let pagelist = duplex ? [[]] : [[], []];
        let sheets = 1;
		const {front, rotate, back} = BOOKLET_LAYOUTS[per_sheet];

        let center = pages.length / 2; // because of zero indexing, this is actually the first page after the center fold
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
            let front_block = pages.slice(front_start, front_end);
            let back_block = pages.slice(back_start, back_end);

            let block = [...front_block, ...back_block];

            front_config.forEach((pnum) => {
                let page = block[pnum - 1]; //page layouts are 1-indexed, not 0-index
                pagelist[0].push(page);
            });

            const backlist = this.duplex ? 0 : 1;

            back_config.forEach((pnum) => {
                let page = block[pnum - 1];
                pagelist[backlist].push(page);
            });

            // Update all our counters
            front_start -= pageblock;
            front_end -= pageblock;
            back_start += pageblock;
            back_end += pageblock;
        }

		return pagelist;
    }
}