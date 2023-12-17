import { schema } from "../models/configuration";
import { getLocalSettings, setLocalSettings } from "./localStorageUtils";
import { renderFormFromSettings, renderInfoBox, renderPageCount, renderWacky } from "./renderUtils";
import { setUrlParams, toUrlParams, updateWindowLocation } from "./uri";

const formToConfigurationMap = {
    source_rotation: "sourceRotation",
    paper_size: "paperSize",
    paper_size_unit: "paperSizeUnit",
    printer_type: "printerType",
    rotate_page: "rotatePage",
    paper_rotation_90: "paperRotation90",
    pagelayout: "pageLayout",
    cropmarks: "cropMarks",
    cutmarks: "cutMarks",
    page_scaling: "pageScaling",
    page_positioning: "pagePositioning",
    main_fore_edge_padding_pt: "mainForeEdgePaddingPt",
    binding_edge_padding_pt: "bindingEdgePaddingPt",
    top_edge_padding_pt: "topEdgePaddingPt",
    bottom_edge_padding_pt: "bottomEdgePaddingPt",
    sig_format: "sigFormat",
    sig_length: "sigLength",
    custom_sig: "customSigLength",
    fore_edge_padding_pt: "foreEdgePaddingPt",
    wacky_spacing: "wackySpacing",
    file_download: "fileDownload",
    print_file: "printFile",
    flyleaf: "flyleaf",
    paper_size_custom_width: "paperSizeCustomWidth",
    paper_size_custom_height: "paperSizeCustomHeight",
};

/**
 * Parses a Form into a common Configiration.
 * @param { FormData } form The form to parse into a configuration
 * @returns { import("../models/configuration").Configuration } The configuration
 */
const fromFormToConfiguration = (form) => {
    const formAsKeyValueTuples = Array.from(form.entries());
    const unparsedConfig = formAsKeyValueTuples.reduce(
        (acc, [key, value]) => ({
            ...acc,
            [formToConfigurationMap[key]]: value,
        }),
        {}
    );
    return schema.parse(unparsedConfig);
};

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
const loadConfiguration = () => {
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
    console.log("Form updated....");
    book.createpages().then(() => {
        console.log("... pages created");
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
