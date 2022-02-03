export class WackyImposition{
    constructor(pages, duplex) {
      this.duplex=duplex;
      this.sigconfig=[]  // sig_count looks at the length of this array, sig_arrange joins them together with a ,;
      this.pagelist = [[]];
      console.log("Constructor sees ", pages)
      // for UI estimates
      this.sheets = Math.ceil(pages.length / 20.0); 

      // for (let i=0; i < pages.length; i=i+10 ) {
      //   let index = Math.floor(i/10)
      //   this.pagelist[index] = []
      //   for (let j=i; j < pages.length && j < i + 10; ++j ) {
      //       this.pagelist[index].push([j]);
      //   }
      //   this.sigconfig.push([2])
      //   this.sigconfig.push([i])
      //   this.sigconfig.push([4])
      // }
      console.log("... spits out pageList ", this.pagelist)
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
            let i = row * 20;
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
            sheets[sheet*2].push(fronts[row]);
            sheets[sheet*2 + 1].push(backs[row]);
            console.log(" -> row ",row," => sheet ", sheet, " grabs front ",fronts[row]," and back ",backs[row])
        }
        return sheets;
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



    async createsignatures(pages, id) {
        //      duplex printers print both sides of the sheet, 
        if (this.duplex) {
            // let outduplex = this.outputpath + '/' + id + 'duplex' + '.pdf';
            let outduplex = id + 'duplex' + '.pdf';
            await this.writepages(outduplex, pages[0], 0);

            this.filelist.push(outduplex);
        } else {
            //      for non-duplex printers we have two files, print the first, flip 
            //      the sheets over, then print the second. damned inconvenient
            // let outname1 = this.outputpath + '/' + id + 'side1.pdf';
            // let outname2 = this.outputpath + '/' + id + 'side2.pdf';
            let outname1 = id + 'side1.pdf';
            let outname2 = id + 'side2.pdf';

            await this.writepages(outname1, pages[0], 0);
            await this.writepages(outname2, pages[1], 1);

            this.filelist.push(outname1);
            this.filelist.push(outname2);
        }


    }


    async writepages(outname, pagelist, side2flag) {

        let side = 'front';
        let imposedpage = 'left';

        const outPDF = await PDFDocument.create();
        let currPage = null;
        let filteredList = [];
        let blankIndices = [];
        pagelist.forEach((page, i) => {
            if (page != 'b') {
                filteredList.push(page);
            } else {
                blankIndices.push(i);
            }
        });

        let embeddedPages = await outPDF.embedPdf(this.currentdoc, filteredList);
        blankIndices.forEach(i => embeddedPages.splice(i, 0, 'b'));

        for (let i = 0; i < pagelist.length; i++) {
            let pagenumber = pagelist[i];
            let embeddedPage = embeddedPages[i];

            if (i % 2 == 0) {
                currPage = outPDF.addPage([this.papersize[0], this.papersize[1]]);
            }
            ////  scaling code here
            if (pagenumber == 'b') {
                // blank page, move on.
            } else {
                if (i % 2 == 0) {
                    imposedpage = 'left';

                    if (side2flag || ((i + 2) % 4 == 0 && this.duplex)) {
                        side = 'back';
                    } else {
                        side = 'front';
                    }
                } else {
                    imposedpage = 'right';
                }
                //print 'adding page'
                const [baseline, leftstart, scale1, scale2, rotate] = this.calculateposition(pagenumber, imposedpage, side);

                // let pageTransform = buildTransform(scale1, scale2, leftstart, baseline, 90, 0, 0)
                // const [embeddedPage] = await outPDF.embedPdf(this.currentdoc, [pagenumber]);
                currPage.drawPage(embeddedPage, { y: leftstart, x: baseline, xScale: scale1, yScale: scale2, rotate: degrees(rotate) });

            }
        }


        return outPDF.save().then(pdfBytes => {
            this.zip.file(outname, pdfBytes);

        }
        );

    }
}