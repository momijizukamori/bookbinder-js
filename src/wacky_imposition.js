/**
 * Dumping grounds for weird foldy single-sheet imposition. Different flow from how the other books work.
 * 
 * The builder functions are the entry points to the different layouts. 
 */
export class WackyImposition{
    constructor(pages, duplex,format, isPacked) {
      this.duplex=duplex;
      this.sigconfig=[]  // sig_count looks at the length of this array, sig_arrange joins them together with a ,;
      this.pagelist = [[]];
      this.isPacked = isPacked;
      console.log("Constructor sees ", pages)
      // for UI estimates
      this.sheets = Math.ceil(pages.length / 20.0); 
      console.log("... spits out pageList ", this.pagelist)
      if (format == "a9_3_3_4") {
        this.sheets = Math.ceil(pages.length/40.0);
        this.sigconfig = Array(Math.ceil(pages.length/40.0) * 3)
      } else if (format == "a10_6_10s") {
        this.sheets = Math.ceil(pages.length/120.0);
        this.sigconfig = Array(Math.ceil(pages.length/20.0) * 2)
      } else if (format == "a_4_8s") {
        this.sheets = Math.ceil(pages.length/64.0);
        this.sigconfig = Array(Math.ceil(pages.length/16.0) * 2)
      } else if (format == "a_3_6s") {
        this.sheets = Math.ceil(pages.length/36.0);
        this.sigconfig = Array(Math.ceil(pages.length/12))
      } else if (format == "A7_2_16s") {
        this.sheets = Math.ceil(pages.length/32.0);
        this.sigconfig = Array(this.sheets * 2)
      } else if (format == "8_zine") {
        this.sheets = 1;
        this.sigconfig = [1];
      }
    }

    page_8_zine_builder() {
        return {
            sheetMaker: this.build_8_zine_sheetList.bind(this),
            lineMaker: this.build_8_zine_lineFunction.bind(this),
            isLandscape: false,
            fileNameMod: "8_zine" + ((this.isPacked) ? "_packed" : "_spread")
        }
    }

    page_1_3rd_builder() {
        return {
            sheetMaker: this.build_1_3rd_sheetList.bind(this),
            lineMaker: this.build_1_3rd_lineFunction.bind(this),
            isLandscape: false,
            fileNameMod: "one_third" + ((this.isPacked) ? "_packed" : "_spread")
        }
    }

    a9_3_3_4_builder() {
        return {
            sheetMaker: this.build_3_3_4_sheetList.bind(this),
            lineMaker: this.build_3_3_4_lineFunction.bind(this),
            isLandscape: false,
            fileNameMod: "little"+ ((this.isPacked) ? "_packed" : "_spread")
        }
    }

    a10_6_10s_builder() {
        return {
            sheetMaker: this.build_6_10s_sheetList.bind(this),
            lineMaker: this.build_6_10s_lineFunction.bind(this),
            isLandscape: true,
            fileNameMod: "mini"+ ((this.isPacked) ? "_packed" : "_spread")
        }
    }

    a_3_6s_builder() {
        return {
            sheetMaker: this.build_3_6s_sheetList.bind(this),
            lineMaker: this.build_strip_lineFunction.bind(this, 3, 6),
            isLandscape: true,
            fileNameMod: "3_by_6"+ ((this.isPacked) ? "_packed" : "_spread")
        }
    }

    a_4_8s_builder() {
        return {
            sheetMaker: this.build_4_8s_sheetList.bind(this),
            lineMaker: this.build_strip_lineFunction.bind(this, 4, 8),
            isLandscape: true,
            fileNameMod: "4_by_8"+ ((this.isPacked) ? "_packed" : "_spread")
        }
    }

    a7_2_16s_builder() {
        return {
            sheetMaker: this.build_2_16s_sheetList.bind(this),
            lineMaker: this.build_2_16s_lineFunction.bind(this),
            isLandscape: false,
            fileNameMod: "4_by_4_two_signatures"+ ((this.isPacked) ? "_packed" : "_spread")
        }
    }


    // ---------------- the real guts of the layout


    /**
     * It's an 8 page zine. Same page count every time....
     *
     * @param pageCount - total pages in document (to add blanks if < 8)
     * @return an array of a single sheets. It's just one printed page (face)
     *      The sheet is an array of rows, containing a list of page objects
     */
    build_8_zine_sheetList(pageCount) {
        let p = this.page;
        let f = this.flipPage;
        return  [[
            this.auditForBlanks([ p(7),p(0),p(1),p(2) ], pageCount),
            this.auditForBlanks([ f(6),f(5),f(4),f(3) ], pageCount)
        ]];
    }

