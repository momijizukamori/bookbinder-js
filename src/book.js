import { PDFDocument, degrees, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Signatures } from './signatures.js';
import { Booklet } from './booklet.js';
import { PerfectBound } from './perfectbound.js';
import { WackyImposition } from './wacky_imposition.js';
import { PAGE_LAYOUTS, PAGE_SIZES, TARGET_BOOK_SIZE, LINE_LEN } from './constants.js';
import JSZip from 'jszip';
export class Book {
    constructor() {
        this.inputpdf = null;    //  string with pdf filepath
        this.password = null;    //  if necessary

        this.duplex = false; //FIXME
        this.duplexrotate = true;
        this.papersize = PAGE_SIZES.A4;   //  default for europe

        this.lockratio = true;
        this.flyleaf = false;
        this.spineoffset = false;
        this.format = 'standardsig';
        this.booksize = [null, null];
        this.sigsize = 4;       //  preferred signature size
        this.customsig = null;
        this.signatureconfig = [];	//  signature configuration

        this.input = null;    //  opened pdf file
        this.currentdoc = null;    //  Itext PDFReader object
        this.pagecount = null;
        this.cropbox = null;

        this.orderedpages = [];      //  ordered list of page numbers (consecutive)
        this.rearrangedpages = [];      //  reordered list of page numbers (signatures etc.)
        this.filelist = [];      //  list of ouput filenames and path
        this.zip = null;
        this.page_layout = PAGE_LAYOUTS.folio;
        this.per_sheet = 8; //number of pages to print per sheet.
        this.cropmarks = false;
        this.cutmarks = false;

        this.fore_edge_padding_pt = 0;  // (wacky only atm) -- to track buffer space on non-binding edge
        this.pack_pages = true;     // (wacky only atm) - to track if the white space should be distributed
    }

    update(form) {

        this.duplex = form.get('printer_type') == 'duplex';
        this.duplexrotate = form.has('rotate_page');
        this.papersize = PAGE_SIZES[form.get('paper_size')];
        this.lockratio = form.get("page_scaling") == 'lockratio';
        this.flyleaf = form.has('flyleaf');
        this.cropmarks = form.has('cropmarks');
        this.cutmarks = form.has('cutmarks');
        this.format = form.get('sig_format');
        let siglength = parseInt(form.get('sig_length'), 10);
        if (!isNaN(siglength)) {
            this.sigsize = siglength;
        }
        this.customsig = this.format == 'customsig';
        if (this.customsig) {
            this.signatureconfig = [];
            let format = form.get('custom_sig');
            format.split(/, */).forEach(number => {
                let num = parseInt(number, 10);
                if (!isNaN(num)) {
                    this.signatureconfig.push(num);
                }
            });

        }

        this.booksize = [this.papersize[1] * 0.5, this.papersize[0]];
        this.page_layout = form.get('pagelayout') == null ? 'folio' : PAGE_LAYOUTS[form.get('pagelayout')];
        this.per_sheet = this.page_layout.per_sheet;
        this.pack_pages = form.get('wacky_spacing') == 'wacky_pack';
        this.fore_edge_padding_pt = parseInt(form.get('fore_edge_padding_pt'))
        if(isNaN(this.fore_edge_padding_pt)) {
            this.fore_edge_padding_pt = 0;
        }
    }

    async openpdf(file) {
        this.inputpdf = file.name;
        this.input = await file.arrayBuffer(); //fs.readFileSync(filepath);
        this.currentdoc = await PDFDocument.load(this.input);
        //TODO: handle pw-protected PDFs
        const pages = this.currentdoc.getPages();

        //FIXME: dumb hack because you can't embed blank pdf pages without errors.
        pages.forEach(page => {
            if (!page.node.Contents()){
            page.drawLine({
                start: { x: 25, y: 75 },
                end: { x: 125, y: 175 },
                opacity: 0.0,
              });
            } else {
                if (!this.cropbox) {
                    this.cropbox = page.getCropBox();
                }
            }
        })

    }

