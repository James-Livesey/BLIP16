var BLIP16 = {
    buttons: {up: false, down: false, left: false, right: false, a: false, b: false},
    buffer: new Uint8Array(128 * 64).fill(0),
    palette: new Array(16).fill(0)
};

BLIP16.buffer = new Uint8Array(128 * 64).fill(0);
BLIP16.palette = [];

BLIP16.palette[0x0] = 0x000000; // Black
BLIP16.palette[0x1] = 0x0000AA; // Blue
BLIP16.palette[0x2] = 0x00AA00; // Green
BLIP16.palette[0x3] = 0x00AAAA; // Cyan
BLIP16.palette[0x4] = 0xAA0000; // Red
BLIP16.palette[0x5] = 0xAA00AA; // Magenta
BLIP16.palette[0x6] = 0xAA5500; // Brown
BLIP16.palette[0x7] = 0xAAAAAA; // Light grey
BLIP16.palette[0x8] = 0x555555; // Dark grey
BLIP16.palette[0x9] = 0x5555FF; // Light blue
BLIP16.palette[0xA] = 0x55FF55; // Light green
BLIP16.palette[0xB] = 0x55FFFF; // Light cyan
BLIP16.palette[0xC] = 0xFF5555; // Light red
BLIP16.palette[0xD] = 0xFF55FF; // Light magenta
BLIP16.palette[0xE] = 0xFFFF55; // Yellow
BLIP16.palette[0xF] = 0xFFFFFF; // White

self.addEventListener("message", function(event) {
    var data = event.data;

    Object.keys(data).forEach(function(key) {
        BLIP16[key] = data[key];
    });
});

setInterval(function() {
    postMessage({request: "get"});

    postMessage({request: "set", name: "buffer", value: BLIP16.buffer});
    postMessage({request: "set", name: "palette", value: BLIP16.palette});
});

console.log = function() {
    postMessage({request: "log", value: [...arguments].map(function(data) {
        if (typeof(data) == "object") {
            return JSON.stringify(data);
        }

        return data;
    }).join(" ") + "\n"});
};