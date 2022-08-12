# bookbinder-js
A JS application to format PDFs for bookbinding, based on [Bookbinder](http://quantumelephant.co.uk/bookbinder/bookbinder.html), rewritten to use [PDF-Lib](https://pdf-lib.js.org) as its backend library. Like Bookbinder, it is licensed under the [Mozilla Public License](https://www.mozilla.org/en-US/MPL/).

## Using
Go to [the project page](https://momijizukamori.github.io/bookbinder-js) to use the app online - saving a complete copy of the webpage will enable you to load it locally without a web connection, too.

A very helpful guide on page size given layout and paper selection has been created and can be found [HERE].

Snapshot of the size chart as of 2022-08-11
![Snapshot of sizes as of 2022-08-11](/docs/sizes_guide_snapshot_2022_08_11.png)



## Building
```
npm install
webpack build
```
And load `index.html` in any modern web browser.