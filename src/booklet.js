// For page layouts: pages are 1-indexed for sanity reasons, and the order for the back list must be reversed
// 'front' will be the side that ends up with consecutive pagenumbers on the innermost fold, by convention.
// page numbers should be listed from left to right, top to bottom, starting in the top left.

const page_layouts = {
	4: {front: [2, 3], back: [4, 1]},
	8: {front: [8, 1, 5, 4], back: [7, 2, 6, 3 ]},
	// 16: {front:[12, 13, 5, 11, 8, 1, 9, 16], back: [14, 11, 3, 6, 2, 7, 15, 10]}
	16: {front:[13, 12, 11, 5, 1, 8, 16, 9], back: [14, 11, 3, 6, 2, 7, 15, 10]}
}

export class Booklet{
    constructor(pages, duplex, per_sheet) {
		this.duplex=duplex;
		
		this.sigconfig=[1];
        this.pagelist = duplex ? [[]] : [[], []];
		this.sheets = 1;
		this.per_sheet = per_sheet;

		let center = pages.length / 2; // because of zero indexing, this is actually the first page after the center fold
		const pageblock = per_sheet / 2; // number of pages before and after the center fold, per sheet
		const front_config = page_layouts[this.per_sheet].front;
		const back_config = page_layouts[this.per_sheet].back;

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
			console.log(block);

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

        // let forwards=0;
		// let backwards=pages.length-1;
		// let backwards2=pages.length-2;
		// let forwards2=1;
        // for (let i=0; i < pages.length; i=i+4 ) {
        //     if (duplex) {
		// 		this.pagelist[0].push(pages[backwards]);
		// 		this.pagelist[0].push(pages[forwards]);
		// 		this.pagelist[0].push(pages[forwards2]);
		// 		this.pagelist[0].push(pages[backwards2]);
        //     } else {
        //         this.pagelist[0].push(pages[backwards]);
		// 		this.pagelist[0].push(pages[forwards]);
		// 		this.pagelist[1].push(pages[forwards2]);
		// 		this.pagelist[1].push(pages[backwards2])   ; 
        //     }

        //     backwards=backwards-2;
		// 	forwards=forwards+2;
		// 	backwards2=backwards2-2;
		// 	forwards2=forwards2+2;
        // }

		//console.log(this.pagelist);
    }
}