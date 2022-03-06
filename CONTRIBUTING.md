# How to Contribute to This Project

## Getting Started
Detailed instructions for tool installation and machine setup are outside the scope of this guide, but please feel free to reach out if you need assistance!
1. Prerequisites: [`node`, `npm`,](https://nodejs.org/en/download/) and [`git`](https://docs.github.com/en/get-started/quickstart/set-up-git), as well as somewhere to edit your code and run commands in the terminal
	- if you're unsure, you can confirm you have these installed by running the following in your terminal: `node --version`, `npm --version`, and `git --version`; if you do not see a version number as output, you will need to install the relevant tool (`npm` is generally part of the `node` installation)
1. [Fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) the repository and [clone](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository) down your copy
1. From the project directory (`bookbinder-js` unless you've renamed it), run `npm i` to install project dependencies

## Running the App
1. Run the webpack build step with `npm run build` - this will update the generated `preload.js` file with the latest code from `src/`

## Writing Code
1. If you are not acquainted with `git`, see general setup and practices [in GitHub's docs](https://docs.github.com/en/get-started/quickstart/set-up-git). As mentioned above, a detailed Git tutorial is outside the scope of this guide, but feel free to reach out for assistance if you'd like to contribute but aren't sure how to get started.
1. Create a feature branch with `git checkout -b` for whatever you're working on, such as `feature/contribution-docs` or `bugfix/page-layout-issues`
1. Commit your changes as you go with meantingul commit messages:
	- Add changes with `git add -A`
	- Commit changes with `git commit -m 'your commit message here'`
		- Commit messages should describe your changes succinctly, for example, `git commit -m 'add contributor documentation'`
1. Push your changes up to the feature branch on your fork as you go with `git push origin [name of branch]`, for example, `git push origin feature/contribution-docs`