    /**
     * Produces a 3 folio signature per sheet
     * @param pageCount - total pages in document
     * @return an array of sheets. Assumes 1st is "front", 2nd is "back", 3rd is "front", etc. 
     *      Each sheet is an array of rows, containing a list of page objects
     */
    build_1_3rd_sheetList(pageCount) {
        let p = this.page;
        let f = this.flipPage;
        let sheets = [];
        let sheetCount = Math.ceil(pageCount / 12.0);
        console.log("Building the 1/3rd page layout. Given ",pageCount," page count, there will be ",sheetCount," sheets...");
        for (let sheet=0; sheet < sheetCount; ++sheet ) {
            let i = sheet * 12 - 1;
            let front = [
                this.auditForBlanks([p(i+8), p(i+5)], pageCount),
                this.auditForBlanks([f(i+9), f(i+4)], pageCount),
                this.auditForBlanks([p(i+12), p(i+1)], pageCount),
            ];
            let back = [
                this.auditForBlanks([p(i+6), p(i+7)], pageCount),
                this.auditForBlanks([f(i+3), f(i+10)], pageCount),
                this.auditForBlanks([p(i+2), p(i+11)], pageCount),
            ]
            sheets.push(front);
            sheets.push(back);
        }
        return sheets;
    }

    /**
     * @return a FUNCTION. The function takes as it's parameter:
     *       Object definition: {
     *           gap: [leftGap, topGap],
     *           renderPageSize: [width, height],
     *           paperSize: [width, height],
     *           isFront: boolean,
     *           isPacked: boolean
     *       }
     *       and returns: a list of lines, as described by PDF-lib.js's `PDFPageDrawLineOptions` object
     */
    build_1_3rd_lineFunction() {
        return info => {
            let vGap = row => { return (info.isPacked) ? info.gap[1] : info.gap[1] * row}
            let hGap = col => { return (info.isPacked) ? info.gap[0] : info.gap[0] * col}
            let foldMarks = [];
            [0,1,2,3].forEach( row => {
                [0,1,2].forEach( page => {
                    foldMarks = foldMarks.concat(this.crosshairMark(
                        hGap(page) + info.renderPageSize[0] * page,
                        vGap(row) + info.renderPageSize[1] * row,
                        5
                        ));
                });
            });
            return [
                this.foldHorizontal(info.paperSize[0], vGap(1) + info.renderPageSize[1]),
                this.foldHorizontal(info.paperSize[0],vGap(2) + info.renderPageSize[1] * 2),
                this.cutHorizontal(info.paperSize[0], vGap(3) + info.renderPageSize[1] * 3),
            ]
            .concat(foldMarks);
        };
    }

    /**
     * @return a FUNCTION. The function takes as it's parameter:
     *       Object definition: {
     *           gap: [leftGap, topGap],
     *           renderPageSize: [width, height],
     *           paperSize: [width, height],
     *           isFront: boolean,
     *           isPacked: boolean
     *       }
     *       and returns: a list of lines, as described by PDF-lib.js's `PDFPageDrawLineOptions` object
     */
    build_8_zine_lineFunction() {
        return info => {
            return [];
        };
    }

    /**
     * Produces two 3 folio foldup signatures and a 4 folio foldup signature.
     * 5 rows, 4 pages across. 1-12 / 13-24 / 25 - 40
     * @param pageCount - total pages in document
     * @return an array of sheets. Assumes 1st is "front", 2nd is "back", 3rd is "front", etc. 
     *      Each sheet is an array of rows, containing a list of page objects
     */
    build_3_3_4_sheetList(pageCount) {
        let p = this.page;
        let f = this.flipPage;
        let sheets = [];
        let sheetCount = Math.ceil(pageCount / 40.0);
        console.log("Building the 3/3/4 pages. Given ",pageCount," page count, there will be ",sheetCount," sheets...");
        for (let sheet=0; sheet < sheetCount; ++sheet ) {
            let i = sheet * 40 - 1;
            let frontThrees = [
                this.auditForBlanks([f(i+5), f(i+8),   f(i+17), f(i+20)], pageCount),
                this.auditForBlanks([p(i+4), p(i+9),    p(i+16), p(i+21)], pageCount),
                this.auditForBlanks([f(i+1), f(i+12),   f(i+13), f(i+24)], pageCount),
            ];
            let frontFour = [
                this.auditForBlanks([p(i+36), p(i+29),  p(i+28), p(i+37)], pageCount),
                this.auditForBlanks([f(i+33), f(i+32),  f(i+25), f(i+40)], pageCount),
            ]
            let backThrees = [
                this.auditForBlanks([f(i+19), f(i+18),   f(i+7), f(i+6)], pageCount),
                this.auditForBlanks([p(i+22), p(i+15),    p(i+10), p(i+3)], pageCount),
                this.auditForBlanks([f(i+23), f(i+14),   f(i+11), f(i+2)], pageCount),
            ];
            let backFour = [
                this.auditForBlanks([p(i+38), p(i+27),  p(i+30), p(i+35)], pageCount),
                this.auditForBlanks([f(i+39), f(i+26),  f(i+31), f(i+34)], pageCount),
            ]
            console.log("Sheet ",sheet," has front 3s ",frontThrees," and front 4 ", frontFour," w/ back 3s ",backThrees," and back 4", backFour)
            sheets.push(frontFour.concat(frontThrees));
            sheets.push(backFour.concat(backThrees));
        }
        return sheets;
    }

