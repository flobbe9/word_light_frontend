import React from "react";
import { getFontSizeDiffInWord } from "./utils/documentBuilderUtils";


export const WEBSITE_NAME = "" + process.env.REACT_APP_WEBSITE_NAME;
export const API_ENV = "" + process.env.REACT_APP_ENV;
export const API_VERSION = "" + process.env.REACT_APP_VERSION;
export const API_NAME = "" + process.env.REACT_APP_API_NAME;
export const API_HOST = "" + process.env.REACT_APP_API_HOST;
export const API_PORT = "" + process.env.REACT_APP_API_PORT;
export const DOCUMENT_BUILDER_BASE_URL = "" + process.env.REACT_APP_DOCUMENT_BUILDER_BASE_URL;
export const USER_SERVICE_BASE_URL = "" + process.env.REACT_APP_USER_SERVICE_BASE_URL;

export const NUM_PAGES = 2;
export const PAGE_WIDTH_PORTRAIT = "806px";
export const PAGE_WIDTH_LANDSCAPE = "1170px";

export const MAX_NUM_COLUMNS = 3;

export const FONT_FAMILIES = [
    "Helvetica",
    "Arial",
    "Arial Black",
    "Verdana",
    "Tahoma",
    "Trebuchet MS",
    "Impact",
    "Gill Sans",
    "Times New Roman",
    "Georgia",
    "Palatino",
    "Baskerville",
    "Andalé Mono",
    "Courier",
    "Lucida",
    "Monaco",
    "Bradley Hand",
    "Brush Script MT",
    "Luminari",
    "Comic Sans MS",
    "Calibri",
];

export const RAW_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]

export const MAX_FONT_SIZE = RAW_FONT_SIZES[RAW_FONT_SIZES.length - 1];
export const MIN_FONT_SIZE = RAW_FONT_SIZES[0];

/** Formatted like: ```[msWordFontSize, browserFontSize]```. To get browserFontSize add a certain diff to even out font style difference in MS Word */
export const FONT_SIZES = RAW_FONT_SIZES.map(fontSize => [fontSize, fontSize + getFontSizeDiffInWord(fontSize)]);

/** Formatted like: ```[msWordFontSize, browserFontSize]```. Cover all fontSizes from {@link MIN_FONT_SIZE} to {@link MAX_FONT_SIZE} */
export const FONT_SIZES_WHOLE_SCALE = getAllFontSizes();
function getAllFontSizes(): number[][] {

    const allFontSizes: number[][] = [];

    for (let i = MIN_FONT_SIZE; i <= MAX_FONT_SIZE; i++) 
        allFontSizes.push([i, i + getFontSizeDiffInWord(i)])

    return allFontSizes;
}

/** Formatted like {@link FONT_SIZES} but mapping all numbers from {@link MIN_FONT_SIZE} to {@link MAX_FONT_SIZE} */

export type Side = "top" | "right" | "left" | "bottom" | "none";

export const DEFAULT_BASIC_PARAGRAPH_TEXT = " ";

export const NO_TEXT_INPUT_SELECTED = "Wähle zuerst ein Texteingabefeld aus.";

/** fontSize of a line that is added to the document (i.e. because there's not enough lines at the moment) */
export const DEFAULT_FONT_SIZE = 14;

/** Number of empty lines on top of every column, becuase of backend */
const numFillerLines = 1;

/** assuming a fontSize of 14 */
export const NUM_LINES_PROTRAIT = 41 - numFillerLines;
/** assuming a fontSize of 19 */
export const MAX_FONT_SIZE_SUM_PORTRAIT = NUM_LINES_PROTRAIT * DEFAULT_FONT_SIZE;

/** assuming a fontSize of 14 */
export const NUM_LINES_LANDSCAPE = 29 - numFillerLines;
/** assuming a fontSize of 19 */
export const MAX_FONT_SIZE_SUM_LANDSCAPE = NUM_LINES_LANDSCAPE * DEFAULT_FONT_SIZE;

export const NUM_SPACES_PER_TAB = 8;
export const TAB_UNICODE = "\t";


/**
 * Defines the number of columns and the start index for each column type involving a table. Object key is the 
 * column type.
 */
export const TABLE_CONFIG: Readonly<Record<number, {numColumns: number, startIndex: number}>> = {
    6: {
        numColumns: 1,
        startIndex: 1
    },
    7: {
        numColumns: 2,
        startIndex: 1
    },
    8: {
        numColumns: 3,
        startIndex: 1
    }
}


export function isMobileWidth(): boolean {

    return document.documentElement.clientWidth < 800;
}


// export const SELECT_COLOR = "rgb(0, 226, 226)";
export const SELECT_COLOR = "black";


export const SELECTED_STYLE: React.CSSProperties = {
    borderColor: SELECT_COLOR
}


/** format of a word file */
export const DOCUMENT_SUFFIX = ".docx";


export const BUILDER_PATH = "/";

export const SINGLE_COLUMN_LINE_CLASS_NAME = "SingleColumnLine";

export const DONT_SHOW_AGAIN_COOKIE_NAME = "dontShowAgain";


// ------------------- Archive

const NUM_LINES_PROTRAIT_OLD: ReadonlyArray<Object> = [{
    8: 76 - numFillerLines,
    9: 68 - numFillerLines,
    10: 61 - numFillerLines,
    11: 54 - numFillerLines,
    12: 51 - numFillerLines,
    14: 44 - numFillerLines,
    16: 38 - numFillerLines,
    18: 34 - numFillerLines,
    20: 31 - numFillerLines,
    22: 28 - numFillerLines,
    24: 26 - numFillerLines,
    26: 24 - numFillerLines,
    28: 22 - numFillerLines,
    36: 17 - numFillerLines,
    48: 13 - numFillerLines,
    72: 9 - numFillerLines
}];

const NUM_LINES_LANDSCAPE_OLD: ReadonlyArray<Object> = [{
    8: 53 - numFillerLines,
    9: 47 - numFillerLines,
    10: 43 - numFillerLines,
    11: 39 - numFillerLines,
    12: 36 - numFillerLines,
    14: 31 - numFillerLines,
    16: 28 - numFillerLines,
    18: 25 - numFillerLines,
    20: 23 - numFillerLines,
    22: 21 - numFillerLines,
    24: 19 - numFillerLines,
    26: 18 - numFillerLines,
    28: 17 - numFillerLines,
    36: 14 - numFillerLines,
    48: 11 - numFillerLines,
    72: 8 - numFillerLines
}];