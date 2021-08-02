const G_MODE_DRAW = `
FFFF--FFFF---FFF--F---F
F---F-F---F-F---F-F---F
F---F-F---F-F---F-F---F
F---F-FFFF--FFFFF-F-F-F
F---F-F-F---F---F-F-F-F
F---F-F--F--F---F-F-F-F
FFFF--F---F-F---F--F-F-
`;

const G_MODE_INK = `
FFFFF-F---F-F---F
--F---FF--F-F--F-
--F---F-F-F-F-F--
--F---F--FF-FF---
--F---F---F-F-F--
--F---F---F-F--F-
FFFFF-F---F-F---F
`;

const G_MODE_SET = `
-FFF--FFFFF-FFFFF
F---F-F-------F--
F-----F-------F--
-FFF--FFF-----F--
----F-F-------F--
F---F-F-------F--
-FFF--FFFFF---F--
`;

const modes = {
	DRAW: 0,
	INK: 1,
	SET: 2
};

var hexChars = [];
var drawX = 0;
var drawY = 0;
var width = 16;
var height = 16;
var drawing = new Uint8Array(width * height).fill(16);
var selectedColour = 0x0;
var mode = modes.DRAW;
var lastButtonPress = 0;

hexChars[0x0] = `
FFF
F-F
F-F
F-F
FFF
`;

hexChars[0x1] = `
FF-
-F-
-F-
-F-
FFF
`;

hexChars[0x2] = `
FFF
--F
FFF
F--
FFF
`;

hexChars[0x3] = `
FFF
--F
FFF
--F
FFF
`;

hexChars[0x4] = `
F-F
F-F
FFF
--F
--F
`;

hexChars[0x5] = `
FFF
F--
FFF
--F
FFF
`;

hexChars[0x6] = `
FFF
F--
FFF
F-F
FFF
`;

hexChars[0x7] = `
FFF
--F
--F
--F
--F
`;

hexChars[0x8] = `
FFF
F-F
FFF
F-F
FFF
`;

hexChars[0x9] = `
FFF
F-F
FFF
--F
FFF
`;

hexChars[0xA] = `
-F-
F-F
FFF
F-F
F-F
`;

hexChars[0xB] = `
FF-
F-F
FF-
F-F
FF-
`;

hexChars[0xC] = `
-FF
F--
F--
F--
-FF
`;

hexChars[0xD] = `
FF-
F-F
F-F
F-F
FF-
`;

hexChars[0xE] = `
FFF
F--
FFF
F--
FFF
`;

hexChars[0xF] = `
FFF
F--
FFF
F--
F--
`;

function setPixel(x, y, c) {
	BLIP16.buffer[y * 128 + x] = c;
}

function drawGraphic(x, y, g) {
	var lines = g.split("\n");
	
	for (var i = 0; i < lines.length; i++) {
		var chars = lines[i].trim();
		
		if (chars == "") continue;
		
		for (var j = 0; j < chars.length; j++) {
			if (chars[j] == "-") continue;
			
			setPixel(x + j, y, parseInt(chars[j], 16));
		}
		
		y++;
	}
}

function drawHex(x, y, h, pad = 0) {
	for (var i = pad; i > 0; i--) {
		drawGraphic(x - 4 + i * 4, y, hexChars[h % 16]);
		
		h = h >> 4;
	}
}

function drawCheckerboard() {
	var alternate = false;

	for (var i = 0; i < 128 * 64; i++) {
		var condition = i % 2 == 0;
		
		if (i % 128 == 0) alternate = !alternate;
		if (alternate) condition = !condition;
	
		BLIP16.buffer[i] = condition ? 0x7 : 0x8;
	}
}

function drawDrawing() {
	for (var i = 0; i < drawing.length; i++) {
		if (drawing[i] == 16) continue;

		setPixel(i % width, Math.floor(i / width), drawing[i]);
	}
	
	if (mode == modes.DRAW && Math.round(new Date().getTime() % 250 <= 125)) {
		setPixel(drawX, drawY, 15 - BLIP16.buffer[drawY * 128 + drawX]);
	}
}

function drawPanel() {
	for (var y = 0; y < 64; y++) {
		for (var x = 0; x < 34; x++) {
			setPixel(127 - x, y, 0x8);
		}
		
		setPixel(127 - 34, y, 0x7);
	}
}

function drawPaletteColour(x, y, c, selected = false) {
	for (var ry = 0; ry < 6; ry++) {
		for (var rx = 0; rx < 6; rx++) {
			setPixel(x + rx, y + ry,
				selected &&
				rx >= 2 && rx <= 3 &&
				ry >= 2 && ry <= 3 ? 15 - c : c
			);
		}
	}
}

function drawPalette() {
	for (var i = 0; i < 16; i++) {
		drawPaletteColour(
			127 - 28 + (6 * (i % 4)),
			64 - 37 + (6 * Math.floor(i / 4)),
			i,
			i == selectedColour
		);
	}
}

function drawMode(m = mode) {
	switch (m) {
		case modes.DRAW:
			drawGraphic(128 - 24, 64 - 8, G_MODE_DRAW);
			break;
			
		case modes.INK:
			drawGraphic(128 - 18, 64 - 8, G_MODE_INK);
			break;
		
		case modes.SET:
			drawGraphic(128 - 18, 64 - 8, G_MODE_SET);
			break;
	}
}

function renderAll() {
	drawCheckerboard();
	
	drawDrawing();
	
	drawPanel();
	drawPalette();
	drawMode();
}

function anyButtonsDown() {
	return (
		BLIP16.buttons.up ||
		BLIP16.buttons.down ||
		BLIP16.buttons.left ||
		BLIP16.buttons.right ||
		BLIP16.buttons.a ||
		BLIP16.buttons.b
	);
}

function handleButtons() {
	if (anyButtonsDown && new Date().getTime() - lastButtonPress < 100) {
		return;
	}
	
	lastButtonPress = new Date().getTime();

	switch (mode) {
		case modes.DRAW:
			if (BLIP16.buttons.up) drawY--;
			if (BLIP16.buttons.down) drawY++;
			if (BLIP16.buttons.left) drawX--;
			if (BLIP16.buttons.right) drawX++;
			
			if (drawX < 0) drawX = width - 1;
			if (drawX > width - 1) drawX = 0;
			if (drawY < 0) drawY = height - 1;
			if (drawY > height - 1) drawY = 0;
			
			if (BLIP16.buttons.a) {
				drawing[drawY * width + drawX] = selectedColour;
			}
			
			if (BLIP16.buttons.b) mode = modes.INK;
			
			break;

		case modes.INK:
			if (BLIP16.buttons.up) selectedColour -= 4;
			if (BLIP16.buttons.down) selectedColour += 4;
			if (BLIP16.buttons.left) selectedColour--;
			if (BLIP16.buttons.right) selectedColour++;
			
			if (selectedColour < 0) selectedColour += 16;
			
			selectedColour = selectedColour % 16;
			
			if (BLIP16.buttons.b) mode = modes.DRAW;
			
			break;
	}
}

setInterval(function() {
	renderAll();
	handleButtons();
});