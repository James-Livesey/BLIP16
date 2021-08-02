const DISPLAY_WIDTH = 128;
const DISPLAY_HEIGHT = 64;
const DISPLAY_SCALE_FACTOR = 2;
const MAX_DEBUGGER_CHARS = 10_000;

var programWorker = null;
var displayBuffer = new Uint8Array(DISPLAY_WIDTH * DISPLAY_HEIGHT).fill(0);
var displayPalette = new Array(16).fill(0);
var displayCanvasContext = null;
var buttonStates = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false
};
var apiClientCode = null;

function renderBufferToContext(palette = displayPalette, buffer = displayBuffer) {
    for (var y = 0; y < DISPLAY_HEIGHT; y++) {
        for (var x = 0; x < DISPLAY_WIDTH; x++) {
            var colourCode = palette[buffer[(y * DISPLAY_WIDTH) + x]] || 0;

            displayCanvasContext.fillStyle = `#${colourCode.toString(16).padStart(6, "0")}`;

            displayCanvasContext.beginPath();
            displayCanvasContext.rect(x * DISPLAY_SCALE_FACTOR, y * DISPLAY_SCALE_FACTOR, DISPLAY_SCALE_FACTOR, DISPLAY_SCALE_FACTOR);
            displayCanvasContext.fill();
        }
    }
}

function addButtonEvents(button) {
    document.querySelector(`#console #buttons button#${button}`).addEventListener("mousedown", function() {
        buttonStates[button] = true;
    });

    document.querySelector(`#console #buttons button#${button}`).addEventListener("touchstart", function() {
        buttonStates[button] = true;
    });

    window.addEventListener("mouseup", function() {
        buttonStates[button] = false;
    });

    window.addEventListener("touchend", function() {
        buttonStates[button] = false;
    });
}

function addButtonKeyEvents(button, key) {
    document.querySelector("#console").addEventListener("keydown", function(event) {
        if (event.key == key) {
            buttonStates[button] = true;
        }
    });

    document.querySelector("#console").addEventListener("keyup", function(event) {
        if (event.key == key) {
            buttonStates[button] = false;
        }
    });
}

function reset() {
    displayBuffer.fill(0);
    displayPalette.fill(0);

    document.querySelector("#editor textarea#debugger").value = "";
}

function loadProgram(program = document.querySelector("#editor textarea#program").value) {
    var blob = new Blob([
        apiClientCode,
        program
    ], {type: "text/javascript"});
    var uri = URL.createObjectURL(blob);

    if (programWorker != null) {
        programWorker.terminate();
    }

    reset();

    programWorker = new Worker(uri);

    addWorkerHostApiHandler();
}

function addDebuggerText(text) {
    var fullText = document.querySelector("#editor textarea#debugger").value + text;

    document.querySelector("#editor textarea#debugger").value = fullText.substring(fullText.length - MAX_DEBUGGER_CHARS);
    document.querySelector("#editor textarea#debugger").scrollTop = document.querySelector("#editor textarea#debugger").scrollHeight;
}

window.addEventListener("load", function() {
    var canvas = document.querySelector("#console canvas");

    displayCanvasContext = canvas.getContext("2d");

    canvas.width = DISPLAY_WIDTH * DISPLAY_SCALE_FACTOR;
    canvas.height = DISPLAY_HEIGHT * DISPLAY_SCALE_FACTOR;

    ["up", "down", "left", "right", "a", "b"].forEach(addButtonEvents);

    addButtonKeyEvents("up", "w");
    addButtonKeyEvents("up", "ArrowUp");
    addButtonKeyEvents("down", "s");
    addButtonKeyEvents("down", "ArrowDown");
    addButtonKeyEvents("left", "a");
    addButtonKeyEvents("left", "ArrowLeft");
    addButtonKeyEvents("right", "d");
    addButtonKeyEvents("right", "ArrowRight");
    addButtonKeyEvents("a", "z");
    addButtonKeyEvents("a", " ");
    addButtonKeyEvents("b", "x");
    addButtonKeyEvents("b", "Enter");

    fetch("apiclient.js").then((response) => response.text()).then(function(data) {
        apiClientCode = data;

        document.querySelector("#editor textarea#program").addEventListener("change", function() {
            loadProgram();
        });

        loadProgram();
    });

    document.querySelector("#editor textarea#program").addEventListener("keydown", function(event) {
        var selectionStart = event.target.selectionStart;
        var selectionEnd = event.target.selectionEnd;

        var code = event.target.value;
        var previousValue = code.substring(selectionStart, selectionEnd);
        var newValue = previousValue;

        function applyNewValue() {
            event.target.value = event.target.value.substring(0, selectionStart) + newValue + event.target.value.substring(selectionEnd);
        }

        if (event.key == "Tab" && !event.shiftKey) {
            newValue = "\t" + previousValue.split("\n").join("\n\t");

            applyNewValue();

            event.target.selectionStart = selectionStart + 1;
            event.target.selectionEnd = selectionEnd + (newValue.length - previousValue.length);

            event.preventDefault();
        } else if (event.key == "Tab" && event.shiftKey) {
            while (!previousValue.startsWith("\n") && selectionStart > 0) {
                selectionStart--;

                previousValue = code.substring(selectionStart, selectionEnd);
            }

            newValue = previousValue.replace(/\n\t/g, "\n").replace(/^\t/g, "");

            applyNewValue();

            if (selectionStart != 0) {
                event.target.selectionStart = selectionStart + 1;
            } else {
                event.target.selectionStart = 0;
            }

            event.target.selectionEnd = selectionEnd + (newValue.length - previousValue.length);

            event.preventDefault();
        }
    });

    requestAnimationFrame(function renderer() {
        renderBufferToContext();

        requestAnimationFrame(renderer);
    });
});