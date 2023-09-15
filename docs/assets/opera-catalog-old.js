// Catalog Client ///////////////////////////////////////////////////////////////////////////////////////////
Opera.CatalogClient = function CatalogClient(projectClient, asyncCompleteHandler) {
	// init
	if (!projectClient) {
		console.error("Opera.CatalogClient(projectClient) : be required Opera.ProjectClient() object");
		throw "Opera.CatalogClient(projectClient) : be required Opera.ProjectClient() object";
	}
	
	this._ = projectClient;
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
	
	// data
	if (asyncCompleteHandler) {
		this._._.App.get('/catalogs?projectId=' + this._.current, (catalogCategory) => {
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
		let catalogCategory = this._._.App.get('/catalogs?projectId=' + this._.current);
		this.category = catalogCategory.categories;
		this.all = catalogCategory.catalogs;
		this.count = this.all.length;
		this.all.forEach((catalog) => {
			if (!(this.current)) this.current = catalog.id;
			this.catalog[catalog.id] = catalog;
		});
	}
};

Opera.CatalogForm = function CatalogForm(client) {
	this.client = client;
	this.catalogId = client.current;
	
	let versions = client._._.Api.get("/catalog/api/items/" + client.current + "/versions");
	let version = versions.content[0];
	this.versionId = version.id;
	this.formId = version.formId;
	this.inputs = {};
	
	//if (formId) {
	//	let data = this._._.Api.post("/form-service/api/forms/renderer/model?formId=" + formId, {});
	//	console.log("from form");
	//	console.log(data);
	//	this.layout = data.model.layout;
	//	this.schema = data.model.schema;
	//} else {
	//	let data = this._._.Api.get("/catalog/api/items/" + this.current + "/versions/" + versionId);
	//	console.log("from schema");
	//	console.log(data);
	//	this.layout = null;
	//	this.schema = data.schema.properties;
	//}
	
	let data = this.client._._.Api.get("/catalog/api/items/" + this.catalogId + "/versions/" + this.versionId);
	console.log(data);
	this.schema = data.schema.properties;
	
	this.props = [];
	for (var id in this.schema) {
		this.props.push(new Opera.CatalogProperty(this, id, this.schema[id]));
	}
	
	this.html = "";
	this.props.forEach((prop) => {
		this.html += `<tr><th>` + prop.title + `</th><td>` + prop.html + `</td></tr>`;
	});
	this.html = `<table width="100%" cellspacing="0"><tbody>` + this.html + `</tbody></table>`;
	
	this.show = (domId, completeHandler) => {
		$("#" + domId).html(this.html);
		$(".opera-catalog-inputs").on("change keyup paste", function() {
			let id = $(this).attr("id");
			let value = null;
			if ($(this).attr("type") == "checkbox") {
				value = $(this).is(":checked");
			} else {
				value = $(this).val();
			}
			console.log(id + " : " + value);
			let pathes = id.split(".");
			let ref = Catalog.form.inputs;
			for (var path of pathes) {
				if (["object", "list"].indexOf(typeof(ref[path])) < 0) {
					ref[path] = value;
					break;
				} else {
					ref = ref[path];
				}
			}
			console.log(Catalog.form.inputs);
		});
		
		if (completeHandler) completeHandler(this);
	}
}


Opera.CatalogProperty = function CatalogProperty(parent, id, schema) {
	// init
	this._ = parent;
	this.id = id;
	this.schema = schema;
	this.type = schema.type;
	this.title = (schema.title != null ? schema.title : this.id);
	this.default = schema.default;
	this.placeholder = (schema.placeholder != null ? schema.placeholder : "");
	this.encrypted = schema.encrypted;
	this.visible = true;
	this.readonly = schema.readOnly;
	this.inputs = null;
	
	if (this.type == "integer") { this.type = "number"; }
	if (this.type == "array") {
		if (this.schema.items.enum != null) {
			this.type = "multiselect";
			this.option = this.schema.items.enum;
		} else if (this.schema.items.oneOf != null) {
			this.type = "multiselect";
			this.option = this.schema.items.oneOf;
		}
	} else if (["string", "number"].indexOf(this.type) > -1) {
		if (this.schema.enum != null) {
			this.type = "select";
			this.option = this.schema.enum;
		} else if (this.schema.oneOf != null) {
			this.type = "select";
			this.option = this.schema.oneOf;
		}
	}
	
	switch (this.type) {
		case "boolean": {
			this.inputs = (this.default ? this.default : false);
			this._.inputs[this.id] = this.inputs;
			this.html = `<input` + (this.readonly ? " readonly" : "") + ` type="checkbox" class="opera-catalog-inputs" id="` + this.id + `"` + (this.inputs ? ` checked>` : `>`)
		}; break;
		case "number": {
			this.inputs = (this.default ? this.default : 0);
			this._.inputs[this.id] = this.inputs;
			this.html = `<input` + (this.readonly ? " readonly" : "") + (this.default == null ? " required" : "") + ` type="` + (this.encrypted ? "password" : "number") + `" class="opera-catalog-inputs" id="` + this.id + `" placeholder="` + this.placeholder + `" value="` + this.inputs + `">`
		}; break;
		case "string": {
			this.inputs = (this.default ? this.default : "");
			this._.inputs[this.id] = this.inputs;
			this.html = `<input` + (this.readonly ? " readonly" : "") + (this.default == null ? " required" : "") + ` type="` + (this.encrypted ? "password" : "text") + `" class="opera-catalog-inputs" id="` + this.id + `" placeholder="` + this.placeholder + `" value="` + this.inputs + `">`
		}; break;
		case "select": {
			this.inputs = (this.default ? this.default : "");
			let items = "";
			if (this.option != null) {
				this.option.forEach((o) => {
					if (typeof(o) == "object") { items += '<option value="' + o.const + '"' + (o.const == this.default ? " selected" : "") + '>' + o.title + '</option>'; }
					else { items += '<option value="' + o + '"' + (o == this.default ? " selected" : "") + '>' + o + '</option>'; }
				});
			}
			this._.inputs[this.id] = this.inputs;
			this.html = `<select` + (this.readonly ? " disabled" : "") + (this.default == null ? " required" : "") + ` class="opera-catalog-inputs" id="` + this.id + `">` + items + `</select>`
		}; break;
		case "multiselect": {
			this.inputs = (this.default ? this.default : []);
			let items = "";
			if (this.option != null) {
				this.option.forEach((o) => {
					if (typeof(o) == "object") { items += '<option value="' + o.value + '"' + ((this.default && this.default.indexOf(o.value) > -1) ? " selected" : "") + '>' + o.title + '</option>'; }
					else { items += '<option value="' + o + '"' + ((this.default && this.default.indexOf(o) > -1) ? " selected" : "") + '>' + o + '</option>'; }
				});
			}
			this._.inputs[this.id] = this.inputs;
			this.html = `<select multiple` + (this.readonly ? " disabled" : "") + (this.default == null ? " required" : "") + ` class="opera-catalog-inputs" id="` + this.id + `">` + items + `</select>`
		}; break;
		case "object": {
			this.inputs = (this.default ? this.default : {});
			this.childrenIds = [];
			this.childrenProps = {};
			for (var id in this.schema.properties) {
				let childrenId = this.id + "." + id;
				let childrenProp = new Opera.CatalogProperty(this, childrenId, this.schema.properties[id]);
				this.childrenIds.push(childrenId);
				this.childrenProps[childrenId] = childrenProp;
				this.inputs[id] = childrenProp.inputs;
			}
			let propHead = "";
			let propData = "";
			this.childrenIds.forEach((id) => {
				propHead += `<th>` + this.childrenProps[id].title + '</th>';
				propData += `<td>` + this.childrenProps[id].html + `</td>`;
			});
			this._.inputs[this.id] = this.inputs;
			this.html = `<table width="100%" cellspacing="0"><thead><tr>` + propHead + `</tr></thead><tbody><tr>` + propData + `</tr></tbody></table>`
		}; break;
		case "array": {
			this.inputs = (this.default ? this.default : []);
			this.index = 0;
			this.childrenProp = new Opera.CatalogProperty(this, this.id + "[" + this.index + "]", this.schema.items);
			this.html = `<table width="100%" cellspacing="0"><thead><tr><th>` + this.childrenProp.title + `</th></tr></thead><tbody><tr><td>` + this.childrenProp.html + `</td></tr></tbody></table>`
			this.inputs.push(this.childrenProp.inputs);
			this.index += 1;
		}; break;
	}
};

Opera.CatalogField = function CatalogField(id, property) {
	// init
	this.id = id;
	this.property = property;
	this.type = property.type;
	this.title = property.title;
	this.value = property.default;
	this.placeholder = null;
	this.encrypted = property.encrypted;
	this.visible = true;
	this.readonly = property.readOnly;
	
	if (this.type == "integer") { this.type = "number"; }
	if (this.type == "array") {
		if (this.property.items.enum != null) {
			this.type = "multiselect";
			this.option = this.property.items.enum;
		} else if (this.property.items.oneOf != null) {
			this.type = "multiselect";
			this.option = this.property.items.oneOf;
		}
	} else if (["string", "number"].indexOf(this.type) > -1) {
		if (this.property.enum != null) {
			this.type = "multiselect";
			this.option = this.property.enum;
		} else if (this.property.oneOf != null) {
			this.type = "multiselect";
			this.option = this.property.oneOf;
		}
		if (this.property.enum != null || this.property.oneOf != null) { this.type = "select"; }
	}
	
	// methods	
	function parseText(pivot) {
		return {
			label: `<th colspan="2" class="` + (this.visible ? "" : "d-none") + `" id="` + this.id + `">` + (this.value != null ? this.value : "") + `</th>`,
			panel: ''
		};
	};
	function parseBoolean(pivot) {
		return {
			label: `<th class="` + (this.visible ? "" : "d-none") + `">` + (this.title != null ? this.title : this.id) + `</th>`,
			panel: `<td class="` + (this.visible ? "" : "d-none") + `"><input` + (this.readonly ? " readonly" : "") + ` type="checkbox" class="" id="` + this.id + `" name="` + this.id + `" value="` + (this.value != null ? this.value : "") + `"></td>`
		};
	};
	function parseNumber(pivot) {
		return {
			label: `<th class="` + (this.visible ? "" : "d-none") + `">` + (this.title != null ? this.title : this.id) + `</th>`,
			panel: `<td class="` + (this.visible ? "" : "d-none") + `"><input style="width:100%;"` + (this.readonly ? " readonly" : "") + (this.value == null ? " required" : "") + ` type="number" class="" id="` + this.id + `" name="` + this.id + `" placeholder="` + (this.placeholder != null ? this.placeholder : "") + `" value="` + (this.value != null ? this.value : "") + `"></td>`
		};
	};
	function parseTextField(pivot) {
		return {
			label: `<th class="` + (this.visible ? "" : "d-none") + `">` + (this.title != null ? this.title : this.id) + `</th>`,
			panel: `<td class="` + (this.visible ? "" : "d-none") + `"><input style="width:100%;"` + (this.readonly ? " readonly" : "") + (this.value == null ? " required" : "") + ` type="` + (this.encrypted ? "password" : "text") + `" class="" id="` + this.id + `" name="` + this.id + `" placeholder="` + (this.placeholder != null ? this.placeholder : "") + `" value="` + (this.value != null ? this.value : "") + `"></td>`
		};
	};
	function parseTextArea(pivot) {
		return {
			label: `<th class="` + (this.visible ? "" : "d-none") + `">` + (this.title != null ? this.title : this.id) + `</th>`,
			panel: `<td class="` + (this.visible ? "" : "d-none") + `"><textarea style="width:100%;"` + (this.readonly ? " readonly" : "") + (this.value == null ? " required" : "") + ` class="" id="` + this.id + `" name="` + this.id + `" placeholder="` + (this.placeholder != null ? this.placeholder : "") + `">` + (this.value != null ? this.value : "") + `"</textarea></td>`
		};
	};
	function parseSelect(pivot) {
		let items = "";
		if (this.option != null) {
			this.option.forEach((o) => {
				if (typeof(o) == "object") { items += '<option value="' + o.value + '"' + (o.value == this.value ? " selected" : "") + '>' + o.title + '</option>'; }
				else { items += '<option value="' + o + '"' + (o == this.value ? " selected" : "") + '>' + o + '</option>'; }
			});
		}
		return {
			label: `<th class="` + (this.visible ? "" : "d-none") + `">` + (this.title != null ? this.title : this.id) + `</th>`,
			panel: `<td class="` + (this.visible ? "" : "d-none") + `"><select style="width:100%;"` + (this.readonly ? " disabled" : "") + (this.value == null ? " required" : "") + ` class="" id="` + this.id + `" name="` + this.id + `">` + items + `</select></td>`
		};
	};
	function parseMultiSelect(pivot) {
		let items = "";
		if (this.value == null) { this.value = []; }
		if (this.option != null) {
			this.option.forEach((o) => {
				if (typeof(o) == "object") { items += '<option value="' + o.value + '"' + (this.value.indexOf(o.value) > -1 ? " selected" : "") + '>' + o.title + '</option>'; }
				else { items += '<option value="' + o + '"' + (this.value.indexOf(o) > -1 ? " selected" : "") + '>' + o + '</option>'; }
			});
		}
		return {
			label: `<th class="` + (this.visible ? "" : "d-none") + `">` + (this.title != null ? this.title : this.id) + `</th>`,
			panel: `<td class="` + (this.visible ? "" : "d-none") + `"><select multiple style="width:100%;"` + (this.readonly ? " disabled" : "") + (this.value == null ? " required" : "") + ` class="" id="` + this.id + `" name="` + this.id + `">` + items + `</select></td>`
		};
	};
	function parseObject(pivot) {
		let props = [];
		for (var id in this.property.properties) {
			props.push((new Opera.CatalogProperty(this.id + "[" + id + "]", this.property.properties[id])).parse(true));
		}
		if (pivot) {
			let head = "";
			let body = "";
			props.forEach((prop) => {
				head += prop.label;
				body += prop.panel;
			});
			return {
				label: `<th class="` + (this.visible ? "" : "d-none") + `">` + (this.title != null ? this.title : this.id) + `</th>`,
				panel: `<td class="` + (this.visible ? "" : "d-none") + `"><table class="table-sm" width="100%" cellspacing="0"><thead><tr>` + head + `</tr></thead><tbody><tr>` + body + `</tr></tbody></table></td>`
			};
		} else {
			let body = "";
			props.forEach((prop) => {
				body += `<tr>` + prop.label + prop.panel + `</tr>`;
			});
			return {
				label: `<th class="` + (this.visible ? "" : "d-none") + `">` + (this.title != null ? this.title : this.id) + `</th>`,
				panel: `<td class="` + (this.visible ? "" : "d-none") + `"><table class="table-sm" width="100%" cellspacing="0"><tbody>` + body + `</tbody></table></td>`
			};
		}
	};
	function parseArray(pivot) {
		let items = (new Opera.CatalogProperty(this.id + "[]", this.property.items)).parse(true);
		return {
			label: `<th class="` + (this.visible ? "" : "d-none") + `">` + (this.title != null ? this.title : this.id) + `</th>`,
			panel: `<td class="` + (this.visible ? "" : "d-none") + `"><table class="table-sm" width="100%" cellspacing="0"><thead><tr>` + items.label + `</tr></thead><tbody><tr>` + items.panel + `</tr></tbody><tfoot><tr><td>+ / -</td></tr></tfoot></table></td>`
		};
	};
	
	switch (this.type) {
		case "boolean": this.parse = parseBoolean; break;
		case "number": this.parse = parseNumber; break;
		case "string": this.parse = parseTextField; break;
		case "password": this.parse = parsePassword; break;
		case "select": this.parse = parseSelect; break;
		case "multiselect": this.parse = parseMultiSelect; break;
		case "object": this.parse = parseObject; break;
		case "array": this.parse = parseArray; break; 
	}
};
