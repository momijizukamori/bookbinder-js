export class Booklet{
    constructor(pages, duplex) {
		this.duplex=duplex;
		
		this.sigconfig=[1];
        this.pagelist = duplex ? [[]] : [[], []];
		this.sheets = 1;

        let forwards=0;
		let backwards=pages.length-1;
		let backwards2=pages.length-2;
		let forwards2=1;
        for (let i=0; i < pages.length; i=i+4 ) {
            if (duplex) {
				this.pagelist[0].push(pages[backwards]);
				this.pagelist[0].push(pages[forwards]);
				this.pagelist[0].push(pages[forwards2]);
				this.pagelist[0].push(pages[backwards2]);
            } else {
                this.pagelist[0].push(pages[backwards]);
				this.pagelist[0].push(pages[forwards]);
				this.pagelist[1].push(pages[forwards2]);
				this.pagelist[1].push(pages[backwards2])   ; 
            }

            backwards=backwards-2;
			forwards=forwards+2;
			backwards2=backwards2-2;
			forwards2=forwards2+2;
        }


    }
}