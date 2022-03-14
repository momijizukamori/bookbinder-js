import { Book, pagesizes, page_layouts } from "./book";

describe("Book model", () => {
    it("returns a new Book", () => {
        const actual = new Book();
        expect(actual).toBeInstanceOf(Book);
    });

    xit("updates a Book based on form contents", () => {
		const testBook = new Book();
		const testForm = {};
		// TODO complete test
		const actual = testBook.update(testForm);
    });

	xit('updates a Book based on PDF contents', async () => {
		const testBook = new Book();
		const testFile = {};
		// TODO complete test
		const actual = await testBook.openpdf(testFile);
	});

	xit('updates a Book based on size params', () => {
		const testBook = new Book();
		const fullTargetSize = 'full';
		const customTargetSize = 'custom';
		const customX = 4;
		const customY = 12;
		// TODO also test some bad/wrong-type custom input
		const unknownTargetSize = 'notsurewhatcouldlandinthisfield';
		// TODO complete test
		// NOTE: this mutates the book, so there should be a new book instance to use for each test case, should split into several tests
		const actualFull = testBook.setbooksize(fullTargetSize);
		const actualCustom = testBook.setbooksize(customTargetSize, customX, customY);
		const actualOther = testBook.setbooksize(unknownTargetSize);
	});

	xit('updates a Book with its pagelists', () => {
		const testBook = new Book();
		// NOTE: this is dependent on currentDoc.getPageCount()
		// TODO complete test
		const actual = testBook.createpagelist();
	});

	xit('updates a Book with its pages', () => {
		const testBook = new Book();
		// NOTE: this is dependent on createpagelist()
		// TODO complete test
		const actual = testBook.createpages();
	});

	xit('updates a Book with a directory full of the newly created signatures', async () => {
		const testBook = new Book();
		// NOTE: this hands off to createsignatures(), buildSheets(), and saveZip()
		// TODO complete test
		const actual = await testBook.createoutputfiles();
	});

	xit('writes the output PDF and updates the book with it', async () => {
		const testBook = new Book();
		// TODO figure out what params go in
		const testOutName = 'testoutname';
		const testPageList = '?';
		const testBack = '?';
		const testAlt = '?';
		// TODO complete test
		const actual = await testBook.writepages(testOutName, testPageList, testBack, testAlt);
	})

});
