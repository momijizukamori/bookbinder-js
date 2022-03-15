import { pagesizes } from '../book';

export function renderPageCount(book) {
    document.getElementById('page_count').innerText = book.pagecount;
}

export function renderInfoBox(book) {
    const totalSheets = document.getElementById('total_sheets');
    const sigCount = document.getElementById('sig_count');
    const sigArrange = document.getElementById('sig_arrange');
    const totalPages = document.getElementById('total_pages');

    const outputPages = book.book.pagelist.reduce((acc, list) => {
        list.forEach((sublist) => (acc += sublist.length));
        return acc;
    }, 0);

    totalSheets.innerText = book.book.sheets;
    sigCount.innerText = book.book.sigconfig.length;
    sigArrange.innerText = book.book.sigconfig.join(', ');
    totalPages.innerText = outputPages;
}

export function renderPaperSelectOptions() {
    const paperList = document.getElementById('paper_size');
    Object.keys(pagesizes).forEach((key) => {
        let opt = document.createElement('option');
        opt.setAttribute('value', key);
        if (key == 'A4') {
            opt.setAttribute('selected', true);
        }
        opt.innerText = key;
        paperList.appendChild(opt);
    });
}

export function renderWacky() {
    const isWacky =
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

export function renderFormFromSettings(bookSettings) {
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

    document.querySelector('option[value="A4"]').removeAttribute('selected');
    document
        .querySelector('option[value="' + bookSettings.papersize + '"]')
        .setAttribute('selected', '');

    document.getElementById(bookSettings.format).setAttribute('checked', '');
    document
        .getElementById(bookSettings.pagelayout)
        .setAttribute('checked', '');
    document
        .querySelector('input[name="sig_length')
        .setAttribute('value', bookSettings.sigsize);
}
