import { PDFDocument, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Signatures } from './signatures.js';
import { Booklet } from './booklet.js';
import { PerfectBound } from './perfectbound.js';
var JSZip = require("jszip");

export const pagesizes = {
    'LETTER': [612, 792], 'NOTE': [540, 720], 'LEGAL': [612, 1008], 'TABLOID': [792, 1224], 'EXECUTIVE': [522, 756], 'POSTCARD': [283, 416],
    'A0': [2384, 3370], 'A1': [1684, 2384], 'A3': [842, 1191], 'A4': [595, 842], 'A5': [420, 595], 'A6': [297, 420],
    'A7': [210, 297], 'A8': [148, 210], 'A9': [105, 148], 'B0': [2834, 4008], 'B1': [2004, 2834], 'B2': [1417, 2004],
    'B3': [1000, 1417], 'B4': [708, 1000], 'B6': [354, 498], 'B7': [249, 354], 'B8': [175, 249], 'B9': [124, 175],
    'B10': [87, 124], 'ARCH_E': [2592, 3456], 'ARCH_C': [1296, 1728], 'ARCH_B': [864, 1296], 'ARCH_A': [648, 864],
    'FLSA': [612, 936], 'FLSE': [648, 936], 'HALFLETTER': [396, 612], '_11X17': [792, 1224], 'ID_1': [242.65, 153],
    'ID_2': [297, 210], 'ID_3': [354, 249], 'LEDGER': [1224, 792], 'CROWN_QUARTO': [535, 697], 'LARGE_CROWN_QUARTO': [569, 731],
    'DEMY_QUARTO': [620, 782], 'ROYAL_QUARTO': [671, 884], 'CROWN_OCTAVO': [348, 527], 'LARGE_CROWN_OCTAVO': [365, 561],
    'DEMY_OCTAVO': [391, 612], 'ROYAL_OCTAVO': [442, 663], 'SMALL_PAPERBACK': [314, 504],
    'PENGUIN_SMALL_PAPERBACK': [314, 513], 'PENGUIN_LARGE_PAPERBACK': [365, 561]
};
const targetbooksize = {
    'standard': [314.5, 502.0],
    'large': [368.5, 558.5]
};

export class Book {
    constructor() {

        this.inputpdf = null;    //  string with pdf filepath
        this.password = null;    //  if necessary
        this.outputdir = null;

        this.duplex = false; //FIXME
        this.duplexrotate = true;
        this.papersize = pagesizes.A4;   //  default for europe

        this.lockratio = true;
        this.flyleaf = false;
        this.spineoffset = false;
        this.format = 'standard';
        this.booksize = [null, null];
        this.sigsize = 8;       //  preferred signature size
        this.customsig = null;
        this.signatureconfig = [];	//  signature configuration

        this.input = null;    //  opened pdf file
        this.currentdoc = null;    //  Itext PDFReader object
        this.pagecount = null;
        this.cropbox = null;

        this.directoryname = null;
        this.orderedpages = [];      //  ordered list of page numbers (consecutive)
        this.rearrangedpages = [];      //  reordered list of page numbers (signatures etc.)
        this.filelist = [];      //  list of ouput filenames and path
        this.zip = null;
    }

    update(form) {

        this.duplex = form.get('printer_type') == 'duplex';
        this.duplexrotate = form.has('rotate_page');
        this.papersize = pagesizes[form.get('paper_size')];
        this.lockratio = form.get("page_scaling") == 'lockratio';
        this.flyleaf = form.has('flyleaf');
        this.format = form.get('sig_format');
        this.outputdir = form.get('output_folder');
        let siglength = parseInt(form.get('sig_length'), 10);
        if (!isNaN(siglength)) {
            this.sigsize = siglength;
        }
        this.customsig = this.format == 'custom';
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

        let customx = form.get('custom_width') || 0;
        let customy = form.get('custom_height') || 0;
        this.setbooksize(form.get('book_size'), customx, customy);

    }

    async openpdf(file) {
        this.inputpdf = file.name;
        this.input = await file.arrayBuffer(); //fs.readFileSync(filepath);
        this.currentdoc = await PDFDocument.load(this.input);
        //TODO: handle pw-protected PDFs
    }