    setbooksize(targetsize, customx, customy) {
        if (targetsize == 'full') {
            this.booksize = [this.papersize[1] * 0.5, this.papersize[0]]
        } else if (targetsize == 'custom') {
            this.booksize = [customx, customy];
        } else {
            this.booksize = TARGET_BOOK_SIZE[targetsize];
        }

    }

    createpagelist() {
        this.pagecount = this.currentdoc.getPageCount();
        this.orderedpages = Array.from({ length: this.pagecount }, (x, i) => i);

        if (this.flyleaf) {
            this.orderedpages.unshift('b');
            this.orderedpages.unshift('b');

            this.orderedpages.push('b');
            this.orderedpages.push('b');
        }

        //      padding calculations if needed
        let pagetotal = this.orderedpages.length;

        //     calculate how many sheets of paper the output document needs
        let sheets = Math.floor(pagetotal / this.per_sheet);

        //      pad out end of document if necessary
        if (pagetotal % this.per_sheet > 0) {
            sheets += 1;
            let padding = (sheets * this.per_sheet) - pagetotal;
            for (let i = 0; i < padding; i++) {
                this.orderedpages.push('b');
            }
        }
        console.log("Calculated pagecount [",this.pagecount,"] and ordered pages: ", this.orderedpages)
    }

    createpages() {
        this.createpagelist();
        if (this.format == 'booklet') {
            this.book = new Booklet(this.orderedpages, this.duplex);
        } else if (this.format == 'perfect') {
            this.book = new PerfectBound(this.orderedpages, this.duplex);
        } else if (this.format == 'standardsig' || this.format == 'customsig') {
            this.book = new Signatures(this.orderedpages, this.duplex, this.sigsize, this.per_sheet, this.duplexrotate);

            if (this.customsig) {
                this.book.setsigconfig(this.signatureconfig);
            } else {
                this.book.createsigconfig();
            }

            this.rearrangedpages = this.book.pagelist;
        } else if (this.format == 'a9_3_3_4' || this.format == 'a10_6_10s' || this.format == 'A7_2_16s' || this.format == '1_3rd' || this.format == 'a_3_6s' || this.format == 'a_4_8s') {
            this.book = new WackyImposition(this.orderedpages, this.duplex, this.format, this.pack_pages)
        }
        console.log("Created pages for : ",this.book)
    }

    async createoutputfiles() {
        //	create a directory named after the input pdf and fill it with
        //	the signatures
        this.zip = new JSZip();
        this.filename = this.inputpdf.replace(/\s|,|\.pdf/, '');

        if (this.format == 'booklet') {
            await this.createsignatures(this.rearrangedpages, 'booklet');
        } else if (this.format == 'perfect') {
            await this.createsignatures(this.rearrangedpages, 'perfect');
        } else if (this.format == 'standardsig' || this.format == 'customsig') {
            const aggregatePdf = await PDFDocument.create();
            const forLoop = async _ => {
                for (let i = 0; i < this.rearrangedpages.length; i++) {
                    let page = this.rearrangedpages[i];
                    const newPDF = await this.createsignatures(page, `signature${i}`);
                    if (newPDF != null) {
                        const dupPages = await aggregatePdf.copyPages(newPDF, newPDF.getPageIndices());
                        dupPages.forEach( page => { aggregatePdf.addPage(page); });
                    }
                }
            }
            await forLoop();
            if (this.duplex && this.rearrangedpages.length > 1) {
                await aggregatePdf.save().then(pdfBytes => { this.zip.file('aggregate_book.pdf', pdfBytes); });
            }

           //return forLoop().then(_ => this.saveZip());
        } else if (this.format == 'a9_3_3_4') {
            await this.buildSheets(this.filename, this.book.a9_3_3_4_builder());
        } else if (this.format == 'a10_6_10s') {
            await this.buildSheets(this.filename, this.book.a10_6_10s_builder());
        } else if (this.format == 'a_4_8s') {
            await this.buildSheets(this.filename, this.book.a_4_8s_builder());
        } else if (this.format == 'a_3_6s') {
            await this.buildSheets(this.filename, this.book.a_3_6s_builder());
        } else if (this.format == 'A7_2_16s') {
            await this.buildSheets(this.filename, this.book.a7_2_16s_builder());
        } else if (this.format == '1_3rd') {
            await this.buildSheets(this.filename, this.book.page_1_3rd_builder());
        }
        return this.saveZip();
    }

