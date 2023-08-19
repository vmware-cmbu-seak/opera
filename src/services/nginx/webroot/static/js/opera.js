// Opera Package
var Opera = Opera || {
	Rest: {},
	Auth: {}
};

Opera.Rest.get = function (url, headers, asyncResultHandler, asyncErrorHandler) {
	if (asyncResultHandler) { // async request
		$.ajax({
			type: "get",
			url: url,
			headers: headers,
			success: function(data) { asyncResultHandler(data); },
			error: function(jqXHR, textStatus, errorThrown) {
				console.error("Opera.Auth.get(" + url + ") [" + jqXHR.status + "] " + errorThrown + " : " + textStatus);
				if (jqXHR.status == 401) { Opera.Auth.redirectLoginPage(); }
				else if (asyncErrorHandler) { asyncErrorHandler(jqXHR, textStatus, errorThrown); }
			}
		});
	} else {
		let result;
		$.ajax({
			type: "get",
			async: false,
			url: url,
			headers: headers,
			success: function(data) { result = data; },
			error: function(jqXHR, textStatus, errorThrown) {
				console.error("Opera.Auth.get(" + url + ") [" + jqXHR.status + "] " + errorThrown + " : " + textStatus);
				if (jqXHR.status == 401) { Opera.Auth.redirectLoginPage(); }
				else { throw jqXHR; }
			}
		});
		return result;
	}
};

Opera.Auth.redirectLoginPage = function () {
	window.location.replace('/auth/login');
};

Opera.Auth.get = function (url, asyncResultHandler, asyncErrorHandler) {
	return Opera.Rest.get("/auth" + url, {}, asyncResultHandler, asyncErrorHandler);
};

// User Client /////////////////////////////////////////////////////////////////////////////////////////////////
Opera.UserClient = function UserClient(completeHandler) {
	// init
	this.children = {};
	let result = Opera.Auth.get("/check");
	this.id = result.id;
	this.userId = result.userId;
	this.accessToken = result.accessToken;
	this.aaEndpoints = result.aaEndpoints;
	
	
	// methods
	this.detail = (asyncResultHandler, asyncErrorHandler) => {
		return Opera.Auth.get("/user", asyncResultHandler, asyncErrorHandler)
	};
	
	this.getRegionClient = (completeHandler) => {
		return new Opera.RegionClient(this, completeHandler);
	};
	
	// execute allocation complete handler
	if (completeHandler) completeHandler(this);
};

// Region Client ///////////////////////////////////////////////////////////////////////////////////////////////
Opera.RegionClient = function RegionClient(userClient, completeHandler) {
	// init
	if (!userClient) {
		console.error("Opera.RegionClient(userClient) : be required Opera.UserClient() object");
		throw "Opera.RegionClient(userClient) : be required Opera.UserClient() object";
	}
	
	this._ = userClient;
	this._.children.regions = this;
	this.children = {};
	
	this.all = [];
	this.brand = {};
	this.current;
	this.active = [];
	this.inactive = [];
	
	userClient.aaEndpoints.forEach((aaEndpoint) => {
		let endpoint = aaEndpoint.endpoint;
		if (aaEndpoint.check) {
			let result = Opera.Rest.get("/api/userprofile/api/branding/byservice/cloud_assembly", {"CMP-REGION-ENDPOINT": endpoint});
			this.brand[endpoint] = result.content[0].serviceName;
			if (!(this.current)) this.current = endpoint;
			this.all.push(endpoint);
			this.active.push(endpoint);
		} else {
			this.all.push(endpoint);
			this.inactive.push(endpoint);
		}
	});
	
	// methods
	this.setCurrent = (endpoint, completeHandler) => {
		if (this.active.indexOf(endpoint) < 0) throw "Opera.RegionClient.setCurrent(" + endpoint + ") : could not set current by region";
		this.current = endpoint;
		if (completeHandler) completeHandler(this);
		return this.current;
	};
	
	this.getProjectClient = (completeHandler) => {
		return new Opera.ProjectClient(this, completeHandler);
	};
	
	this.Api = {
		get: (url, asyncResultHandler, asyncErrorHandler) => {
			return Opera.Rest.get("/api" + url, {"CMP-REGION-ENDPOINT": this.current}, asyncResultHandler, asyncErrorHandler);
		}
	};
	
	this.App = {
		get: (url, asyncResultHandler, asyncErrorHandler) => {
			return Opera.Rest.get("/app" + url, {"CMP-REGION-ENDPOINT": this.current}, asyncResultHandler, asyncErrorHandler);
		}
	};
	
	// execute allocation complete handler
	if (completeHandler) completeHandler(this);
};

