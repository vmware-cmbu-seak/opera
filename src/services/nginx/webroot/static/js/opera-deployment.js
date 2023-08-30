function showDeploymentPage() {
	showWaitPanel();
	$('#opera-page').html(`
<div class="row">
    <div id="opera-deployments" class="col-lg-12"></div>
</div>
	`);
	
	showDeployments();
	hideWaitPanel();
};

function showDeployments() {
	showWaitPanel();
	var html = "";
	Deployment.all.forEach((deployment) => {
		var depStatus = '';
		switch (deployment.status) {
			case "CREATE_FAILURE":
				var depStatus = " bg-danger";
				break;
		}
		var depCatalogName = (deployment.catalog !== undefined && deployment.catalog != null) ? deployment.catalog.name : "By Cloud Template";
		var depExpense = (deployment.expense !== undefined && deployment.expense != null) ? numberWithCommas(parseInt(deployment.expense.totalExpense)) : "0";
		
		html += `
<div class="opera-deployment card shadow mb-4" id="opera-oid-` + deployment.id + `" oid="` + deployment.id + `">
	<div class="card-header d-flex flex-row align-items-center justify-content-between py-2` + depStatus + `">
		<h6 class="m-0 font-weight-bold">` + deployment.name + `</h6>
		<div class="dropdown no-arrow d-flex flex-row align-items-center justify-content-end">
			<div class="m-0 mr-3">
				<small><i class="fas fa-certificate pr-1"></i>` + depCatalogName + `</small>
			</div>
			<div class="m-0 mr-3">
				<small><i class="fas fa-money-bill-alt pr-1"></i>` + depExpense + `</small>
			</div>
			<a class="dropdown-toggle" href="#" role="button" data-toggle="dropdown">
				<i class="fas fa-bars fa-sm fa-fw"></i>
			</a>
			<div class="dropdown-menu dropdown-menu-right shadow animated--fade-in">
				<div class="dropdown-header">운영 작업</div>
				<a class="dropdown-item" href="#">프로젝트 변경</a>
				<a class="dropdown-item" href="#">소유자 변경</a>
				<a class="dropdown-item" href="#">설정 변경</a>
				<a class="dropdown-item" href="#">삭제</a>
			</div>
		</div>
	</div>
`
		var vmHtmls = [];
        deployment.resources.forEach(function(resource) {
			if (resource.type.indexOf("Machine") > -1) {
				if (resource.syncStatus == "SUCCESS") {
					if (resource.state == "OK") {
						if (resource.properties.powerState == "ON") { var rscStatus = "bg-success"; }
						else { var rscStatus = "bg-secondary"; }
					} else { var rscStatus = "bg-warning"; }
				} else { var rscStatus = "bg-danger"; }
				var rscAddress = (resource.properties.address !== undefined && resource.properties.address != null && resource.properties.address != "") ? resource.properties.address : "?";
				var vmHtml = `
<div class="opera-rsc card shadow mb-1" id="opera-oid-` + resource.id + `" oid="` + resource.id + `" onclick="showResource($(this));">
    <div href="#opera-rsc-` + resource.id + `" class="card-header collapsed py-3 d-flex flex-row align-items-center justify-content-between ` + rscStatus + `" data-toggle="collapse" role="button">
        <div class="d-flex flex-row align-items-center justify-content-start">
            <div class="dropdown no-arrow">
                <a class="opera-rsc-toggle dropdown-toggle mr-2 pr-2" role="button" data-toggle="dropdown">
                    <i class="fas fa-fw fa-sm fa-bars"></i>
                </a>
                <div class="opera-rsc-actions dropdown-menu shadow animated--fade-in">
                    <div class="dropdown-header">운영 작업</div>
                    <a class="opera-rsc-action dropdown-item">전원 켬</a>
                    <a class="opera-rsc-action dropdown-item">전원 끔</a>
                    <a class="opera-rsc-action dropdown-item">스냅 샷</a>
                    <a class="opera-rsc-action dropdown-item">삭제</a>
                </div>
            </div>
            <h6 class="m-0 font-weight-bold">` + resource.properties.resourceName + `</h6>
        </div>
        <div class="d-flex flex-row align-items-center justify-content-end">
            <h6 class="m-0 font-weight-bold">` + rscAddress + `</h6>
        </div>
    </div>
    <div id="opera-rsc-` + resource.id + `" class="collapse">
        <div class="card-body p-2">
            <div class="row d-flex flex-row align-items-center justify-content-between m-0 p-0 mb-2">
                <div class="opera-remote-console d-flex align-items-center justify-content-center" onclick="openConsole($(this));">
                    <i class="fas fa-desktop fa-8x"></i>
                </div>
                <div class="opera-detail">
                    <div class="table-responsive">
                        <small>
                            <table class="table-sm table-hover table-bordered" width="100%" cellspacing="0">
                                <tbody class="opera-rsc-props">
                                	<tr class="prop-status">
                                        <th>상태</th>
                                        <td>
                                            <table class="table-sm table-bordered" width="100%" cellspacing="0">
                                                <tbody>
                                                    <tr>
                                                        <th>동기화 상태</th>
                                                        <td class="prop-sync">SUCCESS</td>
                                                    </tr>
                                                    <tr>
                                                        <th>전원 상태</th>
                                                        <td class="prop-power">ON</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr class="prop-hostname">
                                        <th>호스트 이름</th>
                                        <td class="prop-val"></td>
                                    </tr>
                                    <tr class="prop-os">
                                        <th>운영체제</th>
                                        <td class="prop-val"></td>
                                    </tr>
                                    <tr>
                                        <th>컴퓨팅 설정</th>
                                        <td>
                                            <table class="table-sm table-bordered" width="100%" cellspacing="0">
                                                <tbody class="prop-val">
                                                    <tr class="prop-region">
                                                        <th>컴퓨팅 지역</th>
                                                        <td class="prop-val"></td>
                                                    </tr>
                                                    <tr class="prop-zone">
                                                        <th>컴퓨팅 영역</th>
                                                        <td class="prop-val"></td>
                                                    </tr>
                                                    <tr class="prop-cpu">
                                                        <th>CPU</th>
                                                        <td><span class="prop-val"></span><small> Core</small></td>
                                                    </tr>
                                                    <tr class="prop-mem">
                                                        <th>메모리</th>
                                                        <td><span class="prop-val"></span><small> MB</small></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>네트워크 설정</th>
                                        <td>
                                            <table class="table-sm table-bordered mb-1" width="100%" cellspacing="0">
                                                <tr class="prop-addr">
                                                    <th>대표 IP</th>
                                                    <td class="prop-val"></td>
                                                </tr>
                                            </table>
                                            <table class="prop-net table-sm table-bordered" width="100%" cellspacing="0">
                                                <thead style="text-align:center;">
                                                    <tr>
                                                        <th>네트워크 이름</th>
                                                        <th>IP 주소</th>
                                                        <th>GW 주소</th>
                                                        <th>네트워크 마스크</th>
                                                        <th>MAC 주소</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="prop-val" style="text-align:center;">
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr class="prop-storage">
                                        <th>스토리지 설정</th>
                                        <td>
                                            <table class="table-sm table-bordered" width="100%" cellspacing="0">
                                                <tbody class="prop-val">
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr class="prop-tag">
                                        <th>태그 설정</th>
                                        <td>
                                            <table class="table-sm table-bordered" width="100%" cellspacing="0">
                                                <tbody class="prop-val">
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr class="prop-cloud-config">
                                        <th>Cloud-Init 설정</th>
                                        <td>
                                            <textarea class="prop-val" style="width:100%;" readonly></textarea>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </small>
                    </div>
                </div>
            </div>
            <div class="opera-metrics row d-flex flex-row align-items-center justify-content-between m-0 p-0">
`;
				if (rscStatus == "bg-success") {
					vmHtml += `
<div class="opera-metric-cpu">
    <div class="card shadow">
        <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold">CPU 사용율</h6>
        </div>
        <div class="card-body">
            <div class="chart-area">
                <canvas class="opera-metric"></canvas>
            </div>
        </div>
    </div>
</div>
<div class="opera-metric-mem">
    <div class="card shadow">
        <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold">메모리 사용율</h6>
        </div>
        <div class="card-body">
            <div class="chart-area">
                <canvas class="opera-metric"></canvas>
            </div>
        </div>
    </div>
</div>
<div class="opera-metric-net">
    <div class="card shadow">
        <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold">네트워크 처리량</h6>
        </div>
        <div class="card-body">
            <div class="chart-area">
                <canvas class="opera-metric"></canvas>
            </div>
        </div>
    </div>
</div>
<div class="opera-metric-iops">
    <div class="card shadow">
        <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold">IOPS 처리량</h6>
        </div>
        <div class="card-body">
            <div class="chart-area">
                <canvas class="opera-metric"></canvas>
            </div>
        </div>
    </div>
</div>
`;
				}
				vmHtml += `
            </div>
        </div>
    </div>
</div>
`;
				vmHtmls.push(vmHtml);
			}
		});
		if (vmHtmls.length > 1) {
			var cols = [[],[]];
			for (var i=0; i<vmHtmls.length; i++) {
				cols[i%2].push(vmHtmls[i]);
			}
			var col1 = '<div class="opera-rsc-column col-6 pr-1">' + cols[0].join('') + '</div>';
			var col2 = '<div class="opera-rsc-column col-6 pl-1">' + cols[1].join('') + '</div>';
			html += '<div class="opera-resources row card-body p-2">' + col1 + col2;
		} else {
			html += '<div class="card-body p-2">' + vmHtmls.join('');
		}
		html += '</div></div>';
	});
	$("#opera-deployments").html(html);
	hideWaitPanel();
};

