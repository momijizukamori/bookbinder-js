import { Book } from "./book";

describe("Book model", () => {
    it("returns a new Book", () => {
        const expected = {
            inputpdf: null,
            password: null,
            duplex: false,
            duplexrotate: true,
            papersize: [595, 842],
            lockratio: true,
            flyleaf: false,
            spineoffset: false,
            format: "standardsig",
            booksize: [null, null],
            sigsize: 4,
            customsig: null,
            signatureconfig: [],
            input: null,
            currentdoc: null,
            pagecount: null,
            cropbox: null,
            orderedpages: [],
            rearrangedpages: [],
            filelist: [],
            zip: null,
            page_layout: {
                rotations: [[-90], [-90]],
                landscape: true,
                rows: 2,
                cols: 1,
                per_sheet: 4,
            },
            per_sheet: 8,
            cropmarks: false,
            cutmarks: false,
        };
        const actual = new Book();
        expect(actual).toEqual(expected);
    });
});
