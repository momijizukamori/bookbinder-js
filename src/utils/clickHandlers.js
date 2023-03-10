export function handleGenerateClick(generateEl, book) {
	generateEl.setAttribute('disabled', true);
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
			generateEl.innerText = 'Generate Output';
		});
}

export function handlePreviewClick(previewEl, book) {
	previewEl.setAttribute('disabled', true);
	previewEl.innerText = 'Generating Preview, please wait....';
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