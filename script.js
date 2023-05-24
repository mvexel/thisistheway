var osmtype, osmid;

// add event listener for content loaded
addEventListener("DOMContentLoaded", (event) => {
    // focus on the input field
    document.getElementById("userInput").focus();
    // get the path from the URL in the form /node/1234567
    var path = window.location.pathname;
    var params = path.split('/').filter(Boolean); // Remove empty segments
    // if there are two segments, parse them and fetch the data
    if (params.length == 2) {
        [osmtype, osmid] = params;
        document.getElementById("userInput").value = osmtype + '/' + osmid;
        fetch();
    }
});

function daysAgo(timestamp) {
    var now = new Date();
    var then = new Date(timestamp);
    var diff = now - then;
    var days = Math.floor(diff / 1000 / 60 / 60 / 24);
    return days;
}

function updateURLPath(newPath) {
    var currentState = history.state || {};
    var newURL = window.location.protocol + '//' + window.location.host + '/' + newPath;
    history.pushState(currentState, '', newURL);
  }


function callJOSMRemote(objId) {
    var url = `http://127.0.0.1:8111/load_object?objects=${objId}&relation_members=true`;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        console.log(xhr.responseText);
      }
      else if (xhr.status != 200)
        console.error('Error:', xhr.status);
    }
    xhr.send();
  }

function validateInput(userInput) {
    // validate if the input is of the form w1234567, n1234567, r1234567, node/1234567, way/1234567, relation/1234567 or an OSM URL containing one of these
    var match = userInput.match(/^(n|w|r)(\d+)$/)
    if (match) {
        // expand n, w, r to node, way, relation
        osmtype = { "n": "node", "w": "way", "r": "relation" }[match[1]];
        osmid = match[2];
        displayMessage("Valid input: " + match.slice(1).join(" "), "success");
        return [osmtype, osmid];
    }
    match = userInput.match(/.*(node|way|relation)\/(\d+)$/);
    if (match) {
        osmtype = match[1];
        osmid = match[2];
        displayMessage("Valid input: " + match.slice(1).join(" "), "success");
        return [osmtype, osmid];
    }

    displayMessage("Invalid input. Please enter a valid OSM object id.", "error");
    return false;
}

function confirm(event) {
    if (event.key == "Enter") {
        fetch();
    }
}

