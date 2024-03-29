import { CSRF_TOKEN, DOCUMENT_BUILDER_BASE_URL } from "../globalVariables";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { log, logApiResponse, logError } from "./basicUtils";
import { ApiExceptionFormat } from './../abstract/ApiExceptionFormat';


/**
 * Sends an http request using given url, method and body. Log jsonResponse if {@link isHttpStatusCodeAlright()} is false.<p>
 * 
 * Fetch errors will be returned as {@link ApiExceptionFormat}.
 * 
 * @param url to send the request to
 * @param method http request method, default is "get"
 * @param body (optional) to add to the request
 * @param headers json object with strings as keys and values
 * @returns a promise with the json response or an {@link ApiExceptionFormat} object in it
 * @since 0.0.1
 */
export default async function fetchJson(url: string, method = "get", body?: object, headers?): Promise<Response | ApiExceptionFormat> {
    
    // set headers
    const fetchConfig: RequestInit = {
        method: method,
        headers: await getFetchHeaders(headers, false),
        credentials: "include"
    }

    // case: request has body
    if (body) 
        fetchConfig.body = JSON.stringify(body);

    // send request
    try {
        const response = await fetch(url, fetchConfig);
        const jsonResponse = await response.json();

        // case: request failed
        if (!isHttpStatusCodeAlright(response.status)) {
            // try with new csrf token
            if (response.status === 403)
                return await handleForbiddenReturnJson(url, fetchConfig);

            logApiResponse(jsonResponse);
        }
        
        return jsonResponse;

    // case: failed to fetch
    } catch(e) {
        return handleFetchError(e, url);
    }
}


/**
 * Sends an http request using given url, method and body. Will only log fetch errors.<p>
 * 
 * Fetch errors will be returned as {@link ApiExceptionFormat}.
 * 
 * @param url to send the request to
 * @param method http request method, default is "get"
 * @param body (optional) to add to the request
 * @param headers json object with strings as keys and values
 * @returns a promise with the response or an {@link ApiExceptionFormat} object in it
 * @since 0.0.6
 */
export async function fetchAny(url: string, method = "get", body?: object, headers?): Promise<Response | ApiExceptionFormat> {
    
    // set headers
    const fetchConfig: RequestInit = {
        method: method,
        headers: await getFetchHeaders(headers),
        credentials: "include"
    }

    // case: request has body
    if (body) 
        fetchConfig.body = JSON.stringify(body);

    // send request
    try {
        const response = await fetch(url, fetchConfig);

        // case: request failed
        if (!isHttpStatusCodeAlright(response.status)) {
            // try with fresh csrf token
            if (response.status === 403)
                return await handleForbiddenReturnAny(url, fetchConfig);

            logApiResponse(await response.json());
        }
        
        return response;

    // case: failed to fetch
    } catch(e) {
        return handleFetchError(e, url);
    }
}


/**
 * Fetch content from givn url and call ```URL.createObjectURL(response.blob())``` on it.
 * 
 * @param url to send the request to
 * @param method http request method, default is "get"
 * @param body (optional) to add to the request
 * @param headers json object with strings as keys and values
 * @returns a Promise with a url object containing the blob, that can be downloaded with an ```<a></a>``` tag. If error, return
 *          {@link ApiExceptionFormat} object
 */
export async function fetchAnyReturnBlobUrl(url: string, method = "get", body?: object, headers?: any): Promise<string | ApiExceptionFormat> {

    const response = await fetchAny(url, method, body, headers);

    // case: request failed
    if (!isHttpStatusCodeAlright(response.status))
        return response as ApiExceptionFormat;

    const blob = await (response as Response).blob();

    // case: falsy blob
    if (!blob) {
        const error: ApiExceptionFormat = {
            status: 406, // not acceptable
            error: null,
            message: "Failed to get blob from resopnse.",
            path: url.replace(DOCUMENT_BUILDER_BASE_URL, "")
        }

        logApiResponse(error);

        return error;
    }

    return URL.createObjectURL(blob);
}


