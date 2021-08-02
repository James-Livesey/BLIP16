const SMILE = `
-FFFFFF-
F------F
F-F--F-F
F------F
F-F--F-F
F--FF--F
F------F
-FFFFFF-
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

drawGraphic(10, 10, SMILE);