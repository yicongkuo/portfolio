let ui = {
	'webmapJSON': $('#webmapJSON'),
	'parse': $('#parse'),
	'oplayers': $('#oplayers'),
	'bslayers': $('#bslayers'),
};

ui.parse.on('click', function () {
	ui.oplayers.empty();
	ui.bslayers.empty();

	let webmapJSON = ui.webmapJSON.val();
	let mapObj;
	
	try { mapObj = JSON.parse(webmapJSON); } 
	catch (e) {
		ui.oplayers.append('<h3>請在上面的輸入框中，輸入webmap的JSON字串</h3>');
		return;
	}
	
	let data = parseWebmap(mapObj);
	
	// insert oplayers table
	ui.oplayers.append('<h3>圖層列表</h3>');
	new DataTable('#oplayersTable', {
		columns: [
			{ title: '圖層名稱'},
			{ title: '網址'},
			{ title: 'id'},
			{ title: '類型'}
		],
		data: data.oplayers
	});

	// insert basemap table
	ui.bslayers.append('<h3>底圖列表</h3>');
	new DataTable('#bslayersTable', {
		columns: [
			{ title: '圖層名稱' },
			{ title: '類型' },
			{ title: '網址' }
		],
		data: data.bslayers
	});

});

function parseWebmap (mapObj) {
	return { 
		oplayers: __get_oplayers_props(mapObj.operationalLayers),
		bslayers: __get_bslayers_props(mapObj.baseMap.baseMapLayers)
	};
}

function appendTable (dataset, root) {
	let tableHTML = __create_table_html(dataset);
	root.append(tableHTML);
}

function __get_oplayers_props (operationalLayers) {
	return operationalLayers.map(function (layer) {
		let url = '';
		if (layer.layerType === 'VectorTileLayer') { url = layer.styleUrl; }
		else { url = layer.url; }
		
		return [ 
			layer.title,
			url,
			layer.itemId, 
			layer.layerType
		];
	});
}

function __get_bslayers_props (baseMapLayers) {
	return baseMapLayers.map(function (layer) {
		let url = '';
		if (layer.layerType === 'ArcGISTiledMapServiceLayer') { url = layer.url; }
		if (layer.layerType === 'VectorTileLayer') { url = layer.styleUrl; }
		if (layer.layerType === 'WebTiledLayer') { url = layer.templateUrl; }

		return [
			layer.title,
			layer.layerType,
			url
		];
	});
}

function __create_table_html (arr) {
	let heads = Object.keys(arr[0]);
	let tableHTML = "";

	// create table head
	tableHTML += "<tr>";
	heads.forEach(function (head) {
		tableHTML += "<th>" + head + "</th>";
	});
	tableHTML += "</tr>";

	// create table body
	arr.forEach(function (data) {
		tableHTML += "<tr>";
		heads.forEach(function (head) {
			tableHTML += "<td>" + data[head] + "</td>";
		});
		tableHTML += "</tr>";
	});

	return '<table>' + tableHTML + '</table>';
}