// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { PAGE_SIZES } from '../constants';

export function renderPageCount(book) {
  const pageCount = document.getElementById('page_count');
  pageCount.innerText = book.pagecount;
}

export function renderInfoBox(book) {
  const totalSheets = document.getElementById('total_sheets');
  const sigCount = document.getElementById('sig_count');
  const sigArrange = document.getElementById('sig_arrange');
  const totalPages = document.getElementById('total_pages');

  if (book.book == null || book.book == undefined) return;

  const outputPages = book.book.pagelistdetails.reduce((acc, list) => {
    list.forEach((sublist) => (acc += sublist.length ? sublist.length : 1));
    return acc;
  }, 0);

  totalSheets.innerText = book.book.sheets;
  sigCount.innerText = book.book.sigconfig.length;
  sigArrange.innerText = book.book.sigconfig.join(', ');
  totalPages.innerText = outputPages;
}

/**
 * Expects a data object describing the overall page layout info:
 *
 */
export function updatePageLayoutInfo(info) {
  document.getElementById('show_layout_info').style.display = 'block';
  console.log('So much info from updatePageLayoutInfo: ', info);
  const needsRotation =
    info.dimensions.layout.rotations[0] == -90 ||
    info.dimensions.layout.rotations[0] == 90 ||
    info.dimensions.layout.rotations[0][0] == -90 ||
    info.dimensions.layout.rotations[0][0] == 90;
  //   Paper size: ${info.papersize[0]}, ${info.papersize[1]}<BR>
  const paperDims = info.dimensions.layoutCell;
  const pdfDims = [info.dimensions.xPdfWidthFunc(), info.dimensions.yPdfHeightFunc()];

  const scale = Math.min(
    Math.min(250 / paperDims[0], 250 / paperDims[1]),
    Math.min(250 / pdfDims[0], 250 / pdfDims[1])
  );

  let dims = [paperDims[0] * scale, paperDims[1] * scale];
  let displayDiv = document.getElementById('grid_layout_preview'); // blue box
  displayDiv.style.width = `${dims[0]}px`;
  displayDiv.style.height = `${dims[1]}px`;

  dims = [pdfDims[0] * scale, pdfDims[1] * scale];
  displayDiv = document.getElementById('pdf_on_page_layout_preview'); // orange box
  displayDiv.style.width = `${dims[0]}px`;
  displayDiv.style.height = `${dims[1]}px`;

  dims = [info.dimensions.xBindingShiftFunc() * scale, info.dimensions.yTopShiftFunc() * scale];
  displayDiv.style.margin = `${dims[1]}px ${dims[0]}px`;

  document.getElementById('page_grid_layout').innerText =
    `${info.dimensions.layout.rows} rows x ${info.dimensions.layout.cols} cols`;
  document.getElementById('page_grid_dimensions').innerText = `${paperDims[0]}, ${paperDims[1]}`;
  document.getElementById('pdf_source_dimensions').innerText =
    `${info.cropbox.width}, ${info.cropbox.height}`;
  document.getElementById('pdf_page_dimensions').innerText =
    `${pdfDims[0].toFixed(2)}, ${pdfDims[1].toFixed(2)}`;
  document.getElementById('pdf_offset_dimensions').innerHTML = `
  ${info.dimensions.xBindingShiftFunc().toFixed(2)} from spine <BR>
  ${info.dimensions.yTopShiftFunc().toFixed(2)} from top <BR>
  ${info.dimensions.xForeEdgeShiftFunc().toFixed(2)} from fore edge <BR>
  ${info.dimensions.yBottomShiftFunc().toFixed(2)} from bottom
  `;
  document.getElementById('pdf_scale_dimensions').innerText =
    `${info.dimensions.pdfScale[0].toFixed(2)}, ${info.dimensions.pdfScale[1].toFixed(2)}`;
  document.getElementById('pdf_page_rotation_info').innerText = `${needsRotation}`;
}
/**
 * Expects a data object describing the overall page layout info:
 *
 */
