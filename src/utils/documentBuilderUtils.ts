import { DOCX_SUFFIX, FONT_SIZES_WHOLE_SCALE, PDF_SUFFIX, Side, DOCUMENT_FILE_PREFIX_PATTERN, DOCUMENT_FILE_SUFFIX_PATTERN, DEFAULT_DOCUMENT_FILE_NAME, SINGLE_COLUMN_LINE_CLASS_NAME } from "../globalVariables";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getCursorIndex, getJQueryElementById, getTextWidth, getTotalTabWidthInText, insertString, isBlank, isNumberFalsy, isStringNumeric, log, logError, logWarn, matchesAll, stringToNumber } from "./basicUtils";


/**
 * Concat given params in given order using "_".
 * 
 * @param pageIndex index of page
 * @param columnIndex index of column
 * @param textInputIndex index of text input
 * @param customId any string to append to end of id
 * @returns id as string containing all params, valid or not
 */
export function getDocumentId(prefix: string,
                            pageIndex: number,
                            columnIndex?: number,
                            textInputIndex?: number,
                            customId?: string | number
                            ): string {

    if (!prefix || isNumberFalsy(pageIndex))
        logError("Failed to create text input id. Falsy prefix: " + prefix + " or falsy pageIndex: " + pageIndex);

    let id = prefix + "_" + pageIndex;

    if (!isNumberFalsy(columnIndex))
        id += "_" + columnIndex;

    if (!isNumberFalsy(textInputIndex))
        id += "_" + textInputIndex;

    if (customId)
        id += "_" + customId;

    return id;
}


/**
 * Appends given customId to given documentId in the same way as {@link getDocumentId} does.
 * 
 * @param documentId to append customId to
 * @param customId any string to append to documentId
 * @returns the concatenated string (does not alter documentId)
 */
export function appendCustumIdToDocumentId(documentId: string, customId: string): string {

    return documentId + "_" + customId;
}


/**
 * Split given id using "_" and expect array like ```["Page", 1, 3]```. <p>
 * 
 * Each element of the array is considered an idPart. So ```idPart = 2``` would return ```3```. <p>
 * 
 * @param id id of text input
 * @param idPart index of the element in the array resulting from ``` id.split("_")```
 * - ```0```: prefix
 * - ```1```: pageIndex
 * - ```2```: columnIndex (optional in id)
 * - ```3```: textInputIndex (optional in id)
 * - ```4```: customIdPart (optional in id, always last)
 * 
 * @returns the given part of the id or -1 if not found
 */
export function getPartFromDocumentId(id: string, idPart: number): string {

    if (idPart < 0 || !id) {
        logError("Failed to get index part from text input id. 'id': " + id + " 'idPart': " + idPart);
        return "";
    }
        
    const arr = id.split("_");

    return arr[idPart];
}


/**
 * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. textInputId). Default is selectedTextInputId
 * @returns page id of given document element (event if documentId element does not exist) or null
 */
export function getPageIdByDocumentId(documentId: string): string | null {

    // case: no text input selected yet
    if (isBlank(documentId))
        return null;

    const pageIndex = getPartFromDocumentId(documentId, 1);

    return getDocumentId("Page", stringToNumber(pageIndex));
}


/**
 * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. textInputId). Default is selectedTextInputId
 * @returns column id of given document element (event if documentId element does not exist) or null
 */
export function getColumnIdByDocumentId(documentId: string): string | null {

    // case: no text input selected yet
    if (isBlank(documentId))
        return null;

    const pageIndex = getPartFromDocumentId(documentId, 1);
    const columnIndex = getPartFromDocumentId(documentId, 2);

    return getDocumentId("Column", stringToNumber(pageIndex), stringToNumber(columnIndex));
}


/**
 * @param textInputId id of ```<TextInput />``` to check
 * @param debug if true a warn log will be displayed in case of falsy id, default is true
 * @returns true if element with given id exists in document and has className 'TextInput', else false
 */
export function isTextInputIdValid(textInputId: string, debug = true): boolean {

    const textInput = getJQueryElementById(textInputId, debug);
    if (!textInput)
        return false;

    // case: is no TextInput
    if (!textInput.prop("className").includes("TextInput"))
        return false;

    return true;
}


/**
 * @param textInputId id of the current text input
 * @returns JQuery of the next ```<TextInput>``` ```<input />``` tag or null if not found
 */
