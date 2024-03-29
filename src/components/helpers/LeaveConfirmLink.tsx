import React from "react";
import "../../assets/styles/LeavConfirmLink.css";
import { Link, useLocation } from "react-router-dom";


/**
 * Custom Link. Only difference is the onClick handler, which confirms page leave if user leaves a path 
 * included in ```props.pathsToConfirm```
 * 
 * @returns react-router-dom Link with confirm function on click
 */
export default function LeaveConfirmLink(props: {
    id?,
    className?, 
    style?,
    children?,
    to: string,
    /** paths to use the confirm popup for */
    pathsToConfirm: string[]
}) {

    const id = "LeaveConfirmLink" + (props.id || "");
    const className = "LeaveConfirmLink " + (props.className || "");
    const location = useLocation();


    /**
     * Makes user confirm and prevents default event if confirm alert was canceld. Only confirm if 
     * current location matches at least one of ```props.pathsToConfirm```
     * 
     * @param event 
     */
    function confirmNavigate(event): void {

        const confirmLeaveMessage = "Seite verlassen? \nVorgenommene Änderungen werden unter Umständen nicht gespeichert."

        if (props.pathsToConfirm.includes(location.pathname) && !window.confirm(confirmLeaveMessage))
            event.preventDefault();
    }

    
    return (
        <Link id={id}     
              className={className} 
              to={props.to} 
              style={props.style} 
              onClick={confirmNavigate}>
            {props.children}
        </Link>
    );
}