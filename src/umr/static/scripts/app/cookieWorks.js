/**
 * Read a cookie, search for the attribute of a particular name and retrieve it.
 * @param {string} name - The name of the attribute.
 * @returns {?string} session - The session ID of the user, if present.
 */
export function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return '';
}
