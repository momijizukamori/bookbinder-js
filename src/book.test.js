import { Book } from "./book";

describe("Book model", () => {
    it("returns a new Book", () => {
		const actual = new Book();
		expect(actual).toBeInstanceOf(Book);
	});
});
