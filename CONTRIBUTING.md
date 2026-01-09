# How to Contribute to This Project

If you require more detailed instructions on any of these steps, please see the [detailed guide](/docs/contributing-details.md).

## Getting Started

1. Prerequisites: [`node`, `npm`,](https://nodejs.org/en/download/) and [`git`](https://docs.github.com/en/get-started/quickstart/set-up-git), as well as a web browser, somewhere to edit your code, and a way to run commands in the terminal
1. [Fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) the repository, [clone](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository) down your copy, and navigate to the project directory (`bookbinder-js` unless you've renamed it)
1. Set the parent repository as the upstream remote for your project with `git remote add upstream https://github.com/momijizukamori/bookbinder-js.git`
1. Run `npm i` to install project dependencies

## Running the App

1. Run the development server step with `npm run dev` - this will start the Vite dev server on http://localhost:5173/bookbinder-js/ which will refresh when you save changes to any of the source files.
1. If you want to check something in a 'final' build, you can run `npm run preview`, which will build and then serve the app on http://localhost:4173/bookbinder-js/ - this mode will _not_ auto-refresh.
1. If you are using VS Code, you can install the 'Debugger for Chrome' or 'Debugger for Firefox' extensions, and then launch the app via VS Code's Run menu to get an IDE debug session.

## Branching and Committing

1. Create a feature branch with `git checkout -b` for whatever you're working on, such as `feature/contribution-docs` or `bugfix/page-layout-issues`
1. Commit your changes as you go with meaningful commit messages
1. Ideally, write tests for any new behavior you're introducting
1. Run tests with `npm run test` as you introduce changes; try to catch any breaking changes early and, as appropriate, either debug your code to find the problem or update the existing tests to reflect the new expected behavior
1. When you're done with your changes, make sure it passes the formatting and linting checks. These can be run as `npm run prettier` and `npm run lint` to simply check, or `npm run prettier:fix` and `npm run lint:fix` to autofix as much as possible (and show messages about the portions that can't be automatically fixed)
1. Push your changes up to the feature branch on your fork as you go with `git push origin [name of branch]`, for example, `git push origin feature/contribution-docs`

## Pull Requests

1. When you're ready to make a request for your changes to be merged into the parent repository, [open a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request):
   - first, [make sure your fork is still up-to-date](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-from-the-command-line) with the latest version of the upstream repository with `git merge upstream/main`
   - address any conflicts that may arise with upstream updates (currently outside the scope of this guide, but you can read some docs [here](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts)).
   - push all your latest changes, including any updates merged from upstream, up to your fork's feature branch as described above
   - make sure tests are passing with `npm run test`
   - open a pull request against the parent repository, as described in the link at the start of this section. Choose the parent repository's main branch as the 'base' and your fork's feature branch as the 'head'. Describe the changes you've made and review the changed files to make sure it's what you intended. See the following screenshot for an example:
     ![pull request example](/docs/PR-example.png)

## Adding PDF Tests

We use [pdf-visual-diff](https://github.com/moshensky/pdf-visual-diff) to compare results for full workflow runs. To add a new baseline file to compare against:

1. Pick a file under /docs to use. Run it through the app, and save the output zip file. **Important**: if you're adding a test for for a 'classic' layout configuration, set the output to include signatures and to be duplexed.
2. Put the output file (wacky) or first signature (classic) in /pdf-test/files, and give it a descriptive name.
3. Open up /pdf-test/pdfTestCases.js and add a new entry to the `testCases` object. The key should be the same as the name you gave the file (without the .pdf extension), and the object should have two keys: `input`, which is the filename of the file you used, and `config`, which should have the contents of the object from the settings.txt file included in the output zip.
4. Generate new snapshots by running `npm run generate-snapshots` - this will clear existing snapshots and generate new ones for all files.
