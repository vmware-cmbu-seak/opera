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
				console.error("Opera.Rest.get(" + url + ") [" + jqXHR.status + "] " + errorThrown + " : " + textStatus);
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
				console.error("Opera.Rest.get(" + url + ") [" + jqXHR.status + "] " + errorThrown + " : " + textStatus);
				if (jqXHR.status == 401) { Opera.Auth.redirectLoginPage(); }
				else { throw jqXHR; }
			}
		});
		return result;
	}
};

Opera.Rest.post = function (url, data, headers, asyncResultHandler, asyncErrorHandler) {
	if (asyncResultHandler) { // async request
		$.ajax({
			type: "post",
			url: url,
			headers: headers,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: JSON.stringify(data),
			success : function(data) { asyncResultHandler(data); },
			error : function(jqXHR, textStatus, errorThrown) {
				console.error("Opera.Rest.post(" + url + ") [" + jqXHR.status + "] " + errorThrown + " : " + textStatus);
				if (jqXHR.status == 401) { Opera.Auth.redirectLoginPage(); }
				else if (asyncErrorHandler) { asyncErrorHandler(jqXHR, textStatus, errorThrown); }
			}
		});
	} else {
		let result;
		$.ajax({
			type: "post",
			async: false,
			url: url,
			headers: headers,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: JSON.stringify(data),
			success : function(data) { result = data; },
			error : function(jqXHR, textStatus, errorThrown) {
				console.error("Opera.Rest.post(" + url + ") [" + jqXHR.status + "] " + errorThrown + " : " + textStatus);
				if (jqXHR.status == 401) { Opera.Auth.redirectLoginPage(); }
				else if (asyncErrorHandler) { asyncErrorHandler(jqXHR, textStatus, errorThrown); }
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
	this.userClient = this._;
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
			if (!(this.current)) {
				this.current = endpoint;
				$.cookie('CMP_REGION_ENDPOINT', endpoint);
			}
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
		$.cookie('CMP_REGION_ENDPOINT', endpoint);
		if (completeHandler) completeHandler(this);
		return this.current;
	};
	
	this.getProjectClient = (completeHandler) => {
		return new Opera.ProjectClient(this, completeHandler);
	};
	
	this.Api = {
		get: (url, asyncResultHandler, asyncErrorHandler) => {
			return Opera.Rest.get("/api" + url, {}, asyncResultHandler, asyncErrorHandler);
		},
		post: (url, data, asyncResultHandler, asyncErrorHandler) => {
			return Opera.Rest.post("/api" + url, data, {}, asyncResultHandler, asyncErrorHandler);
		},
	};
	
	this.App = {
		get: (url, asyncResultHandler, asyncErrorHandler) => {
			return Opera.Rest.get("/app" + url, {}, asyncResultHandler, asyncErrorHandler);
		},
		post: (url, data, asyncResultHandler, asyncErrorHandler) => {
			return Opera.Rest.post("/app" + url, data, {}, asyncResultHandler, asyncErrorHandler);
		},
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
	this.regionClient = this._;
	this.userClient = this._._;
	this._.children.projects = this;
	this.children = {};
	
	this.all = this.regionClient.Api.get("/iaas/api/projects").content;
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
	
	this.getCatalogClient = (asyncCompleteHandler) => {
		return new Opera.CatalogClient(this, asyncCompleteHandler);
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
	this.projectClient = this._
	this.regionClient = this._._;
	this.userClient = this._._._;
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
	
	this.syncAll = (asyncCompleteHandler) => {
		if (asyncCompleteHandler) {
			this.regionClient.App.get('/deployments?projectId=' + this.projectClient.current, (deployments) => {
				this.all = deployments;
				this.count = this.all.length;
				this.all.forEach((deployment) => {
					if (!(this.current)) this.current = deployment.id;
					this.deployment[deployment.id] = deployment;
				});
				asyncCompleteHandler(this);
			});
		} else {
			this.all = this.regionClient.App.get('/deployments?projectId=' + this.projectClient.current);
			this.count = this.all.length;
			this.all.forEach((deployment) => {
				if (!(this.current)) this.current = deployment.id;
				this.deployment[deployment.id] = deployment;
			});
		}
	};
	
	this.syncAll(asyncCompleteHandler);
};

// Resource Client ///////////////////////////////////////////////////////////////////////////////////////////
Opera.ResourceClient = function ResourceClient(projectClient, asyncCompleteHandler) {
	// init
	if (!projectClient) {
		console.error("Opera.ResourceClient(projectClient) : be required Opera.ProjectClient() object");
		throw "Opera.ResourceClient(projectClient) : be required Opera.ProjectClient() object";
	}
	
	this._ = projectClient;
	this.projectClient = this._
	this.regionClient = this._._;
	this.userClient = this._._._;
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
	
	this.syncAll = (asyncCompleteHandler) => {
		if (asyncCompleteHandler) {
			this.regionClient.App.get('/resources?projectId=' + this.projectClient.current, (resources) => {
				this.all = resources;
				this.count = this.all.length;
				this.all.forEach((resource) => {
					if (!(this.current)) this.current = resource.id;
					this.resource[resource.id] = resource;
				});
				asyncCompleteHandler(this);
			});
		} else {
			this.all = this.regionClient.App.get('/resources?projectId=' + this.projectClient.current);
			this.count = this.all.length;
			this.all.forEach((resource) => {
				if (!(this.current)) this.current = resource.id;
				this.resource[resource.id] = resource;
			});
		}
	};
	
	this.syncAll(asyncCompleteHandler);
};

// Catalog Client ///////////////////////////////////////////////////////////////////////////////////////////
Opera.CatalogClient = function CatalogClient(projectClient, asyncCompleteHandler) {
	// init
	if (!projectClient) {
		console.error("Opera.CatalogClient(projectClient) : be required Opera.ProjectClient() object");
		throw "Opera.CatalogClient(projectClient) : be required Opera.ProjectClient() object";
	}
	
	this._ = projectClient;
	this.projectClient = this._
	this.regionClient = this._._;
	this.userClient = this._._._;
	this._.children.catalogs = this;
	this.children = {};
	
	this.all = [];
	this.count = 0;
	this.current;
	this.catalog = {};
	this.category = {};
	
	// methods
	this.setCurrent = (id, completeHandler) => {
		if (!(this.catalog.hasOwnProperty(id))) throw "Opera.CatalogClient.setCurrent(" + id + ") : could not set current by id";
		this.current = id;
		if (completeHandler) completeHandler(this);
		return this.current;
	};
	
	this.findByName = (name) => {
		for (let catalog of this.all) {
			if (catalog.name == name) return catalog.id;
		}
		return null;
	};
	
	this.getCatalogForm = (completeHandler) => {
		this.form = new Opera.CatalogForm(this);
		if (completeHandler) completeHandler(this.form);
		return this.form;
	};
	
	this.syncAll = (asyncCompleteHandler) => {
		if (asyncCompleteHandler) {
			this.regionClient.App.get('/catalogs?projectId=' + this.projectClient.current, (catalogCategory) => {
				this.category = catalogCategory.categories;
				this.all = catalogCategory.catalogs;
				this.count = this.all.length;
				this.all.forEach((catalog) => {
					if (!(this.current)) this.current = catalog.id;
					this.catalog[catalog.id] = catalog;
				});
				asyncCompleteHandler(this);
			});
		} else {
			let catalogCategory = this.regionClient.App.get('/catalogs?projectId=' + this.projectClient.current);
			this.category = catalogCategory.categories;
			this.all = catalogCategory.catalogs;
			this.count = this.all.length;
			this.all.forEach((catalog) => {
				if (!(this.current)) this.current = catalog.id;
				this.catalog[catalog.id] = catalog;
			});
		}
	};
	
	this.syncAll(asyncCompleteHandler);
};

Opera.CatalogForm = function CatalogForm(client) {
	this._ = client;
	this.catalogClient = this._
	this.projectClient = this._._
	this.regionClient = this._._._;
	this.userClient = this._._._._;
	this.catalogId = client.current;
	
	let versions = client.regionClient.Api.get("/catalog/api/items/" + client.current + "/versions");
	let version = versions.content[0];
	this.versionId = version.id;
	this.formId = version.formId;
	
	this.action = {};
	
	//if (formId) {
	//	let data = this.regionClient.Api.post("/form-service/api/forms/renderer/model?formId=" + formId, {});
	//	this.schema = new Opera.CatalogLayout(this, data.model.layout, data.model.schema);
	//} else {
	//	this.schema = new Opera.CatalogSchema(this, null, "opera", this.regionClient.Api.get("/catalog/api/items/" + this.catalogId + "/versions/" + this.versionId).schema, null);
	//}
	
	this.schema = new Opera.CatalogSchema(this, null, "opera", this.regionClient.Api.get("/catalog/api/items/" + this.catalogId + "/versions/" + this.versionId).schema, null);
	
	this.registerOperaCatalogFields = () => {
		let doms = document.querySelectorAll(".opera-catalog-item:not(.opera-working-input)");
		for (let i = 0; i < doms.length; i++) { doms[i].operaForm = this; }
		$(".opera-catalog-input").not(".opera-working-input").on("change keyup paste", function() {
			let id = $(this).attr("id");
			let value = null;
			let type = $(this).attr("type");
			if (type == "checkbox") { value = $(this).is(":checked"); }
			else if (type == "number") { value = parseInt($(this).val()); }
			else { value = $(this).val(); }
			$(this)[0].operaForm.setInputValue(id, value);
		});
		$(".opera-catalog-action").not(".opera-working-input").on("click", function() {
			let action = $(this).attr("opera-action");
			$(this)[0].operaForm.action[action].doAction();
		});
		$(".opera-catalog-item").not(".opera-working-input").addClass("opera-working-input");
	};
	
	this.setInputValue = (id, value) => {
		let pathes = id.substring(6).split("-");
		let path = null;
		let ref = this.schema;
		for (let i = 0; i < pathes.length; i++) {
			path = pathes[i];
			let isArray = path.match(/^(\d+)$/);
			if (isArray) {
				path = parseInt(isArray[1]);
			}
			ref = ref.children[path];
		}
		ref.inputs = value;
		ref._.inputs[ref.id] = value;
		return this;
	};
	
	this.show = (domId, completeHandler, submitPreHandler, submitPostHandler) => {
		$("#" + domId).html(`
<form class="opera-catalog-form" id="` + this.catalogId + `">
	<div class="opera-catalog-form-deployment-name">
		<table width="100%" cellspacing="0">
			<tbody>
				<tr>
					<th>Deployment Name</th>
					<td><input required type="text" id="opera-deploymentName"/></td>
				</tr>
			</tbody>
		</table>
	</div>
	<br/>
	<div class="opera-catalog-form-field">
	` + this.schema.html + `
	</div>
	</br>
	<div>
		<input type="submit" form="` + this.catalogId + `" value="Submit"/>
	</div>
</form>
		`);
		this.registerOperaCatalogFields();
		$("#" + this.catalogId).submit(() => {
			if (submitPreHandler) { submitPreHandler(this); }
			this.result = this.regionClient.App.post("/catalogs/" + this.catalogId, {
				projectId: this.projectClient.current,
				deploymentName: $("#opera-deploymentName").val(),
				inputs: this.schema.inputs
			});
			if (submitPostHandler) { submitPostHandler(this); }
			return false;
		});
		if (completeHandler) completeHandler(this);
	};
};

Opera.CatalogSchema = function CatalogSchema(form, parent, id, schema, inputs) {
	this.form = form;
	this._ = parent;
	
	this.id = id;
	this.path = (parent != null) ? parent.path + "-" + id : id;
	this.uuid = self.crypto.randomUUID();
	
	this.schema = schema;
	this.title = schema.title != null ? schema.title : this.id;
	this.readonly = schema.readOnly;
	this.encrypted = schema.encrypted;
	
	form.action[this.uuid] = this;
	
	if (schema.properties != null) { // object type
		this.type = "object";
		this.inputs = inputs != null ? inputs : (schema.default != null ? schema.default : {});
		this.children = {};
		this.html = "";
		for (let id in schema.properties) {
			let child = new Opera.CatalogSchema(form, this, id, schema.properties[id], this.inputs[id]);
			this.children[id] = child
			this.inputs[id] = child.inputs;
			this.html += "<tr><th>" + child.title + "</th><td>" + child.html + "</td></tr>";
		}
		this.html = '<table width="100%" cellspacing="0"><tbody>' + this.html + '</tbody></table>';
	} else if (schema.items != null) { // array type
		this.inputs = inputs != null ? inputs : (schema.default != null ? schema.default : []);
		if (schema.items.enum != null) {
			this.type = "multiselect";
			this.html = "";
			schema.items.enum.forEach((option) => {
				this.html += '<option value="' + option + '"' + ((this.inputs.indexOf(option) > -1) ? " selected" : "") + '>' + option + '</option>';
			});
			this.html = '<select multiple' + (schema.readOnly ? " disabled" : "") + (schema.default == null ? " required" : "") + ' class="opera-catalog-item opera-catalog-input" id="' + this.path + '">' + this.html + '</select>'
		} else if (schema.items.oneOf != null) {
			this.type = "multiselect";
			this.html = "";
			schema.items.oneOf.forEach((option) => {
				this.html += '<option value="' + option.const + '"' + ((this.inputs.indexOf(option.const) > -1) ? " selected" : "") + '>' + option.title + '</option>';
			});
			this.html = '<select multiple' + (schema.readOnly ? " disabled" : "") + (schema.default == null ? " required" : "") + ' class="opera-catalog-item opera-catalog-input" id="' + this.path + '">' + this.html + '</select>'
		} else {
			this.type = "array";
			this.count = 0;
			this.children = [];
			this.inputs.forEach((value) => {
				let child = new Opera.CatalogSchema(this.form, this, this.count, this.schema.items, value);
				this.children.push(child);
				this.count += 1;
			});
			this.html = "";
			this.children.forEach((child) => {
				this.html += '<tr><td>' + child.html + '</td></tr>';
			});
			this.html = '<table width="100%" cellspacing="0"><thead><tr><th>' + (schema.items.title != null ? schema.items.title : id) + '</th></tr></thead><tbody id="' + this.uuid + '">' + this.html + '</tbody><tfoot><tr><td><input type="button" class="opera-catalog-item opera-catalog-action" opera-action="' + this.uuid + '" value="ADD"></td></tr></tfoot></table>';
			this.doAction = () => {
				console.log("add array item");
				let child = new Opera.CatalogSchema(this.form, this, this.count, this.schema.items, null);
				this.children.push(child);
				this.inputs.push(child.inputs);
				let dom = $("#" + this.uuid);
				dom.append('<tr><td>' + child.html + '</td></tr>');
				this.form.registerOperaCatalogFields();
				this.count += 1;
			};
		}
	} else { // value type
		this.inputs = inputs != null ? inputs : (schema.default != null ? schema.default : null);
		if (schema.type == "integer") { this.type = "number"; }
		else { this.type = schema.type; }
		if (schema.enum != null) {
			this.subtype = this.type;
			this.type = "select";
			this.html = '<option value="">선택하세요</option>';
			schema.enum.forEach((option) => {
				this.html += '<option value="' + option + '"' + (option == this.inputs ? " selected" : "") + '>' + option + '</option>';
			});
			this.html = '<select' + (schema.readOnly ? " disabled" : "") + (schema.default == null ? " required" : "") + ' class="opera-catalog-item opera-catalog-input" id="' + this.path + '">' + this.html + '</select>'
		} else if (schema.oneOf != null) {
			this.subtype = this.type;
			this.type = "select";
			this.html = '<option value="">선택하세요</option>';
			schema.oneOf.forEach((option) => {
				this.html += '<option value="' + option.const + '"' + (schema.default == option.const ? " selected" : "") + '>' + option.title + '</option>';
			});
			this.html = '<select' + (schema.readOnly ? " disabled" : "") + (schema.default == null ? " required" : "") + ' class="opera-catalog-item opera-catalog-input" id="' + this.path + '">' + this.html + '</select>'
		} else {
			if (this.type == "boolean") {
				this.html = '<input' + (schema.readOnly ? " readonly" : "") + ' type="checkbox" class="opera-catalog-item opera-catalog-input" id="' + this.path + '"' + (this.inputs ? ' checked>' : '>');
			} else if (this.type == "number") {
				this.html = '<input' + (schema.readOnly ? " readonly" : "") + (schema.default == null ? " required" : "") + ' type="' + (schema.encrypted ? "password" : "number") + '" class="opera-catalog-item opera-catalog-input" id="' + this.path + '" value="' + (this.inputs != null ? this.inputs : "") + '">';
			} else if (this.type == "string") {
				this.html = '<input' + (schema.readOnly ? " readonly" : "") + (schema.default == null ? " required" : "") + ' type="' + (schema.encrypted ? "password" : "text") + '" class="opera-catalog-item opera-catalog-input" id="' + this.path + '" value="' + (this.inputs != null ? this.inputs : "") + '">';
			}
		}
	}
};










Opera.CatalogLayout = function CatalogLayout(form, layout, schema) {
	this.form = form;
	this.layout = layout;
	this.pages = layout.pages;
	this.schema = schema;
	this.inputs = {};
	
	this.html = "";
	this.pages.forEach((page) => {
		this.html += new Opera.CatalogPage(form, this, page, schema, this.inputs);
	});
};

Opera.CatalogPage = function CatalogPage(form, layout, page, schema, inputs) {
	this.form = form;
	this.layout = layout;
	this.page = page;
	this.schema = schema;
	this.inputs = inputs;
	
	this.id = page.id;
	this.uuid = self.crypto.randomUUID();
	this.title = page.title != null ? page.title : page.id;
	this.pages.forEach
	
};

Opera.CatalogSection = function CatalogSection(form, layout, page, section, schema, inputs) {
	this.form = form;
	this.layout = layout;
	this.page = page;
	this.section = section;
	this.schema = schema;
	this.inputs = inputs;
	
	this.id = section.id;
	this.uuid = self.crypto.randomUUID();
	this.title = section.title != null ? section.title : section.id;
	
	
};

Opera.CatalogField = function CatalogField(form, parent, field, schema, inputs) {
	this.form = form;
	this._ = parent;
	this.field = field;
	this.schema = schema;
	
	this.id = field.id;
	this.path = (parent != null) ? parent.path + "-" + field.id : field.id;
	this.uuid = self.crypto.randomUUID();
	this.title = schema.title != null ? schema.title : this.id;
	
	this.visible = (field.state != null && field.state.visible != null) ? field.state.visible : true;
	this.readonly = (field.state != null && field.state[read-only] != null) ? field.state[read-only] : false;
	this.encrypted = field.display == "passwordField" ? true : false;
	this.required = (schema.constratins != null && schema.constratins.required != null) ? schema.constratins.required : false
	
	form.action[this.uuid] = this;
	
	
	
	
	this.inputs = inputs != null ? inputs : (schema.default != null ? schema.default : null);
	if (["integer", "decimal"].indexOf(schema.type.dataType) > -1) {
		this.type = "number";
	} else if (schema.type.dataType == "complex" && field.display == "objectField") {
		this.type = "object";
	} else if (field.display == "array") {
		if (schema.type.dataType == "string") {
			if (schema.type.isMultiple) { this.type = "multiselect"; }
			else { this.type = "select"; }	
		} else {
			this.type = "array";
		}
	} else if (field.display == "datagrid") {
		this.type = "array";
	} else {
		this.type = schema.type.dataType;
	}
	console.log(this.id + " : " + this.type);
	
	if (this.type == "object") {
		this.children = {};
		this.html = "";
		field.nestedFields.forEach((nestedField) => {
			let netstedSchema = null;
			this.schema.fields.forEach((ns) => {
				if (netstedField.id == ns.id) { nestedSchema = ns; }
			});
			let child = new Opera.CatalogField(form, this, nestedField.id, nestedField, nestedSchema, null);
			this.children[nestedField.id] = child;
			this.inputs[nestedField.id] = child.inputs;
			this.html += "<tr><th>" + child.title + "</th><td>" + child.html + "</td></tr>";
		});
		this.html = '<table width="100%" cellspacing="0"><tbody>' + this.html + '</tbody></table>';
	}
	if (this.type == "select") {
		this.html = '<option value="">선택하세요</option>';
		field.valueList.forEach((option) => {
			this.html += '<option value="' + option.value + '"' + (option.value == this.inputs ? " selected" : "") + '>' + option.label + '</option>';
		});
		this.html = '<select' + (this.readonly ? " disabled" : "") + (field.default == null ? " required" : "") + ' class="opera-catalog-item opera-catalog-input" id="' + this.path + '">' + this.html + '</select>'
	} else {
		if (this.type == "boolean") {
			this.html = '<input' + (this.readonly ? " readonly" : "") + ' type="checkbox" class="opera-catalog-item opera-catalog-input" id="' + this.path + '"' + (this.inputs ? ' checked>' : '>');
		} else if (this.type == "number") {
			this.html = '<input' + (this.readonly ? " readonly" : "") + (field.default == null ? " required" : "") + ' type="' + (this.encrypted ? "password" : "number") + '" class="opera-catalog-item opera-catalog-input" id="' + this.path + '" value="' + (this.inputs != null ? this.inputs : "") + '">';
		} else if (this.type == "string") {
			this.html = '<input' + (this.readonly ? " readonly" : "") + (field.default == null ? " required" : "") + ' type="' + (this.encrypted ? "password" : "text") + '" class="opera-catalog-item opera-catalog-input" id="' + this.path + '" value="' + (this.inputs != null ? this.inputs : "") + '">';
		}
	}
};

