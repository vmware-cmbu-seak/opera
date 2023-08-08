// Global Variables
var currUser = null;
var currEndpoint = null;
var currProjectId = null;

// Interfaces
function relocateLoginPage() {
	window.location.replace('/auth/login');
}

function getAuthApi(url, func) {
	$.ajax({
		type: "get",
		url: "/auth" + url,
		success: function(data) {
			console.log(data);
			func(data);
		},
		error: function(xhr, status, thrown) {
			console.log("un-authorized");
			relocateLoginPage();
		}
	});
}

function getApi(url, func) {
	$.ajax({
		type: "get",
		url: "/api" + url,
		headers: {
			"CMP-REGION-ENDPOINT": currEndpoint
		},
		success: function(data) {
			console.log(data);
			func(data);
		},
		error: function(xhr, status, thrown) {
			console.log(xhr);
		}
	});
}

function getInv(url, func) {
	$.ajax({
		type: "get",
		url: "/inv" + url,
		headers: {
			"CMP-REGION-ENDPOINT": currEndpoint
		},
		success: function(data) {
			console.log(data);
			func(data);
		},
		error: function(xhr, status, thrown) {
			console.log(xhr);
		}
	});
}

// CMP Functions
function showWaitPanel() {
	$("#opera-wait").show();
}

function hideWaitPanel() {
	$("#opera-wait").hide(500);
}

function getRegions(regionEndpoint) {
	showWaitPanel();
	var html = "";
	currUser.aaEndpoints.forEach(function(aaEndpoint) {
		if (regionEndpoint === undefined || regionEndpoint == null || regionEndpoint == "") {
			if (aaEndpoint.check) {
				if (html == "") {
					html += '<a class="dropdown-item active">' + aaEndpoint.endpoint + '</a>';
					currEndpoint = aaEndpoint.endpoint;
					$("#opera-curr-region").html(currEndpoint);
				} else {
					html += '<a class="dropdown-item" onclick="getRegions(\'' + aaEndpoint.endpoint + '\');">' + aaEndpoint.endpoint + '</a>';
				}
			} else {
				html += '<a class="dropdown-item">' + aaEndpoint.endpoint + '</a>';
			}
		} else {
			if (aaEndpoint.check) {
				if (aaEndpoint.endpoint == regionEndpoint) {
					html += '<a class="dropdown-item active">' + aaEndpoint.endpoint + '</a>';
					currEndpoint = aaEndpoint.endpoint;
					$("#opera-curr-region").html(currEndpoint);
				} else {
					html += '<a class="dropdown-item" onclick="getRegions(\'' + aaEndpoint.endpoint + '\');">' + aaEndpoint.endpoint + '</a>';
				}
			} else {
				html += '<a class="dropdown-item">' + aaEndpoint.endpoint + '</a>';
			}
		}
	});
	getProjects();
	$("#opera-regions").html(html);
}

function getProjects(projectId) {
	showWaitPanel();
	getApi('/iaas/api/projects', function(data) {
		var projects = data.content;
		var html = "";
		if (projectId === undefined || projectId == null || projectId == "") {
			projects.forEach(function(project) {
				if (html == "") {
					html += '<a class="dropdown-item active">' + project.name + '</a>'
					currProjectId = project.id;
					$("#opera-curr-project").html(project.name);
				} else {
					html += '<a class="dropdown-item" onclick="getProjects(\'' + project.id + '\');">' + project.name + '</a>'
				}
			});
		} else {
			projects.forEach(function(project) {
				if (project.id == projectId) {
					html += '<a class="dropdown-item active">' + project.name + '</a>'
					currProjectId = project.id;
					$("#opera-curr-project").html(project.name);
				} else {
					html += '<a class="dropdown-item" onclick="getProjects(\'' + project.id + '\');">' + project.name + '</a>'
				}
			});
		}
		$("#opera-projects").html(html);
		showDeployments();
	});
};