    /**
     * @return reference to the new PDF created
     */
    async writepages(outname, pagelist, back, alt) {
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

        let block_start = 0;
        const offset = this.per_sheet / 2;
        let block_end = offset;

        let alt_folio = (this.per_sheet == 4 && back); 

        let positions = this.calculatelayout(alt_folio);

        let side2flag = back;
    
        while (block_end <= pagelist.length) {
            
            let block = embeddedPages.slice(block_start, block_end);
            currPage = outPDF.addPage([this.papersize[0], this.papersize[1]]);

            block.forEach((page, i) => {
                if (page == 'b') {
                    // blank page, move on.
                } else {
                    let pos = positions[i];
                    let rot = pos.rotation;

                    currPage.drawPage(page, { y: pos.y, x: pos.x, xScale: pos.sx, yScale: pos.sy, rotate: degrees(rot) });
                }
    
            })

            if (this.cropmarks) {
                this.draw_cropmarks(currPage, side2flag);
            }

            if (this.cutmarks) {
                this.draw_cutmarks(currPage)
            }

            if (alt) {
                side2flag = !side2flag;
            }

            block_start += offset;
            block_end += offset;
        }

        await outPDF.save().then(pdfBytes => { this.zip.file(outname, pdfBytes); });
        return outPDF;
    }

    draw_cropmarks(currPage, side2flag) {
        switch(this.per_sheet){
            case 32:
                if (side2flag) {
                if (this.duplexrotate){
                    currPage.drawLine({
                    start: {x: this.papersize[0] * 0.75,  y: this.papersize[1] * 0.75 },
                    end: {x: this.papersize[0] * 0.75, y: this.papersize[1] * 0.5 },
                    opacity: 0.4,
                    dashArray: [1, 5]
                });} else {
                    currPage.drawLine({
                        start: {x: this.papersize[0] * 0.25,  y: this.papersize[1] * 0.5 },
                        end: {x: this.papersize[0] * 0.25,  y: this.papersize[1] * 0.25 },
                        opacity: 0.4,
                        dashArray: [1, 5]
                    });
                }
            }
            case 16:
                if (side2flag) {
                    if (this.duplexrotate){
                    currPage.drawLine({
                    start: {x: 0,  y: this.papersize[1] * 0.75 },
                    end: {x: this.papersize[0] * 0.5, y: this.papersize[1] * 0.75 },
                    opacity: 0.4,
                    dashArray: [3, 5]
                });} else {
                    currPage.drawLine({
                        start: {x: this.papersize[0] * 0.5,  y: this.papersize[1] *.25 },
                        end: {x: this.papersize[0],  y: this.papersize[1] * 0.25 },
                        opacity: 0.4,
                        dashArray: [3, 5]
                    });
                }
            }
            case 8:
                if (side2flag) {
                if (this.duplexrotate){
                    currPage.drawLine({
                    start: {x: this.papersize[0] * 0.5,  y: 0 },
                    end: { y: this.papersize[1] * 0.5, x: this.papersize[0] * 0.5 },
                    opacity: 0.4,
                    dashArray: [5, 5]
                });} else {
                    currPage.drawLine({
                        start: {x: this.papersize[0] * 0.5,  y: this.papersize[1] },
                        end: { y: this.papersize[1] * 0.5, x: this.papersize[0] * 0.5 },
                        opacity: 0.4,
                        dashArray: [5, 5]
                    });
                }
            }
            case 4:
                if (!side2flag) {
                currPage.drawLine({
                    start: { x: 0, y: this.papersize[1] * 0.5 },
                    end: { x: this.papersize[0], y: this.papersize[1] * 0.5 },
                    opacity: 0.4,
                    dashArray: [10, 5]
                });
            }
            }
    }

