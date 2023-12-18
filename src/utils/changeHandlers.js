// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 

import { saveForm, updateForm } from './formUtils';

export function handleInputChange(book, bookbinderForm) {
    const formData = new FormData(bookbinderForm);
    book.update(formData);
    saveForm(formData, book);
    if (book.inputpdf) {
        updateForm(book);
    }
}

export function handleFileChange(e, book) {
    const fileList = e.target.files;
    if (fileList.length > 0) {
        const updated = book.openpdf(fileList[0]);
        updated.then(() => updateForm(book));
    }
}
