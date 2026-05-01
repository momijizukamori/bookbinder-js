## Update

I've begun looking into this issue and researching possible solutions to this issue.

I was able to reproduce the issue from a local build of the repository.

While poking around the `pdf-lib` library, I found multiple references to the content stream.
This confirms my suspicions that certain elements are being ignored by the PDF processing.

```shell
$ grep -rin "content stream" node_modules/@cantoo/pdf-lib/src

node_modules/@cantoo/pdf-lib/src/core/PDFContext.ts:332:   * Used by [[PDFPageLeaf]] instances to ensure that when content streams are
node_modules/@cantoo/pdf-lib/src/core/PDFContext.ts:349:   * Used by [[PDFPageLeaf]] instances to ensure that when content streams are
node_modules/@cantoo/pdf-lib/src/api/form/PDFForm.ts:520:   * field's widgets and make them part of their page's content stream. All form
```

## Next Steps

So far, I think a good approach is to automatically "flatten" any incoming PDF files so that
subsequent processing includes all information.

I tried to use `PDFForm.flatten()` in commit a0eaf79, but this didn't solve the issue.
I suspect that form flattening does not merge together other data streams like annotations.

In my research, I ran into other terms like "Appearance Stream" and "Value Stream";
I'm hoping someone else with more familiarity with PDF files can help address the issue.

I did not find any more comprehensive PDF flattening functions in `pdf-lib`.
I'm considering opening an issue in https://github.com/cantoo-scribe/pdf-lib to introduce this new feature.

## Resources

- https://www.npmjs.com/package/@cantoo/pdf-lib#flatten-form
- https://github.com/cantoo-scribe/pdf-lib/issues/86
  - https://github.com/Hopding/pdf-lib/blob/b8a44bd/src/api/form/PDFForm.ts#L516-L537
- https://github.com/cantoo-scribe/pdf-lib/issues/68
  - https://github.com/Hopding/pdf-lib/discussions/1627
