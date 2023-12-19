// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 

import { ZodType, z } from "zod";
import { PAGE_SIZES } from "../constants";

const commaSeparatedNumberList = z
    .union([z.string(), z.array(z.number())])
    .transform((val) => {
        if (Array.isArray(val)) {
            return val;
        }

        return val.split(/, */);
    })
    .pipe(z.array(z.coerce.number()));

const coercedBoolean = z
    .union([
        z
            .string()
            .toLowerCase()
            .pipe(z.enum(["true", "false", "on"])),
        z.boolean(),
    ])
    .transform((val) => val === "true" || val === "on" || val === true);

/**
 * @type {<Output=unknown, Def extends (import("zod").ZodTypeDef)=(import("zod").ZodTypeDef), Input=Output>(schema: ZodType<Output, Def, Input>) => ZodType<Output | undefined, Def, Input | undefined>}
 */
const urlSafe = (schema) => schema.optional().catch(() => undefined);

const sourceRotation = urlSafe(z.enum(["none", "90cw", "90ccw", "out_binding", "in_binding"])).default("none");

/** @type { keyof typeof import("../constants").PAGE_SIZES } */
const availablePaperSizes = Object.keys(PAGE_SIZES);

const paperSize = urlSafe(z.enum(availablePaperSizes)).default("LETTER");

const paperSizeUnit = urlSafe(z.enum(["pt", "in", "cm"])).default("pt");

const printerType = urlSafe(z.enum(["single", "duplex"])).default("single");

const pageLayout = urlSafe(z.enum(["folio", "quarto", "octavo", "sextodecimo"])).default("folio");

const pageScaling = urlSafe(z.enum(["centered", "lockratio", "stretch"])).default("lockratio");

const pagePositioning = urlSafe(z.enum(["centered", "binding_aligned"])).default("centered");

const sigFormat = urlSafe(z.enum(["perfect", "standardsig", "customsig", "1_3rd", "A7_2_16s", "8_zine", "a_3_6s", "a9_3_3_4", "a_4_8s", "a10_6_10s"])).default("standardsig");

const wackySpacing = urlSafe(z.enum(["wacky_pack", "wacky_gap"])).default("wacky_pack");

const fileDownload = urlSafe(z.enum(["aggregated", "both", "signatures"]).default("both"));

const printFile = urlSafe(z.enum(["aggregated", "signatures", "both"])).default("both");

export const schema = z.object({
    fileDownload,
    printFile,
    sourceRotation,
    rotatePage: urlSafe(coercedBoolean).default(false),
    paperSize,
    paperSizeUnit,
    printerType,
    paperRotation90: urlSafe(coercedBoolean).default(false),
    pageLayout,
    cropMarks: urlSafe(coercedBoolean).default(false),
    cutMarks: urlSafe(coercedBoolean).default(false),
    pageScaling,
    pagePositioning,
    mainForeEdgePaddingPt: urlSafe(z.coerce.number()).default(0),
    bindingEdgePaddingPt: urlSafe(z.coerce.number()).default(0),
    topEdgePaddingPt: urlSafe(z.coerce.number()).default(0),
    bottomEdgePaddingPt: urlSafe(z.coerce.number()).default(0),
    sigFormat,
    sigLength: urlSafe(z.coerce.number()).default(8), // Specific to standard
    customSigLength: urlSafe(commaSeparatedNumberList).default([]), // Specific to custom.
    foreEdgePaddingPt: urlSafe(z.coerce.number()).default(0), // specific to wacky small
    wackySpacing, // specific to wacky small
    flyleaf: urlSafe(coercedBoolean).default(false),
    paperSizeCustomWidth: urlSafe(z.coerce.number()),
    paperSizeCustomHeight: urlSafe(z.coerce.number()),
});

/** @typedef {z.infer<typeof schema>} Configuration */
