function showCatalogPage() {
	showWaitPanel();
	Catalog.getCatalogForm(
	(form) => {
		form.show("opera-page",
		(form) => {
			hideWaitPanel();
		},
		(form) => {
			showWaitPanel();
			console.log(form.schema.inputs);
		},
		(form) => {
			Deployment.syncAll();
			Resource.syncAll();
			showPage($("#opera-deployment-page"));
			hideWaitPanel();
		});
	});
};
