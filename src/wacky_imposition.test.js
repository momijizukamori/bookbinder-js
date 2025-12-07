// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, describe, it } from 'vitest';

import { WackyImposition } from './wacky_imposition';

describe('WackyImposition model', () => {
  it('returns a new instance of a WackyImposition', () => {
    const testPages = [];
    const testDuplex = true;
    const testFormat = 'standardsig';
    const expected = {
      duplex: true,
      sigconfig: [],
      pagelistdetails: [[]],
      sheets: 0,
      wackyOneThirdMode: 'per_sheet'
    };
    const actual = new WackyImposition(testPages, testDuplex, testFormat);
    console.log(actual);
    expect(actual).toEqual(expected);
  });
  // TODO add tests with actual pages for other formats

  describe('build_1_3rd_sheetList', () => {
    const testPages = [];
    const duplex = true;
    const testFormat = '1_3rd';
    const isPacked = true;

    describe ("signature per sheet mode", () => {
      const wackyOneThirdMode = 'per_sheet';
      const wackyImposition  = new WackyImposition(testPages, duplex, testFormat, isPacked, wackyOneThirdMode);

      it('lays out a simple 12 page input', async () => {
        const actual = wackyImposition.build_1_3rd_sheetList(12);

        expect(extractField(actual, page => page.num)).toEqual([
          [ [7, 4], [8, 3], [11, 0] ], // front
          [ [5, 6], [2, 9], [1, 10] ], // back
        ]);

        expect(extractField(actual, page => page.isBlank)).toEqual([
          [ [false, false], [false, false], [false, false] ],
          [ [false, false], [false, false], [false, false] ],
        ]);

        expect(extractField(actual, page => page.vFlip)).toEqual([
          [ [false, false], [true, true], [false, false] ],
          [ [false, false], [true, true], [false, false] ],
        ]);
      });

      it('generates blank pages for a 9 page input file', async () => {
        const actual = wackyImposition.build_1_3rd_sheetList(9);

        expect(extractField(actual, page => page.num)).toEqual([
          [[7, 4], [8, 3], [0, 0]],
          [[5, 6], [2, 0], [1, 0]],
        ]);

        expect(extractField(actual, page => page.isBlank)).toEqual([
          [[false, false], [false, false], [true, false]],
          [[false, false], [false, true], [false, true]],
        ]);

        expect(extractField(actual, page => page.vFlip)).toEqual([
          [[false, false], [true, true], [false, false]],
          [[false, false], [true, true], [false, false]],
        ]);
      });

      it('generates a signature per sheet', async () => {
        const actual = wackyImposition.build_1_3rd_sheetList(24);

        expect(extractField(actual, (page) => page.num)).toEqual([
          [[7, 4], [8, 3], [11, 0]], // a signature (front+back) for the 1st sheet
          [[5, 6], [2, 9], [1, 10]],
          [[19, 16], [20, 15], [23, 12]], // and a signature for the 2nd sheet
          [[17, 18], [14, 21], [13, 22]],
        ]);

        expect(extractField(actual, (page) => page.vFlip)).toEqual([
          [[false, false], [true, true], [false, false]],
          [[false, false], [true, true], [false, false]],
          [[false, false], [true, true], [false, false]],
          [[false, false], [true, true], [false, false]],
        ]);
      });
    });

    describe('single signature booklet mode', () => {
      const wackyOneThirdMode = 'booklet';
      const wackyImposition  = new WackyImposition(testPages, duplex, testFormat, isPacked, wackyOneThirdMode);

      it('lays out a simple 12 page input', async () => {
        const actual = wackyImposition.build_1_3rd_sheetList(12);

        expect(extractField(actual, page => page.num)).toEqual([
          [ [7, 4], [8, 3], [11, 0] ], // front
          [ [5, 6], [2, 9], [1, 10] ], // back
        ]);

        expect(extractField(actual, page => page.isBlank)).toEqual([
          [ [false, false], [false, false], [false, false] ],
          [ [false, false], [false, false], [false, false] ],
        ]);

        expect(extractField(actual, page => page.vFlip)).toEqual([
          [ [false, false], [true, true], [false, false] ],
          [ [false, false], [true, true], [false, false] ],
        ]);
      });

      it('generates blank pages for a 9 page input file', async () => {
        const actual = wackyImposition.build_1_3rd_sheetList(9);

        expect(extractField(actual, page => page.num)).toEqual([
          [[7, 4], [8, 3], [0, 0]],
          [[5, 6], [2, 0], [1, 0]],
        ]);

        expect(extractField(actual, page => page.isBlank)).toEqual([
          [[false, false], [false, false], [true, false]],
          [[false, false], [false, true], [false, true]],
        ]);

        expect(extractField(actual, page => page.vFlip)).toEqual([
          [[false, false], [true, true], [false, false]],
          [[false, false], [true, true], [false, false]],
        ]);
      });

      it('lays out a 24 page input file (2 sheets)', async () => {
        const actual = wackyImposition.build_1_3rd_sheetList(24);

        expect(extractField(actual, page => page.num)).toEqual([
          [ [15, 8], [16, 7], [23, 0] ],
          [ [9, 14], [6, 17], [1, 22] ],
          [ [13, 10], [18, 5], [21, 2] ],
          [ [11, 12], [4, 19], [3, 20] ],
        ]);

        expect(extractField(actual, page => page.vFlip)).toEqual([
          [[false,false],[true,true],[false,false]],
          [[false,false],[true,true],[false,false]],
          [[false,false],[true,true],[false,false]],
          [[false,false],[true,true],[false,false]]
        ]);
      });

      it('lays out a 36 page input file (3 sheets)', async () => {
        const actual = wackyImposition.build_1_3rd_sheetList(36);

        expect(extractField(actual, page => page.num)).toEqual([
          [ [23, 12], [24, 11], [35, 0] ],
          [ [13, 22], [10, 25], [1, 34] ],
          [ [21, 14], [26, 9], [33, 2] ],
          [ [15, 20], [8, 27], [3, 32] ],
          [ [19, 16], [28, 7], [31, 4] ],
          [ [17, 18], [6, 29], [5, 30] ],
        ]);

        expect(extractField(actual, page => page.vFlip)).toEqual([
          [[false,false],[true,true],[false,false]],
          [[false,false],[true,true],[false,false]],
          [[false,false],[true,true],[false,false]],
          [[false,false],[true,true],[false,false]],
          [[false,false],[true,true],[false,false]],
          [[false,false],[true,true],[false,false]]
        ]);
      });
    });
  });
});

const extractField = (sheets, extractor) => {
  return sheets.map((sheet) => {
    return sheet.map((side) => {
      return side.map(extractor);
    });
  });
};
