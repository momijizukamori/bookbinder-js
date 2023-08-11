import { PDFDocument, degrees, grayscale, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Signatures } from './signatures.js';
import { Booklet } from './booklet.js';
import { PerfectBound } from './perfectbound.js';
import { WackyImposition } from './wacky_imposition.js';
import { PAGE_LAYOUTS, PAGE_SIZES, TARGET_BOOK_SIZE, LINE_LEN } from './constants.js';
import { updatePaperSelectOptionsUnits, updateAddOrRemoveCustomPaperOption} from './utils/renderUtils.js';
import JSZip from 'jszip';
export class Book {
    constructor() {
        this.inputpdf = null;    //  string with pdf filepath
        this.password = null;    //  if necessary

        this.duplex = false; //FIXME
        this.duplexrotate = true;
        this.papersize = PAGE_SIZES.A4;   //  default for europe
        this.paper_rotation_90 = false; // make the printed page landscape [for landscaped layouts, results in portait]

        this.print_file = 'both';   //valid options: [aggregated, both, signatures]
        // valid rotation options: [none, 90cw, 90ccw, out_binding, in_binding]
        this.source_rotation = 'none'; // new feature to rotate pages on the sheets 2023/3/09
        this.managedDoc = null; // original PDF with the pages rotated per source_rotation - use THIS for laying out pages

        this.page_scaling = 'lockratio';
        this.page_positioning = 'centered';
        this.flyleaf = false;
        this.spineoffset = false;
        this.format = 'standardsig';
        this.sigsize = 4;       //  preferred signature size
        this.customsig = null;
        this.signatureconfig = [];  //  signature configuration

        this.input = null;    //  opened pdf file
        this.currentdoc = null;    //  uploaded PDF [Itext PDFReader object] untouched by source_rotation - use managedDoc for layout
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
        this.padding_pt = {'top': 0, 'bottom': 0, 'binding': 0, 'fore_edge': 0}
    }

    update(form) {
        this.duplex = form.get('printer_type') == 'duplex';
        this.duplexrotate = form.has('rotate_page');
        this.paper_rotation_90 = form.has('paper_rotation_90');
        this.papersize = PAGE_SIZES[form.get('paper_size')];
        if (this.paper_rotation_90) {
            this.papersize = [this.papersize[1], this.papersize[0]]
        }

        this.source_rotation = form.get("source_rotation");

        this.print_file = form.get("print_file");
        this.page_scaling = form.get("page_scaling");
        this.page_positioning = form.get("page_positioning");
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

        this.page_layout = form.get('pagelayout') == null ? 'folio' : PAGE_LAYOUTS[form.get('pagelayout')];
        this.per_sheet = this.page_layout.per_sheet;
        this.pack_pages = form.get('wacky_spacing') == 'wacky_pack';
        this.fore_edge_padding_pt = this.extractIntFromForm(form, 'fore_edge_padding_pt')

        this.padding_pt = {
            'top' : this.extractIntFromForm(form, 'top_edge_padding_pt'),
            'bottom': this.extractIntFromForm(form, 'bottom_edge_padding_pt'),
            'binding': this.extractIntFromForm(form, 'binding_edge_padding_pt'),
            'fore_edge': this.extractIntFromForm(form, 'main_fore_edge_padding_pt')
        };
        updateAddOrRemoveCustomPaperOption()
        updatePaperSelectOptionsUnits() // make sure this goes AFTER the Custom update!
    }

    extractIntFromForm(form, fieldName) {
        let num = parseInt(form.get(fieldName))
        return (isNaN(num)) ? 0 : num;
    }

