// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/**
 * Parses a human-entered page range and returns zero-based page indices in source order.
 * Supports inputs like `1-8`, `1,3,5-7`, and `8-1`.
 *
 * Invalid segments are ignored. If no valid pages remain, the full document is selected.
 *
 * @param {string | null | undefined} pageRange
 * @param {number} pageCount
 * @returns {number[]}
 */
export function parsePageRange(pageRange, pageCount) {
  const allPages = Array.from({ length: pageCount }, (_, i) => i);
  const normalizedRange = pageRange?.trim() ?? '';

  if (normalizedRange === '') {
    return allPages;
  }

  const selectedPages = new Set();

  normalizedRange.split(',').forEach((segment) => {
    const token = segment.trim();
    if (!token) {
      return;
    }

    const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) {
      console.warn(`Ignoring invalid page range token: "${token}"`);
      return;
    }

    let start = Number(match[1]);
    let end = match[2] ? Number(match[2]) : start;

    if (start > end) {
      [start, end] = [end, start];
    }

    start = Math.max(1, start);
    end = Math.min(pageCount, end);

    for (let pageNumber = start; pageNumber <= end; pageNumber++) {
      selectedPages.add(pageNumber - 1);
    }
  });

  if (selectedPages.size === 0) {
    console.warn(`No valid pages matched "${normalizedRange}", falling back to the full document.`);
    return allPages;
  }

  return Array.from(selectedPages).sort((a, b) => a - b);
}
