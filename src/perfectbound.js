// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 
import { PERFECTBOUND_LAYOUTS } from './constants';

export class PerfectBound {

	//  Duplex printer pages are arranged in a 4-1-2-3 pattern.
	// 	Single-sided pages are arranged in two sets, 4-1 and 2-3.
	// 	After printing two to a page, each sheet is folded in half
	// 	and all the sheets collated into a block for gluing. 
	// 	this.pagelist holds the rearranged index numbers that the 
	// 	book class uses to create a finished document
    constructor(pages, duplex, per_sheet, duplexrotate) {
		this.duplex=duplex;
		this.per_sheet = per_sheet || 4; // pages per sheet - default is 4.
		this.duplexrotate = duplexrotate || false;

		this.sheets = Math.ceil(pages.length/per_sheet);
		this.sigconfig=['N/A'];

		const {front, rotate, back} = PERFECTBOUND_LAYOUTS[per_sheet];
		const front_config = front;
        const back_config = duplexrotate ? rotate : back;

        this.pagelistdetails = duplex ? [[]] : [[], []];

		// Pad the page list with blanks if necessary
		const totalpages = this.sheets * per_sheet;
		if (totalpages > pages.length) {
			const diff = totalpages - pages.length;
			let blanks = new Array(diff).fill('b');
			this.inputpagelist.push(...blanks);
		}

        for (let i=0; i < pages.length; i=i+per_sheet ) {
			const block = pages.slice(i, i + per_sheet);

            front_config.forEach((pnum) => {
                let page = block[pnum - 1]; //page layouts are 1-indexed, not 0-index
                this.pagelistdetails[0].push({
                    info: page,
                    isSigStart: true, 
                    isSigEnd: true
                });
            });

            const backlist = this.duplex ? 0 : 1;

            back_config.forEach((pnum) => {
                let page = block[pnum - 1];
                this.pagelistdetails[backlist].push({
                    info: page,
                    isSigStart: true, 
                    isSigEnd: true
                });
            });

        }
    }

}