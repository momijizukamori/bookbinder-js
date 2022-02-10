// For page layouts: pages are 1-indexed for sanity reasons, and the order for the back list must be reversed
// 'front' will be the side that ends up with consecutive pagenumbers on the innermost fold, by convention.
// page numbers should be listed from left to right, top to bottom, starting in the top left.

const page_layouts = {
	4: {front: [3, 2], back: [1, 4], rotate: [4, 1]},
	8: {front: [6, 3, 7, 2], back: [8, 1, 5, 4], rotate: [4, 5, 1, 8]},
	 16: { front: [3, 6, 14, 11, 15, 10, 2, 7], back:[ 1, 8, 16, 9, 13, 12, 4, 5], rotate: [5, 4, 12, 13, 9, 16, 8, 1]},
	 32: {front: [30, 3, 6, 27, 19, 14, 11, 22, 18, 15, 10, 23, 31, 2, 7, 26], back: [32, 1, 8, 15, 17, 16, 9, 24, 20, 13, 12, 21, 29, 4, 5, 28], 
		rotate: [28, 5, 4, 29, 21, 12, 13, 20, 24, 9, 16, 17, 25, 8, 1, 32]}
}

export class Booklet{
    constructor(pages, duplex, per_sheet, duplexrotate) {
		this.duplex=duplex;
		
		this.sigconfig=[1];
        this.pagelist = duplex ? [[]] : [[], []];
		this.sheets = 1;
		this.per_sheet = per_sheet;
		this.rotate = duplexrotate;

		let center = pages.length / 2; // because of zero indexing, this is actually the first page after the center fold
		const pageblock = per_sheet / 2; // number of pages before and after the center fold, per sheet
		const front_config = page_layouts[this.per_sheet].front;
		const back_config = this.rotate ? page_layouts[this.per_sheet].rotate : page_layouts[this.per_sheet].back;

		// The way the code works: we start with the innermost sheet of the signature (the only one with consecutive page numbers)
		// We then grab the the sections of pages that come on either side and reorder according to predefined page layout

		let front_start = center - pageblock;
		let front_end = center;
		let back_start = center;
		let back_end = center + pageblock;


		while(front_start >= 0 && back_end <= pages.length) {
			let front_block = pages.slice(front_start, front_end)
			let back_block = pages.slice(back_start, back_end)

			let block = [...front_block, ...back_block];

			front_config.forEach(pnum => {
				let page = block[pnum - 1]; //page layouts are 1-indexed, not 0-index
				this.pagelist[0].push(page)
			});

			const backlist = this.duplex? 0 : 1;

			back_config.forEach(pnum => {
				let page = block[pnum - 1];
				this.pagelist[backlist].push(page)
			});

			// Update all our counters
			front_start -= pageblock;
			front_end -= pageblock
			back_start += pageblock;
			back_end += pageblock
		}
    }
}