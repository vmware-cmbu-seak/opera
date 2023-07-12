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
			window.location.replace('/auth/login');
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

// CMP Functions
function setRegionEndpoint(regionEndpoint) {
	var html = "";
	currUser.aaEndpoints.forEach(function(aaEndpoint) {
		if (regionEndpoint === undefined || regionEndpoint == null || regionEndpoint == "") {
			if (aaEndpoint.check) {
				if (html == "") {
					html += '<li><a class="dropdown-item active"><i class="bi bi-layers-fill"></i> <span>' + aaEndpoint.endpoint + '</span></a></li>';
					currEndpoint = aaEndpoint.endpoint;
					$("#opera-curr-region").html(currEndpoint);
				} else {
					html += '<li onclick="setRegionEndpoint(\'' + aaEndpoint.endpoint + '\');"><a class="dropdown-item"><i class="bi bi-layers"></i> <span>' + aaEndpoint.endpoint + '</span></a></li>';
				}
			} else {
				html += '<li><a class="dropdown-item"><i class="bi bi-layers"></i> <span>' + aaEndpoint.endpoint + '</span></a></li>';
			}
		} else {
			if (aaEndpoint.check) {
				if (aaEndpoint.endpoint == regionEndpoint) {
					html += '<li><a class="dropdown-item active"><i class="bi bi-layers-fill"></i> <span>' + aaEndpoint.endpoint + '</span></a></li>';
					currEndpoint = aaEndpoint.endpoint;
					$("#opera-curr-region").html(currEndpoint);
				} else {
					html += '<li onclick="setRegionEndpoint(\'' + aaEndpoint.endpoint + '\');"><a class="dropdown-item"><i class="bi bi-layers"></i> <span>' + aaEndpoint.endpoint + '</span></a></li>';
				}
			} else {
				html += '<li><a class="dropdown-item"><i class="bi bi-layers"></i> <span>' + aaEndpoint.endpoint + '</span></a></li>';
			}
		}
	});
	setProjects();
	$("#opera-regions").html(html);
}

function setProjects(projectId) {
	getApi('/iaas/api/projects',
		function(data) {
			var projects = data.content;
			var html = "";
			if (projectId === undefined || projectId == null || projectId == "") {
				projects.forEach(function(project) {
					if (html == "") {
						html += '<li><a class="dropdown-item active"><i class="bi bi-folder-fill"></i> <span>' + project.name + '</span></a></li>';
						currProjectId = project.id;
						$("#opera-curr-project").html(project.name);
					} else {
						html += '<li onclick="setProjects(\'' + project.id + '\');"><a class="dropdown-item"><i class="bi bi-folder"></i> <span>' + project.name + '</span></a></li>';
					}
				});
			} else {
				projects.forEach(function(project) {
					if (project.id == projectId) {
						html += '<li><a class="dropdown-item active"><i class="bi bi-folder-fill"></i> <span>' + project.name + '</span></a></li>';
						currProjectId = project.id;
						$("#opera-curr-project").html(project.name);
					} else {
						html += '<li onclick="setProjects(\'' + project.id + '\');"><a class="dropdown-item"><i class="bi bi-folder"></i> <span>' + project.name + '</span></a></li>';
					}
				});
			}
			$("#opera-projects").html(html);
			showDeployments();
		});
}

function showDeployments() {
	getApi('/deployment/api/deployments?expand=resources&projects=' + currProjectId,
		function(data) {
			var deployments = data.content;
			var html = "";
			deployments.forEach(function(deployment) {
				html += '<div class="card opera-content-item">';
				html += '<div class="card-header">' + deployment.name + '</div>';
				html += '<div class="card-body">';
				html += '<div class="d-flex flex-column">';
				html += '<div class="d-flex">';
				html += '<div class="col text-center fs-6"><i class="fa-solid fa-heart fa-beat-fade"></i> ' + deployment.status + '</div>';
				html += '<div class="col opera-col-spliter text-center fs-6"><i class="bi bi-person-circle"></i> ' + deployment.ownedBy + '</div>';
				html += '<div class="col opera-col-spliter text-center fs-6"><i class="bi bi-calendar-range"></i> ' + deployment.createdAt + ' <i class="bi bi-chevron-double-right"></i> ~</div>';
				html += '<div class="col opera-col-spliter text-center fs-6"><i class="bi bi-cash-coin"></i>' + parseInt(deployment.expense.totalExpense) + '<small> ' + deployment.expense.unit + '</small></div>';
				html += '</div>';
				html += '<hr>';
				html += '<div class="card">';
				html += '<div class="card-body">';
				html += '<div class="d-flex row row-cols-4">';
				deployment.resources.forEach(function(resource) {
					if (resource.type.indexOf("Machine") > -1) {
						html += '<div class="d-flex col text-center">';
						if (resource.properties.powerState == "ON") {
							html += '<div class="col-4 align-middle opera-vm-icon"><i class="bi bi-play-btn"></i></div>';
						} else {
							html += '<div class="col-4 align-middle opera-vm-icon"><i class="bi bi-stop-btn"></i></div>';
						}
						html += '<div class="col-8 d-flex flex-column text-start align-middle fs-6 my-auto">';
						html += '<small class="col">' + resource.properties.resourceName + '</small>';
						html += '<small class="col">' + resource.properties.address + '</small>';
						html += '</div>';
						html += '</div>';
					}
				});
				html += '</div>';
				html += '</div>';
				html += '</div>';
				html += '</div>';
				html += '</div>';
				html += '</div>';
			});
			$("#opera-content-body").html(html);
		});
}

function getUserDetail() {
	getAuthApi("/user",
		function(data) {
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
		setRegionEndpoint();
	});
};
