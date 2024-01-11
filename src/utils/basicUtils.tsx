import $ from "jquery";
import { ApiExceptionFormat } from "../abstract/ApiExceptionFormat";
import { SPACES_PER_TAB, TAB_UNICODE_ESCAPED } from "../globalVariables";
import { getCSSValueAsNumber } from "./documentBuilderUtils";


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


/**
 * @param id to find in html document
 * @returns a JQuery with all matching elements or null if no results
 */
export function getJQueryElementById(id: string): JQuery | null {

    // case: blank
    if (isBlank(id)) {
        logWarn("id blank: " + id);
        return null;
    }

    const element = $("#"  + id);

    // case: not present
    if (!element.length) {
        logWarn("falsy id: " + id);
        return null;
    }

    return element;
}


/**
 * @param className to find in html document
 * @returns a JQuery with all matching elements or null if no results
 */
export function getJQueryElementByClassName(className: string): JQuery | null {

    // case: blank
    if (isBlank(className)) {
        logWarn("className blank: " + className);
        return null;
    }

    const element = $("."  + className);

    // case: not present
    if (!element.length) {
        logWarn("falsy className: " + className);
        return null;
    }

    return element;
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


export function moveCursor(textInputId: string, start = 0, end = 0): void {

    const textInput = getJQueryElementById(textInputId);
    if (!textInput)
        return;

    textInput.prop("selectionStart", start);
    textInput.prop("selectionEnd", end);
}


export function getCursorIndex(textInputId: string): number {

    const textInput = getJQueryElementById(textInputId);

    return textInput ? textInput.prop("selectionStart") : -1;
}


/**
 * @param key name of the cookie
 * @returns the cookie value as string
 */
function getCookie(key: string): string {

    return document.cookie.split('; ').filter(row => row.startsWith(key)).map(c=>c.split('=')[1])[0];
}


function confirmPageUnloadEvent(event): void {

    event.preventDefault();
    event.returnValue = "";
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
 * Create a hidden ```<a href="url" download></a>``` element, click it and remove it from the dom afterwards.
 * 
 * @param url to make the download request to
 */
export function downloadFileByUrl(url: string) {

    if (!isBlank(url)) {
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


/**
 * @param width of element as css value, possibly with unit appended
 * @param unitDigits to cut from width in order to get the plain number
 * @returns width in percent relative to window width as string with a '%' appended
 */
export function getElementWidthRelativeToWindow(width: string | number, unitDigits: number): string {

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
/**
 * @param keyName of event key to trigger (i.e. 'A' or 'Backspace')
 * @param eventTargetId id of the html element to trigger the event on
 */
export function triggerKeyEvent(keyName: string, eventTargetId: string): void {

    if (isBlank(eventTargetId)) {
        logWarn("Failed to trigger key event for key code " + keyName + ". 'eventTargetId' is blank");
        return;
    }

    if (isBlank(keyName)) {
        logWarn("Failed to trigger key event for key code " + keyName + ". 'keyName' is blank");
        return;
    }

    const event = $.Event('keydown');
    event.key = keyName;
    $("#" + eventTargetId).trigger(event);
}