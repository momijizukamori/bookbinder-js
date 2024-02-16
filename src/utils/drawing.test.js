// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, describe, it } from 'vitest';

import { drawFoldlines, drawCropmarks } from './drawing.js';
import { LINE_LEN } from '../constants.js';

const mockPaper = [50, 100];

describe('tests foldline drawing', () => {
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
      const actual = drawFoldlines(false, false, mockPaper, intKey);
      expect(actual).toEqual(front);
    });

    it(`produces the correct foldlines for ${key}-per-sheet backs`, () => {
      const actual = drawFoldlines(true, false, mockPaper, intKey);
      expect(actual).toEqual(back);
    });

    it(`produces the correct foldlines for ${key}-per-sheet fronts with duplex rotation`, () => {
      const actual = drawFoldlines(false, true, mockPaper, intKey);
      expect(actual).toEqual(frontRotate);
    });

    it(`produces the correct foldlines for ${key}-per-sheet backs with duplex rotation`, () => {
      const actual = drawFoldlines(true, true, mockPaper, intKey);
      expect(actual).toEqual(backRotate);
    });
  });
});

describe('tests cropmark drawing', () => {
  const quartoMarks = [
    { start: { x: 0, y: 50 }, end: { x: LINE_LEN, y: 50 }, opacity: 0.4 },
    { start: { x: 50 - LINE_LEN, y: 50 }, end: { x: 50, y: 50 }, opacity: 0.4 },
  ];
  const octavoMarks = [
    { start: { x: 25, y: 0 }, end: { x: 25, y: LINE_LEN }, opacity: 0.4 },
    { start: { x: 25, y: 100 - LINE_LEN }, end: { x: 25, y: 100 }, opacity: 0.4 },
    { start: { x: 25 - LINE_LEN, y: 50 }, end: { x: 25 + LINE_LEN, y: 50 }, opacity: 0.4 },
    { start: { x: 25, y: 50 - LINE_LEN }, end: { x: 25, y: 50 + LINE_LEN }, opacity: 0.4 },
    ...quartoMarks,
  ];
  const sextidecimoMarks = [
    { start: { x: 0, y: 75 }, end: { x: LINE_LEN, y: 75 }, opacity: 0.4 },
    { start: { x: 50 - LINE_LEN, y: 75 }, end: { x: 50, y: 75 }, opacity: 0.4 },
    { start: { x: 0, y: 25 }, end: { x: LINE_LEN, y: 25 }, opacity: 0.4 },
    { start: { x: 50 - LINE_LEN, y: 25 }, end: { x: 50, y: 25 }, opacity: 0.4 },
    { start: { x: 25 - LINE_LEN, y: 75 }, end: { x: 25 + LINE_LEN, y: 75 }, opacity: 0.4 },
    { start: { x: 25, y: 75 - LINE_LEN }, end: { x: 25, y: 75 + LINE_LEN }, opacity: 0.4 },
    { start: { x: 25 - LINE_LEN, y: 25 }, end: { x: 25 + LINE_LEN, y: 25 }, opacity: 0.4 },
    { start: { x: 25, y: 25 - LINE_LEN }, end: { x: 25, y: 25 + LINE_LEN }, opacity: 0.4 },
    ...octavoMarks,
  ];

  const results = {
    4: [],
    8: quartoMarks,
    16: octavoMarks,
    32: sextidecimoMarks,
  };
  Object.keys(results).forEach((key) => {
    const expected = results[key];
    const intKey = parseInt(key, 10);
    it(`produces the correct cropmarks for ${key}-per-sheet layouts`, () => {
      const actual = drawCropmarks(mockPaper, intKey);
      expect(actual).toEqual(expected);
    });
  });
});
