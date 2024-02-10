// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/**
 * Gets parameters from a URL.
 * @param { string } url The URL to get the params from
 * @returns { Record<string, unknown> } The URL parameters
 */
export const toUrlParams = (url) => {
  const params = new URL(url).searchParams.entries();
  return Object.fromEntries(params);
};

/**
 * Sets parameters on a URL.
 * @param { string } url The URL to set the params on
 * @param { Record<string, unknown> } params The params to set
 * @returns { string } A new URL string with the params set
 */
export const setUrlParams = (url, params) => {
  const urlRepresentation = new URL(url);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }

    urlRepresentation.searchParams.set(key, String(value));
  }

  return urlRepresentation.toString();
};

/**
 * Clears parameters from a URL.
 * @param { string } url The URL to clear the params from
 * @returns { string } A new URL object with no params
 */
export const clearUrlParams = (url) => {
  const urlRepresentation = new URL(url);
  urlRepresentation.search = '';
  return urlRepresentation.toString();
};

/**
 * Updates the window location.
 * @param { string } url The URL to update the location to
 */
export const updateWindowLocation = (url) => {
  window.history.pushState({}, '', url.toString());
};
