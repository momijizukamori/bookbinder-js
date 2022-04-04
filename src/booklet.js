import { BOOKLET_LAYOUTS } from './constants';

export class Booklet {
    constructor(pages, duplex, per_sheet, duplexrotate) {
        this.duplex = duplex;

        this.sigconfig = [1];
        this.pagelist = duplex ? [[]] : [[], []];
        this.sheets = 1;
        this.per_sheet = per_sheet;
        this.rotate = duplexrotate;

        let center = pages.length / 2; // because of zero indexing, this is actually the first page after the center fold
        const pageblock = per_sheet / 2; // number of pages before and after the center fold, per sheet
        const front_config = BOOKLET_LAYOUTS[this.per_sheet].front;
        const back_config = this.rotate
            ? BOOKLET_LAYOUTS[this.per_sheet].rotate
            : BOOKLET_LAYOUTS[this.per_sheet].back;

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
                this.pagelist[0].push(page);
            });

            const backlist = this.duplex ? 0 : 1;

            back_config.forEach((pnum) => {
                let page = block[pnum - 1];
                this.pagelist[backlist].push(page);
            });

            // Update all our counters
            front_start -= pageblock;
            front_end -= pageblock;
            back_start += pageblock;
            back_end += pageblock;
        }
    }
}
