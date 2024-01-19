import React from "react";
import { Link } from "react-router-dom";
import "../../assets/styles/ErrorPages.css";


/**
 * Default page for any route not handled by Router in <App /> component (http 404).
 * 
 * @since 0.0.5
 */
export default function NotFound(props: {
    id?: string,
    className?: string,
    style?,
    children?
}) {

    const id = "NotFound" + (props.id || "");
    const className = "NotFound " + (props.className || "");

    return (
        <div id={id} className={className + " textCenter"}>
            <h1 className="mt-5">404</h1>

            <p>Es sieht so aus, als ob diese Seite nicht existiert.</p>

            <Link className="link" to="/">Zurück zum Dokument</Link>
        </div>
    )
}