    setbooksize(targetsize, customx, customy) {
        if (targetsize == 'full') {
            this.booksize = [this.papersize[1] * 0.5, this.papersize[0]]
        } else if (targetsize == 'custom') {
            this.booksize = [customx, customy];
        } else {
            this.booksize = targetbooksize[targetsize];
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
        let sheets = Math.floor(pagetotal / 4);

        //      pad out end of document if necessary
        if (pagetotal % 4 > 0) {
            sheets += 1;
            let padding = (sheets * 4) - pagetotal;
            for (let i = 0; i < padding; i++) {
                this.orderedpages.push('b');
            }
        }
    }

    createpages() {
        this.createpagelist();
        if (this.format == 'booklet') {
            this.book = new Booklet(this.orderedpages, this.duplex);
        } else if (this.format == 'perfect') {
            this.book = new PerfectBound(this.orderedpages, this.duplex);
        } else if (this.format == 'standard' || this.format == 'custom') {
            this.book = new Signatures(this.orderedpages, this.duplex, this.sigsize);

            if (this.customsig) {
                this.book.setsigconfig(this.signatureconfig);
            } else {
                this.book.createsigconfig();
            }

            this.rearrangedpages = this.book.pagelist;
        }
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
        } else if (this.format == 'standard' || this.format == 'custom') {
            const forLoop = async _ => {
                for (let i = 0; i < this.rearrangedpages.length; i++) {
                    let page = this.rearrangedpages[i];
                    await this.createsignatures(page, `signature${i}`);
                }

            }
            await forLoop();
           //return forLoop().then(_ => this.saveZip());
        }
        return this.saveZip();
    }


    async writepages(outname, pagelist, side2flag) {

        let side = 'front';
        let imposedpage = 'left';

        const outPDF = await PDFDocument.create();
        let currPage = null;
        const embeddedPages = await outPDF.embedPdf(this.currentdoc, pagelist);

        for (let i = 0; i < pagelist.length; i++) {
            let pagenumber = pagelist[i];
            let embeddedPage = embeddedPages[i];

            if (i % 2 == 0) {
                currPage = outPDF.addPage([this.papersize[0], this.papersize[1]]);
            }
            ////	scaling code here
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

    calculateposition(pagenumber, imposedpage, side) {
        //     calculate scaling, and the x and y translation values for the 2up output
        let page = this.currentdoc.getPage(pagenumber);
        let cropbox = page.getCropBox();

        let pagex = cropbox.width;
        let pagey = cropbox.height;

        let targetratio = this.booksize[1] / this.booksize[0];         //       targetpage ratio
        let inputratio = pagey / pagex;                               //       inputpage ratio
        let sx = 1;
        let sy = 1;
        let rotate = -90;

        //      Keep the page proportions (lockratio=1) or stretch to fit target page (lockratio=0)
        if (this.lockratio) {
            let scale = 1;
            if (targetratio > inputratio) {
                //       input page is fatter than target page - scale with width
                scale = this.booksize[0] / pagex;
            } else {
                //       input page is thinner than target page - scale with height
                scale = this.booksize[1] / pagey;
            }
            sx = scale;
            sy = scale;

        } else {
            sx = this.booksize[0] / pagex;
            sy = this.booksize[1] / pagey;
        }

        let sheetwidth = this.papersize[0];
        let sheetheight = this.papersize[1];

        let bookheight = pagey * sy;            //       height of imposed page
        let bookwidth = pagex * sx;             //       width of imposed page

        let centreline = sheetheight * 0.5;              //       centreline of page
        let xpad = (sheetwidth - bookheight) / 2.0;        //       gap above and below imposed page
        let ypad = centreline - bookwidth;              //       gap to side of imposed page
        let baseline = null;
        let leftstart = null;
        let xoffset = cropbox.x * sx;
        let yoffset = cropbox.y * sy;

        //      sheet guidelines: side 1 
        if (!this.duplexrotate || side == 'front') {
            //print side,pagenumber
            baseline = xpad;	//       x translation value for 2up

            if (imposedpage == 'left') {
                leftstart = (sheetheight - ypad) + this.spineoffset; // y translation for top page
            } else if (imposedpage == 'right') {
                leftstart = centreline - this.spineoffset;        // y translation for bottom page
            }

            baseline = baseline - yoffset;
            leftstart = leftstart + xoffset;
            //      sheet guidlines: side2
        } else if (side == 'back') {
            //print side,pagenumber
            rotate = 90;
            baseline = sheetwidth - xpad;                 	// x translation for 2up 

            if (imposedpage == 'left') {
                leftstart = ypad + this.spineoffset;	// y translation for top page
            } else if (imposedpage == 'right') {
                leftstart = centreline - this.spineoffset;	// y translation for bottom page
            }

            baseline = baseline + yoffset;
            leftstart = leftstart - xoffset;
        }

        return [baseline, leftstart, sx, sy, rotate];
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

    saveZip() {
        return this.zip.generateAsync({ type: "blob" })
            .then(blob => {
                saveAs(blob, this.filename + ".zip");
            });
    }

}

function mm2point(millimetres) {
    //       millimetres to points = 2.83464567
    //       points to millimetres = 0.352777778

    return millimetres * 2.83464567;
}