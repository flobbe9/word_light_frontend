import React from "react";
import $ from "jquery";
import { ApiExceptionFormat } from "../abstract/ApiExceptionFormat";
import { DOCUMENT_SUFFIX, SPACES_PER_TAB, Side, TAB_UNICODE_ESCAPED } from "../globalVariables";


export function log(text?: any, debug = false): void {

    if (!debug) {
        console.log(text);
        return;
    }

    try {
        throw Error(text);
        
    } catch (e) {
        console.log(e);
    }
}


export function logWarn(text?: any): void {

    try {
        throw Error(text);
        
    } catch (e) {
        console.warn(e);
    }
}


export function logError(text?: any): void {

    try {
        throw Error(text);
        
    } catch (e) {
        console.error(e);
    }
}


export function logApiResponse(error: ApiExceptionFormat): void {

    logError(error.error + ": " + error.message);
}


export function logApiError(message: string, error: Error): void {
    
    logError(message + ". " + error.message);
}


export function stringToNumber(str: string | number): number {

    if (typeof str === "number")
        return str;
    
    try {
        return Number.parseFloat(str);

    } catch (e) {
        logError(e);
        return -1;
    }
}


/**
 * Concat given params in given order using "_".
 * 
 * @param pageIndex index of page
 * @param customId any string to append to end of id
 * @param paragraphIndex index of paragraph
 * @param textInputIndex index of text input
 * @param columnIndex index of column
 * @returns id as string containing all params, valid or not
 */
export function getDocumentId(prefix: string,
                                pageIndex: number,
                                customId?: string | number,
                                columnIndex?: number,
                                paragraphIndex?: number,
                                textInputIndex?: number): string {

    let id = prefix + "_" + pageIndex;

    if (!isNumberFalsy(columnIndex))
        id += "_" + columnIndex;

    if (!isNumberFalsy(paragraphIndex))
        id += "_" + paragraphIndex;

    if (!isNumberFalsy(textInputIndex))
        id += "_" + textInputIndex;
    
    if (customId)
        id += "_" + customId;

    // this check does not work
    if (!prefix || isNumberFalsy(pageIndex))
        logError("Failed to create text input id: " + id);
        
    return id;
}


/**
 * Split given id using "_" and expect array like ```["Page", 1, 3]```. <p>
 * 
 * Each element of the array is considered an idPart. So ```idPart = 2``` would return ```3```. <p>
 * 
 * IdParts: <p>
 * - ```[0]```: prefix
 * - ```[1]```: pageIndex
 * - ```[2]```: columnIndex (optional in id)
 * - ```[3]```: paragraphIndex (optional in id)
 * - ```[4]```: textInputIndex (optional in id)
 * - ```[length - 1]```: customIdPart (optional in id, always last)
 * 
 * @param id id of text input
 * @param idPart index of the element in the array resulting from ``` id.split("_")```
 * @returns the given part of the id or -1 if not found
 */
export function getPartFromDocumentId(id: string, idPart: number): string {

    if (idPart < 0 || idPart > 3 || !id) {
        logError("Failed to get index part from text input id. 'id': " + id + " 'idPart': " + idPart);
        return "";
    }
        
    const arr = id.split("_");

    return arr[idPart];
}


export function isNumberFalsy(num: number | null | undefined): boolean {

    return num === undefined || num === null || isNaN(num);
}


export function isBooleanFalsy(bool: boolean | null | undefined) {

    return bool === undefined || bool === null;
}


export function isBlank(str: string): boolean {

    if (!str && str !== "") {
        logError("Falsy input str: " + str);
        return false;
    }

    str = str.trim();

    return str.length === 0;
}


/**
 * @param length num chars the string should have
 * @returns random string of of alphanumeric chars with given length
 */
export function getRandomString(length = 12): string {

    return Math.random().toString(36).substring(2, length + 2);
}


export function moveCursor(textInputId: string, start = 0, end = 0): void {

    let textInput: JQuery;
    
    if (!textInputId || !(textInput = $("#" + textInputId)).length) {
        console.warn("Failed to move cursor for text input with id: " + textInputId);
        return;
    }

    textInput.prop("selectionStart", start);
    textInput.prop("selectionEnd", end);
}


export function getCursorIndex(textInputId: string): number {

    const textInput = $("#" + textInputId);
    
    if (!textInput.length) {
        console.warn("Failed to get cursor index for text input with id: " + textInputId);
        return - 1;
    }

    return textInput.prop("selectionStart");
}


