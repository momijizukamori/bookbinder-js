// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { saveForm, updateRenderedForm } from './formUtils';
import {
  updatePaperSelectOptionsUnits,
  updateAddOrRemoveCustomPaperOption,
  memoryWarning,
} from './renderUtils';

export function handleInputChange(book, bookbinderForm) {
  const formData = new FormData(bookbinderForm);
  const updatedConfiguration = saveForm(formData);
  book.update(updatedConfiguration);
  updateAddOrRemoveCustomPaperOption();
  updatePaperSelectOptionsUnits(); // make sure this goes AFTER the Custom update!
  if (book.inputpdf) {
    updateRenderedForm(book);
  }
}

export function handleFileChange(e, book) {
  const fileList = e.target.files;
  if (fileList.length > 0) {
    const file = fileList[0];
    const updated = book.openpdf(file);
    updated.then(() => updateRenderedForm(book));

    // Determine if we need to show or hide the large file warning
    memoryWarning(file.size);
  }
}
