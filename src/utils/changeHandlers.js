import { saveForm, updateForm } from './formUtils';

export function handleInputChange(book, bookbinderForm) {
    const formData = new FormData(bookbinderForm);
    console.log('FORM DATA', formData);
    book.update(formData);
    saveForm(formData, book);
    if (book.inputpdf) {
        updateForm();
    }
}

export function handleFileChange(e, book) {
    const fileList = e.target.files;
    if (fileList.length > 0) {
        const updated = book.openpdf(fileList[0]);
        updated.then(() => updateForm(book));
    }
}