export function getNextTextInput(textInputId: string): JQuery | null {

    const textInput = getJQueryElementById(textInputId);
    if (!textInput)
        return null;

    const allTextInputs = $(".TextInput");
    const index = allTextInputs.index(textInput);

    // case: has no next text input
    if (allTextInputs.length - 1 === index)
        return null;

    return $(allTextInputs.get(index + 1)!);
}


/**
 * @param textInputId id of the current text input
 * @param debug if true a warn log will be displayed in case of falsy id, default is true
 * @returns JQuery of the next ```<TextInput>``` ```<input />``` tag or null if not found
 */
export function getPrevTextInput(textInputId: string, debug = true): JQuery | null {

    const textInput = getJQueryElementById(textInputId, debug);
    if (!textInput)
        return null;

    const allTextInputs = $(".TextInput");
    const index = allTextInputs.index(textInput);

    // case: has no prev text input
    if (index === 0)
        return null;

    return $(allTextInputs.get(index - 1)!);
}


/**
 * @param textInputId id of the starting text input (exluded by default)
 * @param includeThisTextInput if true, the text input with given id will be included in the jquery, else it wont be included (which means 
 *                       the first element in the jquery will be the text input after the given one). Default is false
 * @returns a jquery of all text inputs after the one with given id (excluded by default). Return null if given id is invalid or no text inputs can be found at all.
 */
export function getAllTextInputsAfter(textInputId: string, includeThisTextInput = false): JQuery | null {

    // case: id invalid
    if (!isTextInputIdValid(textInputId))
        return null;

    const allTextInputs = $(".TextInput");
    // case: no text input found
    if (!allTextInputs.length)
        return null;

    let allTextInputsAfter = $();
    let reachedThisTextInput = false;

    // iterate all text inputs
    allTextInputs.each((i, textInputElement) => {
        // case: already iterated past thisTextInput
        if (reachedThisTextInput) {
            allTextInputsAfter = allTextInputsAfter.add(textInputElement);
            return;
        }

        // case: reached thisTextInput
        if (textInputElement.id === textInputId) {
            // case: include thisTextInput
            if (includeThisTextInput)
                allTextInputsAfter = allTextInputsAfter.add(textInputElement);

            reachedThisTextInput = true;
        }
    });

    return allTextInputsAfter;
}


/**
 * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. textInputId).
 * @returns jquery of all ```<TextInput />``` components inside given column or ```null``` if column was not found.
 *          Also include ```<TextInput />```components in page with className {@link SINGLE_COLUMN_LINE_CLASS_NAME}.
 */
export function getColumnTextInputs(documentId: string): JQuery | null {

    const docxElement = getJQueryElementById(documentId);
    if (!docxElement)
        return null;
    
    // get .TextInput
    const columnId = getColumnIdByDocumentId(documentId);
    let columnTextInputs = $("#" + columnId + " .TextInput");
    
    // get .SingleColumnLine
    const pageId = getPageIdByDocumentId(documentId);
    if (!pageId)
        return null;

    const singleColumnLines = $("#" + pageId + " .TextInput." + SINGLE_COLUMN_LINE_CLASS_NAME);
    columnTextInputs = columnTextInputs.add(singleColumnLines);

    return columnTextInputs;
}


/**
 * @param textInputId id of the starting text input (exluded by default)
 * @param includeThisTextInput if true, the text input with given id will be included in the jquery, else it wont be included (which means 
 *                       the first element in the jquery will be the text input after the given one). Default is false
 * @returns a jquery of all text inputs after given one (excluded by default) in same column of given one. Return null if given id is invalid or no text inputs can be found at all.
 */
export function getColumnTextInputsAfter(textInputId: string, includeThisTextInput = false): JQuery | null {

    // case: id invalid
    if (!isTextInputIdValid(textInputId))
        return null;

    const columnTextInputs = getColumnTextInputs(textInputId);
    if (!columnTextInputs)
        return null;

    let columnTextInputsAfter = $();
    let reachedThisTextInput = false;

    // iterate all text inputs
    columnTextInputs.each((i, textInputElement) => {
        // case: already iterated past thisTextInput
        if (reachedThisTextInput) {
            columnTextInputsAfter = columnTextInputsAfter.add(textInputElement);
            return;
        }

        // case: reached thisTextInput
        if (textInputElement.id === textInputId) {
            // case: include thisTextInput
            if (includeThisTextInput)
                columnTextInputsAfter = columnTextInputsAfter.add(textInputElement);

            reachedThisTextInput = true;
        }
    });

    return columnTextInputsAfter;
}



/**
 * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. textInputId)
 * @returns a JQuery of the last ```<TextInput />``` in given column or null if not found
 */
