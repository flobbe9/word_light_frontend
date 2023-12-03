import React from "react";
import $ from "jquery";
import { ApiExceptionFormat } from "../abstract/ApiExceptionFormat";
import { SPACES_PER_TAB, Side, TAB_UNICODE_ESCAPED } from "./GlobalVariables";


export function log(text?: any): void {

    console.log(text);
}


export function logWarn(text?: any): void {

    console.warn(text);
}


export function logError(text?: any): void {

    console.error(text);
}


export function logApiResponse(error: ApiExceptionFormat): void {

    logError(error.error + ": " + error.message);
}


export function logApiError(message: string, error: Error): void {
    
    logError(message + ". " + error.message);
}



export function stringToNumber(str: string): number {

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


export function moveCursor(textInputId: string, start = 0, end = 0): void {

    const textInput = $("#" + textInputId);
    
    if (!textInput.length) {
        console.warn("Failed to move cursor for text input with id: " + textInputId);
        return;
    }

    textInput.prop("selectionStart", start);
    textInput.prop("selectionEnd", end);
}


/**
 * @param textInputId id of text input to compare text width to
 * @param inputOverhead amount of pixels of input's width that should not be considered for calculation, i.e. padding or border.
 * @param testChars string that is not part of input value but should be included in value when calculating value's width
 * @returns true if width of text is greater than width of input - 10
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
export function getCSSValueAsNumber(cssValue: string, unitDigits: number): number {

    const length = cssValue.length;
    if (unitDigits >= length)
        logError("Failed to get css value as number. 'unitDigits' too long or 'cssValue' too short");

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

    // TODO: will this work if one line has not the same width as the window?
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


/**
 * Display ``` #PopUp``` and ``` .appOverlay```.
 * 
 * @param setPopUpContent setter of content inside ```#popUpContainer```
 * @param duration fade in / out time in milliseconds
 */
export function togglePopUp(setPopUpContent: (content: React.JSX.Element) => void, duration = 100): void {

    $("#PopUp").fadeToggle(duration);
    $(".appOverlay").fadeToggle(duration);

    resetPopUp(setPopUpContent);
}


/**
 * Hide ```#PopUp``` and ``` .appOverlay```.
 * 
 * @param setPopUpContent setter of content inside ```#popUpContainer```
 * @param duration fade in / out time in milliseconds
 */
export function hidePopUp(setPopUpContent: (content: React.JSX.Element) => void, duration = 100, ): void {

    $("#PopUp").fadeOut(duration);
    $(".appOverlay").fadeOut(duration);

    resetPopUp(setPopUpContent, duration);
}


/**
 * Set content from ```#popUpContainer``` to ```<></>``` and reset className.
 * 
 * @param setPopUpContent setter of content inside ```#popUpContainer```
 * @param duration milliseconds to wait until reset
 */
export function resetPopUp(setPopUpContent: (content: React.JSX.Element) => void, duration = 100): void {

    setTimeout(() => {
        if ($("#PopUp").css("display") === "none") {
            const popUpContainer = $("#popUpContainer");
            setPopUpContent(<></>);
            popUpContainer.prop("className", "popUpContainer ")
        }
    }, duration + 100);
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


/**
 * Confirm page refresh, tab close and window close with browser popup
 */
export function confirmPageUnload(): void {

    // confirm page refresh / tab close / window close
    window.addEventListener("beforeunload", (event) => {
        event.preventDefault();
        event.returnValue = "";
    });
}


/**
 * Animate the css "border-```borderSide```-color" attribute of given element.
 * 
 * @param element to flash the border of
 * @param borderSide side of the border. Possible values are: "top", "right", "left", "bottom"
 * @param flashColor color of border to use for flash effect
 * @param endColor color of border to fall back on
 * @param holdTime time in ms that the border stays in given flashColor
 * @return promise that resolves once animation is finished
 */
export function flashBorder(element: JQuery,
                            borderSide: Side, 
                            flashColor: string, 
                            endColor: string,
                            holdTime = 1000): any {

    if (!element.length) {
        logWarn("flashBorder() failed")
        return;
    }

    const borderAttr = "border-" + borderSide + "-color";

    return new Promise((res, rej) => {
        element.animate({[borderAttr]: flashColor}, 100, () => 
            setTimeout(() => res(element.animate({[borderAttr]: endColor}, 100)), holdTime))
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