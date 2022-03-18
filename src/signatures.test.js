import { Signatures } from './signatures';

describe('Signatures model', () => {
    it('returns a new Signatures instance', () => {
        const testPages = [];
        const testDuplex = false;
        const testSigSize = 4;
        const testPerSheet = 8;
        const testDuplexRotate = true;
        const expected = {
            sigsize: 4,
            duplex: false,
            inputpagelist: [],
            per_sheet: 8,
            duplexrotate: true,
            pagelist: [],
            sheets: 0,
            sigconfig: [],
            signaturepagelists: [],
        };
        const actual = new Signatures(
            testPages,
            testDuplex,
            testSigSize,
            testPerSheet,
            testDuplexRotate
        );
        expect(actual).toEqual(expected);
    });
    // TODO add tests with actual pages
});
