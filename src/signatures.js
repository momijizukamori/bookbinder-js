// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 

import {Booklet} from './booklet.js';

export class Signatures {

	// Takes a list of pagenumbers, splits them evenly, then rearranges the pages in each chunk.

	constructor(pages, duplex, sigsize, per_sheet, duplexrotate) {
		this.sigsize = sigsize;
		this.duplex = duplex;
		this.inputpagelist = pages;
		this.per_sheet = per_sheet || 4; // pages per sheet - default is 4.
		this.duplexrotate = duplexrotate || false;

		this.pagelist = [];
		this.pagelistdetails = [];

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
		this.pagelistdetails = [];
		this.signaturepagelists = [];

		this.splitpagelist();
	}
	createsigconfig() {

		this.sigconfig = this.generatesignatureindex();
		this.pagelist = [];
		this.pagelistdetails = [];
		this.signaturepagelists = [];

		this.splitpagelist();
	}

	splitpagelist() {
		console.log("Rebecca: splitpagelist()")
		let point = 0;
		let splitpoints = [0];

		//      calculate the points at which to split the document
		this.sigconfig.forEach(number => {
			point = point + (number * this.per_sheet);
			splitpoints.push(point);
		});
		console.log("   -- splitPoints ",splitpoints)

		for (let i = 0; i < this.sigconfig.length; i++) {
			let start = splitpoints[i];
			let end = splitpoints[i + 1];

			let pagerange = this.inputpagelist.slice(start, end); // .reverse();
			this.signaturepagelists.push(pagerange);
		}

		let newsigs = [];
		let newsigsdetails = [];

		//      Use the booklet class for each signature
		this.signaturepagelists.forEach(pagerange => {
			let newlist = new Booklet(pagerange, this.duplex, this.per_sheet, this.duplexrotate);
			console.log("   ---- went from "+pagerange+" to ",newlist)
			console.log("   ------ is ",newlist.pagelistdetails)
			newsigs.push(newlist.pagelist);
			newsigsdetails.push(newlist.pagelistdetails);
		});

		this.pagelist = newsigs;
		this.pagelistdetails = newsigsdetails;
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

		console.log("Rebeccca generatesignatureindex() = ",result)
		return result;
	}
}