    /**
     * @return a FUNCTION. The function takes as it's parameter:
     *       Object definition: {
     *           gap: [leftGap, topGap],
     *           renderPageSize: [width, height],
     *           paperSize: [width, height],
     *           isFront: boolean,
     *           isPacked: boolean
     *       }
     *       and returns: a list of lines, as described by PDF-lib.js's `PDFPageDrawLineOptions` object
     */
    build_3_3_4_lineFunction() {
        return info => {
            let vGap = row => { return (info.isPacked) ? info.gap[1] : info.gap[1] * row};
            let hGap = col => { return (info.isPacked) ? info.gap[0] : info.gap[0] * col};
            let cutBetweenTheThrees = {
                start: { x: hGap(2) + 2 * info.renderPageSize[0], y: info.renderPageSize[1] * 2 + info.gap[1] },
                end: { x: hGap(2) + 2 * info.renderPageSize[0], y: info.paperSize[1] },
                thickness: 0.25,
                opacity: 0.4,
            };
            let foldBetweenTheFours = {
                start: { x: hGap(2) + 2 * info.renderPageSize[0], y: info.renderPageSize[1] * 2 + info.gap[1] },
                end: { x: hGap(2) + 2 * info.renderPageSize[0], y: 0 },
                thickness: 0.5,
                opacity: 0.4,
                dashArray: [2, 5]
            };
            let foldMarks = [];

            [0,1,2,3,4,5].forEach( row => {
                [0,1,2,3,4].forEach( page => {
                    foldMarks = foldMarks.concat(this.crosshairMark(
                        hGap(page) + info.renderPageSize[0] * page,
                        vGap(row) + info.renderPageSize[1] * row,
                        5
                        ));
                });
            });
            return [
                this.foldHorizontal(info.paperSize[0], vGap(1) + info.renderPageSize[1]),
                this.cutHorizontal(info.paperSize[0], vGap(2) + info.renderPageSize[1] * 2),
                this.foldHorizontal(info.paperSize[0], vGap(3) + info.renderPageSize[1] * 3),
                this.foldHorizontal(info.paperSize[0], vGap(4) + info.renderPageSize[1] * 4),
                this.cutVertical(info.paperSize[1], hGap(0)),
                this.cutVertical(info.paperSize[1], hGap(4) + info.renderPageSize[0] * 4),
                cutBetweenTheThrees,
                foldBetweenTheFours
            ].concat(foldMarks);
        };
    }