export function updatePaperSelectOptionsUnits() {
  const paperList = document.getElementById('paper_size');
  const paperListUnit = document.getElementById('paper_size_unit').value;
  for (const option of Array.from(paperList.children)) {
    const paperName = option.value;
    const paper = PAGE_SIZES[paperName];
    let label = `${paperName} (${paper[0]} x ${paper[1]} pt)`;
    // conversion values from Google default converter
    if (paperListUnit == 'in') {
      label = `${paperName} (${(paper[0] * 0.0138889).toFixed(1)} x ${(paper[1] * 0.0138889).toFixed(1)} inches)`;
    } else if (paperListUnit == 'cm') {
      label = `${paperName} (${(paper[0] * 0.0352778).toFixed(2)} x ${(paper[1] * 0.0352778).toFixed(2)} cm)`;
    }
    option.setAttribute('label', label);
  }
}
export function updateAddOrRemoveCustomPaperOption() {
  const width = document.getElementById('paper_size_custom_width').value;
  const height = document.getElementById('paper_size_custom_height').value;
  const paperList = document.getElementById('paper_size');
  const validDimensions = width.length > 0 && height.length > 0 && !isNaN(width) && !isNaN(height);
  const customOpt = paperList.children.namedItem('CUSTOM');
  if (customOpt == null && !validDimensions) {
    // No custom option, no valid custom settings
  } else if (customOpt != null && !validDimensions) {
    // Need to remove custom option because no valid custom settings
    customOpt.remove();
  } else if (customOpt == null) {
    // no option but valid settings!
    const opt = document.createElement('option');
    opt.setAttribute('value', 'CUSTOM');
    opt.setAttribute('name', 'CUSTOM');
    PAGE_SIZES.CUSTOM = [Number(width), Number(height)];
    paperList.appendChild(opt);
  } else {
    // valid option, valid dimensions -- lets just make sure they're up to date
    PAGE_SIZES.CUSTOM = [Number(width), Number(height)];
  }
}
export function renderPaperSelectOptions() {
  const paperList = document.getElementById('paper_size');
  //   const maxLength = Math.max(
  //     Object.keys(PAGE_SIZES).map((s) => {
  //       s.length;
  //     })
  //   );
  Object.keys(PAGE_SIZES).forEach((key) => {
    const opt = document.createElement('option');
    opt.setAttribute('value', key);
    opt.setAttribute('name', key);
    if (key == 'A4') {
      opt.setAttribute('selected', true);
    }
    opt.innerText = key;
    paperList.appendChild(opt);
  });
  updatePaperSelectOptionsUnits();
}

export function renderWacky() {
  const isWacky =
    document.getElementById('a9_3_3_4').checked ||
    document.getElementById('a10_6_10s').checked ||
    document.getElementById('a_3_6s').checked ||
    document.getElementById('a_4_8s').checked ||
    document.getElementById('A7_2_16s').checked ||
    document.getElementById('1_3rd').checked;
  console.log('Is a wacky layout? ', isWacky);
  document
    .getElementById('book_size')
    .querySelectorAll('input')
    .forEach((x) => {
      x.disabled = isWacky;
    });
  document.getElementById('book_size').style.opacity = isWacky ? 0.3 : 1.0;
}

