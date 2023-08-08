// GLobal Statics
Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

// Global Variables
var currUser = null;
var currRegion = null;
var currProjectId = null;
var currPageId = null;
var regionBrands = {};

// Utils
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function dateFormat(tstamp) {
	let date = new Date(tstamp);
	let month = date.getMonth() + 1;
	let day = date.getDate();
	let hour = date.getHours();
	let minute = date.getMinutes();
	let second = date.getSeconds();
	month = month >= 10 ? month : '0' + month;
	day = day >= 10 ? day : '0' + day;
	hour = hour >= 10 ? hour : '0' + hour;
	minute = minute >= 10 ? minute : '0' + minute;
	second = second >= 10 ? second : '0' + second;
	return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

function timeFormat(tstamp) {
	let date = new Date(tstamp);
	let hour = date.getHours();
	let minute = date.getMinutes();
	let second = date.getSeconds();
	hour = hour >= 10 ? hour : '0' + hour;
	minute = minute >= 10 ? minute : '0' + minute;
	second = second >= 10 ? second : '0' + second;
	return "" + hour + ':' + minute + ':' + second;
}

function relocateLoginPage() {
	window.location.replace('/auth/login');
};

function showWaitPanel() {
	$("#opera-wait").show(100);
};

function hideWaitPanel() {
	//$("#opera-wait").hide();
	$("#opera-wait").hide(500);
};

function drawMetricChart(domId, title, labels, data) {
	new Chart($("#" + domId), {
		type: "line",
		data: {
			labels: labels,
			datasets: [{
				label: title,
				backgroundColor: "rgba(78, 115, 223, 0.05)",
				borderColor: "rgba(78, 115, 223, 1)",
				pointBackgroundColor: "rgba(78, 115, 223, 1)",
				pointBorderColor: "rgba(78, 115, 223, 1)",
				pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
				pointHoverBorderColor: "rgba(78, 115, 223, 1)",
				data: data
			}]
		},
		options: {
	        legend: {
				display: false
			},
			maintainAspectRatio: false,
			tooltips: {
				backgroundColor: "rgb(255,255,255)",
				bodyFontColor: "#858796",
				titleMarginBottom: 10,
				titleFontColor: '#6e707e',
				titleFontSize: 14,
				borderColor: '#dddfeb',
				borderWidth: 1,
				xPadding: 15,
				yPadding: 15,
				displayColors: false,
				intersect: false,
				mode: 'index',
				caretPadding: 10
			}
		}
	});
};

// Row Level Rest Wrapper
function getAuthApi(url, func) {
	$.ajax({
		type: "get",
		url: "/auth" + url,
		success: function(data) {
			func(data);
		},
		error: function(xhr, status, thrown) {
			console.log(xhr);
			console.log(status);
			console.log(thrown);
			relocateLoginPage();
		}
	});
};

function getApi(url, func) {
	$.ajax({
		type: "get",
		url: "/api" + url,
		headers: {
			"CMP-REGION-ENDPOINT": currRegion
		},
		success: function(data) {
			func(data);
		},
		error: function(xhr, status, thrown) {
			console.log(xhr);
			console.log(status);
			console.log(thrown);
		}
	});
};

function getApp(url, func) {
	$.ajax({
		type: "get",
		url: "/app" + url,
		headers: {
			"CMP-REGION-ENDPOINT": currRegion
		},
		success: function(data) {
			func(data);
		},
		error: function(xhr, status, thrown) {
			console.log(xhr);
			console.log(status);
			console.log(thrown);
		}
	});
};
