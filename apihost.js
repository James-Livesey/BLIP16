function getApiData() {
    return {
        buttons: buttonStates
    };
}

function setApiData(name, value) {
    if (name == "buffer") {
        if (!(value instanceof Uint8Array) || value.length != DISPLAY_WIDTH * DISPLAY_HEIGHT) {
            return;
        }

        displayBuffer = value;
    } else if (name == "palette") {
        if (!(value instanceof Object) || value.length != displayPalette.length) {
            return;
        }

        displayPalette = value;
    }
}

function addWorkerHostApiHandler(worker = programWorker) {
    worker.addEventListener("message", function(event) {
        var data = event.data;

        if (data.request == "get") {
            worker.postMessage(getApiData());
        } else if (data.request == "set") {
            setApiData(data.name, data.value);
        } else if (data.request == "log") {
            addDebuggerText(data.value);
        }
    });

    worker.addEventListener("error", function(event) {
        addDebuggerText(`${event.message} (line ${event.lineno - apiClientCode.split("\n").length + 1})\n`);
    });
}