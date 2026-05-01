# PDF Form Flattening Recommendation

## Recommendation

To mitigate the issue where Bookbinder-js ignores non-base-layer PDF content or incorrectly interprets page dimensions, add an automatic form flattening step immediately after loading the PDF document.

## Where to add it

File: `src/book.js`

Function: `async openpdf(file)`

Add the form flattening code after `this.currentdoc = await PDFDocument.load(this.input);` and before `this.fixBlankPages();`.

## Suggested code change

```js
async openpdf(file) {
  this.inputpdf = file.name;
  this.input = await file.arrayBuffer();
  this.currentdoc = await PDFDocument.load(this.input);

  try {
    const form = this.currentdoc.getForm();
    form.flatten();
  } catch (err) {
    console.debug('PDF has no flattenable form or flatten failed', err);
  }

  this.fixBlankPages();
}
```

## Why this helps

- `@cantoo/pdf-lib` is currently used to load and embed source pages.
- If a PDF contains form fields, annotations, overlays, or layered objects, these may be interpreted incorrectly when the page is re-embedded.
- Flattening makes form field contents part of the base page content stream, increasing the chance that later operations preserve visible marks and correct dimensions.

## Notes

- This is a mitigation, not a full fix for all layered PDF content.
- It is only applicable when the PDF contains a form that `pdf-lib` can flatten.
- If the document has other unsupported layer types, deeper parser support may still be required.
