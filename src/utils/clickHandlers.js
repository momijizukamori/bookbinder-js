export function handleGenerateClick(generateEl, book) {
	generateEl.setAttribute('disabled', true);
	generateEl.innerText = 'Generating, this may take a little while...';
	console.log('The whole Book model:', book);
	const result = book.createoutputfiles();
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