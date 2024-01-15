import React, { useContext, useEffect, useState, createContext, useRef } from "react";
import "../../assets/styles/Document.css";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { confirmPageUnload, flashClass, getJQueryElementById, getRandomString, insertString, isBlank, log, logError, logWarn, moveCursor, setCssVariable, stringToNumber } from "../../utils/basicUtils";
import { AppContext } from "../App";
import StylePanel from "./StylePanel";
import { API_ENV, DEFAULT_FONT_SIZE, SINGLE_COLUMN_LINE_CLASS_NAME, MAX_FONT_SIZE_SUM_LANDSCAPE, MAX_FONT_SIZE_SUM_PORTRAIT, SELECT_COLOR, TAB_UNICODE, NUM_PAGES, PAGE_WIDTH_PORTRAIT, PAGE_WIDTH_LANDSCAPE } from "../../globalVariables";
import ControlPanel from "./ControlPanel";
import TextInput from "./TextInput";
import { Orientation } from "../../enums/Orientation";
import { getCSSValueAsNumber, getColumnIdByDocumentId, getDocumentId, getFontSizeDiffInWord, getPageIdByDocumentId, getPartFromDocumentId, isTextInputIdValid } from "../../utils/documentBuilderUtils";
import PopupContainer from "../helpers/popups/PopupContainer";
import Style, { StyleProp, applyTextInputStyle, getDefaultStyle, getTextInputStyle } from "../../abstract/Style";
import Page from "./Page";


// TODO: add some kind of "back" button
// TODO: update to bootstrap 5
// TODO: fix console errors

