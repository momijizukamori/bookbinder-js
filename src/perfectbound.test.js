// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 

import { expect, describe, it } from 'vitest';

import { PerfectBound } from './perfectbound';

const testPages = [];
const testPagesEven = Array.from({length: 32}, (x, i) => i + 1);
const generatePageInfo = (page) => {return {info: page, isSigEnd: true, isSigStart: true}};

describe('PerfectBound model', () => {
    it('returns config for a perfectbound booklet based on params (default)', () => {
        const testDuplex = true;
        const expected = {
            duplex: true,
            sheets: 0,
            per_sheet: 4,
            duplexrotate: true,
            sigconfig: ['N/A'],
            pagelistdetails: [[]],
        };
        const actual = new PerfectBound(testPages, testDuplex, 4, true);
        expect(actual).toEqual(expected);
    });

    it('returns config for a perfectbound booklet based on params (no duplex)', () => {
        const testDuplex = false;
        const expected = {
            duplex: false,
            duplexrotate: false,
            sheets: 0,
            per_sheet: 4,
            sigconfig: ['N/A'],
            pagelistdetails: [[], []],
        };
        const actual = new PerfectBound(testPages, testDuplex, 4, false);
        expect(actual).toEqual(expected);
    });

    it('correctly orders folio pages with no duplex', () => {
        const testDuplex = false;
        const expected = {
            duplex: false,
            duplexrotate: false,
            sheets: 8,
            per_sheet: 4,
            sigconfig: ['N/A'],
            pagelistdetails: [[3,2,7,6,11,10,15,14,19,18,23,22,27,26,31,30].map(generatePageInfo), [1,4,5,8,9,12,13,16,17,20,21,24,25,28,29,32].map(generatePageInfo)],
        };
        const actual = new PerfectBound(testPagesEven, testDuplex, 4, false);
        expect(actual).toEqual(expected);
    });

    it('correctly orders quarto pages with no duplex', () => {
        const testDuplex = false;
        const expected = {
            duplex: false,
            duplexrotate: false,
            sheets: 4,
            per_sheet: 8,
            sigconfig: ['N/A'],
            pagelistdetails: [[4,1,7,6,12,9,15,14,20,17,23,22,28,25,31,30].map(generatePageInfo), [8,5,3,2,16,13,11,10,24,21,19,18,32,29,27,26].map(generatePageInfo)],
        };
        const actual = new PerfectBound(testPagesEven, testDuplex, 8, false);
        expect(actual).toEqual(expected);
    });
});
