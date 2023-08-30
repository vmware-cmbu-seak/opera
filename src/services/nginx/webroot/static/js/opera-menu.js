// Top Menu Control ////////////////////////////////////////////////////////////////////////////////////////////
function showUserInfo (user) {
	showWaitPanel();
	user.detail((data) => {
		if (data.displayName !== undefined && data.displayName != null && data.displayName != "") $("#opera-user").html(data.displayName);
		else $("#opera-user").html(data.userName);
	});
	user.getRegionClient(showRegions);
	hideWaitPanel();
};

function showRegions (region) {
	showWaitPanel();
	Region = region;
	let html = "";
	region.active.forEach((endpoint) => {
		let brandName = region.brand[endpoint];
		if (endpoint == region.current) {
			html += '<a class="dropdown-item active"><i class="fas fa-bookmark fa-sm fa-fw mr-2"></i>' + brandName + '</a>';
			$("#opera-curr-region").html(brandName);
		} else {
			html += '<a class="opera-region dropdown-item" oid="' + endpoint + '"><i class="far fa-bookmark fa-sm fa-fw mr-2"></i>' + brandName + '</a>';
		}
	});
	region.inactive.forEach((endpoint) => {
		html += '<a class="dropdown-item"><i class="fas fa-ban fa-sm fa-fw mr-2"></i>' + endpoint + '</a>';
	});
	$("#opera-regions").html('<h6 class="dropdown-header">클라우드 지역 선택</h6>' + html);
	Project = region.getProjectClient(showProjects);
	
	$(".opera-region").click((event) => {
		region.setCurrent($(event.target).attr("oid"), showRegions);
	});
	hideWaitPanel();
};

function showProjects (project) {
	showWaitPanel();
	Project = project;
	let html = "";
	project.all.forEach((data) => {
		if (data.id == project.current) {
			html += '<a class="dropdown-item active"><i class="fas fa-bookmark fa-sm fa-fw mr-2"></i>' + data.name + '</a>'
			$("#opera-curr-project").html(data.name);
		} else {
			html += '<a class="opera-project dropdown-item" oid="' + data.id + '"><i class="far fa-bookmark fa-sm fa-fw mr-2"></i>' + data.name + '</a>'
		}
	});
	$("#opera-projects").html('<h6 class="dropdown-header">프로젝트 선택</h6>' + html);
	showWaitPanel();
	Deployment = project.getDeploymentClient((data) => { hideWaitPanel(); });
	showWaitPanel();
	Resource = project.getResourceClient((data) => { hideWaitPanel(); });
	showPage($("#opera-init-page"));
	
	$(".opera-project").click((event) => {
		project.setCurrent($(event.target).attr("oid"), showProjects);
	});
	hideWaitPanel();
}

// Left Menu Control ///////////////////////////////////////////////////////////////////////////////////////////
function showPage(page) {
	$('#opera-left-menu .nav-item').removeClass("active");
	$(page).addClass("active");
	switch ($(page).attr("page")) {
	case "dashboard":
		showDashboardPage();
		break;
	case "deployment":
		showDeploymentPage();
		break;
	}
};