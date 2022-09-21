/** units in "pt" */
export const PAGE_SIZES = {
    LETTER: [612, 792],
    NOTE: [540, 720],
    LEGAL: [612, 1008],
    TABLOID: [792, 1224],
    EXECUTIVE: [522, 756],
    POSTCARD: [283, 416],
    A0: [2384, 3370],
    A1: [1684, 2384],
    A3: [842, 1191],
    A4: [595, 842],
    A5: [420, 595],
    A6: [297, 420],
    A7: [210, 297],
    A8: [148, 210],
    A9: [105, 148],
    B0: [2834, 4008],
    B1: [2004, 2834],
    B2: [1417, 2004],
    B3: [1000, 1417],
    B4: [708, 1000],
    B5: [498, 708],
    B6: [354, 498],
    B7: [249, 354],
    B8: [175, 249],
    B9: [124, 175],
    B10: [87, 124],
    ARCH_E: [2592, 3456],
    ARCH_C: [1296, 1728],
    ARCH_B: [864, 1296],
    ARCH_A: [648, 864],
    FLSA: [612, 936],
    FLSE: [648, 936],
    HALFLETTER: [396, 612],
    _11X17: [792, 1224],
    ID_1: [242.65, 153],
    ID_2: [297, 210],
    ID_3: [354, 249],
    LEDGER: [1224, 792],
    CROWN_QUARTO: [535, 697],
    LARGE_CROWN_QUARTO: [569, 731],
    DEMY_QUARTO: [620, 782],
    ROYAL_QUARTO: [671, 884],
    CROWN_OCTAVO: [348, 527],
    LARGE_CROWN_OCTAVO: [365, 561],
    DEMY_OCTAVO: [391, 612],
    ROYAL_OCTAVO: [442, 663],
    SMALL_PAPERBACK: [314, 504],
    PENGUIN_SMALL_PAPERBACK: [314, 513],
    PENGUIN_LARGE_PAPERBACK: [365, 561],
};

export const TARGET_BOOK_SIZE = {
    standard: [314.5, 502.0],
    large: [368.5, 558.5],
};

export const LINE_LEN = 18;

export const PAGE_LAYOUTS = {
    /*
	Pages in these layouts are assumed to be already reordered. Layout should go left to right, top to bottom.

	Values are the degree of rotation from a portrait offset needed to re-impose this on a portrait-oriented page, and should only need to be specified for one side.
	*/
    folio: {
        rotations: [[-90], [-90]],
        landscape: true,
        rows: 2,
        cols: 1,
        per_sheet: 4,
    },
    folio_alt: {
        rotations: [[90], [90]],
        landscape: true,
        rows: 2,
        cols: 1,
        per_sheet: 4,
    },
    quarto: {
        rotations: [
            [0, 0],
            [-180, -180],
        ],
        landscape: false,
        rows: 2,
        cols: 2,
        per_sheet: 8,
    },
    octavo: {
        rotations: [
            [-90, 90],
            [-90, 90],
            [-90, 90],
            [-90, 90],
        ],
        landscape: true,
        rows: 4,
        cols: 2,
        per_sheet: 16,
    },
    sextodecimo: {
        rotations: [
            [0, 0, 0, 0],
            [-180, -180, -180, -180],
            [0, 0, 0, 0],
            [-180, -180, -180, -180],
        ],
        landscape: false,
        rows: 4,
        cols: 4,
        per_sheet: 32,
    },
};

export const BOOKLET_LAYOUTS = {
    /*
    For page layouts: pages are 1-indexed for sanity reasons, and the order for the back list must be reversed

    'front' will be the side that ends up with consecutive pagenumbers on the innermost fold, by convention.
    
    page numbers should be listed from left to right, top to bottom, starting in the top left.
    */
    4: {
        front: [3, 2],
        back: [1, 4],
        rotate: [4, 1],
    },
    8: {
        front: [6, 3, 7, 2],
        back: [8, 1, 5, 4],
        rotate: [4, 5, 1, 8],
    },
    16: {
        front: [3, 6, 14, 11, 15, 10, 2, 7],
        back: [1, 8, 16, 9, 13, 12, 4, 5],
        rotate: [5, 4, 12, 13, 9, 16, 8, 1],
    },
    32: {
        front: [30, 3, 6, 27, 19, 14, 11, 22, 18, 15, 10, 23, 31, 2, 7, 26],
        back: [32, 1, 8, 25, 17, 16, 9, 24, 20, 13, 12, 21, 29, 4, 5, 28],
        rotate: [28, 5, 4, 29, 21, 12, 13, 20, 24, 9, 16, 17, 25, 8, 1, 32],
    },
};
