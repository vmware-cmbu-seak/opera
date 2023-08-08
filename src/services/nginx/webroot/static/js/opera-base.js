// User Control
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
		showRegions();
	});
};

// Region Control
function getRegionBrand(regionEndpoint) {
	var brand = regionBrands[regionEndpoint];
	if (brand === undefined || brand == null || brand == "") {
		$.ajax({
			type: "get",
			url: "/api/userprofile/api/branding/byservice/cloud_assembly",
			async: false,
			headers: {
				"CMP-REGION-ENDPOINT": regionEndpoint
			},
			success: function(data) {
				try { brand = data.content[0].serviceName; }
				catch (e) { brand = regionEndpoint; }
			},
			error: function(xhr, status, thrown) {
				console.log(xhr);
				console.log(status);
				console.log(thrown);
				brand = regionEndpoint;
			}
		});
		regionBrands[regionEndpoint] = brand;
	}
	return brand;
};

function showRegions(regionEndpoint) {
	showWaitPanel();
	var html = "";
	if (regionEndpoint === undefined || regionEndpoint == null || regionEndpoint == "") {
		currUser.aaEndpoints.forEach(function(aaEndpoint) {
			if (aaEndpoint.check) {
				if (html == "") {
					html += '<a class="dropdown-item active">' + getRegionBrand(aaEndpoint.endpoint) + '</a>';
					$("#opera-curr-region").html(getRegionBrand(aaEndpoint.endpoint));
					currRegion = aaEndpoint.endpoint;
				} else {
					html += '<a class="opera-region dropdown-item" oid="' + aaEndpoint.endpoint + '">' + getRegionBrand(aaEndpoint.endpoint) + '</a>';
				}
			} else {
				html += '<a class="dropdown-item">' + getRegionBrand(aaEndpoint.endpoint) + '</a>';
			}
		})
	} else {
		$("#opera-curr-region").html("정보없음");
		currUser.aaEndpoints.forEach(function(aaEndpoint) {
			if (aaEndpoint.check) {
				if (aaEndpoint.endpoint == regionEndpoint) {
					html += '<a class="dropdown-item active">' + getRegionBrand(aaEndpoint.endpoint) + '</a>';
					$("#opera-curr-region").html(getRegionBrand(aaEndpoint.endpoint));
					currRegion = aaEndpoint.endpoint;
				} else {
					html += '<a class="opera-region dropdown-item" oid="' + aaEndpoint.endpoint + '">' + getRegionBrand(aaEndpoint.endpoint) + '</a>';
				}
			} else {
				html += '<a class="dropdown-item">' + getRegionBrand(aaEndpoint.endpoint) + '</a>';
			}
		})
	};
	showProjects();
	$("#opera-regions").html(html);
	$(".opera-region").click(function(event) {
		showRegions($(event.target).attr("oid"));
	});
};

// Project Control
function showProjects(projectId) {
	showWaitPanel();
	getApi('/iaas/api/projects', function(data) {
		var projects = data.content;
		var html = "";
		if (projectId === undefined || projectId == null || projectId == "") {
			projects.forEach(function(project) {
				if (html == "") {
					html += '<a class="dropdown-item active">' + project.name + '</a>'
					$("#opera-curr-project").html(project.name);
					currProjectId = project.id;
				} else {
					html += '<a class="opera-project dropdown-item" oid="' + project.id + '">' + project.name + '</a>'
				}
			});
		} else {
			$("#opera-curr-project").html("정보없음");
			projects.forEach(function(project) {
				if (project.id == projectId) {
					html += '<a class="dropdown-item active">' + project.name + '</a>'
					$("#opera-curr-project").html(project.name);
					currProjectId = project.id;
				} else {
					html += '<a class="opera-project dropdown-item" oid="' + project.id + '">' + project.name + '</a>'
				}
			});
		}
		$("#opera-projects").html(html);
		$(".opera-project").click(function(event) {
			showProjects($(event.target).attr("oid"));
		});
		showPage();
	});
};

// Page Control
function showPage(pageId) {
	showDeploymentPage();
};
