import {Booklet} from './booklet.js';

export class PartialSheetSignatures {

	// Takes a list of pagenumbers, splits them evenly, then rearranges the pages in each chunk.

	constructor(pages, duplex, sigsize, per_sheet, duplexrotate) {
		this.sigsize = sigsize;
		this.duplex = duplex;
		this.inputpagelist = pages;
		this.per_sheet = per_sheet || 4; // pages per sheet - default is 4.
		this.duplexrotate = duplexrotate || false;
            

		this.pagelist = [];

    this.sheets_per_sig = Math.ceil(this.sigsize/this.per_sheet);
    this.pages_to_add = (this.sheets_per_sig * this.per_sheet - this.sigsize)/2;
		this.sheets = Math.ceil(pages.length / this.sigsize)  * this.sheets_per_sig;
		this.all_pages_per_sig = this.sheets_per_sig*this.per_sheet

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
			point = point + (number * 4);
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
			let newlist = new Booklet(pagerange, this.duplex, this.per_sheet, this.duplexrotate);
			while (this.pages_to_add>0) {
        newlist.pagelist.unshift('b');
        newlist.pagelist.unshift('b');

        newlist.pagelist.push('b');
        newlist.pagelist.push('b');
        newlist.pagelist.push('b');
        newlist.pagelist.push('b');
        this.pages_to_add -=2
		}
			newsigs.push(newlist.pagelist);
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
}
