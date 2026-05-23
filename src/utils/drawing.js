import { LINE_LEN } from '../constants';
import { grayscale, rgb } from '@cantoo/pdf-lib';

/**
 * @typedef DrawPoint
 * @type {object}
 * @property {number} x - horizontal position
 * @property {number} y - vertical position
 * @property {number} size,
 * @property {import("@cantoo/pdf-lib").Grayscale|import("@cantoo/pdf-lib").RGB} color,
 */

/**
 * @typedef Point
 * @type {object}
 * @property {number} x - horizontal position
 * @property {number} y - vertical position
 */

/**
 * @typedef Line
 * @type {object}
 * @property {Point} start - start position
 * @property {Point} end - end position
 * @property {number} [opacity] - line opacity
 * @property {number[]} [dashArray] - sequence of dash and gap lengths to be repeated for a dashed line
 */

/**
 * @typedef Rect
 * @type {object}
 * @property {Point} start - start position
 * @property {Point} end - end position
 * @property {number} [opacity] - line opacity
 * @property {number[]} [dashArray] - sequence of dash and gap lengths to be repeated for a dashed line
 */

/**
 * @param {boolean} back - whether we're on the back or not.
 * @param {boolean} duplexrotate - if alternate sides are rotated or not
 * @param {number[]} papersize - paper dimensions
 * @param {number} perSheet - pages per sheet of paper
 * @returns {Line[]}
 */
export function drawFoldlines(back, duplexrotate, papersize, perSheet) {
  const lineSettings = {
    opacity: 0.4,
    dashArray: [1, 5],
  };
  let x, xStart, xEnd;
  let y, yStart, yEnd;
  const [width, height] = papersize;
  const lines = [];

  switch (perSheet) {
    case 32:
      if (back) {
        lineSettings.dashArray = [1, 5];

        x = duplexrotate ? width * 0.75 : width * 0.25;
        yStart = height * 0.5;
        yEnd = duplexrotate ? height * 0.75 : height * 0.25;

        lines.push({ ...drawVLine(x, yStart, yEnd), ...lineSettings });
      }
    /* falls through */
    case 16:
      if (back) {
        lineSettings.dashArray = [3, 5];

        y = duplexrotate ? height * 0.75 : height * 0.25;
        xStart = width * 0.5;
        xEnd = duplexrotate ? 0 : height;

        lines.push({ ...drawHLine(y, xStart, xEnd), ...lineSettings });
      }
    /* falls through */
    case 8:
      if (back) {
        lineSettings.dashArray = [5, 5];

        x = width * 0.5;
        yStart = height * 0.5;
        yEnd = duplexrotate ? 0 : height;

        lines.push({ ...drawVLine(x, yStart, yEnd), ...lineSettings });
      }
    /* falls through */
    case 4:
      if (!back) {
        lineSettings.dashArray = [10, 5];
        lines.push({ ...drawHLine(height * 0.5, 0, width), ...lineSettings });
      }
      break;
  }
  return lines;
}

/**
 * @param {number[]} papersize - paper dimensions
 * @param {number} perSheet - number of pages per sheet of paper
 * @returns {Line[]}
 */
export function drawCropmarks(papersize, perSheet) {
  let lines = [];
  const [width, height] = papersize;
  switch (perSheet) {
    case 32:
      lines = [
        ...lines,
        ...drawHCrop(height * 0.75, 0, width),
        ...drawHCrop(height * 0.25, 0, width),
        ...drawCross(width * 0.5, height * 0.75),
        ...drawCross(width * 0.5, height * 0.25),
      ];
    /* falls through */
    case 16:
      lines = [
        ...lines,
        ...drawVCrop(width * 0.5, 0, height),
        ...drawCross(width * 0.5, height * 0.5),
      ];
    /* falls through */
    case 8:
      lines = [...lines, ...drawHCrop(height * 0.5, 0, width)];
    /* falls through */
    case 4:
  }

  return lines;
}

/**
 * @param {import("../book.js").PageInfo} sigDetails - information about signature where marks will be printed
 * @param {import("../book.js").Position} position - position info object
 * @param sewingMarkLocation - see ./models/configuration.js for possible values
 * @param {number} amount - amount of sewing crosses.
 * @param {number} marginPt - distance from the end of sheet of paper to kettle mark
 * @param {number} tapeWidthPt - distance between two points in a single sewwing cross.
 * @returns {Point[]}
 */
export function drawSewingMarks(
  sigDetails,
  position,
  sewingMarkLocation,
  amount,
  marginPt,
  tapeWidthPt
) {
  // Here normalize coordinates to always think in x an y like this
  // | P        |H|    P |
  // |  A       |E|   A  |
  // |   G      |I|  G   |
  // |    E     |G| E    |
  // |          |T|      |
  // |-POSITION-| |      |

  // Left pages have spine position on the edge :/
  console.log('try to draw');
  if (position.isLeftPage) return [];
  console.log('  on right');

  if (sewingMarkLocation == 'only_out' && !sigDetails.isSigStart) return [];
  console.log('  a');
  if (sewingMarkLocation == 'only_in' && !sigDetails.isSigMiddle) return [];
  console.log('  b');
  if (sewingMarkLocation == 'in_n_out' && !(sigDetails.isSigStart || sigDetails.isSigMiddle))
    return [];
  console.log('  c');

  var arePageRotated = Math.abs(position.rotation) === 90;
  let totalSpineHeight = 0;
  let spinePosition = 0;

  if (arePageRotated) {
    totalSpineHeight = Math.abs(position.spineMarkTop[0] - position.spineMarkBottom[0]);
    spinePosition = position.spineMarkTop[1];
  } else {
    totalSpineHeight = Math.abs(position.spineMarkTop[1] - position.spineMarkBottom[1]);
    spinePosition = position.spineMarkTop[0];
  }

  const workingWidth = totalSpineHeight - 2 * marginPt;
  const spaceBetweenPoints = workingWidth / (amount + 1);

  const sewingPoints = [];
  for (let index = 1; index <= amount; index++) {
    const halfOfTape = tapeWidthPt / 2;
    sewingPoints.push(
      { pointHeight: marginPt + spaceBetweenPoints * index + halfOfTape },
      { pointHeight: marginPt + spaceBetweenPoints * index - halfOfTape }
    );
  }

  const allPoints = [
    { pointHeight: marginPt },
    { pointHeight: totalSpineHeight - marginPt },
    ...sewingPoints,
  ];

  const commonCircleValues = { size: 1, color: grayscale(0.0) };
  const drawablePoints = allPoints.map((basePoint) => {
    /** @type {DrawPoint} */
    const point = {x: null, y: null, ...commonCircleValues};
    if (arePageRotated) {
      point.y = spinePosition;
      point.x = basePoint.pointHeight + position.spineMarkBottom[0];
    } else {
      point.y = basePoint.pointHeight + position.spineMarkBottom[1];
      point.x = spinePosition;
    }
    return point;
  });

  return drawablePoints;
}

