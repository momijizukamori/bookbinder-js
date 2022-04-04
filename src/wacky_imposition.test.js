import { WackyImposition } from './wacky_imposition';

describe('WackyImposition model', () => {
    it('returns a new instance of a WackyImposition', () => {
        const testPages = [];
        const testDuplex = true;
        const testFormat = 'standardsig';
        const expected = {
            duplex: true,
            sigconfig: [],
            pagelist: [[]],
            sheets: 0,
        };
        const actual = new WackyImposition(testPages, testDuplex, testFormat);
        console.log(actual);
        expect(actual).toEqual(expected);
    });
	// TODO add tests with actual pages
});
