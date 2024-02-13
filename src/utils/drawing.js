import { LINE_LEN } from '../constants';
import { rgb } from 'pdf-lib';

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
 *  @param {boolean} side2flag - whether we're on the back or not.
 * @param {boolean} duplexrotate - if alternate sides are rotated or not
 * @param {number[]} papersize - paper dimensions
 * @param {number} per_sheet - pages per sheet of paper
 * @returns {Line[]}
 */
export function drawFoldlines(side2flag, duplexrotate, papersize, per_sheet) {
  const lineSettings = {
    opacity: 0.4,
    dashArray: [1, 5],
  };
  let x, xStart, xEnd;
  let y, yStart, yEnd;
  const [width, height] = papersize;
  const lines = [];

  switch (per_sheet) {
    case 32:
      if (side2flag) {
        lineSettings.dashArray = [1, 5];

        x = duplexrotate ? width * 0.75 : width * 0.25;
        yStart = height * 0.5;
        yEnd = duplexrotate ? height * 0.75 : height * 0.25;

        lines.push({ ...drawVLine(x, yStart, yEnd), ...lineSettings });
      }
    /* falls through */
    case 16:
      if (side2flag) {
        lineSettings.dashArray = [3, 5];

        y = duplexrotate ? height * 0.75 : height * 0.25;
        xStart = width * 0.5;
        xEnd = duplexrotate ? 0 : height;

        lines.push({ ...drawHLine(y, xStart, xEnd), ...lineSettings });
      }
    /* falls through */
    case 8:
      if (side2flag) {
        lineSettings.dashArray = [5, 5];

        x = width * 0.5;
        yStart = height * 0.5;
        yEnd = duplexrotate ? 0 : height;

        lines.push({ ...drawVLine(x, yStart, yEnd), ...lineSettings });
      }
    /* falls through */
    case 4:
      if (!side2flag) {
        lineSettings.dashArray = [10, 5];
        lines.push({ ...drawHLine(height * 0.5, 0, width), ...lineSettings });
      }
      break;
  }
  return lines;
}

/**
 * @param {number[]} papersize - paper dimensions
 * @param {number} per_sheet - number of pages per sheet of paper
 * @returns {Line[]}
 */
export function drawCropmarks(papersize, per_sheet) {
  let lines = [];
  const [width, height] = papersize;
  switch (per_sheet) {
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
 * @param {PageInfo} sigDetails - page info object
 * @param {Position} position - position info object
 * @returns {Line[]}
 */
export function drawSpineMarks(sigDetails, position) {
  const w = 5;
  let startX, startY, endX, endY;
  if (sigDetails.isSigStart) {
    [startX, startY] = position.spineMarkTop;
    [endX, endY] = position.spineMarkTop;
  } else {
    [startX, startY] = position.spineMarkBottom;
    [endX, endY] = position.spineMarkBottom;
  }

  if (position.rotation == 0) {
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
 * @param {number} x
 * @param {number} ystart
 * @param {number} yend
 * @returns {Line}
 */
function drawVLine(x, ystart, yend) {
  return { start: { x: x, y: ystart }, end: { x: x, y: yend } };
}

/**
 * @param {number} y
 * @param {number} xstart
 * @param {number} xend
 * @returns {Line}
 */
function drawHLine(y, xstart, xend) {
  return { start: { x: xstart, y: y }, end: { x: xend, y: y } };
}

/**
 * @param {number} x
 * @param {number} ystart
 * @param {number} yend
 * @returns {Line[]}
 */
function drawVCrop(x, ystart, yend) {
  return [
    { start: { x: x, y: ystart }, end: { x: x, y: ystart + LINE_LEN }, opacity: 0.4 },
    { start: { x: x, y: yend - LINE_LEN }, end: { x: x, y: yend }, opacity: 0.4 },
  ];
}

/**
 * @param {number} y
 * @param {number} xstart
 * @param {number} xend
 * @returns {Line[]}
 */
function drawHCrop(y, xstart, xend) {
  return [
    { start: { x: xstart, y: y }, end: { x: xstart + LINE_LEN, y: y }, opacity: 0.4 },
    { start: { x: xend - LINE_LEN, y: y }, end: { x: xend, y: y }, opacity: 0.4 },
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
