// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
import { expect, describe, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
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
    sourcePageCount: null,
    selectedPages: [],
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
    pageRange: '',
    print_file: 'both',
    signatureconfig: [],
    sigOrderMarks: false,
  };

  it('returns a new Book', () => {
    const defaultConfiguration = schema.parse({});
    const expected = defaultBook;
    const actual = new Book(defaultConfiguration);
    expect(actual).toEqual(expected);
  });

  it('creates a pagelist from the selected page range before flyleaf and padding', async () => {
    const configuration = schema.parse({
      pageRange: '2-4',
      flyleafs: 1,
    });
    const book = new Book(configuration);
    const pdf = await PDFDocument.create();

    for (let i = 0; i < 8; i++) {
      pdf.addPage([100, 100]);
    }

    book.currentdoc = pdf;
    book.createpagelist();

    expect(book.sourcePageCount).toBe(8);
    expect(book.selectedPages).toEqual([1, 2, 3]);
    expect(book.pagecount).toBe(3);
    expect(book.orderedpages).toEqual(['b', 'b', 1, 2, 3, 'b', 'b', 'b']);
  });
  // TODO test update
  // TODO test openPDF
  // TODO test createoutputfiles
  // TODO test createPages
});