/** @param { import("../models/configuration").Configuration } configuration */
export function renderFormFromSettings(configuration) {
  // Clear all checked attributes
  document.querySelectorAll('[type=radio]').forEach((e) => {
    e.checked = false;
  });
  document.querySelectorAll('[type=checkbox]').forEach((e) => {
    e.checked = false;
  });

  // Set checkboxes
  if (configuration.paperRotation90) {
    document.querySelector("input[name='paper_rotation_90']").checked = true;
  }

  if (configuration.rotatePage) {
    document.querySelector("input[name='rotate_page']").checked = true;
  }

  if (configuration.cropMarks) {
    document.querySelector("input[name='cropmarks']").checked = true;
  }

  if (configuration.pdfEdgeMarks) {
    document.querySelector("input[name='pdf_edge_marks']").checked = true;
  }

  if (configuration.cutMarks) {
    document.querySelector("input[name='cutmarks']").checked = true;
  }

  // Set radio options
  document.querySelector(`input[name="sig_format"][value="${configuration.sigFormat}"]`).checked =
    true;
  document.querySelector(
    `input[name="wacky_spacing"][value="${configuration.wackySpacing}"]`
  ).checked = true;

  // Set french link stitches settings
  document.querySelector('input[name="add_french_link_stich_checkbox"]').checked =
    configuration.frenchStitchLinkEnabled;
    document.querySelector('input[name="french_link_stitch_margin_pt"]').value =
    configuration.frenchStitchLinkMarginPt;
    document.querySelector('input[name="french_link_stitch_amount_pt"]').value =
    configuration.frenchStitchesAmount;
    document.querySelector('input[name="french_link_stitch_space_pt"]').value =
    configuration.frenchStitchesSpacingPt;

  // Set freeform inputs
  document.querySelector('input[name="main_fore_edge_padding_pt"]').value =
    configuration.mainForeEdgePaddingPt;
  document.querySelector('input[name="binding_edge_padding_pt"]').value =
    configuration.bindingEdgePaddingPt;
  document.querySelector('input[name="top_edge_padding_pt"]').value =
    configuration.topEdgePaddingPt;
  document.querySelector('input[name="bottom_edge_padding_pt"]').value =
    configuration.bottomEdgePaddingPt;
  document.querySelector('input[name="fore_edge_padding_pt"]').value =
    configuration.foreEdgePaddingPt;
  document.querySelector('input[name="flyleafs"]').value = configuration.flyleafs;

  // Set select options
  document.querySelector('select[name="source_rotation"]').value = configuration.sourceRotation;
  document.querySelector('select[name="pagelayout"]').value = configuration.pageLayout;
  document.querySelector('select[name="page_scaling"]').value = configuration.pageScaling;
  document.querySelector('select[name="page_positioning"]').value = configuration.pagePositioning;
  document.querySelector('select[name="print_file"]').value = configuration.printFile;
  document.querySelector('select[name="paper_size"]').value = configuration.paperSize;
  document.querySelector('select[name="paper_size_unit"]').value = configuration.paperSizeUnit;
  document.querySelector('select[name="printer_type"]').value = configuration.printerType;

  // Set options which are not always present
  if (
    configuration.paperSize === 'CUSTOM' &&
    configuration.paperSizeCustomHeight !== undefined &&
    configuration.paperSizeCustomWidth !== undefined
  ) {
    document.querySelector('input[name="paper_size_custom_height"]').value =
      configuration.paperSizeCustomHeight;
    document.querySelector('input[name="paper_size_custom_width"]').value =
      configuration.paperSizeCustomWidth;
    updateAddOrRemoveCustomPaperOption();
    updatePaperSelectOptionsUnits();
    document.querySelector('select[name="paper_size"]').value = 'CUSTOM';
  }

  if (configuration.sigFormat == 'customsig') {
    document.querySelector("input[name='custom_sig']").value = configuration.customSigLength;
  } else {
    document.querySelector("input[name='sig_length']").value = configuration.sigLength;
  }

  // Hide and show elements based on configuration
  const sourceRotationExamples = Array.from(
    document.getElementsByClassName('source_rotation_example')
  );
  const selectedValue = `${configuration.sourceRotation}_example`;
  sourceRotationExamples.forEach((example) => {
    example.style.display = example.id === selectedValue ? 'block' : 'none';
  });
}

export function clearPreview() {
  const previewFrame = document.getElementById('pdf');
  previewFrame.style.display = 'none';
  previewFrame.src = '';
}
