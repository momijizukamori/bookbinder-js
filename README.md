# bookbinder-js
A JS application to format PDFs for bookbinding, based on [Bookbinder](http://quantumelephant.co.uk/bookbinder/bookbinder.html), rewritten to use [PDF-Lib](https://pdf-lib.js.org) as its backend library. Like Bookbinder, it is licensed under the [Mozilla Public License](https://www.mozilla.org/en-US/MPL/).

## Using
Go to [the project page](https://momijizukamori.github.io/bookbinder-js) to use the app online - saving a complete copy of the webpage will enable you to load it locally without a web connection, too.

A very helpful guide on page size given layout and paper selection has been created and can be found [HERE](https://docs.google.com/spreadsheets/d/1Qi9Qlbd4QBj6lErnFaRe8rdBsrX0tD7cWf0iOW1V0Vs/edit#gid=0).

Snapshot of the size chart as of 2022-08-11
![Snapshot of sizes as of 2022-08-11](/docs/sizes_guide_snapshot_2022_08_11.png)


## Building
```
npm install
webpack build
```
And load `index.html` in any modern web browser.

## Auditing Results

In the [`/docs`](/docs) directory:

 - There's 3 sample PDFs (and the `.tex` files to generate them) in [landscape](/docs/example_50cm_wide_10cm_tall.pdf)/[portrait](/docs/example_15cm_wide_40cm_tall.pdf)/[square proportions](/docs/example_20cm_square.pdf) filled with lorum ipsum and colored backgrounds to help test the positioning of the layouts. 
 - There's [a basic PDF](/docs/example_page_numbers.pdf) with just the numbers 1-120 writ large, used for figuring out page ordering.
 - A basic export of the different layouts with proportional/snug settings have been recorded for comparison/reference as well as several shots of `centered` settings. These can be found in the [`/docs/examples`](/docs/examples) folder. 

Snapshot of layout proof summary as of 2022-08-14
![Snapshot of layout proof summary 2022-08-14](/docs/examples_summary_snapshot_2022_08_14.png)