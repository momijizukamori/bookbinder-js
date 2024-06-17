// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { schema } from '../models/configuration';
import { clearLocalSettings, getLocalSettings, setLocalSettings } from './localStorageUtils';
import {
  renderFormFromSettings,
  renderInfoBox,
  renderPageCount,
  renderWacky,
  updatePageLayoutInfo,
} from './renderUtils';
import { clearUrlParams, setUrlParams, toUrlParams, updateWindowLocation } from './uri';

/**
 * Parses a Form into a common Configiration.
 * @param { FormData } form The form to parse into a configuration
 * @returns { import("../models/configuration").Configuration } The configuration
 */
const fromFormToConfiguration = (form) =>
  schema.parse({
    sourceRotation: form.get('source_rotation'),
    paperSize: form.get('paper_size'),
    paperSizeUnit: form.get('paper_size_unit'),
    printerType: form.get('printer_type'),
    rotatePage: form.has('rotate_page'),
    paperRotation90: form.has('paper_rotation_90'),
    pageLayout: form.get('pagelayout'),
    cropMarks: form.has('cropmarks'),
    sigOrderMarks: form.has('sig_order_marks'),
    pdfEdgeMarks: form.has('pdf_edge_marks'),
    cutMarks: form.has('cutmarks'),
    pageScaling: form.get('page_scaling'),
    pagePositioning: form.get('page_positioning'),
    mainForeEdgePaddingPt: form.get('main_fore_edge_padding_pt'),
    bindingEdgePaddingPt: form.get('binding_edge_padding_pt'),
    topEdgePaddingPt: form.get('top_edge_padding_pt'),
    bottomEdgePaddingPt: form.get('bottom_edge_padding_pt'),
    sigFormat: form.get('sig_format'),
    sigLength: form.get('sig_length'),
    customSigLength: form.get('custom_sig'),
    foreEdgePaddingPt: form.get('fore_edge_padding_pt'),
    wackySpacing: form.get('wacky_spacing'),
    fileDownload: form.get('file_download'),
    printFile: form.get('print_file'),
    flyleafs: form.get('flyleafs'),
    paperSizeCustomWidth: form.get('paper_size_custom_width'),
    paperSizeCustomHeight: form.get('paper_size_custom_height'),

    sewingMarksEnabled: form.has('add_sewing_marks_checkbox'),
    sewingMarkLocation: form.get('sewing_mark_locations'),
    sewingMarksMarginPt: form.get('sewing_marks_margin_pt'),
    sewingMarksAmount: form.get('sewing_marks_amount'),
    sewingMarksTapeWidthPt: form.get('sewing_marks_tape_width_pt'),
  });

/**
 * Sets the configuration to the URL.
 * @param { import("../models/configuration").Configuration } configuration The configuration to set
 */
const setConfigurationToUrl = (configuration) => {
  updateWindowLocation(setUrlParams(window.location.href, configuration));
};

/**
 * Loads settings from the URL or local storage.
 * @returns { import("../models/configuration").Configuration } The configuration
 */
export const loadConfiguration = () => {
  const urlParams = toUrlParams(window.location.href);
  const hasUrlParams = Object.keys(urlParams).length > 0;

  const localSettings = hasUrlParams ? urlParams : getLocalSettings();

  const configuration = schema.parse(localSettings);
  setConfigurationToUrl(configuration);
  return configuration;
};

/**
 * Updates the rendered form from a book.
 * @param { import("../book").Book } book The book to update the form from
 */
export function updateRenderedForm(book) {
  book.createpages().then((info) => {
    updatePageLayoutInfo(info);
    console.log('... pages created');
    renderPageCount(book);
    renderInfoBox(book);
    renderWacky();
  });
}

/**
 * Saves a form and updates the service's configuration.
 * @param { FormData } form The form to save
 * @returns { import("../models/configuration").Configuration } The updated configuration set
 */
export function saveForm(form) {
  const configuration = fromFormToConfiguration(form);
  setLocalSettings(configuration);
  setConfigurationToUrl(configuration);
  return configuration;
}

/**
 * Loads the initial form.
 * @returns { import("../models/configuration").Configuration } The configuration last saved, or a default configuration set
 */
export function loadForm() {
  const configuration = loadConfiguration();
  renderFormFromSettings(configuration);
  return configuration;
}

/**
 * Resets the form to the default configuration.
 */
export const resetForm = () => {
  clearLocalSettings();
  updateWindowLocation(clearUrlParams(window.location.href));
  return loadForm();
};
