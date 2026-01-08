/**
 * When considering page size, don't forget to take into account
 *  this.padding_pt's ['top','bottom','binding','fore_edge'] values
 *
 * @return {import("../book.js").Position[]}
 */
export function calculateLayout(book) {
  const l = calculateDimensions(book);
  const {
    layoutCell,
    xForeEdgeShiftFunc,
    xBindingShiftFunc,
    yTopShiftFunc,
    yBottomShiftFunc,
    pdfScale,
  } = l;
  const [cellWidth, cellHeight] = layoutCell;
  const positions = [];

  l.layout.rotations.forEach((row, i) => {
    row.forEach((col, j) => {
      const xForeEdgeShift = xForeEdgeShiftFunc();
      const xBindingShift = xBindingShiftFunc();
      const yTopShift = yTopShiftFunc();
      const yBottomShift = yBottomShiftFunc();

      let isLeftPage = j % 2 == 0; //page on 'left' side of open book
      let x = j * cellWidth + (isLeftPage ? xForeEdgeShift : xBindingShift);
      let y = i * cellHeight + yBottomShift;
      let spineMarkTop = [j * cellWidth, (i + 1) * cellHeight - yTopShift];
      let spineMarkBottom = [(j + 1) * cellWidth, i * cellHeight + yBottomShift];

      if (col == -180) {
        // upside-down page
        isLeftPage = j % 2 == 1; //page on 'left' (right side on screen)
        y = (i + 1) * cellHeight - yBottomShift;
        x = (j + 1) * cellWidth - (isLeftPage ? xForeEdgeShift : xBindingShift);
        spineMarkTop = [(j + 1) * cellWidth, (i + 1) * cellHeight];
        spineMarkBottom = [(j + 1) * cellWidth, i * cellHeight];
      } else if (col == 90) {
        // 'top' of page is on left, right side of screen
        isLeftPage = i % 2 == 0; // page is on 'left' (top side of screen)
        x = (1 + j) * cellHeight - yBottomShift;
        y = i * cellWidth + (isLeftPage ? xForeEdgeShift : xBindingShift );
        spineMarkTop = [(1 + j) * cellHeight, i * cellWidth];
        spineMarkBottom = [j * cellHeight, i * cellWidth];
      } else if (col == -90) {
        // 'top' of page is on the right, left sight of screen
        isLeftPage = i % 2 == 1; // page is on 'left' (bottom side of screen)
        x = j * cellHeight + yBottomShift;
        y = (1 + i) * cellWidth - (isLeftPage ? xForeEdgeShift : xBindingShift);
        spineMarkTop = [(j + 1) * cellHeight - yTopShift, (isLeftPage ? i : i + 1) * cellWidth];
        spineMarkBottom = [j * cellHeight + yBottomShift, (isLeftPage ? i : i + 1) * cellWidth];
      }

      console.log(
        `>> (${i},${j})[${col}] : [${x},${y}] :: [xForeEdgeShift: ${xForeEdgeShift}][xBindingShift: ${xBindingShift}]`
      );
      positions.push({
        rotation: col,
        sx: pdfScale[0],
        sy: pdfScale[1],
        x: x,
        y: y,
        spineMarkTop: spineMarkTop,
        spineMarkBottom: spineMarkBottom,
        isLeftPage: isLeftPage,
      });
    });
  });
  console.log('And in the end of it all, (calculatelayout) we get: ', positions);
  return positions;
}

