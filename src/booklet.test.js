import { Booklet } from './booklet';

describe('Booklet model', () => {
    it('returns a new booklet based on the provided params (default book values)', () => {
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

    it('returns a new booklet based on the provided params (duplex, no rotate, 4 per sheet)', () => {
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

    it('returns a new booklet based on the provided params (now with pages)', () => {
        const testPages = [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            'b',
            'b',
            'b',
        ];
        // TODO confirm this 'expected' result is indeed what is wanted - I've just copied the result of making a new model with the testPages as input, assuming it's currently working as-intended
        const expected = {
            duplex: true,
            sigconfig: [1],
            pagelist: [
                [
                    12,
                    11,
                    10,
                    13,
                    14,
                    9,
                    8,
                    15,
                    16,
                    7,
                    6,
                    17,
                    18,
                    5,
                    4,
                    19,
                    20,
                    3,
                    2,
                    'b',
                    'b',
                    1,
                    0,
                    'b',
                ],
            ],
            sheets: 1,
            per_sheet: 4,
            rotate: false,
        };
        const testDuplex = true;
        const testPerSheet = 4;
        const testDuplexRotate = false;
        const actual = new Booklet(
            testPages,
            testDuplex,
            testPerSheet,
            testDuplexRotate
        );
        expect(actual).toEqual(expected);
    });
});
