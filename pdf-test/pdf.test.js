import { expect, describe, it } from 'vitest';
import { testCases } from './pdfTestCases';
import { runTestCase } from './helpers';

describe('PDF visual diff test', () => {
  Object.keys(testCases).forEach((key) => {
    it(`has unchanged visual output for ${key}`, async () => {
      expect.assertions(1);
      const result = await runTestCase(key);
      console.log(result);
      expect(result).toBeTruthy();
    });
  });
}, 10000);