    /**
     * @return a FUNCTION. The function takes as it's parameter:
     *       Object definition: {
     *           gap: [leftGap, topGap],
     *           renderPageSize: [width, height],
     *           paperSize: [width, height],
     *           isFront: boolean,
     *           isPacked: boolean
     *       }
     *       and returns: a list of lines, as described by PDF-lib.js's `PDFPageDrawLineOptions` object
     */
    build_6_10s_lineFunction() {
        return info => {
            let cutOffset = (!this.duplex || info.isFront) ? 4 : 6;
            let vGap = row => { return (info.isPacked) ? info.gap[1] : info.gap[1] * (2 * row); };
            let hGap = col => { return (info.isPacked) ? info.gap[0] : col * info.gap[0]};
            let baseCuts = [
                //this.cutHorizontal(info.paperSize[0], vGap(0)),
                this.cutHorizontal(info.paperSize[0], vGap(0) + info.renderPageSize[1] * 0),
                this.cutHorizontal(info.paperSize[0], vGap(1) + info.renderPageSize[1] * 1),
                this.cutHorizontal(info.paperSize[0], vGap(2) + info.renderPageSize[1] * 2),
                this.cutHorizontal(info.paperSize[0], vGap(3) + info.renderPageSize[1] * 3),
                this.cutHorizontal(info.paperSize[0], vGap(4) + info.renderPageSize[1] * 4),
                this.cutHorizontal(info.paperSize[0], vGap(5) + info.renderPageSize[1] * 5),
                this.cutHorizontal(info.paperSize[0], vGap(6) + info.renderPageSize[1] * 6),

                // this.foldVertical(info.paperSize[1], info.gap[0] + info.renderPageSize[0] * 2),
                this.cutVertical(info.paperSize[1], hGap(cutOffset) + info.renderPageSize[0] * cutOffset),
                // this.foldVertical(info.paperSize[1], info.gap[0] + info.renderPageSize[0] * 6),
                // this.foldVertical(info.paperSize[1], info.gap[0] + info.renderPageSize[0] * 8),
                this.cutVertical(info.paperSize[1], hGap(0)),
                this.cutVertical(info.paperSize[1], hGap(10) + info.renderPageSize[0] * 10),
            ];
            let foldMarks = [];
            [0,1,2,3,4,5,6].forEach( row => {
                [...Array(10).keys()].forEach( page => {
                    foldMarks = foldMarks.concat(this.crosshairMark(
                        hGap(page) + info.renderPageSize[0] * page,
                        vGap(row) + info.renderPageSize[1] * row,
                        5
                        ));
                });
            });
            console.log("Providing lines: \nbase cuts: ",baseCuts,"\nfold marks: ",foldMarks,"\ntotal: ",baseCuts.concat(foldMarks))
            return baseCuts.concat(foldMarks)
        };
    }

    build_3_6s_sheetList(pageCount) {
        let page = this.page;
        let frontFunc = i => {return [page(i+2),page(i+11),page(i+10),page(i+3),page(i+6),page(i+7)];};
        let backFunc = i => {return [page(i+8),page(i+5),page(i+4),page(i+9),page(i+12),page(i+1)];};
        return this.build_strips_sheetList(3, 3, pageCount, frontFunc, backFunc);
    }
    build_4_8s_sheetList(pageCount) {
        let page = this.page;
        let frontFunc = i => {return [page(i+2),page(i+15),page(i+14),page(i+3),page(i+6),page(i+11),page(i+10),page(i+7)];};
        let backFunc = i => {return [page(i+8),page(i+9),page(i+12),page(i+5),page(i+4),page(i+13),page(i+16),page(i+1)];};
        return this.build_strips_sheetList(4, 4, pageCount, frontFunc, backFunc);
    }
    build_6_10s_sheetList(pageCount) {
        let page = this.page;
        let frontFunc = i => {return [page(i+6),page(i+3),page(i+2),page(i+7),page(i+10),page(i+19),page(i+18),page(i+11),page(i+14),page(i+15)];};
        let backFunc = i => {return [page(i+16),page(i+13),page(i+12),page(i+17),page(i+20),page(i+9),page(i+8),page(i+1),page(i+4),page(i+5)];};
        return this.build_strips_sheetList(6, 5, pageCount, frontFunc, backFunc);
    }

