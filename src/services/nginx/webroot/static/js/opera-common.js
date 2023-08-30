// Global Statics
Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

// Opera Client Variables
var User;
var Region;
var Project;
var Deployment;
var Resource;

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

var waitCount = 0;
var hideDuration = 300;

function showWaitPanel() {
	waitCount += 1;
	$("#opera-wait").show();
};

function hideWaitPanel() {
	if (waitCount > 0) waitCount -= 1;
	if (!waitCount) $("#opera-wait").hide(hideDuration);
};

function hideWaitPanelWhenDev() {
	waitCount = 0;
	$("#opera-wait").hide();
}

function drawMetricChart(dom, title, labels, data) {
	new Chart(dom, {
		type: "line",
		data: {
			labels: labels,
			datasets: [{
				label: title,
				color: "#acbac3",
				backgroundColor: "#1b2a31",
				borderColor: "#17242b",
				pointBackgroundColor: "#17242b",
				pointBorderColor: "#4aaed9",
				pointHoverBackgroundColor: "#4aaed9",
				pointHoverBorderColor: "#4aaed9",
				data: data
			}]
		},
		options: {
	        legend: {
				display: false
			},
			scales: {
				xAxes: [{
					gridLines: {
						color: "#121c21",
						drawBorder: true,
						borderDash: [4],
					}
				}],
				yAxes: [{
					ticks: {
						maxTicksLimit: 6,
						suggestedMax: (title=="CPU" || title=="MEM")?100:1,
			            beginAtZero: true
			        },
					gridLines: {
						color: "#121c21",
						drawBorder: true,
						borderDash: [4],
					}
				}]
			},
			maintainAspectRatio: false,
			tooltips: {
				backgroundColor: "#3f4d5f",
				bodyFontColor: "#acbac3",
				titleMarginBottom: 10,
				titleFontColor: '#acbac3',
				titleFontSize: 14,
				borderColor: '#384359',
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

function openConsole(dom) {
	let resourceId = dom.parent().parent().parent().parent().attr("oid");
	if (resourceId) {
		window.open("/app/console?resourceId=" + resourceId, "_blank", "width=800,height=600,resizable=yes,titlebar=no,location=no,menubar=no,scrollbars=no,status=no,toobar=no");
	}
}