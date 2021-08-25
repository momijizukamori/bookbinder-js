import { Book, pagesizes } from './book.js';
window.addEventListener('DOMContentLoaded', () => {

  const paperlist = document.getElementById('paper_size');
  const generate = document.getElementById("generate");
  Object.keys(pagesizes).forEach(key => {
    let opt = document.createElement('option');
    opt.setAttribute('value', key);
    if (key == 'A4') {
      opt.setAttribute('selected', true);
    }
    opt.innerText = key;
    paperlist.appendChild(opt);
  });

    let book = new Book();
    let inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('change', function() {
        let bookbinderForm = document.getElementById('bookbinder');
        let formData = new FormData(bookbinderForm);

       book.update(formData);
       if (book.inputpdf) {
         updateForm();
       }
      });
    });

    document.querySelector('#input_file').addEventListener('change', function(e) {
      let filelist = e.target.files;
      if (filelist.length > 0) {
        let updated = book.openpdf(filelist[0]);
        updated.then(_ => updateForm());
      }
    });

    generate.addEventListener('click', (e) => {
      generate.setAttribute('disabled', true);
      generate.innerText = "Generating, this may take a little while...";
      let result = book.createoutputfiles();
      result.then(_ => {
        generate.removeAttribute('disabled');
        generate.innerText = "Generate Output";
      })

    });

    function updateForm() {
      generate.removeAttribute('disabled');
      book.createpages();
      document.getElementById("page_count").innerText = book.pagecount;

      // Sig infobox
      document.getElementById("total_sheets").innerText = book.book.sheets;
      document.getElementById("sig_count").innerText = book.book.sigconfig.length;
      document.getElementById("sig_arrange").innerText = book.book.sigconfig.join(", ");
      let output_pages = 0;
      book.book.pagelist.forEach(list => {
        list.forEach( sublist => output_pages += sublist.length);
      });
      document.getElementById("total_pages").innerText = output_pages;
    }
  });