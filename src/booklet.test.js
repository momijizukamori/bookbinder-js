import { Booklet } from "./booklet";

describe("Booklet model", () => {
    it("returns a new booklet based on the provided params (default book values)", () => {
        const testPages = [];
        const testDuplex = false;
        const testPerSheet = 8;
        const testDuplexRotate = true;
        const expected = {
            duplex: false,
            sigconfig: [1],
            pagelist: [[], []],
            sheets: 1,
            per_sheet: 8,
            rotate: true,
        };
        const actual = new Booklet(
            testPages,
            testDuplex,
            testPerSheet,
            testDuplexRotate
        );

        expect(actual).toEqual(expected);
    });

	it("returns a new booklet based on the provided params (duplex, no rotate, 4 per sheet)", () => {
        const testPages = [];
        const testDuplex = true;
        const testPerSheet = 4;
        const testDuplexRotate = false;
        const expected = {
            duplex: true,
            sigconfig: [1],
            pagelist: [[]],
            sheets: 1,
            per_sheet: 4,
            rotate: false,
        };
        const actual = new Booklet(
            testPages,
            testDuplex,
            testPerSheet,
            testDuplexRotate
        );

        expect(actual).toEqual(expected);
    });
    
    // TODO add tests with actual pages
});
