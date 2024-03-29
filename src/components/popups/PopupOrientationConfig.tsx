import React, { useContext, useState } from "react"; 
import "../../assets/styles/PopupOrientationConfig.css";
import useCookie from "react-use-cookie";
import { AppContext } from "../App";
import { Orientation } from "../../enums/Orientation";
import RadioButton from "../helpers/RadioButton";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { log } from "../../utils/basicUtils";
import Button from "../helpers/Button";
import Popup from "./Popup";
import PopupWarnConfirm from "./PopupWarnConfirm";
import { DocumentContext } from "../document/Document";
import PopupContainer from "./PopupContainer";
import { DONT_SHOW_AGAIN_COOKIE_NAME } from "../../globalVariables";
import { getDefaultStyle } from "../../abstract/Style";


/**
 * Popup content used for changing the document orientation.
 * 
 * @since 0.0.6
 */
export default function PopupOrientationConfig(props: {
    id?: string,
    className?: string,
    children?,
    warnPopupContainerIdPart: string,
    toggleWarnPopup: (warnPopupId: string, duration?: number) => void
}) {

    const className = "PopupOrientationConfig " + (props.className || "");
    const id = "PopupOrientationConfig" + (props.id || "");

    const appContext = useContext(AppContext);
    const documentContext = useContext(DocumentContext);

    const [orientation, setOrientation] = useState(documentContext.orientation);
    const [dontShowAgainCookie, setDontShowAgainCookie] = useCookie(DONT_SHOW_AGAIN_COOKIE_NAME + "OrientationConfig", "false");


    function handleSelectOrientation(orientation: Orientation): void {

        setOrientation(orientation);
    }


    function handleSubmit(event): void {
        
        // reset all columns
        documentContext.setRefreshColumns(!documentContext.refreshColumns);

        // update selectedTextInputStyle state
        documentContext.setSelectedTextInputStyle(getDefaultStyle());

        // update orientation state
        documentContext.setOrientation(orientation);

        documentContext.hidePopup();
    }


    function toggleWarnPopup(event, duration = 100): void {

        // case: selected same orientation
        if (orientation === documentContext.orientation) {
            documentContext.hidePopup(duration);
            return;
        }

        // case: dont show again
        if (dontShowAgainCookie === "true") {
            handleSubmit(event)
            return;
        }

        props.toggleWarnPopup("PopupContainer" + props.warnPopupContainerIdPart, duration);
    }


    return (
        <div id={id} className={className + " dontMarkText"}> 
            <div className="popupHeader flexRightStart">
                <i className="fa-solid fa-xmark fa-xl closeIcon hideDocumentPopup"></i>
            </div>
            
            <div className="popupBody">
                <h2 className="textCenter">Ausrichtung ändern</h2>
                
                <div className="bodyContent flexCenter">
                    <div id="orientationContainer" className="orientationContainer flexCenter">
                        <div className="col-12 col-sm-4">
                            <RadioButton id="Portrait"
                                        className="flexCenter" 
                                        labelClassName="whiteButton whiteButtonPortrait"
                                        childrenClassName="flexCenterStart"
                                        name="Orientation" 
                                        value={Orientation.PORTRAIT}
                                        radioGroupValue={orientation}
                                        handleSelect={handleSelectOrientation}
                                        boxStyle={{
                                            borderRadius: "3px",
                                            boxShadow: "0 1px 3px 0px rgb(151, 151, 151)",
                                            padding: "2px"
                                        }}
                                        checkedStyle={{backgroundColor: "rgb(238, 238, 238)"}}
                                        hoverBackgroundColor="rgb(243, 243, 243)"
                                        >
                                <span style={{fontSize: "10px"}}>Lorem ipsum</span>
                            </RadioButton>
                            <div className="mt-2 textCenter">Hoch-Format</div>
                        </div>
                        
                        <div className="col-12 col-sm-6 col-md-5 mt-3 mt-sm-0">
                            <RadioButton id="Landscape"
                                        className="flexCenter"
                                        labelClassName="whiteButton whiteButtonLandscape"
                                        childrenClassName="flexCenterStart"
                                        name="Orientation"
                                        value={Orientation.LANDSCAPE}
                                        radioGroupValue={orientation}
                                        handleSelect={handleSelectOrientation}
                                        boxStyle={{
                                            borderRadius: "3px",
                                            boxShadow: "0 1px 3px 0px rgb(151, 151, 151)",
                                            padding: "2px"
                                        }}
                                        checkedStyle={{backgroundColor: "rgb(238, 238, 238)"}}
                                        hoverBackgroundColor="rgb(243, 243, 243)"
                                        >
                                <span style={{fontSize: "10px"}}>Lorem ipsum</span>
                            </RadioButton>
                            <div className="mt-2 textCenter">Quer-Format</div>
                        </div>
                    </div>

                    <PopupContainer id={props.warnPopupContainerIdPart} className="warnPopupContainer" matchPopupDimensions={documentContext.matchPopupDimensions}>
                        <Popup id={props.warnPopupContainerIdPart} height={appContext.isMobileView ? "350px" : "medium"} width="medium">
                            <PopupWarnConfirm id="OrientationConfig"
                                                handleConfirm={handleSubmit} 
                                                handleDecline={(event) => toggleWarnPopup(event)}
                                                hideThis={(event) => toggleWarnPopup(event)}
                                                displayDontShowAgainCheckbox={true}
                                                checkboxContainerClassname="flexCenter mt-5"
                                                setDontShowAgainCookie={setDontShowAgainCookie}
                                                >
                                <p className="textCenter">Der Inhalt des <strong>gesamten</strong> Dokumentes wird <strong>gelöscht</strong> werden.</p>
                                <p className="textCenter">Fortfahren?</p>
                            </PopupWarnConfirm>
                        </Popup>
                    </PopupContainer>
                </div>
            </div>

            <div className="popupFooter flexRight" >
                <Button id={id + "Submit"} 
                        className="blackButton blackButtonContained"
                        childrenStyle={{padding: "5px 10px"}}
                        hoverBackgroundColor="rgb(70, 70, 70)"
                        clickBackgroundColor="rgb(130, 130, 130)"
                        onClick={(event) => toggleWarnPopup(event)}
                        type="submit"
                        >
                    Anwenden
                </Button>
            </div>
        </div>
    )
}