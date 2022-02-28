import { Book, pagesizes } from './book.js';
window.addEventListener('DOMContentLoaded', () => {

  const paperlist = document.getElementById('paper_size');
  const generate = document.getElementById("generate");
  const storageKey = "bookbinderSettings";
  const settings = window.localStorage;
  let bookbinderForm = document.getElementById('bookbinder');



  Object.keys(pagesizes).forEach(key => {
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
    inputs.forEach(input => {
      input.addEventListener('change', function() {
        let formData = new FormData(bookbinderForm);

       book.update(formData);
       saveForm(formData);

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

      let isWacky = document.getElementById("a9_3_3_4").checked || document.getElementById("a10_6_10s").checked
          || document.getElementById("A7_2_16s").checked || document.getElementById("A7_32").checked  
          || document.getElementById("1_3rd").checked;
      console.log("Is a wacky layout? ",isWacky)
      document.getElementById("book_size").querySelectorAll("input").forEach(x => {x.disabled = isWacky})
      document.getElementById("book_size").style.opacity = isWacky ? 0.3 : 1.0;
    }

    function saveForm(formData) {
      let result = (({ duplex, duplexrotate, format, sigsize, lockratio }) => ({ duplex, duplexrotate, format, sigsize, lockratio }))(book);
      result.papersize = formData.get('paper_size');
      result.pagelayout = formData.get('pagelayout');
      settings.setItem(storageKey, JSON.stringify(result));
    }

    function loadForm(){
      const bookSettings = JSON.parse(settings.getItem(storageKey));
      if (bookSettings) {
        try {
        if (bookSettings.duplex) {
          document.querySelector('#printer_type > option[value="duplex"]').setAttribute('selected', "");
          document.querySelector('#printer_type > option[value="single"]').removeAttribute('selected');
        } else {
          document.querySelector('#printer_type > option[value="single"]').setAttribute('selected', "");
          document.querySelector('#printer_type > option[value="duplex"]').removeAttribute('selected');
        }

        if (bookSettings.lockratio) {
          document.querySelector('option[value="lockratio"]').setAttribute('selected', "");
          document.querySelector('option[value="stretch"]').removeAttribute('selected');
        } else {
          document.querySelector('option[value="stretch"]').setAttribute('selected', "");
          document.querySelector('option[value="lockratio"]').removeAttribute('selected');
        }

        if (bookSettings.duplexrotate) {
          document.querySelector('input[name="rotate_page"').setAttribute('checked', "");
        } else {
          document.querySelector('input[name="rotate_page"').removeAttribute('checked');
        }

        document.querySelector('option[value="A4"]').removeAttribute('selected');
       document.querySelector('option[value="'+ bookSettings.papersize + '"]').setAttribute('selected', "");
  
        document.getElementById(bookSettings.format).setAttribute('checked', "");
        document.getElementById(bookSettings.pagelayout).setAttribute('checked', "");
        document.querySelector('input[name="sig_length').setAttribute('value', bookSettings.sigsize);
      } catch(error) {
        console.log(error);
        // Clean up potentially bad settings
        settings.removeItem(storageKey);
      }
    }
    }
  });