/**
 * @param statusCode http status code to check
 * @returns true if status code is informational (1xx), successful (2xx) or redirectional (3xx), else false
 */
export function isHttpStatusCodeAlright(statusCode: number): boolean {

    const firstDigit = statusCode / 100

    return firstDigit === 1 || firstDigit === 2 ||  firstDigit === 3;
}


/** Http status code "Service Unavailable" 503, use this status when ```fetch()``` throws "failed to fetch" error */
export const FAILED_TO_FETCH_STATUS_CODE = 503;


/**
 * @param headers json object with strings as keys and values
 * @param refreshCsrfToken if true the csrf token will be fetched again before sending the request
 * @returns ```headers``` param with ```"Content-Type": "application/json"``` as default content type if none set 
 */
async function getFetchHeaders(headers?: Record<string, any>, refreshCsrfToken = false) {

    const contentType = {"Content-Type": "application/json"};

    // case: refresh csrf token
    if (refreshCsrfToken)
        CSRF_TOKEN.setToken(await getCsrfToken());
    
    const csrfToken = {[CSRF_TOKEN.getHeaderName()]: CSRF_TOKEN.getToken()};

    if (!headers)
        headers = {};

    if (!headers["Content-Type"])
        Object.assign(headers, contentType);

    if (!headers[CSRF_TOKEN.getHeaderName()])
        Object.assign(headers, csrfToken);

    return headers;
}


/**
 * Fetch csrf token from session id.
 * 
 * @returns return csrf token string or empty string if request failed
 */
async function getCsrfToken(): Promise<string> {

    const response = await fetchAny(DOCUMENT_BUILDER_BASE_URL + "/getCsrfToken");

    if (!isHttpStatusCodeAlright(response.status))
        return "";
    
    return await (response as Response).text();
}


/**
 * Format given fetch error as {@link ApiExceptionFormat}, log and return it.
 * 
 * @param e fetch error that was thrown 
 * @param url that fetch() used
 * @returns {@link ApiExceptionFormat} using most values from given error
 */
function handleFetchError(e: Error, url: string): ApiExceptionFormat {

    const error: ApiExceptionFormat = {
        status: FAILED_TO_FETCH_STATUS_CODE,
        error: e.toString(),
        message: e.message,
        path: url.replace(DOCUMENT_BUILDER_BASE_URL, "")
    }

    logApiResponse(error);

    return error;
}


/**
 * Call fetch with given params but refresh csrf token first.
 * 
 * @param url of the request
 * @param fetchConfig options to pass to fetch call
 * @returns raw response of request
 */
async function handleForbiddenReturnAny(url: string, fetchConfig: RequestInit): Promise<Response | ApiExceptionFormat> {

    // get headers with fresh csrf token
    fetchConfig.headers = await getFetchHeaders(fetchConfig.headers, true);

    try {
        // fetch again
        const response = await fetch(url, fetchConfig);

        // case: still not successful
        if (!isHttpStatusCodeAlright(response.status))
            logApiResponse(await response.json());
    
        return response;

    } catch (e) {
        return handleFetchError(e, url);
    }
}


/**
 * Call fetch with given params but refresh csrf token first.
 * 
 * @param url of the request
 * @param fetchConfig options to pass to fetch call
 * @returns json response of request
 */
async function handleForbiddenReturnJson(url: string, fetchConfig: RequestInit): Promise<Response | ApiExceptionFormat> {

    // get headers with fresh csrf token
    fetchConfig.headers = await getFetchHeaders(fetchConfig.headers, true);

    try {
        // fetch again
        const response = await fetch(url, fetchConfig);
        const jsonResponse = await response.json();

        // case: still not successful
        if (!isHttpStatusCodeAlright(response.status))
            logApiResponse(jsonResponse);
    
        return jsonResponse;

    } catch (e) {
        return handleFetchError(e, url);
    }
}