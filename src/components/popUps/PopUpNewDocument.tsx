import React, { useContext, useEffect, useState } from "react"; 
import "../../assets/styles/PopUpNewDocument.css";
import { AppContext } from "../../App";
import { Orientation } from "../../enums/Orientation";
import RadioButton from "../helpers/RadioButton";
import { log } from "../../utils/Utils";
import { Link } from "react-router-dom";


export default function PopUpNewDocument(props) {

    const className = props.className ? "PopUpNewDocument " + props.classname : "PopUpNewDocument";
    const id = props.id ? "PopUpNewDocument " + props.id : "PopUpNewDocument";

    const [containerIndex, setContainerIndex] = useState(0);
    const [isContinue, setIsContinue] = useState(false);
    const [selectedOrientation, setSelectedOrientation] = useState(false);
    const [selectedNumColumns, setSelectedNumColumns] = useState(false);
    const [orientationClassName, setOrientationClassName] = useState("whiteButtonPortrait");

    const appContext = useContext(AppContext);


    useEffect(() => {
        
        if (containerIndex === 0) {
            if (selectedOrientation)
                setIsContinue(true);

            else 
                setIsContinue(false);
        
        } else if (containerIndex === 1) {
            if (selectedNumColumns)
                setIsContinue(true)

            else 
                setIsContinue(false);
        }
        
    }, [containerIndex, selectedOrientation, selectedNumColumns]);


    useEffect(() => {
        if (appContext.orientation === Orientation.PORTRAIT.toString())
            setOrientationClassName("whiteButtonPortrait")
        
        else    
            setOrientationClassName("whiteButtonLandscape");

    }, [appContext.orientation])


    /**
     * Toggle current and next container and update container index state.
     * 
     * @param prev if true move to previous container, else move to next one
     */
    function handleNextContainer(prev: boolean): void {

        const currentContainer = $(getContainerIdByIndex(containerIndex));

        const otherContainerClass = getContainerIdByIndex(prev ? containerIndex - 1 : containerIndex + 1);

        // case: no container in given direction
        if (otherContainerClass === "")
            return;

        const otherContainer = $(otherContainerClass);
    
        // toggle containers
        currentContainer.toggle();
        setTimeout(() => {
            otherContainer.toggle();
            otherContainer.css("display", "flex");
        }, 10);

        // update current index
        setContainerIndex(prev ? containerIndex - 1 : containerIndex + 1);
    }


    function getContainerIdByIndex(index: number): string {

        switch (index) {
            case 0: 
                return "#orientationContainer";
            
            case 1:
                return "#numColumnsContainer";

            default:
                return "";
        }
    }


    function handleSelectOrientation(orientation: Orientation): void {

        appContext.setOrientation(orientation);
        setSelectedOrientation(true);
    }


    function handleSelectNumColumns(numColumns: number): void {

        appContext.setNumColumns(numColumns);
        setSelectedNumColumns(true);
    }


    const nextButton = <button id="nextButton"
                                className={"slideButton slideLeftButton blackButton blackButtonContained buttonSmall" + (containerIndex === 1 ? " hidePopUp" : "")}// last container
                                onClick={() => handleNextContainer(false)}
                                disabled={!isContinue}>
                            {/* last container */}
                            {containerIndex === 1 ? "Fertig" : "Weiter"}
                        </button>;


    return (
        <div id={id} className={className}> 
            <div className="header flexRight">
                <img src={"closeX.png"} alt="close icon" className="smallIconButton hidePopUp"/>
            </div>
            
            <div className="body flexCenter">
                <div id="orientationContainer" className="orientationContainer flexCenter">
                    <RadioButton id="Portrait"
                                 className="radioContainer" 
                                 labelClassName="whiteButton whiteButtonPortrait"
                                 name="Orientation" 
                                 handleSelect={() => handleSelectOrientation(Orientation.PORTRAIT)}>
                        Hoch-Format
                    </RadioButton>
                    
                    <RadioButton id="Landscape"
                                 className="radioContainer"
                                 labelClassName="whiteButton whiteButtonLandscape"
                                 name="Orientation"
                                 handleSelect={() => handleSelectOrientation(Orientation.LANDSCAPE)}>
                        Quer-Format
                    </RadioButton>
                </div>

                <div id="numColumnsContainer" className="numColumnsContainer flexCenter">
                    <div className="radioContainer">
                        <RadioButton id="OneColumn" 
                                    labelClassName={"whiteButton " + orientationClassName}
                                    name="NumColumns"
                                    handleSelect={() => handleSelectNumColumns(1)}>
                            <div style={{height: "100%"}}>Lorem ipsum</div>
                        </RadioButton>
                        <span>1 Spalte</span>
                    </div>

                    <div className="radioContainer">
                        <RadioButton id="TwoColumns" 
                                    labelClassName={"whiteButton " + orientationClassName}
                                    name="NumColumns"
                                    handleSelect={() => handleSelectNumColumns(2)}>
                            <div className="verticalBorderRightDotted" style={{width: "50%"}}>
                                Lorem ipsum
                            </div>
                            <div style={{width: "50%"}}></div>
                        </RadioButton>
                        <span>2 Spalten</span>
                    </div>

                    <div className="radioContainer">
                        <RadioButton id="ThreeColumns" 
                                    labelClassName={"whiteButton " + orientationClassName}
                                    name="NumColumns"
                                    handleSelect={() => handleSelectNumColumns(3)}>
                            <div className="verticalBorderRightDotted" style={{width: "33%"}}>
                                Lorem ipsum
                            </div>
                            <div className="verticalBorderRightDotted" style={{width: "33%"}}></div>
                            <div style={{width: "33%"}}></div>
                        </RadioButton>
                        <span>3 Spalten</span>
                    </div>
                </div>
            </div>

            <div className="footer">
                <div className="flexLeft">
                    <button id="prevButton"
                            className="slideButton slideRightButton blackButton blackButtonContained buttonSmall"
                            onClick={() => handleNextContainer(true)}
                            disabled={containerIndex === 0}>
                        Zurück
                    </button>
                </div>

                <div className="flexRight">
                    {containerIndex === 1 ? // last container
                        <Link to="/build" className="whiteLink">{nextButton}</Link> : 
                        nextButton
                    }       
                </div>
            </div>
        </div>
    )
}