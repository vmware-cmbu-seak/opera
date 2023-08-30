function showDashboardPage() {
	showWaitPanel();
	$('#opera-page').html(`
<div class="row">
    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">VM</div>
                        <div class="h5 mb-0 font-weight-bold"><span id="opera-agg-ins-metric">1</span><small> Machines</small></div>
                    </div>
                    <div class="col-auto"><i class="fas fa-desktop fa-2x"></i></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">CPU</div>
                        <div class="h5 mb-0 font-weight-bold"><span id="opera-agg-cpu-metric">2</span><small> CPUs</small></div>
                    </div>
                    <div class="col-auto"><i class="fas fa-microchip fa-2x"></i></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Memory</div>
                        <div class="h5 mb-0 mr-3 font-weight-bold"><span id="opera-agg-mem-metric">3</span><small> GB</small></div>
                    </div>
                    <div class="col-auto"><i class="fas fa-memory fa-2x"></i></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Storage</div>
                        <div class="h5 mb-0 font-weight-bold"><span id="opera-agg-stg-metric">4</span><small> GB</small></div>
                    </div>
                    <div class="col-auto"><i class="fas fa-hdd fa-2x"></i></div>
                </div>
            </div>
        </div>
    </div>
</div>
	`);
	
	showAggregateMetrics();
	hideWaitPanel();
};

function showAggregateMetrics() {
	showWaitPanel();
	Region.Api.get("/aggregator/api/metrics/deployment/aggregate/projects/" + Project.current, (data) => {
		let ins = 0;
		let cpu = 0;
		let mem = 0;
		let stg = 0;
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
		hideWaitPanel();
	});
};
