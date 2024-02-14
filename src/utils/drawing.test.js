// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, describe, it } from 'vitest';

import { drawFoldlines } from './drawing.js';

describe('tests foldline drawing', () => {
  const mockPaper = [50, 100];
  const folioFoldsRotate = [
    { start: { x: 0, y: 50 }, end: { x: 50, y: 50 }, dashArray: [10, 5], opacity: 0.4 },
  ];
  const quartoFoldsRotate = [
    { start: { x: 25, y: 50 }, end: { x: 25, y: 0 }, dashArray: [5, 5], opacity: 0.4 },
  ];
  const octavoFoldsRotate = [
    { start: { x: 25, y: 75 }, end: { x: 0, y: 75 }, dashArray: [3, 5], opacity: 0.4 },
    ...quartoFoldsRotate,
  ];
  const sextidecimoFoldsRotate = [
    { start: { x: 37.5, y: 50 }, end: { x: 37.5, y: 75 }, dashArray: [1, 5], opacity: 0.4 },
    ...octavoFoldsRotate,
  ];

  const folioFolds = folioFoldsRotate;
  const quartoFolds = [
    { start: { x: 25, y: 50 }, end: { x: 25, y: 100 }, dashArray: [5, 5], opacity: 0.4 },
  ];
  const octavoFolds = [
    { start: { x: 25, y: 25 }, end: { x: 100, y: 25 }, dashArray: [3, 5], opacity: 0.4 },
    ...quartoFolds,
  ];
  const sextidecimoFolds = [
    { start: { x: 12.5, y: 50 }, end: { x: 12.5, y: 25 }, dashArray: [1, 5], opacity: 0.4 },
    ...octavoFolds,
  ];

  const results = {
    4: {
      frontRotate: folioFoldsRotate,
      backRotate: [],
      front: folioFolds,
      back: [],
    },
    8: {
      frontRotate: folioFoldsRotate,
      backRotate: quartoFoldsRotate,
      front: folioFolds,
      back: quartoFolds,
    },
    16: {
      frontRotate: folioFoldsRotate,
      backRotate: octavoFoldsRotate,
      front: folioFolds,
      back: octavoFolds,
    },
    32: {
      frontRotate: folioFoldsRotate,
      backRotate: sextidecimoFoldsRotate,
      front: folioFolds,
      back: sextidecimoFolds,
    },
  };
  Object.keys(results).forEach((key) => {
    const { frontRotate, backRotate, front, back } = results[key];
    const intKey = parseInt(key, 10);
    it(`produces the correct foldlines for ${key}-per-sheet fronts`, () => {
      let actual = drawFoldlines(false, false, mockPaper, intKey);
      expect(actual).toEqual(front);
    });

    it(`produces the correct foldlines for ${key}-per-sheet backs`, () => {
      let actual = drawFoldlines(true, false, mockPaper, intKey);
      expect(actual).toEqual(back);
    });

    it(`produces the correct foldlines for ${key}-per-sheet fronts with duplex rotation`, () => {
      let actual = drawFoldlines(false, true, mockPaper, intKey);
      expect(actual).toEqual(frontRotate);
    });

    it(`produces the correct foldlines for ${key}-per-sheet backs with duplex rotation`, () => {
      const actual = drawFoldlines(true, true, mockPaper, intKey);
      expect(actual).toEqual(backRotate);
    });
  });
});
