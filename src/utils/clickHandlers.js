// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 

import { resetForm } from "./formUtils";
import { updateAddOrRemoveCustomPaperOption, updatePaperSelectOptionsUnits } from "./renderUtils";

export function handleGenerateClick(generateEl, book) {
	generateEl.setAttribute('disabled', true);
	generateEl.style.fontSize = "13px";
	generateEl.innerText = 'Generating, this may take a little while...';
	console.log('The whole Book model:', book);
	const result = book.createoutputfiles(false);
	result
		.then((_) => {
			console.log('Generated result!');
		})
		.catch((error) => {
			console.error(error);
		})
		.finally((_) => {
			generateEl.removeAttribute('disabled');
			generateEl.style.fontSize = "24px";
			generateEl.innerText = 'Generate PDF Output';
		});
}

export function handlePreviewClick(previewEl, book) {
	previewEl.setAttribute('disabled', true);
	previewEl.innerText = 'Generating Preview...';
	const result = book.createoutputfiles(true);
	result
		.then((_) => {
			console.log('Preview result!');
		})
		.catch((error) => {
			console.error(error);
		})
		.finally((_) => {
			previewEl.removeAttribute('disabled');
			previewEl.innerText = 'Preview Output';
		});
}

export function handleResetSettingsClick(book) {
		const defaultConfiguration = resetForm();
		book.update(defaultConfiguration);
    updateAddOrRemoveCustomPaperOption();
    updatePaperSelectOptionsUnits();
}