// Project Client //////////////////////////////////////////////////////////////////////////////////////////////
Opera.ProjectClient = function ProjectClient(regionClient, completeHandler) {
	// init
	if (!regionClient) {
		console.error("Opera.ProjectClient(regionClient) : be required Opera.RegionClient() object");
		throw "Opera.ProjectClient(regionClient) : be required Opera.RegionClient() object";
	}
	
	this._ = regionClient;
	this._.children.projects = this;
	this.children = {};
	
	this.all = this._.Api.get("/iaas/api/projects").content;
	this.count = this.all.length;
	this.current;
	this.project = {};
	
	this.all.forEach((project) => {
		if (!(this.current)) this.current = project.id;
		this.project[project.id] = project;
	});
	
	// methods
	this.setCurrent = (id, completeHandler) => {
		if (!(this.project.hasOwnProperty(id))) throw "Opera.ProjectClient.setCurrent(" + id + ") : could not set current by id";
		this.current = id;
		if (completeHandler) completeHandler(this);
		return this.current;
	};
	
	this.findByName = (name) => {
		for (let project of this.all) {
			if (project.name == name) return project.id;
		}
		return null;
	}
	
	this.getDeploymentClient = (asyncCompleteHandler) => {
		return new Opera.DeploymentClient(this, asyncCompleteHandler);
	};
	
	this.getResourceClient = (asyncCompleteHandler) => {
		return new Opera.ResourceClient(this, asyncCompleteHandler);
	};
	
	// execute allocation complete handler
	if (completeHandler) completeHandler(this);
};

// Deployment Client ///////////////////////////////////////////////////////////////////////////////////////////
Opera.DeploymentClient = function DeploymentClient(projectClient, asyncCompleteHandler) {
	// init
	if (!projectClient) {
		console.error("Opera.DeploymentClient(projectClient) : be required Opera.ProjectClient() object");
		throw "Opera.DeploymentClient(projectClient) : be required Opera.ProjectClient() object";
	}
	
	this._ = projectClient;
	this._.children.deployments = this;
	this.children = {};
	
	this.all = [];
	this.count = 0;
	this.current;
	this.deployment = {};
	
	// methods
	this.setCurrent = (id, completeHandler) => {
		if (!(this.deployment.hasOwnProperty(id))) throw "Opera.DeploymentClient.setCurrent(" + id + ") : could not set current by id";
		this.current = id;
		if (completeHandler) completeHandler(this);
		return this.current;
	};
	
	this.findByName = (name) => {
		for (let deployment of this.all) {
			if (deployment.name == name) return deployment.id;
		}
		return null;
	};
	
	// data
	if (asyncCompleteHandler) {
		this._._.App.get('/deployments?projectId=' + this._.current, (deployments) => {
			this.all = deployments;
			this.count = this.all.length;
			this.all.forEach((deployment) => {
				if (!(this.current)) this.current = deployment.id;
				this.deployment[deployment.id] = deployment;
			});
			asyncCompleteHandler(this);
		});
	} else {
		this.all = this._._.App.get('/deployments?projectId=' + this._.current);
		this.count = this.all.length;
		this.all.forEach((deployment) => {
			if (!(this.current)) this.current = deployment.id;
			this.deployment[deployment.id] = deployment;
		});
	}
};

// Resource Client ///////////////////////////////////////////////////////////////////////////////////////////
Opera.ResourceClient = function ResourceClient(projectClient, asyncCompleteHandler) {
	// init
	if (!projectClient) {
		console.error("Opera.ResourceClient(projectClient) : be required Opera.ProjectClient() object");
		throw "Opera.ResourceClient(projectClient) : be required Opera.ProjectClient() object";
	}
	
	this._ = projectClient;
	this._.children.resources = this;
	this.children = {};
	
	this.all = [];
	this.count = 0;
	this.current;
	this.resource = {};
	
	// methods
	this.setCurrent = (id, completeHandler) => {
		if (!(this.resource.hasOwnProperty(id))) throw "Opera.ResourceClient.setCurrent(" + id + ") : could not set current by id";
		this.current = id;
		if (completeHandler) completeHandler(this);
		return this.current;
	};
	
	this.findByName = (name) => {
		for (let resource of this.all) {
			if (resource.name == name) return resource.id;
		}
		return null;
	}
	
	// data
	if (asyncCompleteHandler) {
		this._._.App.get('/resources?projectId=' + this._.current, (resources) => {
			this.all = resources;
			this.count = this.all.length;
			this.all.forEach((resource) => {
				if (!(this.current)) this.current = resource.id;
				this.resource[resource.id] = resource;
			});
			asyncCompleteHandler(this);
		});
	} else {
		this.all = this._._.App.get('/resources?projectId=' + this._.current);
		this.count = this.all.length;
		this.all.forEach((resource) => {
			if (!(this.current)) this.current = resource.id;
			this.resource[resource.id] = resource;
		});
	}
};