    draw_cutmarks(currPage) {
        let lines = []
        switch(this.per_sheet){
            case 32:
                lines = [...lines, 
                        ...this.draw_hline(this.papersize[1] * 0.75, 0, this.papersize[0]),
                        ...this.draw_hline(this.papersize[1] * 0.25, 0, this.papersize[0]),
                        ...this.draw_cross(this.papersize[0] * 0.5, this.papersize[1] * 0.75),
                        ...this.draw_cross(this.papersize[0] * 0.5, this.papersize[1] * 0.25)
                    ]
            case 16:
                lines = [...lines,
                        ...this.draw_vline(this.papersize[0] * 0.5, 0, this.papersize[1]),
                        ...this.draw_cross(this.papersize[0] * 0.5, this.papersize[1] * 0.5)
                    ];
            case 8:
                lines = [...lines,
                        ...this.draw_hline(this.papersize[1] * 0.5, 0, this.papersize[0])
                        ];
            case 4:
            }

            lines.forEach(line => {
                currPage.drawLine({...line, opacity: 0.4});
            });
    }

    draw_vline(x, ystart, yend){
        return [{start: {x: x, y: ystart}, end: {x: x, y: ystart + LINE_LEN}}, {start: {x: x, y: yend - LINE_LEN}, end: {x: x, y: yend}}]
    }

    draw_hline(y, xstart, xend){
        return [{start: {x: xstart, y: y}, end: {x: xstart + LINE_LEN, y: y}}, {start: {x: xend - LINE_LEN, y: y}, end: {x: xend, y: y}}]
    }

    draw_cross(x, y) {
        return [{start: {x: x - LINE_LEN, y: y}, end: {x: x + LINE_LEN, y: y}}, {start: {x: x, y: y - LINE_LEN}, end: {x: x, y: y + LINE_LEN}}]
    }


    calculatelayout(alt_folio){
        let pagex = this.cropbox.width;
        let pagey = this.cropbox.height;


        let sheetwidth = this.papersize[0];
        let sheetheight = this.papersize[1];

        // Folios are the only type with a different set of layout params for the back
        // let layout = alt_folio ? PAGE_LAYOUTS['folio_alt'] : this.page_layout;  
        let layout = this.page_layout; 

        // Calculate the size of each page box on the sheet
        let finalx = sheetwidth / layout.cols;
        let finaly = sheetheight / layout.rows;
       
        // if pages are rotated a quarter-turn in this layout, we need to swap the width and height measurements
        if (layout.landscape) {
            pagex = this.cropbox.height;
            pagey = this.cropbox.width;
        }

        let targetratio = finaly / finalx;
        let inputratio = pagey / pagex;                               //       inputpage ratio
        let sx = 1;
        let sy = 1;

        //      Keep the page proportions (lockratio=1) or stretch to fit target page (lockratio=0)
        if (this.lockratio) {
            let scale = 1;
            if (targetratio > inputratio) {
                //       input page is fatter than target page - scale with width
                scale = finalx / pagex;
            } else {
                //       input page is thinner than target page - scale with height
                scale = finaly / pagey;
            }
            sx = scale;
            sy = scale;

        } else {
            sx = finalx / pagex;
            sy = finaly / pagey;
        }

        let bookheight = pagey * sy;            //       height of imposed page
        let bookwidth = pagex * sx;             //       width of imposed page

        let xpad = (finalx - bookwidth) / 2.0;        //       gap above and below imposed page
        let ypad = (finaly - bookheight) / 2.0;            //       gap to side of imposed page

        let xoffset = this.cropbox.x * sx;
        let yoffset = this.cropbox.y * sy;

        let positions = []

        layout.rotations.forEach((row, i) => {
            row.forEach((col, j) => {
                let x = j * finalx + xpad + xoffset;
                let y = ((i * finaly) + ypad + yoffset);

                if ([-90, -180].includes(col)) {
                    y += finaly;
                }

                if ([-180, 90].includes(col)) {
                    x += finalx;
                }

                positions.push({rotation: col, sx: sx, sy: sy, x: x, y: y})

            })
        })
        return positions;
    }