/**
 * @param textInputId id of text input to compare text width to
 * @param inputOverhead amount of pixels of input's width that should not be considered for calculation, i.e. padding or border.
 * @param testChars string that is not part of input value but should be included in value when calculating value's width
 * @returns true if width of text is greater than width of input
 */
export function isTextLongerThanInput(textInputId: string, inputOverhead: number, testChars = ""): boolean {

    if (!textInputId) {
        logError("Failed to determine text input length. 'textInputId' is falsy");
        return false;
    }

    const textInput = $("#" + textInputId);

    const textInputWidth = getCSSValueAsNumber(textInput.css("width"), 2) - inputOverhead;
    const textWidth = getTextWidth(textInput.prop("value") + testChars, textInput.css("fontSize"), textInput.css("fontFamily"), textInput.css("fontWeight"));

    return textInputWidth < textWidth;
}


/**
 * @param text to measure
 * @param fontSize of text, unit should be included
 * @param fontFamily of text
 * @param fontWeight of text, default is "norml"
 * @returns width of text in unit of fontSize
 */
export function getTextWidth(text: string, fontSize: string, fontFamily: string, fontWeight = "normal"): number { 
     
    const font = fontWeight + " " + fontSize + " " + fontFamily;
    
    const canvas = document.createElement("canvas"); 
    const context = canvas.getContext("2d")!; 
    context.font = font; 

    // replace tab unicode with equivalent amount of spaces
    text = text.replaceAll(TAB_UNICODE_ESCAPED, getTabSpaces());

    const width = context.measureText(text).width;
    
    return width;
} 


/**
 * @returns a string with {@link SPACES_PER_TAB} amount of white space chars
 */
export function getTabSpaces(): string {

    let spaceChars = "";
    for (let i = 0; i < SPACES_PER_TAB; i++) 
        spaceChars += " "

    return spaceChars;
}


/**
 * Insert given ```insertionString``` into given ```targetString``` after given index.
 * 
 * I.e: ```insertString("Hello", "X", 1)``` would return ```HXello```.
 * 
 * @param targetString string to insert another string into
 * @param insertionString string to insert 
 * @param insertionIndex index in ```targetString``` to insert into, i.e ```insertionIndex = 0``` would insert at the start
 * @returns result string, does not alter ```targetString```
 */
export function insertString(targetString: string, insertionString: string, insertionIndex: number): string {

    let leftHalft = targetString.substring(0, insertionIndex);
    const rightHalf = targetString.substring(insertionIndex);

    leftHalft += insertionString;

    return leftHalft + rightHalf;
}


/**
 * Cut given number of digits from cssValue and try to parse substring to number.
 * 
 * @param cssValue css value e.g: 16px
 * @param unitDigits number of digigts to cut of cssValue string
 * @returns substring of cssValue parsed to number or NaN if parsing failed
 */
export function getCSSValueAsNumber(cssValue: string | number, unitDigits: number): number {

    if (typeof cssValue === "number")
        return cssValue;

    const length = cssValue.length;
    if (unitDigits >= length) {
        // case: is numeric
        if (isStringNumeric(cssValue, true))
            return stringToNumber(cssValue);

        logError("Failed to get css value as number. 'unitDigits' (" + unitDigits + ") too long or 'cssValue' (" + cssValue + ") too short.");
    }

    const endIndex = cssValue.length - unitDigits;

    return stringToNumber(cssValue.substring(0, endIndex));
}


/**
 * @param width css value as string, possibly with unit appended
 * @param unitDigits to cut from width in order to get the plain number
 * @returns width in percent relative to window width as string with a '%' appended
 */
export function getWidthRelativeToWindow(width: string | number, unitDigits: number): string {

    const windowWidth = $(window).width();
    if (!windowWidth) {
        logError("Failed to get width in percent. 'windowWidth' is falsy");
        return "";
    }

    // NOTE: will this work if one line has not the same width as the window?
    const widhInPercent = (getCSSValueAsNumber(width.toString(), unitDigits) / windowWidth) * 100;

    return widhInPercent + "%";
}


/**
 * @param keyCode code of the key e.g ```65``` for letter 'A'
 * @returns true if key would use space inside a text input. Includes 'Tab' and 'Space'
 */
