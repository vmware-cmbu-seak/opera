function showDeploymentPage() {
	showAggregateMetrics();
	showDeployments();
};

function showAggregateMetrics() {
	getApi("/aggregator/api/metrics/deployment/aggregate/projects/" + currProjectId, function(data) {
		var ins = 0;
		var cpu = 0;
		var mem = 0;
		var stg = 0;
		data.metrics.forEach(function(metric) {
			switch (metric.name) {
				case "instances":
					ins = metric.value;
					break;
				case "cpu":
					cpu = metric.value;
					break;
				case "memory":
					mem = metric.value;
					break;
				case "storage":
					stg = metric.value;
					break;
			}
		});
		$("#opera-agg-ins-metric").html(numberWithCommas(ins));
		$("#opera-agg-cpu-metric").html(numberWithCommas(cpu));
		$("#opera-agg-mem-metric").html(numberWithCommas(parseInt(mem / 1024)));
		$("#opera-agg-stg-metric").html(numberWithCommas(stg));
	});
};

function showDeployments() {
	getApp('/deployments?projectId=' + currProjectId, function(data) {
		var deployments = data;
		var html = "";
		deployments.forEach(function(deployment) {
			switch (deployment.status) {
				case "CREATE_SUCCESSFUL":
					var depStatus = "bg-primary";
					break;
				case "CREATE_FAILURE":
					var depStatus = "bg-danger";
					break;
				default:
					var depStatus = "bg-secondary";
			}
			var depCatalogName = (deployment.catalog !== undefined && deployment.catalog != null) ? deployment.catalog.name : "By Cloud Template";
			var depExpense = (deployment.expense !== undefined && deployment.expense != null) ? numberWithCommas(parseInt(deployment.expense.totalExpense)) : "0";
			html += '<div class="card shadow mb-4" oid="' + deployment.id + '">';
			html += '<div class="card-header py-3 d-flex flex-row align-items-center justify-content-between ' + depStatus + '">';
            html += '<h6 class="m-0 font-weight-bold text-white">' + deployment.name + '</h6>';
            html += '<div class="dropdown no-arrow d-flex flex-row align-items-center justify-content-end">';
			html += '<div class="m-0 mr-3 text-white"><small><i class="fas fa-certificate"></i> ' + depCatalogName + '</small></div>';
			html += '<div class="m-0 mr-3 text-white"><small><i class="fas fa-money-bill-alt"></i> ' + depExpense + '</small></div>';
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
					var rscStatus = (resource.properties.powerState == "ON") ? "bg-success" : "bg-secondary";
					var rscAddress = (resource.properties.address !== undefined && resource.properties.address != null && resource.properties.address != "") ? resource.properties.address : "?";
					var vmHtml = "";
					vmHtml += '<div class="card shadow mb-1">';
					vmHtml += '<div href="#opera-' + resource.id + '" oid="' + resource.id + '" class="opera-resource card-header collapsed py-3 d-flex flex-row align-items-center justify-content-between ' + rscStatus + '" data-toggle="collapse" role="button">';
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
					vmHtml += '<h6 class="m-0 font-weight-bold text-white"><i class="fas fa-network-wired"></i> ' + rscAddress + '</h6>';
					vmHtml += '</div></div>';
					vmHtml += '<div id="opera-' + resource.id + '" class="collapse">';
					vmHtml += '<div class="card-body p-1">'
					vmHtml += '<div class="row"><div class="table-responsive m-2 px-2"><table class="table table-bordered" width="100%" cellspacing="0">';
					vmHtml += '<tbody id="opera-detail-' + resource.id + '">';
					vmHtml += '</tbody></table></div></div>';
					if (resource.properties.powerState == "ON") {
						vmHtml += '<div class="row container-fluid d-flex flex-row align-items-center justify-content-between">';
						vmHtml += '<div class="card shadow m-1"><div class="card-header py-3"><h6 class="m-0 font-weight-bold text-primary">CPU 사용율</h6></div>';
						vmHtml += '<div class="card-body"><div class="chart-area"><canvas id="opera-metric-cpu-' + resource.id + '"></canvas></div></div></div>';
						vmHtml += '<div class="card shadow m-1"><div class="card-header py-3"><h6 class="m-0 font-weight-bold text-primary">메모리 사용율</h6></div>';
						vmHtml += '<div class="card-body"><div class="chart-area"><canvas id="opera-metric-mem-' + resource.id + '"></canvas></div></div></div>';
						vmHtml += '<div class="card shadow m-1"><div class="card-header py-3"><h6 class="m-0 font-weight-bold text-primary">IOPS 처리량</h6></div>';
						vmHtml += '<div class="card-body"><div class="chart-area"><canvas id="opera-metric-iops-' + resource.id + '"></canvas></div></div></div>';
						vmHtml += '<div class="card shadow m-1"><div class="card-header py-3"><h6 class="m-0 font-weight-bold text-primary">네트워크 처리량</h6></div>';
						vmHtml += '<div class="card-body"><div class="chart-area"><canvas id="opera-metric-net-' + resource.id + '"></canvas></div></div></div>';
						vmHtml += '</div>';	
					}
					vmHtml += '</div></div></div>';
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
		$(".opera-resource").click(function(event) {
			var dom = $(event.target);
			if (dom.hasClass("collapsed")) {
				showResource(dom);
			}
		});
		hideWaitPanel();
	});
};

function showResource(dom) {
	var resourceId = dom.attr("oid");
	getApi("/deployment/api/resources/" + resourceId, function (data) {
		let prop = data.properties;
		var html = "";
		html += '<tr><th>CPU</th><td>' + prop.cpuCount + '</td></tr>';
		html += '<tr><th>MEM</th><td>' + prop.memoryGB + '</td></tr>';
		html += '<tr><th>OS</th><td>' + prop.softwareName + '</td></tr>';
		$("#opera-detail-" + resourceId).html(html);
	});
	if (dom.hasClass("bg-success")) {
		var endTS = Date.now();
		var sttTS = endTS - 3600000;
		getApi("/metrics/api/resources/" + resourceId + "?fromDate=" + sttTS + "&toDate=" + endTS, function (data) {
			let cpuLabels = [];
			let cpuData = [];
			data.stats.CPU.statData.forEach(function(m) {
				cpuLabels.push(timeFormat(m.timestamp));
				cpuData.push(m.value.toFixed(1));
			});
			let memLabels = [];
			let memData = [];
			data.stats.MEM.statData.forEach(function(m) {
				memLabels.push(timeFormat(m.timestamp));
				memData.push(m.value.toFixed(1));
			});
			let iopsLabels = [];
			let iopsData = [];
			data.stats.IOPS.statData.forEach(function(m) {
				iopsLabels.push(timeFormat(m.timestamp));
				iopsData.push(m.value.toFixed(1));
			});
			let netLabels = [];
			let netData = [];
			data.stats.NET.statData.forEach(function(m) {
				netLabels.push(timeFormat(m.timestamp));
				netData.push(m.value.toFixed(1));
			});
			drawMetricChart("opera-metric-cpu-" + resourceId, "CPU", cpuLabels, cpuData);
			drawMetricChart("opera-metric-mem-" + resourceId, "MEM", memLabels, memData);
			drawMetricChart("opera-metric-iops-" + resourceId, "IOPS", iopsLabels, iopsData);
			drawMetricChart("opera-metric-net-" + resourceId, "NET", netLabels, netData);
		});	
	}
};
