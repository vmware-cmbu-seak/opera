// Top Menu Control ////////////////////////////////////////////////////////////////////////////////////////////
function showUserInfo(user) {
	showWaitPanel();
	user.detail((data) => {
		if (data.displayName !== undefined && data.displayName != null && data.displayName != "") $("#opera-user").html(data.displayName);
		else $("#opera-user").html(data.userName);
	});
	user.getRegionClient(showRegions);
	hideWaitPanel();
};

function showRegions(region) {
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
	$("#opera-regions").html('<h6 class="dropdown-header" style="text-align: center;">Select Cloud Endpoint</h6>' + html);
	Project = region.getProjectClient(showProjects);
	
	$(".opera-region").click((event) => {
		region.setCurrent($(event.target).attr("oid"), showRegions);
	});
	hideWaitPanel();
};

function showProjects(project) {
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
	$("#opera-projects").html('<h6 class="dropdown-header" style="text-align: center;">Select Project</h6>' + html);
	showWaitPanel();
	Deployment = project.getDeploymentClient((deployments) => { hideWaitPanel(); });
	showWaitPanel();
	Resource = project.getResourceClient((resources) => { hideWaitPanel(); });
	showWaitPanel();
	Catalog = project.getCatalogClient((catalogs) => {
		let categoryIndices = [];
		Object.keys(catalogs.category).forEach((index) => {
			categoryIndices.push(parseInt(index));
		});
		categoryIndices = categoryIndices.sort((x, y) => { return x - y; });
		let html = "";
		categoryIndices.forEach((index) => {
			let category = catalogs.category[index];
			html += `
<li class="nav-item">
<a class="nav-link collapsed" data-toggle="collapse" data-target="#opera-category-` + index + `"><i class="fas fa-fw fa-bullseye"></i><span>` + category.name + `</span></a>
<div id="opera-category-` + index + `" class="collapse" data-parent="#opera-left-menu"><div class="collapse-inner rounded py-2 animated--grow-in">
`;
			category.catalogs.forEach((catalogId) => {
				catalog = catalogs.catalog[catalogId];
				html += `<a class="opera-catalog collapse-item" oid="` + catalog.id + `">` + catalog.name + `</a>`;
			});
			html += `</div></div></li>`;
		});
		html += `<hr class="sidebar-divider">`;
		$("#opera-catalog-category").html(html);
		
		$(".opera-catalog").click((event) => {
			Catalog.setCurrent($(event.target).attr("oid"), showCatalog);
		});
		hideWaitPanel();
	});
	showPage($("#opera-dashboard-page"));
	
	$(".opera-project").click((event) => {
		project.setCurrent($(event.target).attr("oid"), showProjects);
	});
	hideWaitPanel();
};

function showCatalog(catalog) {
	showCatalogPage();
};

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