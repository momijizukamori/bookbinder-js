// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
import { expect, describe, it } from 'vitest';
import { Book } from './book';
import { schema } from './models/configuration';

describe('Book model', () => {
  // TODO confirm that this is what a newly created book (that is, without any settings changed) should look like; I've copied the result from how it currently works assuming it's working as-intended
  const defaultBook = {
    inputpdf: null,
    duplex: true,
    duplexrotate: false,
    papersize: [595, 842],
    flyleafs: 1,
    spineoffset: false,
    format: 'standardsig',
    sigsize: 4,
    customsig: false,
    input: null,
    currentdoc: null,
    pagecount: null,
    cropbox: null,
    orderedpages: [],
    rearrangedpages: [],
    filelist: [],
    zip: null,
    page_layout: {
      rotations: [[-90], [-90]],
      landscape: true,
      rows: 2,
      cols: 1,
      per_sheet: 4,
    },
    per_sheet: 4,
    cropmarks: false,
    pdfEdgeMarks: false,
    cutmarks: false,
    fore_edge_padding_pt: 0,
    pack_pages: true,
    padding_pt: {
      binding: 0,
      bottom: 0,
      fore_edge: 0,
      top: 0,
    },
    sewingMarks: {
      sewingMarkLocation: 'all',
      amount: 3,
      isEnabled: false,
      marginPt: 72,
      tapeWidthPt: 36,
    },
    managedDoc: null,
    page_positioning: 'centered',
    page_scaling: 'lockratio',
    paper_rotation_90: false,
    source_rotation: 'none',
    print_file: 'both',
    signatureconfig: [],
    sigOrderMarks: false,
    wacky_one_third_mode: "per_sheet",
  };

  it('returns a new Book', () => {
    const defaultConfiguration = schema.parse({});
    const expected = defaultBook;
    const actual = new Book(defaultConfiguration);
    expect(actual).toEqual(expected);
  });
  // TODO test update
  // TODO test openPDF
  // TODO test createoutputfiles
  // TODO test createPages
});