    /**
     * @param pages - a nested list of original source document pages. Single list of list for duplex, two entries for non-duplex
     *
     * @return returns a newly created PDF if duplex or null
     */
    async createsignatures(pages, id) {
        let result = null;
        //      duplex printers print both sides of the sheet, 
        if (this.duplex) {
            // let outduplex = this.outputpath + '/' + id + 'duplex' + '.pdf';
            let outduplex = id + 'duplex' + '.pdf';
            result = await this.writepages(outduplex, pages[0], false, true);
            this.filelist.push(outduplex);
        } else {
            //      for non-duplex printers we have two files, print the first, flip 
            //      the sheets over, then print the second. damned inconvenient
            let outname1 = id + 'side1.pdf';
            let outname2 = id + 'side2.pdf';
 
            await this.writepages(outname1, pages[0], false, false);
            await this.writepages(outname2, pages[1], true, false);

            this.filelist.push(outname1);
            this.filelist.push(outname2);
        }
        console.log("After creating signatures, our filelist looks like: ",this.filelist)
        return result;
    }

    saveZip() {
        console.log("Saving zip... ")
        return this.zip.generateAsync({ type: "blob" })
            .then(blob => {
                console.log("  calling saveAs on ", this.filename)
                saveAs(blob, this.filename + ".zip");
            });
    }

    /**
     * @param id - base for the final PDF name
     * @param builder - object to help construct this configuration. Object definition: {
     *      sheetMaker: function that takes the page count as a param and returns an array of sheets,
     *      lineMaker: function that makes a function that generates trim lines for the PDF,
     *      isLandscape: true if we need to have largest dimension be width,
     *      fileNameMod: string to affix to exported file name (contains no buffer begin/end characters)
     *      isPacked: boolean - true if white spaces goes on the outside, false if white space goes everywhere (non-binding edge)
     * }
     */
    async buildSheets(id, builder) {
        let sheets = builder.sheetMaker(this.pagecount);
        let lineMaker = builder.lineMaker();
        console.log("Working with the sheet descritpion: ", sheets);
        const outPDF = await PDFDocument.create();
        const outPDF_back = await PDFDocument.create();

        for (let i=0; i < sheets.length; ++i ) {
            let isFront = i % 2 == 0;
            let isFirst = i < 2;
            console.log("Trying to write ", sheets[i])
            let targetPDF = (this.duplex || isFront) ? outPDF : outPDF_back;
            await this.write_single_page(targetPDF, builder.isLandscape, isFront, isFirst, sheets[i], lineMaker);
        }
        {
            console.log("Trying to save to PDF ", builder.fileNameMod, " w/ packing : ", this.pack_pages)
            let fileName = id + "_" + builder.fileNameMod + ( this.duplex ? '' : '_fronts') +'.pdf';
            await outPDF.save().then(pdfBytes => { 
                console.log("Calling zip.file on ", fileName);
                this.zip.file(fileName, pdfBytes); 
            });
            this.filelist.push(fileName);
        }
        if (!this.duplex) {
            console.log("Trying to save to PDF (back pages)")
          let fileName = id + "_" + builder.fileNameMod + '_backs.pdf';
          await outPDF_back.save().then(pdfBytes => { 
            console.log("Calling zip.file on ", fileName);
            this.zip.file(fileName, pdfBytes); 
          });
          this.filelist.push(fileName);
        }
        console.log("buildSheets complete");
    }