function fetch() {
    try {
        var [osmtype, osmid] = validateInput(document.getElementById("userInput").value);
    } catch (e) {
        displayMessage("Invalid input. Please enter a valid OSM object id.", "error");
        return;
    }
    displayMessage(`Fetching data for ${osmtype} ${osmid}...`, "success")
    var url = "https://api.openstreetmap.org/api/0.6/" + osmtype + '/' + osmid + '.json';
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send();
    var status = xhr.status;
    if (status == 200) {
        // The OSM object exists
        // Display success message
        displayMessage(`Data for ${osmtype} ${osmid} fetched successfully.`, "success");
        // parse the data
        var data = JSON.parse(xhr.responseText);
        try {
            var osmElement = data["elements"][0];
        }
        catch (e) {
            // if the data is not parseable, display an error message
            displayMessage(`Error parsing data for ${osmtype} ${osmid}.`, "error");
            return;
        }
        // update path
        updateURLPath(osmtype + "/" + osmid);
        // display the data
        // FIXME from here on out, this is a mess
        document.getElementById("resultHeader").innerHTML = osmtype + " " + osmid;
        var mainResultElem = document.getElementById("resultMain");
        // resultElem.innerHTML = JSON.stringify(data, null, 2);
        mainResultElem.innerHTML = "";
        // Display OSM Map URL
        var osmUrl = "https://www.openstreetmap.org/" + osmtype + "/" + osmid;
        mainResultElem.innerHTML += `<a href="${osmUrl}" target="_blank">OSM Map</a> | `;
        // compose HTML encoded overpass query for the object
        var overpassQuery = `[out:json][timeout:25];${osmtype}(${osmid});out body;>;out skel qt;`;
        // call https://overpass-turbo.eu/map.html?Q= with encoded query
        var overpassUrl = "https://overpass-turbo.eu/map.html?Q=" + encodeURIComponent(overpassQuery);
        mainResultElem.innerHTML += `<a href="${overpassUrl}" target="_blank">Overpass Turbo Map</a> (also displayed on this page)`;
        
        
        var iframeElem = document.getElementById("omap");
        iframeElem.src = overpassUrl;

        // display changeset, user, timestamp
        var changeset = osmElement["changeset"];
        var user = osmElement["user"];
        var uid = osmElement["uid"];
        var timestamp = osmElement["timestamp"];
        mainResultElem.innerHTML += `<br><br><strong>Changeset</strong> <a href="https://www.openstreetmap.org/changeset/${changeset}" target="_blank">${changeset}</a> <small><a href="https://osmcha.org/changesets/${changeset}" target="_blank">[OSMCha]</a></small>`;
        mainResultElem.innerHTML += `<br><strong>User</strong> <a href="https://www.openstreetmap.org/user/${user}" target="_blank">${user}</a> <small><a href="https://hdyc.neis-one.org/?${user}" target="_blank">[HDYC]</a>; <a href="https://resultmaps.neis-one.org/osm-discussion-comments?uid=${uid}" target="_blank">[Comments]</a>; <a href="https://www.openstreetmap.org/message/new/${user}" target="_blank">Send message to ${user}</a></small>`;

        // display timestamp in human format
        var date = new Date(timestamp);
        readableTimestamp = date.toLocaleString();
        var ago = daysAgo(timestamp);
        mainResultElem.innerHTML += `<br><strong>Last update</strong> ${readableTimestamp} <small>[${ago} days ago]</small>`;

        // display iD edit link
        var idUrl = "https://www.openstreetmap.org/edit?editor=id&" + osmtype + "=" + osmid;
        mainResultElem.innerHTML += `<br><br><a href="${idUrl}" target="_blank">Edit in iD</a> | `; 

        // display JOSM edit link
        var josmObjectId = osmtype.slice(0, 1) + osmid;
        mainResultElem.innerHTML += `<a href="#" onclick="event.preventDefault(); callJOSMRemote('${josmObjectId}')">Edit in JOSM</a> <small>(requires remote control)</small>`;

        // display object tags with keys and values in a table
        var tagsResultElem = document.getElementById("resultTags");
        tagsResultElem.innerHTML = "<h3>Tags</h3>";
        var metadata = osmElement["tags"];
        // if there are no tags, display a message
        if (metadata == undefined) {
            tagsResultElem.innerHTML += "No tags.";
        }
        else {
            // parse into table
            var tableString = "<table id=\"tagTable\"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>";
            for (var key in metadata) {
                tableString += `<tr><td>${key}</td><td>${metadata[key]}</td><tr>`;
            }
            tableString += "</tbody></table>";
            tagsResultElem.innerHTML += tableString;
        }

        // display history
        // deep history link
        var historyResultElem = document.getElementById("resultHistory");
        historyResultElem.innerHTML = "<h3>History</h3>";

        // history table
        // retrieve history data from OSM API
        var historyUrl = "https://api.openstreetmap.org/api/0.6/" + osmtype + "/" + osmid + "/history.json";
        var xhrHistory = new XMLHttpRequest();
        xhrHistory.open("GET", historyUrl, false);
        xhrHistory.send();
        var historyData = JSON.parse(xhrHistory.responseText);
        var historyElements = historyData["elements"];

        // parse into table
        var tableString = "<table id=\"historyTable\"><thead><tr><th>Version</th><th>Changeset</th><th>User</th><th>Timestamp</th></tr></thead><tbody>";
        for (var i = historyElements.length - 1; i >= 0; i--) {
            var historyElement = historyElements[i];
            var version = historyElement["version"];
            var changeset = historyElement["changeset"];
            var user = historyElement["user"];
            var uid = historyElement["uid"];
            var timestamp = historyElement["timestamp"];
            var date = new Date(timestamp);
            readableTimestamp = date.toLocaleString();
            ago = daysAgo(timestamp);
            tableString += `<tr><td>${version}</td><td><a href="https://www.openstreetmap.org/changeset/${changeset}" target="_blank">${changeset}</a></td><td><a href="https://www.openstreetmap.org/user/${user}" target="_blank">${user}</a></td><td>${readableTimestamp} <small>[${ago} days ago]</small></td><tr>`;
        }
        tableString += "</tbody></table>";
        historyResultElem.innerHTML += tableString;

        var deepHistoryUrl = "https://osmlab.github.io/osm-deep-history/#/" + osmtype + "/" + osmid;
        historyResultElem.innerHTML += `<small><a href="${deepHistoryUrl}" target="_blank">Deep History</a></small>`;

        return;

    } else if (status == 404) {
        displayMessage(`${osmtype} ${osmid} does not exist.`, "error");
        updateURLPath("");
        return;
    } else if (status == 410) {
        displayMessage(`${osmtype} ${osmid} has been deleted.`, "error");
        updateURLPath("");
        return;
    } else {
        displayMessage(`Error fetching data for ${osmtype} ${osmid}.`, "error");
        return;
    }
}

// display a message either error (red) or success (green)
function displayMessage(message, messageType) {
    var messageDiv = document.getElementById("message");
    messageDiv.innerHTML = message;
    messageDiv.className = messageType;
}

