import { Book, pagesizes } from './book.js';
import { loadForm } from './utils/formUtils.js';
import { handleFileChange, handleInputChange } from './utils/changeHandlers.js';
import { handleGenerateClick } from './utils/clickHandlers.js';
import { renderPaperSelectOptions } from './utils/renderUtils.js';

window.addEventListener('DOMContentLoaded', () => {
    const generate = document.getElementById('generate');
    const bookbinderForm = document.getElementById('bookbinder');
    const fileInput = document.getElementById('input_file');
    const inputs = document.querySelectorAll('input, select');

    renderPaperSelectOptions();
    loadForm();

    const book = new Book();
    
    inputs.forEach((input) => {
        input.addEventListener('change', () =>
            handleInputChange(book, bookbinderForm)
        );
    });

    fileInput.addEventListener('change', (e) => handleFileChange(e, book));

    generate.addEventListener('click', () =>
        handleGenerateClick(generate, book)
    );
});