    /**
     * Spits out a document of specificed `papersize` dimensions.
     * The 2 dimensional pagelist determines the size of the rendered pages. 
     * The height of each rendered page is `papersize[1] / pagelist.length`. 
     * The width of each rendered page is `papersize[0] / pagelist[x].length`.
     * 
     * @param outPDF - the PDFDocument document we're appending a page to
     * @param isLandscape - true if we need to have largest dimension be width
     * @param isFront - true if front of page
     * @param isFirst - true if this is the first (front/back) pair of sheets
     * @param pagelist - a 2 dimensional array. Outer array is rows, nested array page objects. Object definition: { 
     *      num: page number from original doc, 
     *      isBlank: true renders it blank-- will override any `num` included,
     *      vFlip: true if rendered upside down (180 rotation)
     * }
     * @param lineMaker - a function called to generate list of lines as described by PDF-lib.js's `PDFPageDrawLineOptions` object.
     *      Function takes as parameters: 
     * @return 
     */
    async write_single_page(outPDF, isLandscape, isFront, isFirst, pagelist, lineMaker) {
        let filteredList = [];
        console.log(pagelist)
        pagelist = pagelist.filter( r => {  // need second sheet to remain small even if there's room to expand
            return !isFirst || r.filter(c => {return c.isBlank == false;}).length > 0;
        });
        console.log(pagelist)
        console.log("Hitting that write_single_page : isPacked[",this.pack_pages,"] || (front ",isFront,"/ first ",isFirst,") [",pagelist.length,",",pagelist[0].length,"]")
        pagelist.forEach(row => { row.forEach( page => { if (!page.isBlank) filteredList.push(page.num) }) });
        if (filteredList.length == 0) {
            console.warn("All the pages are empty! : ",pagelist);
            return;
        }
        let embeddedPages = await outPDF.embedPdf(this.currentdoc, filteredList);
        // TODO : make sure the max dimen is correct here...
        let papersize = isLandscape ? [this.papersize[1], this.papersize[0]] : [this.papersize[0], this.papersize[1]]
        let curPage = outPDF.addPage(papersize);
        let sourcePage = embeddedPages.slice(0, 1)[0];
        let pageHeight = papersize[1] / pagelist.length;
        let pageWidth = papersize[0] / pagelist[0].length;
        let heightRatio =  pageHeight / sourcePage.height;
        let widthRatio =  pageWidth / (sourcePage.width + this.fore_edge_padding_pt);
        let pageScale = Math.min(heightRatio, widthRatio);
        let vGap = papersize[1] - (sourcePage.height * pageScale * pagelist.length);
        let topGap = (this.pack_pages) ? vGap / 2.0 : vGap / (pagelist.length * 2);
        let hGap = papersize[0] - ((sourcePage.width + this.fore_edge_padding_pt) * pageScale * pagelist[0].length);
        let leftGap = (this.pack_pages) ? hGap / 2.0 : (hGap / pagelist[0].length) ;
        let printPageWidth = pageScale * sourcePage.width;
        let printPageHeight = pageScale * sourcePage.height;
        let printedForeEdgeGutter = pageScale * this.fore_edge_padding_pt;
        for (let row=0; row < pagelist.length; ++row ) {
            let y = sourcePage.height * pageScale * row;
            for (let i=0; i < pagelist[row].length; ++i) {
                let x = (sourcePage.width + this.fore_edge_padding_pt) * pageScale * i + (this.fore_edge_padding_pt * (i + 1)%2);
                let pageInfo = pagelist[row][i]
                if (pageInfo.isBlank)
                    continue;
                let origPage = embeddedPages[filteredList.indexOf(pageInfo.num)]
                let hOffset = (this.pack_pages) ? leftGap : (1 + i - i % 2) * leftGap;
                let vOffset = (this.pack_pages) ? topGap : topGap  + (2 * topGap * row);
                let positioning = { 
                    x: x + hOffset + (pageInfo.vFlip ? printPageWidth : 0) + printedForeEdgeGutter * ((i + 1)%2), 
                    y: y + vOffset + (pageInfo.vFlip ? printPageHeight : 0), 
                    width: printPageWidth , 
                    height: printPageHeight, 
                    rotate: pageInfo.vFlip ? degrees(180) : degrees(0)
                }
                //console.log(" [",row,",",i,"] Given page info ", pageInfo, " now embedding at ", positioning);
                curPage.drawPage(origPage, positioning);
            }
        }
        lineMaker({
            isFront: isFront,
            gap: [leftGap, topGap],
            renderPageSize: [printPageWidth + printedForeEdgeGutter, printPageHeight],
            paperSize: papersize,
            isPacked: this.pack_pages
        }).forEach( line => { curPage.drawLine(line)});
    }

}