export function isKeyAlphaNumeric(keyCode: number): boolean {

    if (isNumberFalsy(keyCode)) {
        logError("Failed to determine if key is alpha numeric. 'keyCode' is falsy.");
        return false;
    }

    return (keyCode >= 48 && keyCode <= 57) || // numbers
           (keyCode >= 65 && keyCode <= 90) || // letters
           keyCode === 32 || // "Space"
           keyCode === 9; // "Tab"
}


export function isRGB(color: string): boolean {

    return color.toLowerCase().includes("rgb");
}


/**
 * @param rgb string formatted like ```rgb(0, 0, 0)```
 * @returns hex string with '#' prepended
 */
export function rgbStringToHex(rgb: string): string {

    rgb = rgb.replace("rgb(", "");
    rgb = rgb.replace(")", "");

    const rgbArr = rgb.split(",");

    return rgbNumbersToHex(stringToNumber(rgbArr[0]), 
                           stringToNumber(rgbArr[1]), 
                           stringToNumber(rgbArr[2]));
}


/**
 * @param r red
 * @param g green
 * @param b blue
 * @returns hex string with '#' prepended
 */
function rgbNumbersToHex(r: number, g: number, b: number) {

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

  
/**
 * @param hex string
 * @returns ```[23, 14, 45]``` like ```[r, g, b]```
 */
function hexToRgb(hex: string) {

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? result.map(i => parseInt(i, 16)).slice(1) : null
}


/**
 * @param key name of the cookie
 * @returns the cookie value as string
 */
function getCookie(key: string): string {

    return document.cookie.split('; ').filter(row => row.startsWith(key)).map(c=>c.split('=')[1])[0];
}


/**
 * Create a hidden ```<a href="url" download></a>``` element, click it and remove it from the dom afterwards.
 * 
 * @param url to make the download request to
 */
export function downloadFileByUrl(url: string) {

    if (!url) {
        logWarn("Failed to download file by url. 'url' is falsy");
        return;
    }

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    
    linkElement.style.display = 'none';
    document.body.appendChild(linkElement);
  
    linkElement.click();
  
    document.body.removeChild(linkElement);
}


function confirmPageUnloadEvent(event): void {

    event.preventDefault();
    event.returnValue = "";
}


/**
 * Confirm page refresh, tab close and window close with browser popup
 */
export function confirmPageUnload(): void {

    // confirm page refresh / tab close / window close
    window.addEventListener("beforeunload", confirmPageUnloadEvent);
}


export function removeConfirmPageUnloadEvent(): void {

    window.removeEventListener("beforeunload", confirmPageUnloadEvent);
}


/**
 * Remove given ```removeClass``` className from given ```element```, add given ```addClass``` and then
 * after given ```holdTime``` undo both operations.
 * 
 * @param elementId id of element to flash the className of
 * @param addClass className the element has while flashing 
 * @param removeClass className the element should loose while flashing and get back afterwards
 * @param holdTime time in ms that the border stays with given addClass and without given removeClass
 * @return promise that resolves once animation is finished
 */
export async function flashClass(elementId: string, addClass: string, removeClass: string, holdTime = 1000) {

    const element = $("#" + elementId);
    if (!element.length) {
        logWarn("flashClass() failed")
        return;
    }

    return new Promise((res, rej) => {
        // remove old class
        res(element.removeClass(removeClass));

        // add flash class shortly
        res(element.addClass(addClass));
        setTimeout(() => {
            res(element.removeClass(addClass));
            res(element.addClass(removeClass));
        }, holdTime);
    });
}


export function getOppositeSide(side: Side): Side {

    if (side === "right")
        return "left";

    if (side === "left") 
        return "right";

    if (side === "top") 
        return "bottom";

    if (side === "bottom") 
        return "top";

    return "none";
}


/**
 * @param str string to replace a char in
 * @param replacement string to use as replacement
 * @param startIndex of chars to replace in ```str```
 * @param endIndex of chars to replace in ```str``` (not included), default is ```str.length```
 * @returns string with replacement at given position (does not alter ```str```)
 */
export function replaceAtIndex(str: string, replacement: string, startIndex: number, endIndex = str.length): string {

    const charsBeforeIndex = str.substring(0, startIndex);
    const charsBehindIndex = str.substring(endIndex);

    return charsBeforeIndex + replacement + charsBehindIndex;
}


/**
 * @param expected first value to compare
 * @param actual second value to compare
 * @returns ```expected === actual``` after calling ```trim()``` and ```toLowerCase()``` on both values.
 *          Types wont be considered: ```"1" === 1 = true```
 */
export function equalsIgnoreCase(expected: string | number, actual: string | number): boolean {

    if (!expected || !actual)
        return expected === actual;

    expected = expected.toString().trim().toLowerCase();
    actual = actual.toString().trim().toLowerCase();

    return expected === actual;
}


/**
 * @param arr array to search in
 * @param value string or number to look for
 * @returns true if value is included in array. Uses {@link equalsIgnoreCase} for comparison instead of ```includes()```.
 */
export function includesIgnoreCase(arr: (string | number)[] | string, value: string | number): boolean {

    // case: arr is string
    if (typeof arr === "string")
        return arr.trim().toLowerCase().includes(value.toString().trim().toLowerCase());

    const result = arr.find(val => equalsIgnoreCase(val, value));

    return result ? true : false;
}


/**
 * @param str to check 
 * @param regexp pattern to use for checking
 * @returns true if and only if all chars in given string match given pattern, else false
 */
export function matchesAll(str: string, regexp: RegExp): boolean {

    // iterate chars
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        
        if (char.match(regexp) === null)
            return false;
    }

    return true;
}


