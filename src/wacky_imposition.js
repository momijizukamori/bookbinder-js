export class WackyImposition{
    constructor(pages, duplex) {
      this.duplex=duplex;
      this.sigconfig=[]  // sig_count looks at the length of this array, sig_arrange joins them together with a ,;
      this.pagelist = [[]];
      console.log("Constructor sees ", pages)
      // for UI estimates
      this.sheets = Math.ceil(pages.length / 20.0); 
      console.log("... spits out pageList ", this.pagelist)
    }

    a9_3_3_4_builder() {
        return {
            sheetMaker: this.build_3_3_4_sheetList.bind(this),
            lineMaker: this.build_3_3_4_lineFunction.bind(this),
            isLandscape: false,
            fileNameMod: "little"
        }
    }
    a10_6_10s_builder() {
        return {
            sheetMaker: this.build_6_10s_sheetList.bind(this),
            lineMaker: this.build_6_10s_lineFunction.bind(this),
            isLandscape: true,
            fileNameMod: "mini"
        }
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
                this.auditForBlanks([p(i+18), p(i+37),  p(i+36), p(i+29)], pageCount),
                this.auditForBlanks([f(i+25), f(i+40),  f(i+33), f(i+32)], pageCount),
            ]
            let backThrees = [
                this.auditForBlanks([f(i+19), f(i+18),   f(i+7), f(i+6)], pageCount),
                this.auditForBlanks([p(i+22), p(i+15),    p(i+10), p(i+3)], pageCount),
                this.auditForBlanks([f(i+23), f(i+14),   f(i+11), f(i+2)], pageCount),
            ];
            let backFour = [
                this.auditForBlanks([p(i+30), p(i+35),  p(i+38), p(i+27)], pageCount),
                this.auditForBlanks([f(i+31), f(i+34),  f(i+39), f(i+26)], pageCount),
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
     *       }
     *       and returns: a list of lines, as described by PDF-lib.js's `PDFPageDrawLineOptions` object
     */
    build_3_3_4_lineFunction() {
        return info => {
            let cutBetweenTheThrees = {
                start: { x: info.gap[0] + 2 * info.renderPageSize[0], y: info.renderPageSize[1] * 2 + info.gap[1] },
                end: { x: info.gap[0] + 2 * info.renderPageSize[0], y: info.paperSize[1] },
                thickness: 0.25,
                opacity: 0.4,
            };
            let foldBetweenTheFours = {
                start: { x: info.gap[0] + 2 * info.renderPageSize[0], y: info.renderPageSize[1] * 2 + info.gap[1] },
                end: { x: info.gap[0] + 2 * info.renderPageSize[0], y: 0 },
                thickness: 0.5,
                opacity: 0.2,
                dashArray: [2, 5]
            };
            
            return [
                this.foldHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1]),
                this.cutHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1] * 2),
                this.foldHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1] * 3),
                this.foldHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1] * 4),
                this.cutVertical(info.paperSize[1], info.gap[0]),
                this.cutVertical(info.paperSize[1], info.gap[0] + info.renderPageSize[0] * 4),
                cutBetweenTheThrees,
                foldBetweenTheFours
            ];
        };
    }

    foldHorizontal(paperWidth, y) {
        return {
            start: { x: 0, y: y },
            end: { x: paperWidth, y: y},
            thickness: 0.25,
            opacity: 0.2,
            dashArray: [2, 5]
        }
    }
    foldVertical(paperHeight, x) {
        return {
            start: { x: x, y: 0 },
            end: { x: x, y: paperHeight},
            thickness: 0.25,
            opacity: 0.2,
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
            opacity: 0.7
        },
        {
            start: { x: x, y: y - size/2 },
            end: { x: x, y: y + size/2},
            thickness: 0.5,
            opacity: 0.4
        }
        ];
    }

    /**
     * @param pageCount - total pages in document
     * @return an array of sheets. Assumes 1st is "front", 2nd is "back", 3rd is "front", etc. 
     *      Each sheet is an array of rows, containing a list of page objects
     */
    build_6_10s_sheetList(pageCount) {
        let fronts = []
        let backs = []
        let page = this.page;
        let rowCount = Math.ceil(pageCount / 20.0);
        console.log("Building the 6 rows of 10 pages. Given ",pageCount," page count, there will be ",rowCount," rows...");
        for (let row=0; row < rowCount; ++row ) {
            let i = row * 20 - 1;
            let front = [page(i+6),page(i+3),page(i+2),page(i+7),page(i+10),page(i+19),page(i+18),page(i+11),page(i+14),page(i+15)];
            let back = [page(i+16),page(i+13),page(i+12),page(i+17),page(i+20),page(i+9),page(i+8),page(i+1),page(i+4),page(i+5)];
            fronts.push(this.auditForBlanks(front, pageCount));
            backs.push(this.auditForBlanks(back, pageCount));
            console.log("   -> adding front ",fronts[fronts.length - 1], " and back ", backs[fronts.length-1])
        }
        let sheets = [];
        for (let row=0; row < rowCount; ++row ) {
            let sheet = Math.floor(row/6);
            if (row % 6 == 0 ) {
                sheets[sheet*2] = [];
                sheets[sheet*2 + 1] = [];
                console.log(sheets)
            }
            sheets[sheet*2].unshift(fronts[row]);
            sheets[sheet*2 + 1].unshift(backs[row]);
            console.log(" -> row ",row," => sheet ", sheet, " grabs front ",fronts[row]," and back ",backs[row])
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
     *       }
     *       and returns: a list of lines, as described by PDF-lib.js's `PDFPageDrawLineOptions` object
     */
    build_6_10s_lineFunction() {
        return info => {
            let cutOffset = info.isFront ? 4 : 6
            let baseCuts = [
                this.cutHorizontal(info.paperSize[0], info.gap[1]),
                this.cutHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1]),
                this.cutHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1] * 1),
                this.cutHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1] * 2),
                this.cutHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1] * 3),
                this.cutHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1] * 4),
                this.cutHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1] * 5),
                this.cutHorizontal(info.paperSize[0], info.gap[1] + info.renderPageSize[1] * 6),

                // this.foldVertical(info.paperSize[1], info.gap[0] + info.renderPageSize[0] * 2),
                this.cutVertical(info.paperSize[1], info.gap[0] + info.renderPageSize[0] * cutOffset),
                // this.foldVertical(info.paperSize[1], info.gap[0] + info.renderPageSize[0] * 6),
                // this.foldVertical(info.paperSize[1], info.gap[0] + info.renderPageSize[0] * 8),
                this.cutVertical(info.paperSize[1], info.gap[0]),
                this.cutVertical(info.paperSize[1], info.gap[0] + info.renderPageSize[0] * 10),
            ];
            let foldMarks = [];
            [0,1,2,3,4,5,6].forEach( row => {
                [...Array(10).keys()].forEach( page => {
                    foldMarks = foldMarks.concat(this.crosshairMark(
                        info.gap[0] + info.renderPageSize[0] * page,
                        info.gap[1] + info.renderPageSize[1] * row,
                        5
                        ));
                });
            });
            console.log("Providing lines: \nbase cuts: ",baseCuts,"\nfold marks: ",foldMarks,"\ntotal: ",baseCuts.concat(foldMarks))
            return baseCuts.concat(foldMarks)
        };
    }

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
}