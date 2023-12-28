// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 

import { expect, describe, it } from 'vitest';

import { PERFECTBOUND_LAYOUTS, BOOKLET_LAYOUTS, PAGE_LAYOUTS } from './constants';

function numSort(a, b) {
    return a - b;
  }
  

describe('Tests of the perfectbound layout constants', () => {
    Object.keys(PERFECTBOUND_LAYOUTS).forEach( (key) => {
        const {front, back, rotate} = PERFECTBOUND_LAYOUTS[key];
        it(`has the same pages on the back regardless of rotation for ${key}-per-sheet layouts`, () => {
            const back_sorted = back.sort(numSort);
            const back_rotated = rotate.sort(numSort);
            expect(back_sorted).toEqual(back_rotated);

        });

        it(`accounts for all pages in ${key}-per-sheet layouts`, () => {
            let both = front.concat(back);
            both.sort(numSort);
            const expected = Array.from({length: key}, (x, i) => i + 1);
            expect(both).toEqual(expected);

        });
});

});


describe('Tests of the booklet layout constants', () => {
    Object.keys(BOOKLET_LAYOUTS).forEach( (key) => {
        const {front, back, rotate} = BOOKLET_LAYOUTS[key];
        it(`has the same pages on the back regardless of rotation for ${key}-per-sheet layouts`, () => {
            const back_sorted = back.sort(numSort);
            const back_rotated = rotate.sort(numSort);
            expect(back_sorted).toEqual(back_rotated);

        });

        it(`accounts for all pages in ${key}-per-sheet layouts`, () => {
            let both = front.concat(back);
            both.sort(numSort);
            const expected = Array.from({length: key}, (x, i) => i + 1);
            expect(both).toEqual(expected);

        });
});

});

describe('Tests of the page layout constants', () => {
    Object.keys(PAGE_LAYOUTS).forEach( (key) => {
        const {rotations, rows, cols, per_sheet} = PAGE_LAYOUTS[key];
        it(`has the correct number of rows and columns ${key} layouts`, () => {
            const row_cols = rows * cols
            // rows and cols are per-side, while per_sheet is both sides
            expect(per_sheet).toEqual(row_cols * 2);

        });

        it(`accounts for all rows in ${key} layout rotations`, () => {
            expect(rows).toEqual(rotations.length);

        });

        it(`accounts for all columns in ${key} layout rotations`, () => {
            let col_counts = [];
            rotations.forEach(row => {
                col_counts.push(row.length);
            });
            const col_array = new Array(rows).fill(cols);
            expect(col_counts).toEqual(col_array);

        });
});

});