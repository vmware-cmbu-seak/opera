
function hideConsoleWaitPanel() {
	setTimeout(() => {
		$("#opera-console-wait").hide(300);	
	}, 200);
};

var clipboard = null;
async function getClipboardContents() {
	try {
		clipboard = await navigator.clipboard.readText();
		console.log('Pasted content: ', clipboard);
	} catch (err) {
		console.error('Failed to read clipboard contents: ', err);
	}
}

function connectConsole(data) {
	let connectionId = data.connectionId;
	let token = data.token;
	let display = document.getElementById('opera-console');
	let tunnel = new Guacamole.WebSocketTunnel('/gui/websocket-tunnel');
	let gui = new Guacamole.Client(tunnel);

	display.appendChild(gui.getDisplay().getElement());

	let conn = "token=" + token;
	conn += "&GUAC_DATA_SOURCE=postgresql";
	conn += "&GUAC_ID=" + connectionId;
	conn += "&GUAC_TYPE=c";
	conn += "&GUAC_WIDTH=1024";
	conn += "&GUAC_HEIGHT=768";
	conn += "&GUAC_DPI=96";
	conn += "&GUAC_TIMEZONE=Asia%2FSeoul";
	conn += "&GUAC_AUDIO=audio%2FL8";
	conn += "&GUAC_AUDIO=audio%2FL16";
	conn += "&GUAC_IMAGE=image%2Fjpeg";
	conn += "&GUAC_IMAGE=image%2Fpng";
	conn += "&GUAC_IMAGE=image%2Fwebp";

	gui.connect(conn);
	gui.onerror = (error) => console.log(error.message);
	window.onunload = () => gui.disconnect();
	window.onresize = (event) => {
		gui.sendSize(window.innerWidth, window.innerHeight);
	};

	mouse = new Guacamole.Mouse(gui.getDisplay().getElement());
	mouse.onmousemove = (mouseState) => { gui.sendMouseState(mouseState); }

	keyboard = new Guacamole.Keyboard(document);
	keyboard.onkeydown = (keysym) => gui.sendKeyEvent(1, keysym);
	keyboard.onkeyup = (keysym) => gui.sendKeyEvent(0, keysym);
	
	hideConsoleWaitPanel();
};

function errorConsole(jqXHR, textStatus, errorThrown) {
	windows.alert("could not connect console");
};

(function($) {
	
	$.ajax({
		type: "get",
		url: "/app/console/" + resourceId,
		success: connectConsole,
		error: errorConsole
	});

})(jQuery);