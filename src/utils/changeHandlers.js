import { saveForm, updateRenderedForm } from "./formUtils";
import { updatePaperSelectOptionsUnits, updateAddOrRemoveCustomPaperOption} from './renderUtils';

export function handleInputChange(book, bookbinderForm) {
    const formData = new FormData(bookbinderForm);
    const updatedConfiguration = saveForm(formData);
    book.update(updatedConfiguration);
    updateAddOrRemoveCustomPaperOption()
    updatePaperSelectOptionsUnits() // make sure this goes AFTER the Custom update!
    if (book.inputpdf) {
        updateRenderedForm(book);
    }
}

export function handleFileChange(e, book) {
    const fileList = e.target.files;
    if (fileList.length > 0) {
        const updated = book.openpdf(fileList[0]);
        updated.then(() => updateRenderedForm(book));
    }
}
