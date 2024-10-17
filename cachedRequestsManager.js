import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";

let expirationTime = serverVariables.get("main.response.CacheExpirationTime");

// Repository file data models cache
globalThis.responseCache = [];
globalThis.cachedResponsesCleanerStarted = false;

export default class CachedRequestsManager {

    /** Starts the process of automatic cache release */
    static startCachedRequestsCleaner() {
        setInterval(CachedRequestsManager.flushExpired, expirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic responses caches cleaning process started...]");
    }

    static add(url, content, ETag = "") {
        if (!cachedResponsesCleanerStarted) {
            cachedResponsesCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }

        responseCache[url] = {
            content: content,
            etag: ETag,
            Expire_Time: utilities.nowInSeconds() + expirationTime
        };
        console.log(BgWhite + FgBlue, `[Response of '${url}' has been cached]`);
    }

    /**
     * Finds the cached response for the given URL
     * @returns {*|null}
     */
    static find(url) {
        let response;
        try {
            response = responseCache[url];
        } catch (e) {
            console.log(BgWhite + FgRed, "[Response Cache Error]: ", e);
            response = null;
        }

        // If not cached, skip
        if (response == null)
            return null;

        // Renew cache
        response.Expire_Time = utilities.nowInSeconds() + expirationTime;
        console.log(BgWhite + FgBlue, `[Response for '${url}' retrieved from cache]`);
        return response;
    }

    /** Removes the response cached from the given URL */
    static clear(url) {
        delete responseCache[url];
    }

    /** Clears the expired cache values */
    static flushExpired() {
        let now = utilities.nowInSeconds();
        let cleared = 0;

        for (const key in responseCache) {

            let response = responseCache[key];

            // If still valid, skip
            if (response.Expire_Time > now)
                continue;

            CachedRequestsManager.clear(key);
            cleared++;
        }

        if (cleared > 0)
            console.log(BgWhite + FgBlue, `[${cleared} responses have been cleared from cache]`);
    }

    /**
     * Finds the cached value and returns it
     * @returns {boolean} Has been sent
     */
    static get(HttpContext) {/*
        Chercher la cache correspondant à l'url de la requête. Si trouvé,
        Envoyer la réponse avec
        HttpContext.response.JSON( content, ETag, true)
        */

        let response = CachedRequestsManager.find(HttpContext.req.url);

        if (response == null)
            return false;

        HttpContext.response.JSON(response.content, response.etag, true);
        return true;
    }
}