/**
 * This calculation is quite inaccurate. Tends to subtract more pixels than necessary which means the fontSize in 
 * Word will be a bit too small.
 * 
 * @param fontSize get the fontSize difference in Word for
 * @returns approximated number of pixels by which the fontSize in the browser should be increased to match the actual fontSize in MS Word
 */
export function getFontSizeDiffInWord(fontSize: number): number {

    if (isNaN(fontSize)) {
        logError("'getFontSizeDiffInWord()' failed. 'fontSize' is NaN")
        return -1;
    }

    return fontSize >= 19 ? Math.ceil(fontSize / 4) : Math.ceil(fontSize / 3);
}


export function isStringAlphaNumeric(str: string): boolean {

    // alpha numeric regex
    const regexp = /^[a-z0-9ßäÄöÖüÜ]+$/i;

    return matchString(str, regexp);
}


/**
 * @param str to check
 * @returns true if every char of given string matches regex. Only alphabetical chars including german exceptions
 *          'ßäÄöÖüÜ' are a match (case insensitive).
 */
export function isStringAlphabetical(str: string): boolean {

    // alpha numeric regex
    const regexp = /^[a-zßäÄöÖüÜ]+$/i;

    return matchString(str, regexp);
}


/**
 * @param str to check
 * @param considerDouble if true, ',' and '.' will be included in the regex
 * @returns true if every char of given string matches the numeric regex
 */
export function isStringNumeric(str: string, considerDouble = false): boolean {

    // alpha numeric regex
    let regexp = /^[0-9]+$/;

    if (considerDouble)
        regexp = /^[0-9.,]+$/;

    return matchString(str, regexp);
}


export function setCssVariable(variableName: string, value: string): void {

    document.documentElement.style.setProperty("--" + variableName, value);
}


/**
 * @param fileName to append suffix to
 * @returns given fileName with {@link DOCUMENT_SUFFIX} appended or unaltered fileName, if fileName is falsy
 *          or has suffix already
 */
export function appendDocxSuffix(fileName: string): string {

    if (!fileName) {
        logWarn("'appendDocxSuffix()' failed. 'fileName' is falsy: " + fileName);
        return fileName;
    }

    const suffix = fileName.substring(fileName.length - 5);

    return suffix !== DOCUMENT_SUFFIX ? fileName += DOCUMENT_SUFFIX : fileName;
}


/**
 * @param str to check
 * @param regexp to use for matching
 * @returns true if every char of string matches the regex, trims the string first
 */
function matchString(str: string, regexp: RegExp): boolean {

    str = str.trim();

    let matches = true;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (char.match(regexp) === null) {
            matches = false;
            break;
        }
    }

    return matches
}

// BUG: does not work
// /**
//  * @param keyName of event key to trigger (i.e. 'A' or 'Backspace')
//  * @param eventTargetId id of the html element to trigger the event on
//  */
// export function triggerKeyEvent(keyName: string, eventTargetId: string): void {

//     if (isBlank(eventTargetId)) {
//         logWarn("Failed to trigger key event for key code " + keyName + ". 'eventTargetId' is blank");
//         return;
//     }

//     if (isBlank(keyName)) {
//         logWarn("Failed to trigger key event for key code " + keyName + ". 'keyName' is blank");
//         return;
//     }

//     const event = $.Event('keydown');
//     event.key = keyName;
//     $("#" + eventTargetId).trigger(event);
// }