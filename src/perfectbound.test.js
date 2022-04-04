import { PerfectBound } from './perfectbound';

describe('PerfectBound model', () => {
    it('returns config for a perfectbound booklet based on params (default)', () => {
        const testPages = [];
        const testDuplex = true;
        const expected = {
            duplex: true,
            sheets: 0,
            sigconfig: [],
            pagelist: [[]],
        };
        const actual = new PerfectBound(testPages, testDuplex);
        expect(actual).toEqual(expected);
    });

    it('returns config for a perfectbound booklet based on params (no duplex)', () => {
        const testPages = [];
        const testDuplex = false;
        const expected = {
            duplex: false,
            sheets: 0,
            sigconfig: [],
            pagelist: [[], []],
        };
        const actual = new PerfectBound(testPages, testDuplex);
        expect(actual).toEqual(expected);
    });

    // TODO add tests with actual pages
});
