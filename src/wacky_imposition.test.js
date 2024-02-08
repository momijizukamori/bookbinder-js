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
});
