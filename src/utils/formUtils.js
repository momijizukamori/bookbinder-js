import { clearLocalSettings, getLocalSettings, setLocalSettings } from './localStorageUtils';
import { renderInfoBox, renderPageCount } from './renderUtils';

export function updateForm(book) {
    book.createpages();

    renderPageCount(book);
    renderInfoBox(book);

    let isWacky =
        document.getElementById('a9_3_3_4').checked ||
        document.getElementById('a10_6_10s').checked ||
        document.getElementById('A7_2_16s').checked ||
        document.getElementById('A7_32').checked ||
        document.getElementById('1_3rd').checked;
    console.log('Is a wacky layout? ', isWacky);
    document
        .getElementById('book_size')
        .querySelectorAll('input')
        .forEach((x) => {
            x.disabled = isWacky;
        });
    document.getElementById('book_size').style.opacity = isWacky ? 0.3 : 1.0;
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
            if (bookSettings.duplex) {
                document
                    .querySelector('#printer_type > option[value="duplex"]')
                    .setAttribute('selected', '');
                document
                    .querySelector('#printer_type > option[value="single"]')
                    .removeAttribute('selected');
            } else {
                document
                    .querySelector('#printer_type > option[value="single"]')
                    .setAttribute('selected', '');
                document
                    .querySelector('#printer_type > option[value="duplex"]')
                    .removeAttribute('selected');
            }

            if (bookSettings.lockratio) {
                document
                    .querySelector('option[value="lockratio"]')
                    .setAttribute('selected', '');
                document
                    .querySelector('option[value="stretch"]')
                    .removeAttribute('selected');
            } else {
                document
                    .querySelector('option[value="stretch"]')
                    .setAttribute('selected', '');
                document
                    .querySelector('option[value="lockratio"]')
                    .removeAttribute('selected');
            }

            if (bookSettings.duplexrotate) {
                document
                    .querySelector('input[name="rotate_page"')
                    .setAttribute('checked', '');
            } else {
                document
                    .querySelector('input[name="rotate_page"')
                    .removeAttribute('checked');
            }

            document
                .querySelector('option[value="A4"]')
                .removeAttribute('selected');
            document
                .querySelector('option[value="' + bookSettings.papersize + '"]')
                .setAttribute('selected', '');

            document
                .getElementById(bookSettings.format)
                .setAttribute('checked', '');
            document
                .getElementById(bookSettings.pagelayout)
                .setAttribute('checked', '');
            document
                .querySelector('input[name="sig_length')
                .setAttribute('value', bookSettings.sigsize);
        } catch (error) {
            console.log(error);
            // Clean up potentially bad settings
            clearLocalSettings()
        }
    }
}