    /**
     * Populates [this.currentdoc] from user's file system
     */
    async openpdf(file) {
        this.inputpdf = file.name;
        this.input = await file.arrayBuffer(); //fs.readFileSync(filepath);
        this.currentdoc = await PDFDocument.load(this.input);
        //TODO: handle pw-protected PDFs
        const pages = this.currentdoc.getPages();
        this.cropbox = null;

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

                    const cropBox = page.getCropBox();
                    const bleedBox = page.getBleedBox();
                    const trimBox = page.getTrimBox();
                    const artBox = page.getArtBox();
                    console.log("\n\tCropBox [",cropBox,"] \n\tBleedBox [",bleedBox,"]  \n\tTrimBox [",trimBox,"]  \n\tArtBox [",artBox,"]");
                    this.cropbox = page.getCropBox();
                }
            }
        })

    }

    /**
     * Populates [this.orderedpages] (array [0, 1, ... this.page_sheets * # of sheets]) 
     */
    createpagelist() {
        this.pagecount = (this.managedDoc == null) ? this.currentdoc.getPageCount() : this.managedDoc.getPageCount();
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

    /**
     * Populates [this.managedDoc] with potentially rotated pages
     *  & populates [this.book] with the correct Book instance
     */
    async createpages() {
        this.createpagelist();
        let pages;
        [this.managedDoc, pages] = await this.embedPagesInNewPdf(this.currentdoc)

        for (var i = 0; i < pages.length; ++i) {
            var page = pages[i]
            var newPage = this.managedDoc.addPage();
            var rotate90cw = this.source_rotation == '90cw' 
                || (this.source_rotation == 'out_binding' && i % 2 == 0)
                || (this.source_rotation == 'in_binding' && i % 2 == 1)
            var rotate90ccw = this.source_rotation == '90ccw' 
                || (this.source_rotation == 'out_binding' && i % 2 == 1)
                || (this.source_rotation == 'in_binding' && i % 2 == 0)
            if (this.source_rotation == 'none') {
                newPage.setSize(page.width, page.height);
                newPage.drawPage(page);
            } else if (rotate90ccw) {
                newPage.setSize(page.height, page.width);
                newPage.drawPage(page, {
                  x: page.height,
                  y: 0,
                  rotate: degrees(90),
                });
            } else if (rotate90cw) {
               newPage.setSize(page.height, page.width);
                newPage.drawPage(page, {
                  x: 0,
                  y: page.width,
                  rotate: degrees(-90),
                });
            } else {
                var e = new Error("??? what sorta' layout you think you're going to get?");
                console.error(e);
                throw e;
            }
            page.embed();
            this.cropbox = newPage.getCropBox();
        }

        console.log("The updatedDoc doc has : ", this.managedDoc.getPages(), " vs --- ", this.managedDoc.getPageCount());
        
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
        } else if (this.format == 'a9_3_3_4' || this.format == 'a10_6_10s' || this.format == 'A7_2_16s' || this.format == '1_3rd' || this.format == '8_zine'|| this.format == 'a_3_6s' || this.format == 'a_4_8s') {
            this.book = new WackyImposition(this.orderedpages, this.duplex, this.format, this.pack_pages)
        }
        console.log("Created pages for : ",this.book)
    }

    /**
     * Calls the appropriate builder based on [this.format]
     *  to generate PDF & populate Previewer
     * @param isPreview - if it's true we only generate preview content, if it's not true... we still 
     *      generate preview content AND a downloadable zip
     */
    async createoutputfiles(isPreview) {
        let previewFrame = document.getElementById('pdf');
        previewFrame.style.display = 'none';
        let resultPDF = null

        //  create a directory named after the input pdf and fill it with
        //  the signatures
        this.zip = new JSZip();
        var origFileName = this.inputpdf.replace(/\s|,|\.pdf/, '');
        this.filename = origFileName

        if (this.format == 'booklet') {
            await this.createsignatures({
                pages: this.rearrangedpages, 
                id: 'booklet',
                isDuplex: this.duplex,
                fileList: this.fileList
            });
        } else if (this.format == 'perfect') {
            await this.createsignatures({
                pages: this.rearrangedpages, 
                id: 'perfect',
                isDuplex: this.duplex,
                fileList: this.filelist
            });
        } else if (this.format == 'standardsig' || this.format == 'customsig') {
            const generateAggregate = this.print_file != "signatures"
            const generateSignatures = this.print_file != "aggregated"
            const side1PageNumbers = new Set(this.rearrangedpages.reduce((accumulator, currentValue) => { return accumulator.concat(currentValue[0]) },[]))
            const [pdf0PageNumbers, pdf1PageNumbers] = (!generateAggregate || this.duplex) ? [null, null]
            : [
                Array.from(Array(this.managedDoc.getPageCount()).keys()).map( p => { return (side1PageNumbers.has(p) ? p : 'b')}),
                Array.from(Array(this.managedDoc.getPageCount()).keys()).map( p => { return (!side1PageNumbers.has(p) ? p : 'b')})
              ];
            const [aggregatePdf0, embeddedPages0] = (generateAggregate) ? await this.embedPagesInNewPdf(this.managedDoc, pdf0PageNumbers) : [null, null]
            const [aggregatePdf1, embeddedPages1] = (generateAggregate && !this.duplex) ? await this.embedPagesInNewPdf(this.managedDoc, pdf1PageNumbers) : [null, null]
            const forLoop = async _ => {
                for (let i = 0; i < this.rearrangedpages.length; i++) {
                    let page = this.rearrangedpages[i];
                    await this.createsignatures({
                        embeddedPages: (generateAggregate) ? [embeddedPages0, embeddedPages1] : null,
                        aggregatePdfs: (generateAggregate) ? [aggregatePdf0, aggregatePdf1] : null,
                        pageIndexes: page, 
                        id: (generateSignatures) ? `signature${i}` : null,
                        isDuplex: this.duplex,
                        fileList: this.filelist
                    });
                }
            }
            await forLoop();

            if (aggregatePdf1 != null) {
                await aggregatePdf1.save().then(pdfBytes => { 
                        if (!isPreview) 
                            this.zip.file('aggregate_side2.pdf', pdfBytes); 
                    });
            }
            if (aggregatePdf0 != null) {
                await aggregatePdf0.save().then(pdfBytes => { 
                    if (!isPreview) 
                        this.zip.file((this.duplex) ? 'aggregate_book.pdf' : 'aggregate_side1.pdf', pdfBytes); 
                });
            }
            var rotationMetaInfo = ((this.paper_rotation_90) ? "_paperRotated" : "")
                + ((this.source_rotation == 'none') ? "" : `_${this.source_rotation}`)
            this.filename = `${origFileName}${rotationMetaInfo}`
            resultPDF = aggregatePdf0;
        } else if (this.format == 'a9_3_3_4') {
            resultPDF = await this.buildSheets(this.filename, this.book.a9_3_3_4_builder());
        } else if (this.format == 'a10_6_10s') {
            resultPDF = await this.buildSheets(this.filename, this.book.a10_6_10s_builder());
        } else if (this.format == 'a_4_8s') {
            resultPDF = await this.buildSheets(this.filename, this.book.a_4_8s_builder());
        } else if (this.format == 'a_3_6s') {
            resultPDF = await this.buildSheets(this.filename, this.book.a_3_6s_builder());
        } else if (this.format == 'A7_2_16s') {
            resultPDF = await this.buildSheets(this.filename, this.book.a7_2_16s_builder());
        } else if (this.format == '1_3rd') {
            resultPDF = await this.buildSheets(this.filename, this.book.page_1_3rd_builder());
        } else if (this.format == '8_zine') {
            resultPDF = await this.buildSheets(this.filename, this.book.page_8_zine_builder());
        }
        console.log("Attempting to generate preview for ",resultPDF);

        if (resultPDF != null) {
            const pdfDataUri = await resultPDF.saveAsBase64({ dataUri: true });
            const viewerPrefs = resultPDF.catalog.getOrCreateViewerPreferences()
            viewerPrefs.setHideToolbar(false)
            viewerPrefs.setHideMenubar(false)
            viewerPrefs.setHideWindowUI(false)
            viewerPrefs.setFitWindow(true)
            viewerPrefs.setCenterWindow(true)
            viewerPrefs.setDisplayDocTitle(true)

            previewFrame.style.width = `450px`;
            let height = this.papersize[1] / this.papersize[0] * 500
            previewFrame.style.height = `${height}px`;
            previewFrame.style.display = '';
            previewFrame.src = pdfDataUri;
        }

        if (!isPreview)
            return this.saveZip();
        else
            return Promise.resolve(1);
    }

    /**
     * @return the aggregate file w/ all the original pages embedded, but nothing placed
     */
    async create_base_aggregate_files() {
        return aggregatePdf
    }

    /**
     * Generates a new PDF & embeds the prescribed pages of the source PDF into it
     *
     * @param pageNumbers - an array of page numbers. Ex: [1,5,6,7,8,'b',10] or null to embed all pages from source
     *          NOTE: re-construction behavior kicks in if there's 'b's in the list
     *
     * @return [newPdf with pages embedded, embedded page array]
     */
    async embedPagesInNewPdf(sourcePdf, pageNumbers) {
        const newPdf = await PDFDocument.create();
        const needsReSorting = pageNumbers != null && pageNumbers.includes("b");
        if (pageNumbers == null) {
            pageNumbers = Array.from(Array(sourcePdf.getPageCount()).keys())
        } else {
            pageNumbers = pageNumbers.filter( p => {return typeof p === 'number'})
        }
        let embeddedPages =  await newPdf.embedPdf(sourcePdf, pageNumbers);
        // what a gnarly little hack. Letting this sit for now -- 
        //   --- downstream code requires embeds to be in their 'correct' index possition
        //    but we want to only embed half the pages for the aggregate single sides
        //    thus we expand the embedded pages to allow those gaps to return. This is gross & dumb but whatever...
        if (needsReSorting) {
            embeddedPages = embeddedPages.reduce((acc, curVal, curI) => {
                acc[pageNumbers[curI]] = curVal;
                return acc
            },[])
        }
        return [newPdf, embeddedPages]
    }

    /**
     * Part of the Classic (non-Wacky) flow. Called by [createsignatures].
     *   (conditionally) populates the destPdf and (conditionally) generates the outname PDF
     *
     * @param config - object /w the following parameters:
     *      - outname : name of pdf added to ongoing zip file. Ex: 'signature1duplex.pdf' (or null if no signature file needed)
     *      - pageList : indicies of pages to assemble. Ex: [12, 11, 10, 13, 14, 9, 8, 15]
     *      - back : is 'back' of page  (boolean)
     *      - alt : alternate pages (boolean)
     *      - destPdf : PDF to write to, in addition to PDF created w/ `outname` (or null)
     *      - providedPages : pages already embedded in the `destPdf` to assemble in addition (or null)
     * @return reference to the new PDF created
     */
    async writepages(config) {
        const printSignatures = config.outname != null
        const printAggregate = config.providedPages != null && config.destPdf != null
        const pagelist = config.pageList;
        const back = config.back;
        let filteredList = [];
        let blankIndices = [];
        pagelist.forEach((page, i) => {
            if (page != 'b') {
                filteredList.push(page);
            } else {
                blankIndices.push(i);
            }
        });
        const [outPDF, embeddedPages] = (printSignatures) ? await this.embedPagesInNewPdf(this.managedDoc, filteredList) : [null, null];

        let destPdfPages = (printAggregate) ? filteredList.map( (pI) => {
            return config.providedPages[pI]
        }) : null

        if (printSignatures)
            blankIndices.forEach(i => embeddedPages.splice(i, 0, 'b'));
        if (printAggregate)
            blankIndices.forEach(i => destPdfPages.splice(i, 0, 'b'));

        let block_start = 0;
        const offset = this.per_sheet / 2;
        let block_end = offset;

        let alt_folio = (this.per_sheet == 4 && back); 

        let positions = this.calculatelayout(alt_folio);

        let side2flag = back;
    
        while (block_end <= pagelist.length) {
            if (printAggregate) {
                this.draw_block_onto_page({
                    outPDF: config.destPdf,
                    embeddedPages: destPdfPages,
                    block_start: block_start,
                    block_end: block_end,
                    papersize: this.papersize,
                    positions: positions,
                    cropmarks: this.cropmarks,
                    cutmarks: this.cutmarks,
                    alt: config.alt,
                    side2flag: side2flag
                });
            }
            if (printSignatures) {
                side2flag = this.draw_block_onto_page({
                    outPDF: outPDF,
                    embeddedPages: embeddedPages,
                    block_start: block_start,
                    block_end: block_end,
                    papersize: this.papersize,
                    positions: positions,
                    cropmarks: this.cropmarks,
                    cutmarks: this.cutmarks,
                    alt: config.alt,
                    side2flag: side2flag
                });
            }
            block_start += offset;
            block_end += offset;
        }

        if (printSignatures) {
            await outPDF.save().then(pdfBytes => { this.zip.file(config.outname, pdfBytes); });
        }
    }

    draw_block_onto_page(config) {
        const block_start = config.block_start
        const block_end = config.block_end
        const papersize = config.papersize
        const outPDF = config.outPDF
        const positions = config.positions
        const cropmarks = config.cropmarks
        const cutmarks = config.cutmarks
        const alt = config.alt
        let side2flag = config.side2flag

        let block = config.embeddedPages.slice(block_start, block_end);
        let currPage = outPDF.addPage([papersize[0], papersize[1]]);

        block.forEach((page, i) => {
            if (page == 'b' || page === undefined) {
                // blank page, move on.
            } else {
                let pos = positions[i];
                let rot = pos.rotation;
                currPage.drawPage(page, { y: pos.y, x: pos.x, xScale: pos.sx, yScale: pos.sy, rotate: degrees(rot) });
            }
        });
        if (cropmarks) {
            this.draw_cropmarks(currPage, side2flag);
        }
        if (cutmarks) {
            this.draw_cutmarks(currPage)
        }
        if (alt) {
            side2flag = !side2flag;
        }
        return side2flag
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


    /**
     * When considering page size, don't forget to take into account 
     *  this.padding_pt's ['top','bottom','binding','fore_edge'] values
     *
     * @return an array of objects in the form {rotation: col, sx: sx, sy: sy, x: x, y: y}
     */
    calculatelayout(alt_folio){
        let pagex = this.cropbox.width + this.padding_pt['binding'] + this.padding_pt['fore_edge'];
        let pagey = this.cropbox.height + this.padding_pt['top'] + this.padding_pt['bottom'];

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
            let temp = pagex;
            pagex = pagey;
            pagey = temp;
        }

        let sx = 1;
        let sy = 1;

        // The page_scaling options are: 'lockratio', 'stretch', 'centered'
        if (this.page_scaling == 'lockratio') {
            let scale = Math.min(finalx/pagex, finaly/pagey);
            sx = scale;
            sy = scale;
        } else if (this.page_scaling == 'stretch') {
            sx = finalx / pagex;
            sy = finaly / pagey;
        }  // else = centered retains 1 x 1

        let bookheight = pagey * sy;            //       height of imposed page
        let bookwidth = pagex * sx;             //       width of imposed page

        let xpad = (finalx - bookwidth) / 2.0;        //       gap above and below imposed page
        let ypad = (finaly - bookheight) / 2.0;            //       gap to side of imposed page

        let xoffset = this.cropbox.x * sx;
        let yoffset = this.cropbox.y * sy;

        let padding = {
            'fore_edge' : this.padding_pt['fore_edge'] * sx,
            'binding' : this.padding_pt['binding'] * sx,
            'bottom' : this.padding_pt['bottom'] * sy,
            'top' : this.padding_pt['top'] * sy
        };

        let positions = []

        console.log("Laying out page w/ scaling option [",this.page_scaling,"] & position option [",this.page_positioning,"] -"+
            "\n\tcrop box (x,y): [",this.cropbox.x,", ",this.cropbox.y,"]"+
            "\n\tcrop box (width,height): [",this.cropbox.width,", ",this.cropbox.height,"]"+
            "\n\tsource size + padding (page): [",pagex,", ",pagey,"]"+
            "\n\tprinted paper size (sheetwidth): [",sheetwidth,", ",sheetheight,"]"+
            "\n\tcols/rows: [",layout.cols,", ",layout.rows,"]"+
            "\n\tmax space to work with (final): [",finalx,", ",finaly,"]"+
            "\n\tscaling: [",sx,", ",sy,"]"+
            "\n\tbookheight: [",bookwidth,", ",bookheight,"]"+
            "\n\tpadding: [",xpad,", ",ypad,"]"+
            "\n\toffset: [",xoffset,", ",yoffset,"]" +
            "\n\tpadding (bottom/binding/top/fore edge): [",padding['bottom'],", ",padding['binding'],",",padding['top'],", ",padding['fore_edge'],"]" 
            +"");
        console.log("WHAT IS GOING ON?? : layout ", layout)
        console.log("WWHYYyyyyyy?  ", layout.rotations)


        layout.rotations.forEach((row, i) => {
            row.forEach((col, j) => {
                // page_positioning has 2 options: centered, binding_alinged

                // value tracking white space to left and right of an open book/page spread
                let leftRightPageGap = ([90,-90].includes(col)) ? ypad : xpad;

                // amount to inset by, relative to fore edge, on left side of book
                let xForeEdgeShift = padding['fore_edge'] + ((this.page_positioning == 'centered' ) ? leftRightPageGap : 2 * leftRightPageGap);
                // amount to inset by, relative to binding, on right side of book
                let xBindingShift = padding['binding'] + ((this.page_positioning == 'centered' ) ? leftRightPageGap : 0);

                let isLeftPage = j % 2 == 0; //page on 'left' side of open book
                let x = (j * finalx) + ((j % 2 == 0 ) ? xForeEdgeShift : xBindingShift);
                let y = (i * finaly) + ypad + padding['bottom'] * sy;

                if ([-180].includes(col)) { // upside-down page
                    let isLeftPage = j % 2 == 1; //page on 'left' (right side on screen)
                    y = finaly + (i * finaly) - ypad - padding['bottom'] * sy;
                    x = finalx + (j * finalx) - ((j % 2 == 0) ? xBindingShift : xForeEdgeShift);
                }

                if ([90].includes(col)) {   // 'top' of page is on left, right side of screen
                    let isLeftPage = i % 2 == 0; // page is on 'left' (top side of screen)
                    x = (1 + j) * finalx - padding['bottom'] - xpad;// + padding['top'];
                    y = (i * finaly) + ((isLeftPage) ? xForeEdgeShift : xBindingShift);// + ((isLeftPage) ? 2 * ypad : 0);//(this.padding_pt['binding'] * sx * 2));
                }
                if ([-90].includes(col)) {  // 'top' of page is on the right, left sight of screen
                    let isLeftPage = i % 2 == 1; // page is on 'left' (bottom side of screen)
                    x = j * finalx + padding['bottom'] + xpad;
                    y = ((1+i) * finaly) - ((isLeftPage) ? xForeEdgeShift : xBindingShift);// - ((isLeftPage) ? 0 + this.padding_pt['binding'] * sx : (2 * ypad) - (this.padding_pt['binding'] * sx));
                }

                console.log(">> (", i, ",",j,")[",col,"] : [",x,", ",y,"] :: [xForeEdgeShift: ",xForeEdgeShift,"][xBindingShift: ",xBindingShift,"]");
                positions.push({rotation: col, sx: sx, sy: sy, x: x, y: y})
            })
        })
        return positions;
    }

    /**
     * PDF builder base function for Classic (non-Wacky) layouts. Called by [createoutputfiles]
     *
     * @param config - object w/ the following parameters:
     *    - pageIndexes : a nested list of original source document page numbers ordered for layout. ( [0] for duplex & front, [1] for backs -- value is null if no aggregate printing enabled). Ex: [[4, 3, 2, 5, 6, 1, 0, 7]]
     *    - aggregatePdfs : list of destination PDF(s_ for aggregated content ( [0] for duplex & front, [1] for backs -- value is null if no aggregate printing enabled)
     *    - embeddedPages : list of lists of embedded pages from source document ( [0] for duplex & front, [1] for backs -- value is null if no aggregate printing enabled)
     *    - id : string dentifier for signature file name (null if no signature files to be generated)
     *    - isDuplex : boolean
     *    - fileList : list of filenames for sig filename to be added to (modifies list)
     */
    async createsignatures(config) {
        const printAggregate = config.aggregatePdfs != null
        const printSignatures = config.id != null
        const pages = config.pageIndexes;
        //      duplex printers print both sides of the sheet, 
        if (config.isDuplex) {
            let outduplex = (printSignatures) ? config.id + 'duplex' + '.pdf' : null;
            await this.writepages({
                outname: outduplex, 
                pageList: pages[0], 
                back: false, 
                alt: true,
                destPdf: (printAggregate) ? config.aggregatePdfs[0] : null,
                providedPages: (printAggregate) ? config.embeddedPages[0] : null
            });
            if (printSignatures) {
                config.fileList.push(outduplex);
            }
        } else {
            //      for non-duplex printers we have two files, print the first, flip 
            //      the sheets over, then print the second
            let outname1 = (printSignatures) ? config.id + 'side1.pdf' : null;
            let outname2 = (printSignatures) ? config.id + 'side2.pdf' : null;
 
            await this.writepages({
                outname: outname1,
                pageList: pages[0],
                back: false,
                alt: false,
                destPdf: (printAggregate) ? config.aggregatePdfs[0] : null,
                providedPages: (printAggregate) ? config.embeddedPages[0] : null
            });
            await this.writepages({
                outname: outname2,
                pageList: pages[1],
                back: true,
                alt: false,
                destPdf: (printAggregate) ? config.aggregatePdfs[1] : null,
                providedPages: (printAggregate) ? config.embeddedPages[1] : null
            });
            if (printSignatures) {
                config.fileList.push(outname1);
                config.fileList.push(outname2);
            }
        }
        console.log("After creating signatures, our filelist looks like: ",this.filelist)
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
     *      sheetMaker: function that takes the page count as a param and returns an array of sheets. A sheet is { 
     *            num: page number from original doc, 
     *            isBlank: true renders it blank-- will override any `num` included,
     *            vFlip: true if rendered upside down (180 rotation)
     *       },
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
        return outPDF
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
        let embeddedPages = await outPDF.embedPdf(this.managedDoc, filteredList);
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