function showDeployments() {
	getInv('/deployments?projectId=' + currProjectId, function(data) {
		var deployments = data;
		var html = "";
		deployments.forEach(function(deployment) {
			
			html += '<div id="opera-' + deployment.id + '" class="card shadow mb-4">';
			switch (deployment.status) {
				case "CREATE_SUCCESSFUL":
					html += '<div class="card-header py-3 d-flex flex-row align-items-center justify-content-between bg-primary">';
					break;
				case "CREATE_FAILURE":
					html += '<div class="card-header py-3 d-flex flex-row align-items-center justify-content-between bg-danger">';
					break;
				default:
					html += '<div class="card-header py-3 d-flex flex-row align-items-center justify-content-between bg-secondary">';
			}
            html += '<h6 class="m-0 font-weight-bold text-white">' + deployment.name + '</h6><div class="dropdown no-arrow d-flex flex-row align-items-center justify-content-end">';
            if (deployment.catalog !== undefined || deployment.catalog != null) {
				html += '<div class="m-0 mr-3 text-white"><small><i class="fas fa-certificate"></i> ' + deployment.catalog.name + '</small></div>';
			} else {
				html += '<div class="m-0 mr-3 text-white"><small><i class="fas fa-certificate"></i> By Cloud Template</small></div>';
			}
            if (deployment.expense !== undefined || deployment.expense != null) {
				html += '<div class="m-0 mr-3 text-white"><small><i class="fas fa-money-bill-alt"></i> ' + parseInt(deployment.expense.totalExpense) + '</small></div>';	
			} else {
				html += '<div class="m-0 mr-3 text-white"><small><i class="fas fa-money-bill-alt"></i> 0</small></div>';
			}
            html += '<a class="dropdown-toggle" href="#" role="button" data-toggle="dropdown"><i class="fas fa-bars fa-sm fa-fw text-white"></i></a>';
            html += '<div class="dropdown-menu dropdown-menu-right shadow animated--fade-in">';
            html += '<div class="dropdown-header">운영 작업</div>';
            html += '<a class="dropdown-item" href="#">프로젝트 변경</a>';
            html += '<a class="dropdown-item" href="#">소유자 변경</a>';
            html += '<a class="dropdown-item" href="#">설정 변경</a>';
            html += '<a class="dropdown-item" href="#">삭제</a>';
            html += '</div></div></div>';
			var vmHtmls = [];
            deployment.resources.forEach(function(resource) {
				if (resource.type.indexOf("Machine") > -1) {
					var vmHtml = "";
					vmHtml += '<div class="card shadow mb-1">';
					if (resource.properties.powerState == "ON") {
						vmHtml += '<div href="#opera-' + resource.id + '" class="card-header collapsed py-3 d-flex flex-row align-items-center justify-content-between bg-success" data-toggle="collapse" role="button">';
					} else {
						vmHtml += '<div href="#opera-' + resource.id + '" class="card-header collapsed py-3 d-flex flex-row align-items-center justify-content-between bg-secondary" data-toggle="collapse" role="button">';
					}
					vmHtml += '<div class="d-flex flex-row align-items-center justify-content-start">';
					vmHtml += '<div class="dropdown no-arrow">';
					vmHtml += '<a class="dropdown-toggle mr-2 pr-2" role="button" data-toggle="dropdown"><i class="fas fa-fw fa-sm fa-bars text-white"></i></a>';
					vmHtml += '<div class="dropdown-menu shadow animated--fade-in">';
					vmHtml += '<div class="dropdown-header">운영 작업</div>';
					vmHtml += '<a class="dropdown-item">전원 켬</a>';
					vmHtml += '<a class="dropdown-item">전원 끔</a>';
					vmHtml += '<a class="dropdown-item">스냅 샷</a>';
					vmHtml += '<a class="dropdown-item">삭제</a>';
					vmHtml += '</div></div>';
					vmHtml += '<h6 class="m-0 font-weight-bold text-white">' + resource.properties.resourceName + '</h6></div>';
					vmHtml += '<div class="d-flex flex-row align-items-center justify-content-end">';
					if (resource.properties.address !== undefined && resource.properties.address != null) {
						vmHtml += '<h6 class="m-0 font-weight-bold text-white">' + resource.properties.address + '</h6>';						
					}
					vmHtml += '</div></div>';
					vmHtml += '<div id="opera-' + resource.id + '" class="collapse">';
					vmHtml += '<div class="card-body p-1">' + resource.properties.resourceName + '</div></div></div>';
					vmHtmls.push(vmHtml);
				}
			});
			if (vmHtmls.length > 1) {
				var cols = [[],[]];
				for (var i=0; i<vmHtmls.length; i++) {
					cols[i%2].push(vmHtmls[i]);
				}
				var col1 = '<div class="col-6 pr-1">' + cols[0].join() + '</div>';
				var col2 = '<div class="col-6 pl-1">' + cols[1].join() + '</div>';
				html += '<div class="row card-body p-2">' + col1 + col2;
			} else {
				html += '<div class="card-body p-2">' + vmHtmls.join();
			}
			html += '</div></div>';
		});
		$("#opera-deployments").html(html);
		hideWaitPanel();
	});
};

function getUserDetail() {
	getAuthApi("/user", function(data) {
		if (data.displayName !== undefined && data.displayName != null && data.displayName != "") {
			$("#opera-user").html(data.displayName);
		} else {
			$("#opera-user").html(data.userName);
		}
	});
};

function checkUser() {
	getAuthApi('/check', function(data) {
		currUser = data;
		getUserDetail();
		getRegions();
	});
};

(function($) {
	$("#opera-menu-toggle, #opera-menu-toggle-top").on('click', function(event) {
		$("body").toggleClass("sidebar-toggled");
		$(".sidebar").toggleClass("toggled");
		if ($(".sidebar").hasClass("toggled")) {
			$('.sidebar .collapse').collapse('hide');
		};
	});

	$(window).resize(function() {
		if ($(window).width() < 768) {
			$('.sidebar .collapse').collapse('hide');
		};
		if ($(window).width() < 480 && !$(".sidebar").hasClass("toggled")) {
			$("body").addClass("sidebar-toggled");
			$(".sidebar").addClass("toggled");
			$('.sidebar .collapse').collapse('hide');
		};
	});

	$('body.fixed-nav .sidebar').on('mousewheel DOMMouseScroll wheel', function(event) {
		if ($(window).width() > 768) {
			var e0 = event.originalEvent,
			delta = e0.wheelDelta || -e0.detail;
			this.scrollTop += (delta < 0 ? 1 : -1) * 30;
			event.preventDefault();
		}
	});

	$(document).on('scroll', function() {
		var scrollDistance = $(this).scrollTop();
		if (scrollDistance > 100) {
			$('.scroll-to-top').fadeIn();
		} else {
			$('.scroll-to-top').fadeOut();
		}
	});

	$(document).on('click', 'a.scroll-to-top', function(event) {
		var $anchor = $(this);
		$('html, body').stop().animate({
			scrollTop: ($($anchor.attr('href')).offset().top)
		}, 1000, 'easeInOutExpo');
		event.preventDefault();
	});
})(jQuery);

$(document).ready(function() {
	checkUser();
	//hideWaitPanel();
});