/**
 * @param {boolean} drawTopMark - true to draw mark at top of PDF, false for bottom of PDF
 * @param {import("../book.js").Position} position - position info object
 * @param {number} w - width of the line in pts
 * @returns {Line}
 */
export function drawSpineMark(drawTopMark, position, w) {
  let startX, startY, endX, endY;
  if (drawTopMark) {
    [startX, startY] = position.spineMarkTop;
    [endX, endY] = position.spineMarkTop;
  } else {
    [startX, startY] = position.spineMarkBottom;
    [endX, endY] = position.spineMarkBottom;
  }

  if (position.rotation == 0 || position.rotation == 180) {
    startX -= w / 2;
    endX += w / 2;
  } else {
    startY -= w / 2;
    endY += w / 2;
  }

  const drawLineArgs = {
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    thickness: position.rotation == 0 ? 0.5 : 0.25,
    color: rgb(0, 0, 0),
    opacity: 1,
  };

  console.log(' --> draw this: ', drawLineArgs);
  return drawLineArgs;
}

/**
 * TODO : these params should probably be pushed into a config... maybe next time/next pass
 *
 * @param {import("../book.js").PageInfo} sigDetails - page info object
 * @param {import("../book.js").Position} position - position info object
 * @param {number} maxSigCount - number of total signatures
 * @param {number} w - width of the mark in pts
 * @param {number} suggestedH - suggested height of the mark in pts (can be scaled down to fit all marks between PDF top/bottom)
 * @returns {import("@cantoo/pdf-lib").PDFPageDrawRectangleOptions}
 */
export function drawSigOrderMark(sigDetails, position, maxSigCount, w, suggestedH) {
  const top = drawSpineMark(true, position, w);
  const bottom = drawSpineMark(false, position, w);

  let x = top.start.x;
  let y = top.start.y;

  const dist = position.rotation == 0 ? top.start.y - bottom.start.y : top.start.x - bottom.start.x;
  let h = Math.min(suggestedH, dist / maxSigCount);
  const offset = h * sigDetails.signatureNum;
  // console.log("Looking at signature ",sigDetails.signatureNum," of ",maxSigCount," PDF top/bottom distance ",dist," results in ",h," (",suggested_h," vs ",(dist/maxSigCount),") order mark height w/ offset ",offset," (width ",w,")");

  if (position.rotation == 0) {
    h = h * -1;
    y -= offset;
  } else {
    const temp = h;
    h = w;
    w = temp * -1;
    x -= offset;
  }

  return {
    x: x,
    y: y,
    width: w,
    height: h,
    borderWidth: 0,
    color: rgb(0, 0, 0),
    opacity: 0.5,
  };
}
/**
 * @param {number} x
 * @param {number} yStart
 * @param {number} yEnd
 * @returns {Line}
 */
function drawVLine(x, yStart, yEnd) {
  return { start: { x: x, y: yStart }, end: { x: x, y: yEnd } };
}

/**
 * @param {number} y
 * @param {number} xStart
 * @param {number} xEnd
 * @returns {Line}
 */
function drawHLine(y, xStart, xEnd) {
  return { start: { x: xStart, y: y }, end: { x: xEnd, y: y } };
}

/**
 * @param {number} x
 * @param {number} yStart
 * @param {number} yEnd
 * @returns {Line[]}
 */
function drawVCrop(x, yStart, yEnd) {
  return [
    { start: { x: x, y: yStart }, end: { x: x, y: yStart + LINE_LEN }, opacity: 0.4 },
    { start: { x: x, y: yEnd - LINE_LEN }, end: { x: x, y: yEnd }, opacity: 0.4 },
  ];
}

/**
 * @param {number} y
 * @param {number} xStart
 * @param {number} xEnd
 * @returns {Line[]}
 */
function drawHCrop(y, xStart, xEnd) {
  return [
    { start: { x: xStart, y: y }, end: { x: xStart + LINE_LEN, y: y }, opacity: 0.4 },
    { start: { x: xEnd - LINE_LEN, y: y }, end: { x: xEnd, y: y }, opacity: 0.4 },
  ];
}

/**
 * @param {number} y
 * @param {number} x
 * @returns {Line[]}
 */
function drawCross(x, y) {
  return [
    { start: { x: x - LINE_LEN, y: y }, end: { x: x + LINE_LEN, y: y }, opacity: 0.4 },
    { start: { x: x, y: y - LINE_LEN }, end: { x: x, y: y + LINE_LEN }, opacity: 0.4 },
  ];
}
