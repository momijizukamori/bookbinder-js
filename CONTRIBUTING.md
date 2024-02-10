# How to Contribute to This Project
If you require more detailed instructions on any of these steps, please see the [detailed guide](/docs/contributing-details.md).
## Getting Started
1. Prerequisites: [`node`, `npm`,](https://nodejs.org/en/download/) and [`git`](https://docs.github.com/en/get-started/quickstart/set-up-git), as well as a web browser, somewhere to edit your code, and a way to run commands in the terminal
1. [Fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) the repository, [clone](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository) down your copy, and navigate to the project directory (`bookbinder-js` unless you've renamed it)
1. Set the parent repository as the upstream remote for your project with `git remote add upstream https://github.com/momijizukamori/bookbinder-js.git`
1. Run `npm i` to install project dependencies

## Running the App
1. Run the webpack build step with `npm run build` - this will update the generated `preload.js` file with the latest code from `src/`
1. At present, this project does not automatically rebuild to reflect your changes. If you have made changes to files in `src/` you will need to run `npm run build` to see them reflected in the app.
1. Open `index.html` in your browser and you're all set! (if you're not using a tool like VS Code's [LiveServer](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension you will need to refresh the page to see changes you've made)

## Branching and Committing
1. Create a feature branch with `git checkout -b` for whatever you're working on, such as `feature/contribution-docs` or `bugfix/page-layout-issues`
1. Commit your changes as you go with meaningful commit messages
1. Ideally, write tests for any new behavior you're introducting
1. Run tests with `npm run test` as you introduce changes; try to catch any breaking changes early and, as appropriate, either debug your code to find the problem or update the existing tests to reflect the new expected behavior
1. Push your changes up to the feature branch on your fork as you go with `git push origin [name of branch]`, for example, `git push origin feature/contribution-docs`

## Pull Requests
1. When you're ready to make a request for your changes to be merged into the parent repository, [open a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request):
	- first, [make sure your fork is still up-to-date](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-from-the-command-line) with the latest version of the upstream repository with `git merge upstream/main`
	- address any conflicts that may arise with upstream updates (currently outside the scope of this guide, but you can read some docs [here](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts)).
	- push all your latest changes, including any updates merged from upstream, up to your fork's feature branch as described above
	- make sure tests are passing with `npm run test`
	- open a pull request against the parent repository, as described in the link at the start of this section. Choose the parent repository's main branch as the 'base' and your fork's feature branch as the 'head'. Describe the changes you've made and review the changed files to make sure it's what you intended. See the following screenshot for an example:
	![pull request example](/docs/PR-example.png)
