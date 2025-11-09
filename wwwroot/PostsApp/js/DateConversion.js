/////////////////////////////////////////////////////////////////////
// These utilities are use to convert dates to local format and store dates in UTC
/////////////////////////////////////////////////////////////////////
function convertToFrenchDate(numeric_date) {
    const date = new Date(numeric_date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const opt_weekday = { weekday: 'long' };
    const weekday = toTitleCase(date.toLocaleDateString("fr-FR", opt_weekday));

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    return `${weekday} le ${date.toLocaleDateString("fr-FR", options)} @ ${date.toLocaleTimeString("fr-FR")}`;
}

function UTC_To_Local(UTC_numeric_date) {
    const UTC_Offset = new Date().getTimezoneOffset() / 60;
    const UTC_Date = new Date(UTC_numeric_date);
    UTC_Date.setHours(UTC_Date.getHours() - UTC_Offset);
    return UTC_Date.getTime();
}

function Local_to_UTC(Local_numeric_date) {
    const UTC_Offset = new Date().getTimezoneOffset() / 60;
    const Local_Date = new Date(Local_numeric_date);
    Local_Date.setHours(Local_Date.getHours() + UTC_Offset);
    return Local_Date.getTime();
}