    /**
     * @param rows - number of rows for page
     * @param folioPerRow - number of folios per row (not pages!)
     * @param pageCount - total pages in document
     * @param frontPageFunc - function (takes page number i to start (0)) that lays out the front pages as an array of pages
     * @param backPageFunc - function (takes page number i to start (0)) that lays out the back pages as an array of pages
     * @return an array of sheets. Assumes 1st is "front", 2nd is "back", 3rd is "front", etc. 
     *      Each sheet is an array of rows, containing a list of page objects
     */
    build_strips_sheetList(rows, folioPerRow, pageCount, frontPageFunc, backPageFunc) {
        let fronts = []
        let backs = []
        let page = this.page;
        let blank = this.blankPage;
        let totalPagesPerRow = folioPerRow * 4;
        let rowCount = Math.ceil(pageCount / totalPagesPerRow);
        console.log("Building the ",rows," rows of ",(folioPerRow * 2)," pages. Given ",pageCount," page count, there will be ",rowCount," rows...");
        for (let row=0; row < rowCount; ++row ) {
            let i = row * totalPagesPerRow - 1;
            let front = frontPageFunc(i);
            let back = backPageFunc(i);
            if (!this.duplex) {
                console.log("in duplex mode, reversing")
                back.reverse();
            }
            fronts.push(this.auditForBlanks(front, pageCount));
            backs.push(this.auditForBlanks(back, pageCount));
            console.log("   -> adding front ",fronts[fronts.length - 1], " and back ", backs[fronts.length-1])
        }
        let sheets = [];
        for (let row=0; row < rowCount; ++row ) {
            let sheet = Math.floor(row/rows);
            if (row % rows == 0 ) {
                sheets[sheet*2] = [];
                sheets[sheet*2 + 1] = [];
                console.log(sheets)
            }
            sheets[sheet*2].unshift(fronts[row]);
            sheets[sheet*2 + 1].unshift(backs[row]);
            console.log(" -> row ",row," => sheet ", sheet, " grabs front ",fronts[row]," and back ",backs[row])
        }
        if (sheets[sheets.length - 1].length < rows){
            let rowOfBlanks = new Array(folioPerRow * 2)
            for(let j = 0; j < rowOfBlanks.length; ++j) { rowOfBlanks[j] = blank()}
            console.log("I present you my blanks! [for ",folioPerRow,"] : ", rowOfBlanks)
            for (let filler = 0; filler < rows - rowCount % rows; ++filler) {
                let sheet = Math.floor(rowCount/rows);
                if (filler % 2 == 0) {
                    sheets[sheet*2].unshift(rowOfBlanks);
                    sheets[sheet*2 + 1].unshift(rowOfBlanks);
                } else {
                    sheets[sheet*2].push(rowOfBlanks);
                    sheets[sheet*2 + 1].push(rowOfBlanks);
                }
            }
        }
        for (let i=0;i < sheets.length; ++i){
            if (i % 2 == 1 && !this.duplex) {   // stupid "flip on short edge" rotation plans...
                sheets[i].reverse();
                sheets[i].forEach( row => {
                    row.forEach( page => {
                        this.rotate180(page);
                    });
                });
            }
        }
        return sheets;
    }

    /**
     * @param rowCount - how many rows expected to be cut out
     * @param colCount - how many column fold lines
     * @return a FUNCTION. The function takes as it's parameter:
     *       Object definition: {
     *           gap: [leftGap, topGap],
     *           renderPageSize: [width, height],
     *           paperSize: [width, height],
     *           isFront: boolean,
     *           isPacked: boolean
     *       }
     *       and returns: a list of lines, as described by PDF-lib.js's `PDFPageDrawLineOptions` object
     */
    build_strip_lineFunction(rowCount, colCount) {
        return info => {
            let vGap = row => { return (info.isPacked) ? info.gap[1] : info.gap[1] * (2 * row); };
            let hGap = col => { return (info.isPacked) ? info.gap[0] : col * info.gap[0]};
            let baseCuts = [
                this.cutVertical(info.paperSize[1], hGap(0)),
                this.cutVertical(info.paperSize[1], hGap(colCount) + info.renderPageSize[0] * colCount),
            ];
            for (let i = 0; i <= rowCount; ++i) {
                baseCuts.push(this.cutHorizontal(info.paperSize[0], vGap(i) + info.renderPageSize[1] * i));
            }
            let foldMarks = [];
            [...Array(rowCount).keys()].forEach( row => {
                [...Array(colCount).keys()].forEach( page => {
                    foldMarks = foldMarks.concat(this.crosshairMark(
                        hGap(page) + info.renderPageSize[0] * page,
                        vGap(row) + info.renderPageSize[1] * row,
                        5
                        ));
                });
            });
            console.log("Providing lines: \nbase cuts: ",baseCuts,"\nfold marks: ",foldMarks,"\ntotal: ",baseCuts.concat(foldMarks))
            return baseCuts.concat(foldMarks)
        };
    }

