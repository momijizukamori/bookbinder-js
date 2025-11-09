// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, describe, it } from 'vitest';

import { Signatures } from './signatures';

describe('Signatures model', () => {
  it('returns a new Signatures instance', () => {
    const testPages = [];
    const testSigSize = 4;
    const testPerSheet = 8;
    const testDuplexRotate = true;
    const expected = {
      sigsize: 4,
      duplex: false,
      inputpagelist: [],
      per_sheet: 8,
      duplexrotate: true,
      pagelistdetails: [],
      sheets: 0,
      sigconfig: [],
      signaturepagelists: [],
    };
    const actual = new Signatures(testPages, testSigSize, testPerSheet, testDuplexRotate);
    expect(actual).toEqual(expected);
  });
  // TODO add tests with actual pages

  describe('folio layout', () => {
    const per_sheet = 4;
    const duplexrotate = false;

    describe('a 16 page PDF, with signature length = 4 and flyleafs = 1', () => {
      const pages = ['b', 'b', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 'b', 'b'];
      const sigsize = 4;

      it('computes pagelistdetails correctly', () => {
        const signatures = new Signatures(pages, sigsize, per_sheet, duplexrotate);

        signatures.createsigconfig();
        const infos = extractPageInfos(signatures.pagelistdetails);

        expect(infos).toEqual([
          // start of a signature
          [
            [4, 3, 6, 1, 8, 'b'],
            [2, 5, 0, 7, 'b', 9],
          ],
          // start of a signature
          [
            [14, 13, 'b', 11],
            [12, 15, 10, 'b'],
          ],
        ]);
      });
    });

    describe('a 16 page PDF, with signature length = 4 and flyleafs = 0', () => {
      const pages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      const sigsize = 4;

      it('computes pagelistdetails correctly', () => {
        const signatures = new Signatures(pages, sigsize, per_sheet, duplexrotate);
        signatures.createsigconfig();

        const infos = extractPageInfos(signatures.pagelistdetails);

        expect(infos).toEqual([
          [
            // start of a signature
            [8, 7, 10, 5, 12, 3, 14, 1], // front sides of the paper
            [6, 9, 4, 11, 2, 13, 0, 15], // back sides of the paper
          ],
        ]);
      });
    });
  });

  describe('quarto layout', () => {
    const per_sheet = 8;
    const duplexrotate = false;

    describe('a 16 page PDF, with signature length = 2 and flyleafs = 0', () => {
      const pages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      const sigsize = 2;

      it('computes pagelistdetails correctly', () => {
        const signatures = new Signatures(pages, sigsize, per_sheet, duplexrotate);
        signatures.createsigconfig();

        const infos = extractPageInfos(signatures.pagelistdetails);

        expect(infos).toEqual([
          [
            [11, 4, 12, 3, 9, 6, 14, 1],
            [13, 2, 10, 5, 15, 0, 8, 7],
          ],
        ]);
      });
    });

    describe('a 32 page PDF, with signature length = 2 and flyleafs = 0', () => {
      const pages = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        25, 26, 27, 28, 29, 30, 31,
      ];
      const sigsize = 4;

      it('computes pagelistdetails correctly', () => {
        const signatures = new Signatures(pages, sigsize, per_sheet, duplexrotate);
        signatures.createsigconfig();

        const infos = extractPageInfos(signatures.pagelistdetails);

        // Current behavior. Test passes, but it's wrong
        // expect(infos).toEqual([
        //   [
        //     [19, 12, 28, 3, 25, 6, 22, 9, 27, 4, 20, 11, 17, 14, 30, 1],
        //     [29, 2, 18, 13, 23, 8, 24, 7, 21, 10, 26, 5, 31, 0, 16, 15],
        //   ],
        // ]);

        // Desired behavior. Test is failing right now.
        expect(infos).toEqual([
          [
            [23, 8, 24, 7, 21, 10, 26, 5, 19, 12, 28, 3, 17, 14, 30, 1],
            [25, 6, 22, 9, 27, 4, 20, 11, 29, 2, 18, 13, 31, 0, 16, 15]
          ],
        ]);
      });
    });
  });
});

function extractPageInfos(pagelistdetails) {
  return pagelistdetails.map((currentSig) => {
    return currentSig.map((side) => {
      return side.map((page) => {
        return page.info;
      });
    });
  });
}
