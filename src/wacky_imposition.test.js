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
    };
    const actual = new WackyImposition(testPages, testDuplex, testFormat);
    console.log(actual);
    expect(actual).toEqual(expected);
  });
  // TODO add tests with actual pages

  describe('build_1_3rd_sheetList', () => {
    const testPages = [];
    const duplex = true;
    const testFormat = '1_3rd';

    describe('a simple 12 page input file', () => {

      it('generates 2 sheets with the correct pages', async () => {
        const expected = [
          [
            [
              { "num": 7, "isBlank": false, "vFlip": false },
              { "num": 4, "isBlank": false, "vFlip": false }
            ],
            [
              { "num": 8, "isBlank": false, "vFlip": true },
              { "num": 3, "isBlank": false, "vFlip": true }
            ],
            [
              { "num": 11, "isBlank": false, "vFlip": false },
              { "num": 0, "isBlank": false, "vFlip": false }
            ]
          ],
          [
            [
              { "num": 5, "isBlank": false, "vFlip": false },
              { "num": 6, "isBlank": false, "vFlip": false }
            ],
            [
              { "num": 2, "isBlank": false, "vFlip": true },
              { "num": 9, "isBlank": false, "vFlip": true }
            ],
            [
              { "num": 1, "isBlank": false, "vFlip": false },
              { "num": 10, "isBlank": false, "vFlip": false }
            ]
          ]
        ];

        const actual = new WackyImposition(testPages, duplex, testFormat).build_1_3rd_sheetList(12);

        expect(actual).toEqual(expected);
      });
    });


  });
});
