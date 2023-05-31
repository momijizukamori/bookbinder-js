import {
    clearLocalSettings,
    getLocalSettings,
    setLocalSettings,
} from './localStorageUtils';
import {
    renderFormFromSettings,
    renderInfoBox,
    renderPageCount,
    renderWacky,
} from './renderUtils';

export function updateForm(book) {
    console.log("Form updated....")
    book.createpages().then(() => {
        console.log("... pages created")
        renderPageCount(book);
        renderInfoBox(book);
        renderWacky();
    })
}

export function saveForm(formData, book) {
    const bookSettings = {
        duplex: book.duplex,
        duplexrotate: book.duplexRotate,
        format: book.format,
        sigsize: book.sigsize,
        lockratio: book.lockratio,
        papersize: formData.get('paper_size'),
        pagelayout: formData.get('pagelayout'),
    };
    setLocalSettings(bookSettings);
}

export function loadForm() {
    const bookSettings = getLocalSettings();
    if (bookSettings) {
        try {
            renderFormFromSettings(bookSettings);
        } catch (error) {
            console.log(error);
            // Clean up potentially bad settings
            clearLocalSettings();
        }
    }
}