function showResource(dom) {
	let card = dom;
	let header = dom.find('.card-header:eq(0)');
	let resource = Resource.resource[card.attr("oid")];
	let prop = resource.properties;
	
	if (header.hasClass("collapsed")) {
		var propDom = $('#opera-rsc-' + resource.id + ' .opera-rsc-props');
		var networks = new Array(prop.networks.length);
		prop.networks.forEach(function (network) {
			networks[network.deviceIndex] = `
<tr>
    <td>` + network.name + `</td>
    <td>` + network.address + `</td>
    <td>` + (network.gateway?network.gateway:'csp provided') + `</td>
    <td>` + network.netmask + `</td>
    <td>` + network.mac_address + `</td>
</tr>
		`
		});
		
		prop.storage.disks.sort(function (a, b) {
			if(a.controllerKey !== undefined && b.controllerKey !== undefined) {
				return (parseInt(a.controllerKey) + parseInt(a.controllerUnitNumber)) - (parseInt(b.controllerKey) + parseInt(b.controllerUnitNumber))
			}
		});
		var storages = [];
		prop.storage.disks.forEach(function (storage) {
			if (storage.type == "HDD" | storage.type == "SSD") {
				storages.push(`
<tr>
    <th>` + storage.name + `</th>
    <td>` + numberWithCommas(storage.capacityGb) + `<small> GB</small></td>
</tr>
				`);
			}
		});
		var tags = [];
		prop.tags.forEach(function (tag) {
			tags.push('<tr><th>' + tag.key + '</th><td>' + tag.value + '</td></tr>')
		});
		
		propDom.find('.prop-status .prop-sync').html(resource.syncStatus);
		propDom.find('.prop-status .prop-power').html((resource.syncStatus=="SUCCESS")?prop.powerState:"알수없음");
		propDom.find('.prop-hostname .prop-val').html(prop.hostName?prop.hostName:prop.resourceName);
		propDom.find('.prop-os .prop-val').html(prop.softwareName?prop.softwareName:(prop.osType + " / " + prop.image));
		propDom.find('.prop-region .prop-val').html(prop.region);
		propDom.find('.prop-zone .prop-val').html(prop.zone);
		propDom.find('.prop-cpu .prop-val').html(prop.cpuCount);
		propDom.find('.prop-mem .prop-val').html(numberWithCommas(prop.totalMemoryMB));
		propDom.find('.prop-addr .prop-val').html(prop.address);
		propDom.find('.prop-net .prop-val').html(networks.join(''));
		propDom.find('.prop-storage .prop-val').html(storages.join(''));
		propDom.find('.prop-tag .prop-val').html(tags.join(''));
		propDom.find('.prop-cloud-config .prop-val').html(prop.cloudConfig);
	}
		
	if (header.hasClass("bg-success")) {
		var endTS = Date.now();
		var sttTS = endTS - 3600000;
		Region.Api.get("/metrics/api/resources/" + resource.id + "?fromDate=" + sttTS + "&toDate=" + endTS, (data) => {
			try {
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
				
				drawMetricChart($('#opera-rsc-' + resource.id + ' .opera-metric-cpu .opera-metric'), "CPU", cpuLabels, cpuData);
				drawMetricChart($('#opera-rsc-' + resource.id + ' .opera-metric-mem .opera-metric'), "MEM", memLabels, memData);
				drawMetricChart($('#opera-rsc-' + resource.id + ' .opera-metric-net .opera-metric'), "NET", netLabels, netData);
				drawMetricChart($('#opera-rsc-' + resource.id + ' .opera-metric-iops .opera-metric'), "IOPS", iopsLabels, iopsData);
			} catch (e) {}
		});
	}
};