export function getLastTextInputOfColumn(documentId: string): JQuery | null {

    const columnTextInputs = getColumnTextInputs(documentId);
    if (!columnTextInputs || !columnTextInputs.length)
        return null;

    return $(columnTextInputs.get(columnTextInputs.length - 1)!);
}


/**
* @param textInputId id of text input to check the value of 
* @returns true if value of text input is marked
*/
export function isTextInputValueMarked(textInputId: string): boolean {

   if (!textInputId)
       return false;

   const textInput = $("#" + textInputId);
   return textInput.prop("selectionStart") !== textInput.prop("selectionEnd")
}


/**
* @param textInputId id of text input to get the marked value of 
* @returns the marked part of given text input's value
*/
export function getMarkedTextInputValue(textInputId: string): string {

    if (!textInputId)
        return "";
 
    const textInput = $("#" + textInputId);
    const selectionStart = textInput.prop("selectionStart");
    const selectionEnd = textInput.prop("selectionEnd");

    return (textInput.prop("value") as string).substring(selectionStart, selectionEnd);
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


/**
 * @param msWordFontSize font size in ms word
 * @returns the matching font size for browser. Adds a cretain amount to msWord font size
 */
export function getBrowserFontSizeByMSWordFontSize(msWordFontSize: number): number {

    return msWordFontSize + getFontSizeDiffInWord(msWordFontSize);
}


/**
 * @param browserFontSize font size in browser
 * @returns the matching font size for ms word. Adds a cretain amount to browser font size
 */
export function getMSWordFontSizeByBrowserFontSize(browserFontSize: number): number {

    const msWordFontSize = FONT_SIZES_WHOLE_SCALE.find(([msWordFontSize, fontSize]) => fontSize === browserFontSize);

    return msWordFontSize ? msWordFontSize[0] : -1;
}


/**
 * @param textInputId id of text input to compare text width to
 * @param testChars string that is not part of input value but should be included in value when calculating value's width
 * @param fontSize to use when calculating the text width instead of the font size of given text input
 * @param fontFamily to use when calculating the text width instead of the font family of given text input
 * @param fontWeight to use when calculating the text width instead of the font weight of given text input
 * @returns isTextTooLong: true if width of text is greater than width of input
 * 
 *          textOverheadWidth: width of the text that does not fit into text input
 */
export function isTextLongerThanInput(textInputId: string, 
                                      testChars: string, 
                                      fontSize?: string, 
                                      fontFamily?: string,
                                      fontWeight?: string): {isTextTooLong: boolean, textOverheadWidth: number} {

    const textInput = getJQueryElementById(textInputId);
    if (!textInput)
        return {isTextTooLong: false, textOverheadWidth: NaN};

    // insert test chars at correct position
    const cursorIndex = getCursorIndex(textInputId);
    let textInputValue = textInput.prop("value");
    textInputValue = insertString(textInputValue, testChars, cursorIndex);

    // measure width of text and tabs
    const textInputWidth = getCSSValueAsNumber(textInput.css("width"), 2) - getTextInputOverhead(textInputId);
    const textWidth = getTextWidth(textInputValue, fontSize || textInput.css("fontSize"), fontFamily || textInput.css("fontFamily"), fontWeight || textInput.css("fontWeight"));
    const totalTabWidth = getTotalTabWidthInText(textInputValue, fontSize || textInput.css("fontSize"), fontFamily || textInput.css("fontFamily"), fontWeight || textInput.css("fontWeight"));

    return {
        isTextTooLong: textInputWidth < textWidth + totalTabWidth, 
        textOverheadWidth: textWidth + totalTabWidth - textInputWidth
    };
}


/**
 * @param textInputId of text input to get the value from
 * @param targetWidth width of the text input value beeing retrieved
 * @param endOfText if true, the width measurment starts at the end of the text input value, else it will start in front
 * @returns longest substring of given text input's value that doesn't exceed given width
 */
export function getTextInputValueSubstringOfWidth(textInputId: string, targetWidth: number, endOfText = false): string | null {

    const textInput = getJQueryElementById(textInputId);
    if (!textInput)
        return null;

    const textInputValue: string = textInput.prop("value");
    const fontSize = textInput.css("fontSize");
    const fontFamily = textInput.css("fontFamily");
    const fontWeight = textInput.css("fontWeight");

    let charSequence = "";

    const measureAndCollectChars = (i: number): void => {
    
        const char = textInputValue.charAt(i);
        const width = getTextWidth(char + charSequence, fontSize, fontFamily, fontWeight);
        
        // case: targetWidth not exceeded yet
        if (width <= targetWidth)
            charSequence = endOfText ?  char + charSequence : charSequence + char;
    }

    // case: get end part of text input value
    if (endOfText) 
        for (let i = textInputValue.length - 1; i >= 0; i--) 
            measureAndCollectChars(i);

    // case: get start part of text input value
    else 
        for (let i = 0; i < textInputValue.length; i++) 
            measureAndCollectChars(i);

    return charSequence;
}


/**
 * @param textInputId id of the text input to check
 * @returns any space of selectedTextInput element's width like padding etc. that cannot be occupied by the text input value (in px).
 *          Return 0 if textInputId param is invalid
 */
export function getTextInputOverhead(textInputId: string): number {

    const textInput = getJQueryElementById(textInputId);
    if (!textInput)
        return 0;

    // add up padding and border
    const paddingRight = getCSSValueAsNumber(textInput.css("paddingRight"), 2);
    const paddingLeft = getCSSValueAsNumber(textInput.css("paddingLeft"), 2);
    const borderRightWidth = getCSSValueAsNumber(textInput.css("borderRightWidth"), 2);
    const borderLefttWidth = getCSSValueAsNumber(textInput.css("borderLeftWidth"), 2);

    return paddingRight + paddingLeft + borderRightWidth + borderLefttWidth;
}


/**
 * Trim file name and replace white space chars with '_'. 
 * If valid suffix is missing, append one depending on ```pdf``` param
 * 
 * @param documentFileName to adjust
 * @param pdf if true {@link PDF_SUFFIX} will be appended, else {@link DOCX_SUFFIX}
 * @returns valid document file name (not altering given param) or null if file name param is invalid
 */
export function adjustDocumentFileName(documentFileName: string | undefined, pdf = false): string | null {

    // case: no file name passed at all
    if (isBlank(documentFileName))
        documentFileName = DEFAULT_DOCUMENT_FILE_NAME;

    const [isPrefixValid, isSuffixValid] = isFileNameValid(documentFileName);

    // case: prefix invalid
    if (!isPrefixValid)
        return null;

    let fileName = documentFileName!.trim();

    fileName = fileName.replaceAll(" ", "_");

    // case: suffix invalid
    if (!isSuffixValid)
        // case: prefix + suffix both invalid
        if (!matchesAll(fileName, DOCUMENT_FILE_PREFIX_PATTERN))
            return null;

        // case: prefix + suffix valid
        else
            fileName = fileName += pdf ? PDF_SUFFIX : DOCX_SUFFIX;

    return fileName;
}


/**
 * @param fileName to check
 * @return true if file name without suffix matches {@link DOCUMENT_FILE_PREFIX_PATTERN} and suffix matches
 *         {@link DOCUMENT_FILE_SUFFIX_PATTERN}
 * 
 * @see {@link DOCX_SUFFIX}
 * @see {@link PDF_SUFFIX}
 */
export function isFileNameValid(fileName: string | undefined): [boolean, boolean] {

    const prefixAndSuffix = separateFileNameSuffix(fileName || "");

    // case: falsy fileName
    if (!prefixAndSuffix)
        return [false, false];

    const prefix = prefixAndSuffix[0];
    const suffix = prefixAndSuffix[1];

    return [matchesAll(prefix, DOCUMENT_FILE_PREFIX_PATTERN), suffix.match(DOCUMENT_FILE_SUFFIX_PATTERN) !== null];
}


/**
 * @param fileName to get prefix and suffix from
 * @returns a touple with```[prefix, suffix]``` where suffix is a substring starting at the last '.' of given file name. 
 *          I.e. ```Hello.world.pdf``` would return ```["Hello.world", ".pdf"]```.
 *          Return ```null``` if fileName is blank.
 */
function separateFileNameSuffix(fileName: string): [string, string] | null {

    if (isBlank(fileName))
        return null;

    const lastDotIndex = fileName.lastIndexOf(".");

    // case: no '.' at all
    if (lastDotIndex === -1)
        return [fileName, ""];

    const prefix = fileName.substring(0, lastDotIndex);
    const suffix = fileName.substring(lastDotIndex);

    return [prefix, suffix];
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
 * @param documentId to get the column id from
 * @returns column id extracted from document id
 */
export function documentIdToColumnId(documentId: string): string {

    const pageIndex = stringToNumber(getPartFromDocumentId(documentId, 1));
    const columnIndex = stringToNumber(getPartFromDocumentId(documentId, 2));
    const columnId = getDocumentId("Column", pageIndex, columnIndex);

    return columnId;
}