    /**
     * @param pageCount - total pages in document
     * @return an array of sheets. Assumes 1st is "front", 2nd is "back", 3rd is "front", etc. 
     *      Each sheet is an array of rows, containing a list of page objects
     */
    build_2_16s_sheetList(pageCount) {
        let p = this.page;
        let f = this.flipPage;
        let sheets = [];
        let sheetCount = Math.ceil(pageCount / 32.0);
        console.log("Building the 32 pages. Given ",pageCount," page count, there will be ",sheetCount," sheets...");
        for (let sheet=0; sheet < sheetCount; ++sheet ) {
            let i = sheet * 32 - 1;
            let front = [
                this.auditForBlanks([p(i+8), p(i+9),   p(i+24), p(i+25)], pageCount),
                this.auditForBlanks([f(i+1), f(i+16),   f(i+17), f(i+32)], pageCount),
                this.auditForBlanks([p(i+4), p(i+13),    p(i+20), p(i+29)], pageCount),
                this.auditForBlanks([f(i+5), f(i+12),   f(i+21), f(i+28)], pageCount),
            ];
            let back = [
                this.auditForBlanks([p(i+26), p(i+23),  p(i+10), p(i+7)], pageCount),
                this.auditForBlanks([f(i+31), f(i+18),  f(i+15), f(i+2)], pageCount),
                this.auditForBlanks([p(i+30), p(i+19),  p(i+14), p(i+3)], pageCount),
                this.auditForBlanks([f(i+27), f(i+22),  f(i+11), f(i+6)], pageCount),
            ]
            sheets.push(front);
            sheets.push(back);
        }
        return sheets
    }

    /**
     * @return a FUNCTION. The function takes as it's parameter:
     *       Object definition: {
     *           gap: [leftGap, topGap],
     *           renderPageSize: [width, height],
     *           paperSize: [width, height],
     *           isFront: boolean,
     *           isPacked: boolean
     *       }
     *       and returns: a list of lines, as described by PDF-lib.js's `PDFPageDrawLineOptions` object
     */
    build_2_16s_lineFunction() {
        return info => {
            let vGap = row => { return (info.isPacked) ? info.gap[1] : info.gap[1] * (2 * row); };
            let hGap = col => { return (info.isPacked) ? info.gap[0] : col * info.gap[0]};
            let foldMarks = [];
            [0,1,2,3,4].forEach( row => {
                [0,1,2,3,4].forEach( page => {
                    foldMarks = foldMarks.concat(this.crosshairMark(
                        hGap(page) + info.renderPageSize[0] * page,
                        vGap(row) + info.renderPageSize[1] * row,
                        5
                        ));
                });
            });
            return [
                {...(this.foldHorizontal(info.paperSize[0], info.paperSize[1]/2, 0.)), opacity: 0.4},
                this.cutVertical(info.paperSize[1], info.paperSize[0]/2),
                this.cutVertical(info.paperSize[1], info.paperSize[0] - info.gap[0]),
                this.cutVertical(info.paperSize[1], info.gap[0]),
            ].concat(foldMarks);
        };
    }

    // ---------------- drawing lines helpers

    foldHorizontal(paperWidth, y) {
        return {
            start: { x: 0, y: y },
            end: { x: paperWidth, y: y},
            thickness: 0.25,
            opacity: 0.4,
            dashArray: [2, 5]
        }
    }
    foldVertical(paperHeight, x) {
        return {
            start: { x: x, y: 0 },
            end: { x: x, y: paperHeight},
            thickness: 0.25,
            opacity: 0.4,
            dashArray: [2, 5]
        }
    }
    cutHorizontal(paperWidth, y) {
        return {
            start: { x: 0, y: y },
            end: { x: paperWidth, y: y},
            thickness: 0.5,
            opacity: 0.4
        }
    }
    cutVertical(paperHeight, x) {
        return {
            start: { x: x, y: 0 },
            end: { x: x, y: paperHeight},
            thickness: 0.5,
            opacity: 0.4
        }
    }
    crosshairMark(x, y, size) {
        return [
        {
            start: { x: x - size/2, y: y },
            end: { x: x + size/2, y: y},
            thickness: 0.5,
            opacity: 0.4
        },
        {
            start: { x: x, y: y - size/2 },
            end: { x: x, y: y + size/2},
            thickness: 0.5,
            opacity: 0.4
        }
        ];
    }





    // ---------------- page layout helpers
    /**
     * @param page - page object, will have it's `isBlank` modified if it exceeds bounds
     * @param pageCount - total pages in document
     * 
     * @return pageList - the possibly modified list provided
     */
    auditForBlanks(pageList, pageCount) {
        pageList.forEach( page => {
            if (page.num >= pageCount) {
                page.isBlank = true;
                page.num = 0;
            }
        });
        return pageList;
    }

    page(num) {
        return { num: num, isBlank: false, vFlip: false}
    }
    flipPage(num) {
        return { num: num, isBlank: false, vFlip: true}
    }
    blankPage() {
        return { num: 0, isBlank: true, vFlip: false}
    }
    /**
     * @param page - the page object, which will be mutated, vertically flipping it
     */
    rotate180(page) {
        page.vFlip = !page.vFlip;
    }
}