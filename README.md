# bookbinder-js

A JS application to format PDFs for bookbinding, based on [Bookbinder](http://quantumelephant.co.uk/bookbinder/bookbinder.html), rewritten to use [PDF-Lib](https://pdf-lib.js.org) as its backend library. Like Bookbinder, it is licensed under the [Mozilla Public License](https://www.mozilla.org/en-US/MPL/).

## Using

Go to [the project page](https://momijizukamori.github.io/bookbinder-js) to use the app online - saving a complete copy of the webpage will enable you to load it locally without a web connection, too.

A very helpful guide on page size given layout and paper selection has been created and can be found [HERE](https://docs.google.com/spreadsheets/d/1Qi9Qlbd4QBj6lErnFaRe8rdBsrX0tD7cWf0iOW1V0Vs/edit#gid=0).

Snapshot of the size chart as of 2022-08-11
![Snapshot of sizes as of 2022-08-11](/docs/sizes_guide_snapshot_2022_08_11.png)

## Contributing

See the [contributing](/CONTRIBUTING.md) documentation!

## Dev script cheatsheet

```shell
npm run dev          # Starts the development server (auto-refreshes changes) on http://localhost:5173/bookbinder-js/
npm run build        # Builds output files into the /dist folder, to be copied and served elsewhere
npm run preview      # Builds output files into the /dist folder and serves locally on http://localhost:4173/bookbinder-js/
npm run test         # Runs vitest, and auto-retests if you make changes to test files
npm run test:unit    # Runs the unit tests (fast) with vitest, and auto-retests if you make changes to test files
npm run test:pdf     # Runs the pdf check tests (slow), and auto-retests if you make changes to test files
npm run lint         # Runs ESLint to check for coding style violations
npm run lint:fix     # Runs ESLint to check for coding style violations, and attempts to fix all easily-fixed ones
npm run prettier     # Runs Prettier to check for file formatting violations
npm run prettier:fix # Runs ESLint to check for file formatting violations, and attempts reformat any bad files
```

To close out of any of the commands that don't automatically exit (`dev`, `preview`, and `test`), type `q` and then hit Enter.

## Running Locally

```
npm install
npm run dev
```

And load http://localhost:4173/bookbinder-js/ in any modern web browser.

## Auditing Results

In the [`/docs`](/docs) directory:

- There's 3 sample PDFs (and the `.tex` files to generate them) in [landscape](/docs/example_50cm_wide_10cm_tall.pdf)/[portrait](/docs/example_15cm_wide_40cm_tall.pdf)/[square proportions](/docs/example_20cm_square.pdf) filled with lorum ipsum and colored backgrounds to help test the positioning of the layouts.
- There's [a basic PDF](/docs/example_page_numbers.pdf) with just the numbers 1-120 writ large, used for figuring out page ordering.
- A basic export of the different layouts with proportional/snug settings have been recorded for comparison/reference as well as several shots of `centered` settings. These can be found in the [`/docs/examples`](/docs/examples) folder.

Snapshot of layout proof summary as of 2022-08-14
![Snapshot of layout proof summary 2022-08-14](/docs/examples_summary_snapshot_2022_08_14.png)

## Containerization

### Production

We added an easy compose.yaml for building and hosting this applications' files using nginx.

This nginx does not open any ports, expects to be proxied by some other external web server and may be omitted if not needed.

If you require this nginx to open a port, feel free to add your own (docker-)compose.override.yaml, where you would open ports as needed, like so

```yaml
services:
  bookbinder-nginx:
    ports:
      - '80:80'
```

### Development

If you need to run bookbinder-js in development mode, feel free to create your compose.override.yaml and overwrite the startup command - `npm run build` by default - and create the container with host network mode, which would look like this

```yaml
services:
  bookbinder-app:
    # environment:
    #   BASE: "http://localhost" <-- can be adjusted to your environment
    network_mode: 'host'
    command: bash -c "cd /app && npm install && npm run dev"
```