export default function Document(props) {

    const id = props.id ? "Document" + props.id : "Document";
    const className = props.className ? "Document " + props.className : "Document";

    const appContext = useContext(AppContext);

    const [escapePopup, setEscapePopup] = useState(true);
    const [popupContent, setPopupContent] = useState<React.JSX.Element>();
    const [subtlePopupContent, setSubtlePopupContent] = useState("");


    const [pages, setPages] = useState<React.JSX.Element[]>(initPages());
    const [selectedTextInputId, setSelectedTextInputId] = useState("");
    const [selectedTextInputStyle, setSelectedTextInputStyleState] = useState(getDefaultStyle());

    const [orientation, setOrientation] = useState(Orientation.PORTRAIT);
    const [numColumns, setNumColumns] = useState(1);
    const [numSingleColumnLines, setNumSingleColumnLines] = useState(0);
    const [documentFileName, setDocumentFileName] = useState("Dokument_1.docx");

    /** <Paragraph /> component listens to changes of these states and attempts to append or remove a <TextInput /> at the end */
    const [paragraphIdAppendTextInput, setParagraphIdAppendTextInput] = useState<[string[], number]>(); // [paragraphIds, numTextInputsToAppend]
    const [paragraphIdRemoveTextInput, setParagraphIdRemoveTextInput] = useState<[string[], number]>(); // [paragraphIds, numTextInputsToRemove]
    
    /** serves as notification for the singleColumnLines state in ```<Page />``` component to refresh */
    const [refreshSingleColumnLines, setRefreshSingleColumnLines] = useState(false);

    const windowScrollY = useRef(0);
    const documentPopupRef = useRef(null);
    const documentOverlayRef = useRef(null);

    const context = {
        isTextInputHeading,
        refreshSingleColumnLines, 
        setRefreshSingleColumnLines,

        isFontSizeTooLarge,
        handleFontSizeTooLarge,
        getNumLinesOverhead,
        appendTextInput,
        removeTextInput,
        paragraphIdAppendTextInput,
        setParagraphIdAppendTextInput,
        paragraphIdRemoveTextInput,
        setParagraphIdRemoveTextInput,
        getParagraphIdByDocumentId,
        getParagraphIdsForFontSizeChange,

        getColumnTextInputs,
        getColumnFontSizesSum,
        getLastTextInputOfColumn,
        checkIsColumnEmptyById,

        togglePopup,
        hidePopup,
        popupContent,
        setPopupContent,
        showSubtlePopup,
        subtlePopupContent,
        setSubtlePopupContent,

        focusTextInput,
        unFocusTextInput,

        setSelectedTextInputStyle,
        setPages,
        initPages,
        orientation,
        setOrientation,
        numColumns,
        setNumColumns,
        numSingleColumnLines, 
        setNumSingleColumnLines,
        selectedTextInputId,
        setSelectedTextInputId,
        selectedTextInputStyle,
        documentFileName,
        setDocumentFileName,
    };


    useEffect(() => {
        if (API_ENV !== "dev")
            confirmPageUnload();

        appContext.hidePopup();
        
        window.addEventListener('scroll', handleScroll);

        setCssVariable("selectedColor", SELECT_COLOR);
        setCssVariable("appBackgroundColor", "white");
        setCssVariable("pageWidthPortrait", PAGE_WIDTH_PORTRAIT);
        setCssVariable("pageWidthLandscape", PAGE_WIDTH_LANDSCAPE);

    }, []);


    function handleDocumentClick(event): void {

        const targetClassName = event.target.className;

        // hide popup
        if (targetClassName.includes("hideDocumentPopup") && escapePopup)
            hidePopup();
    }


    /**
     * @param style to update selectedTextInputStyle with
     * @param stylePropsToOverride style props to override in ```style``` param
     */
    function setSelectedTextInputStyle(style: Style, stylePropsToOverride?: [StyleProp, string | number][]): void {

        // set specific props
        if (stylePropsToOverride) 
            stylePropsToOverride.forEach(([styleProp, value]) => style[styleProp.toString()] = value);
        
        setSelectedTextInputStyleState(style);
    }


    /**
     * @param textInputId id of valid ```<TextInput />``` to focus
     * @param updateSelectedTextInputStyle if true, the ```selectedTextInputStyle``` state will be updated with focused text input style
     * @param updateSelectedTextInputStyle if true, the ```selectedTextInputStyle``` will be applied to text input with ```selectedTextInputId```
     * @param stylePropsToOverride list of style properties to override when copying styles 
     */
    function focusTextInput(textInputId: string, 
                            updateSelectedTextInputStyle = true, 
                            applySelectedTextInputStyle = true,
                            stylePropsToOverride?: [StyleProp, string | number][]): void {

        if (!isTextInputIdValid(textInputId))
            return;

        const textInput = getJQueryElementById(textInputId);
        if (!textInput)
            return;

        textInput.addClass("textInputFocus");

        // id state
        setSelectedTextInputId(textInputId);

        // style state
        if (updateSelectedTextInputStyle) 
            setSelectedTextInputStyle(getTextInputStyle(textInput), stylePropsToOverride);

        // style text input
        if (applySelectedTextInputStyle)
            applyTextInputStyle(textInputId, selectedTextInputStyle);

        textInput.trigger("focus");
    }


    function unFocusTextInput(textInputId: string, debug = true): void {

        const textInput = getJQueryElementById(textInputId, debug);
        if (!textInput)
            return;

        textInput.removeClass("textInputFocus");
    }
        

    function initPages(): React.JSX.Element[] {

        const pages: React.JSX.Element[] = [];

        for (let i = 0; i < NUM_PAGES; i++)
            pages.push((
                <div className="flexCenter" key={i}>
                    <Page pageIndex={i} />
                </div>
            ));

        return pages;
    }
    

    /**
     * @returns true if no chars are found in any text input of selected column, else false (Tabs and spaces don't count as chars here)
     */
    function checkIsColumnEmptyById(documentId: string): boolean {

        const columnTextInputs = getColumnTextInputs(documentId);
        if (!columnTextInputs)
            return false;

        let isEmpty = true;

        Array.from(columnTextInputs).forEach(textInputElement => {
            const textInput = textInputElement as HTMLInputElement;

            if (!isBlank(textInput.value)) {
                isEmpty = false;
                return;
            }
        });

        return isEmpty;
    }


    /**
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @returns jquery of all ```<TextInput />``` components inside given column or ```null``` if column was not found.
     *          Also include ```<TextInput />```components in page with className {@link SINGLE_COLUMN_LINE_CLASS_NAME}.
     */
    function getColumnTextInputs(documentId = selectedTextInputId): JQuery | null {

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
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @returns jquery of all ```<TextInput />``` components inside given paragraph or ```null``` if paragraph was not found
     */
    function getColumnParagraphs(documentId = selectedTextInputId): JQuery | null {

        const docxElement = getJQueryElementById(documentId);
        if (!docxElement)
            return null;

        const columnId = getColumnIdByDocumentId(documentId);

        return $("#" + columnId + " .Paragraph");
    }


    /**
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @returns sum of font sizes of all text inputs in column (in px) or -1 if column was not found
     * 
     * @see getFontSizeDiffInWord
     */
    function getColumnFontSizesSum(documentId = selectedTextInputId): number {

        const columnTextInputs = getColumnTextInputs(documentId);

        if (!columnTextInputs || !columnTextInputs.length)
            return -1;

        let sum = 0;
        columnTextInputs.each((i, textInputElement) => {
            const textInput = $("#" + textInputElement.id);
            const fontSize = textInput.css("fontSize");

            if (fontSize) {
                const fontSizeNumber = getCSSValueAsNumber(fontSize, 2);
                sum += fontSizeNumber - getFontSizeDiffInWord(fontSizeNumber)
            }
        });

        return sum;
    }


    /**
     * Append new ```<TextInput />``` to ```textInputs``` state (passed as param).
     *
     * @param textInputs array of ```<TextInput />``` (state) to add new text input to
     * @param setTextInputs state setter to use
     * @param pageIndex index of page to append the text input to
     * @param columnIndex index of column to append the text input to
     * @param paragraphIndex index of paragraph to append the text input to
     * @param numTextInputs number of text inputs to append
     * @returns array with the appended ```<TextInput />```s
     */
    function appendTextInput(textInputs: React.JSX.Element[],
                            setTextInputs: (textInputs: React.JSX.Element[]) => void,
                            pageIndex: number,
                            columnIndex: number,
                            paragraphIndex: number,
                            numTextInputs = 1): React.JSX.Element[] {

        let newTextInputs: React.JSX.Element[] = [];

        for (let i = 0; i < numTextInputs; i++) {
            newTextInputs.push(<TextInput key={getRandomString()}
                                            pageIndex={pageIndex}
                                            columnIndex={columnIndex}
                                            paragraphIndex={paragraphIndex}
                                            textInputIndex={textInputs.length + i}
                                            isSingleColumnLine={false}
                                            />);
        }

        setTextInputs([...textInputs, ...newTextInputs]);

        return newTextInputs;
    }


    /**
     * Remove ```<TextInput />``` from given ```textInputs``` array at given ```index```.
     *
     * @param textInputs array of ```<TextInput />``` (state) to add new text input to
     * @param setTextInputs state setter to use
     * @param index of text input position in given ```textInputs``` array to remove the text input at
     * @param deleteCount  number of elements to remove
     * @returns array with the removed ```<TextInput />```s
     */
    function removeTextInput(textInputs: React.JSX.Element[],
                            setTextInputs: (textInputs: React.JSX.Element[]) => void,
                            index: number = textInputs.length - 1,
                            deleteCount = 1): React.JSX.Element[] {

        const removedTextInput = textInputs.splice(index, deleteCount);

        setTextInputs([...textInputs]);

        return removedTextInput;
    }


    /**
     * Try to remove text inputs at the end of the column of given textInputId. Don't remove any text input if at least 
     * one is not blank and try to flash text input border instead.
     * 
     * @param flash if true, the given text input will flash if no text input can be removed, default is true
     * @param deleteCount number of lines to remove if blank, default is 1
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @returns false if the fontSize should not be changed, else true
     */
    // TODO: handle value too large
    function handleFontSizeTooLarge(flash = true, deleteCount = 1, documentId = selectedTextInputId): boolean {

        const columnTextInputs = getColumnTextInputs(documentId);
        if (!columnTextInputs) {
            logError("'handleFontSizeTooLarge()' failed. 'columnTextInputs' is falsy.");
            return false;
        }

        // get last textinputs
        let areTextInputsBlank = true;
        let areTextInputsToDeleteFocused = false;
        const columnTextInputsToDelete = Array.from(columnTextInputs).slice(columnTextInputs.length - deleteCount);

        // check for non blank textInputs
        columnTextInputsToDelete.forEach(textInput => {
            // case: is not blank
            if (areTextInputsBlank && !isBlank((textInput as HTMLInputElement).value))
                areTextInputsBlank = false;

            // case: is focused
            if (!areTextInputsToDeleteFocused && textInput.id === selectedTextInputId)
                areTextInputsToDeleteFocused = true;
        });

        // case: last input blank
        if (areTextInputsBlank && !areTextInputsToDeleteFocused) {
            const paragraphIndex = getParagraphIndexOfLastTextInputInColumn(documentId);
            const paragraphIds = getParagraphIdsForFontSizeChange(documentId, paragraphIndex);
            setParagraphIdRemoveTextInput([paragraphIds, deleteCount]);

        // case: last input not blank
        } else {
            // case: warn user
            if (flash) {
                flashClass(selectedTextInputId, "textInputFlash", "textInputFocus");
                showSubtlePopup("Kann Schriftgröße nicht ändern", "Lösche ein paar der unteren Zeilen auf dieser Seite, um die Schriftgröße zu ändern.");
            }

            return false;
        }

        return true;
    }


    /**
     * @param textInputId to check
     * @returns true if ```<TextInput />``` has {@link SINGLE_COLUMN_LINE_CLASS_NAME}
     */
    function isTextInputHeading(textInputId = selectedTextInputId): boolean {

        if (isBlank(textInputId)) {
            logWarn("'isTextInputHeading()' failed. 'textInputId' is blank")
            return false;
        }

        const textInput = $("#" + textInputId);
        if (!textInput.length) {
            logWarn("'isTextInputHeading()' failed. 'textInput' is falsy")
            return false;
        }

        return textInput.prop("className").includes(SINGLE_COLUMN_LINE_CLASS_NAME);
    }


    /**
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @param paragraphIndex index of paragraph in column, relevant if only one column is changed
     * @param isSingleColumnLine true if text input component is heading
     * @returns array of paragraph ids that should be considered for font size change
     */
    function getParagraphIdsForFontSizeChange(documentId = selectedTextInputId, paragraphIndex?: number, isSingleColumnLine = isTextInputHeading()): string[] {

        const paragraphIds: string[] = [];

        // case: is heading
        if (isSingleColumnLine) {
            const pageIndex = stringToNumber(getPartFromDocumentId(documentId, 1));
            
            // add lines to all columns
            for (let i = 0; i < numColumns; i++)
                paragraphIds.push(getParagraphIdByDocumentId(getDocumentId("Column", pageIndex, "", i), paragraphIndex));

        // case: normal line
        } else 
            paragraphIds.push(getParagraphIdByDocumentId(documentId, paragraphIndex));

        return paragraphIds;
    }


    /**
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @param diff amount of px to consider when comparing ```columnFontSizesSum``` to ```maxSum```. Will be added to ```columnFontSizesSum```. 
     * @returns a touple formatted like: ```[isFontSizeTooLarge, numLinesOverhead]``` where numLinesOverhead is the number
     *          of lines that should be removed to match the MAX_NUM_LINES.
     */
    function isFontSizeTooLarge(documentId = selectedTextInputId, diff = 0): [boolean, number] {

        const columnFontSizesSum = getColumnFontSizesSum(documentId);
        
        if (columnFontSizesSum === -1)
            return [false, -1];

        const numLinesOverhead = Math.abs(getNumLinesOverhead(documentId, diff, columnFontSizesSum));

        const maxSum = orientation === Orientation.PORTRAIT ? MAX_FONT_SIZE_SUM_PORTRAIT : MAX_FONT_SIZE_SUM_LANDSCAPE;

        // case: adding numLinesOverhead would exceed max value
        if (columnFontSizesSum + numLinesOverhead > maxSum)
            return [true, numLinesOverhead];

        return [false, numLinesOverhead];
    }


    /**
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @param diff amount of px to consider when comparing ```columnFontSizesSum``` to ```maxSum```. Will be added to ```columnFontSizesSum```.
     * @param columnFontSizesSum sum of fontSizes of all text inputs in this column. If present it wont be calculated again to increase performance 
     * @returns number of lines with fontSize {@link DEFAULT_FONT_SIZE} by which the number of lines in the given ```<Column />``` differes from max num lines.
     *          Return -1 if no column is selected yet.
     */
    function getNumLinesOverhead(documentId = selectedTextInputId, diff = 0, columnFontSizesSum?: number): number {

        // case: no sum in param
        if (!columnFontSizesSum)
            columnFontSizesSum = getColumnFontSizesSum(documentId);

        // case: invalid document id
        if (columnFontSizesSum === -1)
            return -1;

        columnFontSizesSum += diff;
        
        const maxSum = orientation === Orientation.PORTRAIT ? MAX_FONT_SIZE_SUM_PORTRAIT : MAX_FONT_SIZE_SUM_LANDSCAPE;
        
        const totalDiff = maxSum - columnFontSizesSum;

        return Math.floor(totalDiff / DEFAULT_FONT_SIZE);
    }


    /**
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @param paragraphIndex index of the paragraph inside the column, will be set to last paragraph in column if not present
     * @returns id of the paragraph found with given params. Contains -1 as paragraphIndex if paragraph wasn't found
     */
    function getParagraphIdByDocumentId(documentId = selectedTextInputId, paragraphIndex?: number): string {

        // set default paragraph index to last paragraph in column
        if (!paragraphIndex) {
            const columnParagraphs = getColumnParagraphs(documentId);

            if (!columnParagraphs) 
                paragraphIndex = -1;
                
            else 
                paragraphIndex = columnParagraphs.length - 1;
        }

        const pageIndex = getPartFromDocumentId(documentId, 1);
        const columnIndex = getPartFromDocumentId(documentId, 2);

        const paragraphId = getDocumentId("Paragraph", stringToNumber(pageIndex), "", stringToNumber(columnIndex), paragraphIndex);

        return paragraphId;
    }


    /**
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @return index of last ```<Paragraph />``` with a ```<TextInput />``` in it in given ```<Column />``` or -1
     */
    function getParagraphIndexOfLastTextInputInColumn(documentId = selectedTextInputId): number {

        const lastTextInputOfColumn = getLastTextInputOfColumn(documentId);
        if (!lastTextInputOfColumn)
            return -1;

        const paragraph = lastTextInputOfColumn.parents(".Paragraph");
        if (!paragraph.length)
            return -1;

        return stringToNumber(getPartFromDocumentId(paragraph.prop("id"), 3));
    }


    /**
     * @param documentId in order to identify the column. Must be a columnId or a deeper level (i.e. paragraphId or textInputId). Default is selectedTextInputId
     * @returns a JQuery of the last ```<TextInput />``` in given column or null if not found
     */
    function getLastTextInputOfColumn(documentId: string): JQuery | null {

        const columnTextInputs = getColumnTextInputs(documentId);
        if (!columnTextInputs || !columnTextInputs.length)
            return null;

        return $(columnTextInputs.get(columnTextInputs.length - 1)!);
    }


    function handleScroll(event): void {

        const currentScrollY = window.scrollY;

        const controlPanelHeight = $(".ControlPanel").css("height");
        const isScrollUp = windowScrollY.current > currentScrollY;

        // move controlPanel in view
        $(".StylePanel").css("top", isScrollUp ? controlPanelHeight : 0);
        
        // update ref
        windowScrollY.current = currentScrollY;
    }


    function togglePopup(duration = 100): void {

        const documentPopup = $(documentPopupRef.current);
        documentPopup.fadeToggle(duration);
        documentPopup.css("display", "flex");

        $(documentOverlayRef.current).fadeToggle(duration);

        // case: is hidden now
        if (!documentPopup.is(":visible"))
            resetDocumentPopup(setPopupContent);
    }


    function hidePopup(duration = 100): void {

        const documentPopup = $(documentPopupRef.current);
        documentPopup.fadeOut(duration);

        $(documentOverlayRef.current).fadeOut(duration);

        resetDocumentPopup(duration);
    }


    function resetDocumentPopup(duration = 100): void {

        setTimeout(() => {
            setPopupContent(<></>);
            
        }, duration + 100);
    }


    /**
     * @param summary heading to display inside popup, may be a plain string or html
     * @param content content to display inside popup, may be a plain string or html
     * @param warn if true, the popup will be styles as warn popup, else as error popup, default is true (warn style)
     * @param duration time in ms that the popup should fade in, default is 100
     * @param holdTime time in ms that the popup should stay displayed and should fade out, default is 2000
     */
    function showSubtlePopup(summary: string | React.JSX.Element, content: string | React.JSX.Element, warn = true, duration = 100, holdTime = 3000): void {

        const subtlePopup = getJQueryElementById("PopupSubtle" + (warn ? "Warn" : "Error"));
        if (!subtlePopup)
            return;

        // case: is displayed already
        if (subtlePopup.is(":visible")) 
            return;

        subtlePopup.fadeIn(duration);

        const fadeOutCallback = setTimeout(() => subtlePopup.fadeOut(holdTime), holdTime);
        
        // TODO: continue here, clear timeout on hover, start timeout on mouseout
        setSubtlePopupContent(
            <div onMouseMove={() => clearTimeout(fadeOutCallback)} onMouseOut={() => setTimeout(() => subtlePopup.fadeOut(holdTime), holdTime)}>
                <h6>{summary}</h6>
                <div>{content}</div>
            </div>
        );
    }


    return (
        <div id={id} className={className} onClick={handleDocumentClick}>
            <DocumentContext.Provider value={context}>
                <div className="documentOverlay hideDocumentPopup" ref={documentOverlayRef}></div>

                {/* document popup */}
                <div className="flexCenter">
                    <PopupContainer id={"Document"} className="hideDocumentPopup" ref={documentPopupRef}>
                        {popupContent}
                    </PopupContainer>
                </div>
                
                <ControlPanel />

                <StylePanel />

                <div className="pageContainer">
                    {pages}
                </div>
            </DocumentContext.Provider>
        </div>
    );
}


export const DocumentContext = createContext();