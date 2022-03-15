import { Book, pagesizes } from './book.js';
import { loadForm } from './utils/formUtils.js';
import { handleFileChange, handleInputChange } from './utils/changeHandlers.js';
import { handleGenerateClick } from './utils/clickHandlers.js';

window.addEventListener('DOMContentLoaded', () => {
    const paperlist = document.getElementById('paper_size');
    const generate = document.getElementById('generate');

    let bookbinderForm = document.getElementById('bookbinder');

    Object.keys(pagesizes).forEach((key) => {
        let opt = document.createElement('option');
        opt.setAttribute('value', key);
        if (key == 'A4') {
            opt.setAttribute('selected', true);
        }
        opt.innerText = key;
        paperlist.appendChild(opt);
    });

    loadForm();

    let book = new Book();
    let inputs = document.querySelectorAll('input, select');
    inputs.forEach((input) => {
        input.addEventListener('change', () =>
            handleInputChange(book, bookbinderForm)
        );
    });

    document
        .querySelector('#input_file')
        .addEventListener('change', (e) => handleFileChange(e, book));

    generate.addEventListener('click', () =>
        handleGenerateClick(generate, book)
    );
});
