//window.open("/console.html", "_blank", "width=800,height=600,resizable=yes,titlebar=no,location=no,menubar=no,scrollbars=no,status=no,toobar=no");

var clipboard = null;
async function getClipboardContents() {
	try {
		clipboard = await navigator.clipboard.readText();
		console.log('Pasted content: ', clipboard);
	} catch (err) {
		console.error('Failed to read clipboard contents: ', err);
	}
}

(function($) {
	
	var guiToken = "9035FD9BFC0BEC74DC6F7D1060BE02128DD2615AA43DAA0ADCAB38428EE81D3C";
	
	var display = document.getElementById('opera-gui-console');
	var tunnel = new Guacamole.WebSocketTunnel('/gui/websocket-tunnel');
	var gui = new Guacamole.Client(tunnel);
	
	display.appendChild(gui.getDisplay().getElement());
	
	var data = "token=" + guiToken;
	data += "&GUAC_DATA_SOURCE=postgresql";
	data += "&GUAC_ID=8";
	data += "&GUAC_TYPE=c";
	data += "&GUAC_WIDTH=800";
	data += "&GUAC_HEIGHT=600";
	data += "&GUAC_DPI=96";
	data += "&GUAC_TIMEZONE=Asia%2FSeoul";
	data += "&GUAC_AUDIO=audio%2FL8";
	data += "&GUAC_AUDIO=audio%2FL16";
	data += "&GUAC_IMAGE=image%2Fjpeg";
	data += "&GUAC_IMAGE=image%2Fpng";
	data += "&GUAC_IMAGE=image%2Fwebp";
	
    gui.connect(data);
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
    
})(jQuery);
