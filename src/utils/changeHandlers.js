import { saveForm, updateRenderedForm } from './formUtils';

export function handleInputChange(book, bookbinderForm) {
    const formData = new FormData(bookbinderForm);
    const updatedConfiguration = saveForm(formData);
    book.update(updatedConfiguration)
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
