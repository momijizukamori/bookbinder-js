import { Book } from './book.js';
import { loadForm } from './utils/formUtils.js';
import { handleFileChange, handleInputChange } from './utils/changeHandlers.js';
import { handleGenerateClick, handlePreviewClick } from './utils/clickHandlers.js';
import { renderPaperSelectOptions } from './utils/renderUtils.js';

window.addEventListener('DOMContentLoaded', () => {
    // render dynamic content
    renderPaperSelectOptions();
    loadForm();

    // grab DOM elements
    const generate = document.getElementById('generate');
    const preview = document.getElementById('preview');
    const bookbinderForm = document.getElementById('bookbinder');
    const fileInput = document.getElementById('input_file');
    const inputs = document.querySelectorAll('input, select');

    // spin up a book to pass to listeners
    const book = new Book();

    // add event listeners to grabbed elements
    inputs.forEach((input) => {
        input.addEventListener('change', () =>
            handleInputChange(book, bookbinderForm)
        );
    });
    fileInput.addEventListener('change', (e) => { 
        handleFileChange(e, book);
        generate.removeAttribute('disabled');
        preview.removeAttribute('disabled');
    });
    generate.addEventListener('click', () =>
        handleGenerateClick(generate, book)
    );
    preview.addEventListener('click', () =>
        handlePreviewClick(preview, book)
    );

});
