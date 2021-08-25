export class PerfectBound {

	//  Duplex printer pages are arranged in a 4-1-2-3 pattern.
	// 	Single-sided pages are arranged in two sets, 4-1 and 2-3.
	// 	After printing two to a page, each sheet is folded in half
	// 	and all the sheets collated into a block for gluing. 
	// 	this.pagelist holds the rearranged index numbers that the 
	// 	book class uses to create a finished document
    constructor(pages, duplex) {
		this.duplex=duplex;

		this.sheets = Math.ceil(pages.length/4);
		this.sigconfig= new Array(this.sheets).fill('4');

        this.pagelist = duplex ? [[]] : [[], []];

        for (let i=0; i < pages.length; i=i+4 ) {
            if (duplex) {
				this.pagelist[0].push(pages[i+3]);
				this.pagelist[0].push(pages[i]);
				this.pagelist[0].push(pages[i+1]);
				this.pagelist[0].push(pages[i+2]);
            } else {
				this.pagelist[0].push(pages[i+3]);
				this.pagelist[0].push(pages[i]);
				this.pagelist[1].push(pages[i+1]);
				this.pagelist[1].push(pages[i+2]) ;
            }

        }
    }

}