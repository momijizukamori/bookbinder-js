export function renderPageCount(book) {
    document.getElementById('page_count').innerText = book.pagecount;
}

export function renderInfoBox(book) {
    const totalSheets = document.getElementById('total_sheets');
    const sigCount = document.getElementById('sig_count');
    const sigArrange = document.getElementById('sig_arrange');
    const totalPages = document.getElementById('total_pages');

    const outputPages = book.book.pagelist.reduce((acc, list) => {
        list.forEach((sublist) => (acc += sublist.length));
		return acc;
    }, 0);

    totalSheets.innerText = book.book.sheets;
    sigCount.innerText = book.book.sigconfig.length;
    sigArrange.innerText = book.book.sigconfig.join(', ');
    totalPages.innerText = outputPages;
}
