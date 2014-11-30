/**
 * This class deals with unwrapping the data we receive from Clickatell
 * into a usable format. The adapter can then proceed with their tasks in a "known"
 * manner and not have to worry about different packet results when changing variables.
 */

module.exports = {
    // This function is responsible for parsing the text packets that Clickatell
    // returns. Their format is inconsistent so any exceptions also needs to be handled
    // in this function.
    unwrapLegacy: function (data) {

        var lines = data.trim("\n").split("\n");
        var result = [];
        var re = new RegExp(/([A-Za-z]+):((.(?![A-Za-z]+:))*)/g);

        for (var key in lines) {
            var line = lines[key];
            var match;
            var row = [];

            // Loop through every match and create an associative
            // array that indexes by using the response key.
            while (match = re.exec(line)) {
                row[match[1]] = match[2].trim();
            }

            // If an "ERR" key is present it means the entire packet (or part of it) failed
            // and must be handled. We will only throw an error if the packet contained one
            // item...otherwise it's too difficult to handle.
            if (typeof row['ERR'] !== 'undefined') {
                var error = row['ERR'].split(",");
                row.code = error.length == 2 ? error[0] : 0;
                row.error = typeof error[1] !== 'undefined' ? error[1].trim() : error[0];
                delete row['ERR'];

                // If this response only has one value then we will
                // raise an exception to be handled.
                if (lines.length == 1) {
                    var response = new Error(row['error']);
                    response.code = row['code'];
                    throw response;
                }
            }

            result.push(row);
        }

        return result.length > 1 ? result : result[0];
    }
}