/**
 * Looks at [this.cropbox] and [this.padding_pt] and [this.papersize] and [this.page_layout] and [this.page_scaling]
 * in order to calculate the information needed to render a PDF page within a layout cell. It provides several functions
 * in the return object that calculate the positioning and scaling needed when provided the rotation information.
 *
 * When calculating 'x' and 'y' values, those are relative to a laid out PDF page, not necessarily paper sheet x & y
 *
 * @return the object: {
 *      layoutCell: 2 dimensional array of the largest possible space the PDF page could take within the layout (and not overflow)
 *      rawPdfSize: 2 dimensional array of dimensions for the PDF (pre scaled)
 *      pdfSize: 2 dimensional array of dimensions for the PDF page + margins (pre scaled)
 *      pdfScale: 2 dimensional array of scaling factors for the raw PDF so it fits in layoutCell (w/ margins)
 *      padding: object containing the already scaled padding. Keys are: fore_edge, binding, top, bottom
 *      xForeEdgeShiftFunc: requires the page rotation, in degrees. In pts, already scaled.
 *      xBindingShiftFunc: requires the page rotation, in degrees. In pts, already scaled.
 *      xPdfWidthFunc:  requires the page rotation, in degrees. In pts, already scaled.
 *      yPdfHeightFunc: requires the page rotation, in degrees. In pts, already scaled.
 *      yTopShiftFunc:  requires the page rotation, in degrees. In pts, already scaled.
 *      yBottomShiftFunc:  requires the page rotation, in degrees. In pts, already scaled.
 * }
 */
export function calculateDimensions(book) {
  const { cropbox, padding_pt, papersize, page_layout, page_positioning, page_scaling } = book;

  const { width, height } = cropbox;
  const pageX = width + Math.max(padding_pt.binding, 0) + Math.max(padding_pt.fore_edge, 0);
  const pageY = height + Math.max(padding_pt.top, 0) + Math.max(padding_pt.bottom, 0);

  // Calculate the size of each page box on the sheet
  let finalX = papersize[0] / page_layout.cols;
  let finalY = papersize[1] / page_layout.rows;

  // if pages are rotated a quarter-turn in this layout, we need to swap the width and height measurements
  if (page_layout.landscape) {
    const temp = finalX;
    finalX = finalY;
    finalY = temp;
  }

  let sx = 1;
  let sy = 1;

  // The page_scaling options are: 'lockratio', 'stretch', 'centered'
  if (page_scaling == 'lockratio') {
    const scale = Math.min(finalX / pageX, finalY / pageY);
    sx = scale;
    sy = scale;
  } else if (page_scaling == 'stretch') {
    sx = finalX / pageX;
    sy = finalY / pageY;
  } // else = centered retains 1 x 1

  const padding = {
    fore_edge: padding_pt.fore_edge * sx,
    binding: padding_pt.binding * sx,
    bottom: padding_pt.bottom * sy,
    top: padding_pt.top * sy,
  };

  // page_positioning has 2 options: centered, binding_aligned
  const positioning = page_positioning;

  const xForeEdgeShiftFunc = function () {
    // amount to inset by, relative to fore edge, on left side of book
    const xgap = finalX - pageX * sx;
    return padding.fore_edge + (positioning == 'centered' ? xgap / 2 : xgap);
  };
  const xBindingShiftFunc = function () {
    // amount to inset by, relative to binding, on right side of book
    const xgap = finalX - pageX * sx;
    return padding.binding + (positioning == 'centered' ? xgap / 2 : 0);
  };
  const yTopShiftFunc = function () {
    const ygap = finalY - pageY * sy;
    return padding.top + ygap / 2;
  };
  const yBottomShiftFunc = function () {
    const ygap = finalY - pageY * sy;
    return padding.bottom + ygap / 2;
  };
  const xPdfWidthFunc = function () {
    return pageX * sx - padding.fore_edge - padding.binding;
  };
  const yPdfHeightFunc = function () {
    return pageY * sy - padding.top - padding.bottom;
  };
  return {
    layout: page_layout,
    rawPdfSize: [width, height],
    pdfScale: [sx, sy],
    pdfSize: [pageX, pageY],
    layoutCell: [finalX, finalY],
    padding: padding,

    xForeEdgeShiftFunc: xForeEdgeShiftFunc,
    xBindingShiftFunc: xBindingShiftFunc,
    xPdfWidthFunc: xPdfWidthFunc,
    yPdfHeightFunc: yPdfHeightFunc,
    yTopShiftFunc: yTopShiftFunc,
    yBottomShiftFunc: yBottomShiftFunc,

    positioning: positioning,
  };
}
