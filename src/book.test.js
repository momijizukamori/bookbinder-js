// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 
import { expect, describe, it } from 'vitest';
import { Book } from './book';

describe('Book model', () => {
    // TODO confirm that this is what a newly created book (that is, without any settings changed) should look like; I've copied the result from how it currently works assuming it's working as-intended
    const defaultBook = {
        inputpdf: null,
        password: null,
        duplex: false,
        duplexrotate: true,
        papersize: [595, 842],
        flyleaf: false,
        spineoffset: false,
        format: 'standardsig',
        sigsize: 4,
        customsig: null,
        signatureconfig: [],
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
        per_sheet: 8,
        cropmarks: false,
        cutmarks: false,
        fore_edge_padding_pt: 0,
        managedDoc: null,
        pack_pages: true,
        padding_pt: {
            binding: 0,
            bottom: 0,
            fore_edge: 0,
            top: 0
        },
        page_positioning: 'centered',
        page_scaling: 'lockratio',
        paper_rotation_90: false,
        print_file: "both",
        source_rotation: "none"
       
    };
    it('returns a new Book', () => {
        const expected = defaultBook;
        const actual = new Book();
        expect(actual).toEqual(expected);
    });
    // TODO test update
    // TODO test openPDF
    // TODO test createoutputfiles
    // TODO test createPages
});
