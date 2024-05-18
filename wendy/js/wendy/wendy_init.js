$(function(){	
	// Define local variable and wendy library module
	var csv 	= wendy.csv,
		topo    = wendy.topo,
		builtIn = wendy.builtIn,
		user    = wendy.user;

	// Define button selected flag
	var csvFlag   	  = 0,
		tsvFlag       = 0,
		_dacet		  = {},
		orderLayer    = {},	
		choropleth    = {},
		interpolation = {};
	
	/** Initialize Leaflet Map **/
	var map = new L.map('map').setView([23.978567, 120.9579531], 7)
					.addLayer(new L.tileLayer('https://wmts.nlsc.gov.tw/wmts/EMAP12/default/GoogleMapsCompatible/{z}/{y}/{x}', { 
						attribution: '&copy; <a href="https://maps.nlsc.gov.tw/">國土測繪中心</a>', 
						maxZoom: 18}));

	/** Initialize Taiwan county Boundary **/
	d3.json("Data/json/twCounty_after2010.topo.json", function(twJson){
		var twCountyBoundary = topo.parse(twJson);
		wendy.graph.plotTwCounty(map, twCountyBoundary);
	});


	/** Initialize all element **/
	// ListLayer Button active state
	$("#ListLayer").addClass("red").removeClass("black");

	// left-side panels
	$("#Panels>div").hide();
	$("#ListLayerPanel").show();

	// right-side panels
	$(".col-md-9").hide();
	$("#map").show();
	
	// hide progressBar 
	$("#progressBar").hide();

	/***** Tool Menu button *****/	
	// set Buttons and Panels event
	$("#ToolMenu .button").click(function(){
		// change style
		$("#ToolMenu .button").addClass("black").removeClass("red");
		$(this).addClass("red").removeClass("black");
		
		// show the relative "left" panels
		$("#Panels > div").slideUp();
		$("#" + this.id + "Panel").slideDown();

		// show the relative "right" panels
		$(".col-md-9").hide();		
		switch(this.id){
			case "AddTable":
				$("#tableList").show();
				break;
			case "AddTopo":
				$("#vectorList").show();
				break;
			case "Analysis":
				$("#AnalysisOptions").show();
				break;
			default:
				$("#map").show();
		}
	});

	$("#OrderLayer").on("click", function(){		
		var svgList = d3.select(".leaflet-map-pane")
					  	.select(".leaflet-objects-pane")
					  	.select(".leaflet-overlay-pane")
			 		  	.selectAll("svg");
		
		// remove exist svg list 
		$("#OrderLayerPanel > [data-dataType='graphList']").children('*').remove();
		
		// show exist svg list
 		svgList.each(function (d, i){
 				var svgName  = $(this).attr("name");
 				var svgClass = $(this).attr("class");
 				var z_index  = $(this).css("z-index");

 				/// create wendy layer options
 				var parentNode = d3.select("#OrderLayerPanel")
				 				   .select("[data-dataType='graphList']")
				 				   .append("div")
				 				   .attr("data-graphName", svgName)
				 				   .attr("data-graphClass", svgClass)
				 				   .attr("class", "header");
				
				// create add and minus button
				parentNode.append("a")
						  .attr("data-action","add")
						  .attr("class", "ui black label button")
						  .text("+");
				
				parentNode.append("a")
						  .attr("data-action","minus")
						  .attr("class", "ui black label button")
						  .text("─");

				// create z-index input text
				parentNode.append("input")
						  .attr("type", "text")
						  .attr("data-graphName", svgName)
						  .attr("data-graphClass", svgClass)
						  .attr("value", z_index)
						  .attr("placeholder", z_index)
						  .style("width", "2em");

				// create label
				parentNode.append("label").html("&nbsp&nbsp&nbsp" + svgName);
 				
 		});// End of List exist svg options	
	});

	/***** Panels *****/	
	// Layer List Panel Resize
	$(".LayerHeader").mouseover(function(){
		$(this).css("cursor", "pointer");
	});

	$(".LayerHeader").toggle(
		function (){
			$(this).next().slideUp();
		},
		function (){
			$(this).next().slideDown();
		}
	);

	/***** WendyPanel *****/
	// wendy Layer Options
	$("#popIndex").toggle(
		function(){
			$(this).css("background-color", "gray")
					.css("color", "white");
		},
		function(){
			$(this).css("background-color", "white")
					.css("color", "gray");
		}
	);
	
	$("#popIndex").toggle(		
		// toggle on: show table fields		
		function (){			
			if($("#" + this.id + "+ .list")[0] !== undefined){				
				// table option is already exist
				$("#" + this.id + "+ .list").slideDown();			
			
			}else{				
				// insert fields container node after selected nodes
				$(this).after('<div class="ui fluid selection list"></div>');
				$(this).next('div').attr("data-graphType", "choropleth");

				// show population index fields
				var parentNode = "#" + this.id + " + .list";
				var url = wendy.csv.getChoroplethUrl(this.id);				
				var dataSource = this.id;
				d3.csv(url, function (table){				    
				    var header = Object.keys(table[0]);				    
					for(var i=0, max=header.length; i<max; i+=1){
						if (header[i]!=="COUNTYNAME"){						
							// show field options
							d3.select(parentNode).append("div")							 
						  	  .attr("class", "item")						  	  
						  	  .attr("data-graphName", header[i])
						  	  .attr("name", header[i])
						  	  .attr("data-dataSource", dataSource)
						  	  .style("color", "gray")
						  	  .style("background-color", "white")
						  	  .text(header[i]);
						
						}// end of add options
					}// end of for loop 				
				});// end of d3.csv load
			}
		},

		// toggle off: hide table fields
		function (){
			$("#"+ this.id + "+.list").slideUp();
		}
	);
	
	// built-in choropleth button event
	$("#WendyPanel").on("click", "[data-graphType='choropleth'] [data-graphName]", function (){
		// svg variable
		var outputField = $(this).attr("name");
		var svgSelector = ".wendy[name='"+ outputField + "']";
		var svg = wendy.builtIn.choropleth[outputField];

		// button click event 
		//  1. set button style
		$(this).css("background-color", "gray")
				.css("color","white");

		// 2. identify if layer is exist or not
		// 2-1) if svg is not exist
		if(svg === undefined){
			d3.csv(wendy.csv.getChoroplethUrl($(this).attr("data-dataSource")), function(table){
				d3.json(topo.getTopoUrl("twCounty_after2010"), function(json){
	  				var twCounty = topo.parse(json);
	  				var twCounty = topo.joinCsv({
						csv          : table,
						topo         : twCounty,
						topoJoinField: "COUNTYNAME",
						csvJoinField : "COUNTYNAME",
						joinSingle   : true,
						outputField  : outputField,
	  				});
	  				// plot built-in choropleth
	  				wendy.graph.plotChoropleth(map, twCounty, outputField);
	  				
	  				// save choropleth 
	  				wendy.builtIn.choropleth[outputField]
	  					 = d3.select(".leaflet-map-pane")
							 .select(".leaflet-objects-pane")
							 .select(".leaflet-overlay-pane")
							 .select(svgSelector)
							 .style("z-index", 1);
				});// End of topo load
			});// End of csv load
			return 0;
		}else{
			alert("【" +outputField + "】 已經存在，請點選【圖層清單】操控圖層");
		}	

	});

	$("#pm25").on("click", function (){
		// set button style
		$(this).css("background-color", "gray")
			   .css("color", "white");

		// plot and save graph
		var svgName = this.id;
		var svg = wendy.builtIn.kriging[svgName];
		
		if(svg === undefined){
			// set progress bar
			$("#progressBar").show();
			$("#progressBar div.bar").attr("style", "width:10%");				
			
			d3.csv("Data/csv/epa/EPA_AirStation.csv", function (airSite){				
				console.log(airSite);
				// set progress bar
				$("#progressBar div.bar").attr("style", "width:30%")
										 .css("color", "white")
										 .css("font-size", "1.2em")
										 .text("環保署資料下載中...請勿點擊其他按鈕...");

				// air quality data url
				// var aqxUrl="http://opendata.epa.gov.tw/ws/Data/AQX/?$orderby=SiteName&$skip=0&$top=1000&format=json";					
				var aqxUrl="https://script.google.com/macros/s/AKfycbzpHxC3q2ANPe_9KVFjyTYpAtDvEUo2M-IzgDsQ-H8BttmIBSm7izPQiAAx8b1cXJgt/exec";				

				d3.json(aqxUrl, function (aqx){						
					
					// set progress bar
					$("#progressBar div.bar").attr("style", "width:45%")
											 .css("color", "white")
											 .css("font-size", "1.2em")
											 .text("台灣網格讀取中...請勿點擊其他按鈕...");

					d3.json("Data/json/twGrid.topo.json", function (twGrid){
						// set progress bar
						$("#progressBar div.bar").attr("style", "width:50%");
						
						// parse twGrid topojson
						var twGrid = topo.parse(twGrid);
					
						// join wendy csv and user csv by siteName
						aqx = aqx['records'];
						var aqxCsv = csv.csvJoinCsv(airSite, aqx);
						
						// set progress bar
						$("#progressBar div.bar").attr("style", "width:60%");
						
						// Define kriging variable
						var t = [],
							x = [],
							y = [],
							model = "exponential",
							sigma2 = 0,
							alpha = 100,
							variogram;

						// Extract kriging variable from aqx csv file
						for(var i=0, max=aqxCsv.length; i<max; i+=1){
							var lng = aqxCsv[i]["Lng"],
								lat = aqxCsv[i]["Lat"],
								value = aqxCsv[i]["pm25"];
							x.push(lng);
							y.push(lat);
							t.push(value);
						}
						console.log(aqxCsv);
						// kriging training predicted function
						variogram = kriging.train(t, x, y, model, sigma2, alpha);					
						
						// set progress bar
						$("#progressBar div.bar").attr("style", "width:70%").text("");
						
						// add kriging predicted value into twGrid
						for(var i=0, max=twGrid.length; i<max; i+=1){
							var newX = twGrid[i]["properties"]["Lng"],
								newY = twGrid[i]["properties"]["Lat"];
							
							twGrid[i]["properties"]["PM2.5"] 
								= kriging.predict(newX, newY, variogram);
						}						
						
						// set progress bar
						$("#progressBar div.bar").attr("style", "width:80%");
						
						// plot interpolation graph
						wendy.topo.plotOnLeaflet(map, twGrid, "PM2.5", "PM2.5", 7, "RdYlGn", true);

						// save svg graph
						wendy.builtIn.kriging[svgName]
							= d3.select(".leaflet-map-pane")
								 .select(".leaflet-objects-pane")
								 .select(".leaflet-overlay-pane")
								 .select("svg.wendy[name='PM2.5']")
								 .style("z-index", 1);

						// set progress bar
						$("#progressBar div.bar").attr("style", "width:100%");
						$("#progressBar").fadeOut();

					}); // End of twGrid topo json
				}); // End of loading pm2.5 csv from epa open data
			}); // End of loading air station csv		
		}// End of svg is not exist

		// svg is exist
		else{
			alert("【PM2.5】 已經存在，請點選【圖層清單】操控圖層");
		}				
	});

	$("#temperature").on("click", function (){
		// set button style
			$(this).css("background-color", "gray")
				   .css("color", "white")		;
		
		// plot and save graph  
		var svgName = this.id;
		var svg = wendy.builtIn.kriging[svgName];	
		
		if(svg === undefined){
			// set progress bar			
			$("#progressBar").show();
			$("#progressBar div.bar").attr("style", "width:20%")
									 .css("color", "white")
									 .css("font-size", "1.2em")
									 .text("溫度資料讀取中...請勿點擊其他按鈕...");

			// data source: http://opendata.cwb.gov.tw/about.htm
			// var url = wendy.getCloudUrl("https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/O-A0001-001?Authorization=rdec-key-123-45678-011121314&format=XML");
			var url = "https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/O-A0001-001?Authorization=rdec-key-123-45678-011121314&format=JSON";
			d3.json(url, function (cwbJSON){				
				// set progress bar
				$("#progressBar div.bar").attr("style", "width:50%")
										 .css("color", "white")
									     .css("font-size", "1.2em")
									     .text("網格讀取中...請勿點擊其他按鈕...");

				d3.json("Data/json/twGrid.topo.json", function (twGrid){
					// parse xml to json format object
					var tmpData = cwbJSON['cwaopendata']['dataset']['Station'];
					
					
					// parse twGrid topojson
					var twGrid = topo.parse(twGrid);

					// set progress bar
					$("#progressBar div.bar").attr("style", "width:60%").text("");

					// Define kriging variable
					var t = [],
						x = [],
						y = [],
						model = "exponential",
						sigma2 = 0,
						alpha = 100,
						variogram;

					// Extract kriging variable from xml file
					for(var i=0, maxSites=tmpData.length; i< maxSites; i+=1){
						var lng = tmpData[i]["GeoInfo"]["Coordinates"][1]["StationLongitude"],
							lat = tmpData[i]["GeoInfo"]["Coordinates"][1]["StationLatitude"],
							temp = tmpData[i]["WeatherElement"]["AirTemperature"];
						
						x.push(lng);
						y.push(lat);
						t.push(temp);
					}// End of for loop of xmlLocation
					
					// solve problem:
					//    exponential memory and Max Call Stack Exceeds.
                    //    refernece: https://github.com/oeo4b/kriging.js/issues/13    
					Array.prototype.rep = function(n) {
						var arrayn = new Array(n);
						var v = this[0];
						for (var i = 0; i < n; i++) { arrayn[i] = v; }
						return arrayn;
					};		

					// kriging training predicted function
					variogram = kriging.train(t, x, y, model, sigma2, alpha);
					
					// set progress bar
					$("#progressBar div.bar").attr("style", "width:70%").text("");			

					// add kriging predicted value into twGrid
					for(var i=0, max=twGrid.length; i<max; i+=1){
						var newX = twGrid[i]["properties"]["Lng"],
							newY = twGrid[i]["properties"]["Lat"];
						
						twGrid[i]["properties"]["temperature"] 
							= kriging.predict(newX, newY, variogram);
					}
					
					// set progress bar
					$("#progressBar div.bar").attr("style", "width:80%").text("");

					// plot interpolation graph
					wendy.topo.plotOnLeaflet(map, twGrid, "temperature", "temperature", 7, "RdYlBu", true);

					// set progress bar
					$("#progressBar div.bar").attr("style", "width:90%").text("");

					// save svg graph
					wendy.builtIn.kriging[svgName]
						= d3.select(".leaflet-map-pane")
							 .select(".leaflet-objects-pane")
							 .select(".leaflet-overlay-pane")
							 .select("svg.wendy[name='temperature']")
							 .style("z-index", 1);

					// set progress bar
					$("#progressBar div.bar").attr("style", "width:100%");
					$("#progressBar").fadeOut();
				
				});// End of twGrid load
			});// End of xml load
		}// End of svg not exist

		// svg is exist
		else{
			alert("【" + svgName + "】已經存在，請點選【圖層清單】操控圖層");
		}		
	});

	// Dacet database options
	$('#WendyPanel [data-database="Dacet"] div.item').css("color", "gray");

	$('#WendyPanel [data-database="Dacet"] [data-action="dateTimePicker"]').datetimepicker({
		dateFormat: 'yy/mm/dd',
		timeFormat: "HH:00"
	});

	$('#WendyPanel [data-database="Dacet"] [name="colorPicker"]').on("change", function (){
		var colorPath = "images/colorbrewer/";
		var colorName = $(this).children("option:selected").val();
		var img = $('#WendyPanel [data-database="Dacet"] .colorImage');

		if(colorName === "choseColors"){
			img.attr("src", null);
			img.parent().css("display", "none");
		}else{
			img.attr("src", colorPath + colorName + ".jpg");
			img.parent().css("display", "block");
		}

	});

	$('#WendyPanel [data-database="Dacet"] div[data-action="plot"]').css("font-size", "1.1em")	
		.on("click", function (){
			// Define user selected options
			var dateTime    = $('#WendyPanel [data-database="Dacet"] [data-action="dateTimePicker"]').val() || false,			
			    species     = $('#WendyPanel [data-database="Dacet"] select[name="speciesPicker"]').val(),
			    speciesName = $('#WendyPanel [data-database="Dacet"] select[name="speciesPicker"] option:selected').text();
				
			var colorPicker  = $('#WendyPanel [data-database="Dacet"] [name="colorPicker"]'),
				colorName    = colorPicker.children("option:selected").val(),
			    colorInverse = (colorPicker.next('label').children('input').attr("checked") == "checked") ? true:false;
			
			if(!dateTime){
				alert("請選擇日期與時間");
				return 0;
			}
			if(species === "請選擇變項資料"){
				alert("請選擇變相資料");
				return 0;
			}

			var yyear      = dateTime.split('/')[0],
				mmonth     = dateTime.split('/')[1],
				dday       = dateTime.split('/')[2].split(' ')[0],
				thour      = dateTime.split('/')[2].split(' ')[1].split(':')[0];
				valueField = 'hr'+ thour;
			
			// Define SVG graph variable
			var svgName = $(this).parent().attr("data-database")+ '_' + yyear 
						  + mmonth + dday + '_' + thour + '_' + speciesName;
			var svg = wendy.builtIn.kriging[svgName];
		
			// svg is not exist
			if(svg === undefined){
				// set progress bar			
				$("#progressBar").show();
				$("#progressBar div.bar").attr("style", "width:20%")
										 .css("color", "white")
										 .css("font-size", "1.2em")
										 .text("Dacet資料讀取中...請勿點擊其他按鈕...");
				
				var url = "data.php"; 							
				$.post( url,						
						
						// post header
						{
							'yyear'  : String(yyear), 
							'mmonth' : String(mmonth),
							'dday'   : String(dday),
							'thour'  : String(thour),
							'species': String(species)
					  	},						
						
						// post callback function
						function (json){
							
							$("#progressBar div.bar").attr("style", "width:40%")
								 .css("color", "white")
								 .css("font-size", "1.2em")
								 .text("台灣網格資料讀取中...請勿點擊其他按鈕...");
							
							d3.json("Data/json/twGrid.topo.json", function (twGrid){					
								// parse twGrid topojson
								var twGrid = topo.parse(twGrid);

								// set progress bar
								$("#progressBar div.bar").attr("style", "width:60%").text("");

								// Define kriging variable
								var t = [],
									x = [],
									y = [],
									model = "exponential",
									sigma2 = 0,
									alpha = 100,
									variogram;

								// Extract kriging variable from json data
								for(var i=0, max=json.length; i< max; i+=1){
									var lng = json[i]["lon"],
										lat = json[i]["lat"],
										value = json[i][valueField];
									
									x.push(lng);
									y.push(lat);
									t.push(value);
								}// End of for loop of json data

								// kriging training predicted function
								variogram = kriging.train(t, x, y, model, sigma2, alpha);
								
								// set progress bar
								$("#progressBar div.bar").attr("style", "width:70%").text("");

								// add kriging predicted value into twGrid
								for(var i=0, max=twGrid.length; i<max; i+=1){
									var newX = twGrid[i]["properties"]["Lng"],
										newY = twGrid[i]["properties"]["Lat"];
									
									twGrid[i]["properties"][svgName] 
										= kriging.predict(newX, newY, variogram);
								}

								// set progress bar
								$("#progressBar div.bar").attr("style", "width:80%").text("");

								// plot interpolation graph
								wendy.topo.plotOnLeaflet(map, twGrid, svgName, svgName, 7, colorName, colorInverse);

								// set progress bar
								$("#progressBar div.bar").attr("style", "width:90%").text("");

								// save svg graph
								wendy.builtIn.kriging[svgName]
									= d3.select(".leaflet-map-pane")
										 .select(".leaflet-objects-pane")
										 .select(".leaflet-overlay-pane")
										 .select("svg.wendy[name='"+ svgName + "']")
										 .style("z-index", 1);

								// set progress bar
								$("#progressBar div.bar").attr("style", "width:100%");
								$("#progressBar").fadeOut();
							
							});// End of twGrid load
						}// End of callback function					
				
				,"json").fail(function (){
					// post method error messages
					alert("【" + dateTime + "】沒有資料，請重新選取!");
					$("#progressBar").fadeOut();
				});
			
			}// End of svg is not exist

			// svg is exist
			else{
				alert("【" + svgName + "】已經存在，\n請點選【圖層清單】操控圖層");
			}
		});


	/***** OrderLayerPanel *****/
	$("#OrderLayerPanel > [data-dataType='graphList']").on("click", "[data-action]", function (e){			
		// Define button action
		var action = $(this).attr("data-action");

		// Define input text jquery selector
		// change input text value
		switch(action){
			case "add":
				var inputText = $(this).next('a').next('input');
				inputText.val(function (){
					return parseInt($(this).val(), 10) + 1;
				});
				break;
			case "minus":
				var inputText = $(this).next('input');
				inputText.val(function (){
					return parseInt($(this).val(), 10) - 1;
				});				
				break;
		}
		
		// get z_index and save
		var z_index = inputText.val();		
		orderLayer[inputText.attr("data-graphName")] = z_index
		
		// change placehold value
		inputText.attr("placeholder", z_index);

		// svg move up!
		var svgClass = inputText.attr("data-graphClass");
		var svgName = inputText.attr("data-graphName");
		var svgSelector = "svg." + svgClass + "[name='" + svgName + "']";

		d3.select("#map")
		   .select(".leaflet-map-pane")
		   .select(".leaflet-objects-pane")
		   .select(".leaflet-overlay-pane")
		   .select(svgSelector)
		   .style("z-index", z_index);

		// show top svg legend
		wendy.graph.showTopLegend();

		// hide z-index equal zero svg
		wendy.graph.hideZeroZindexGraph();
	});

	$("#OrderLayerPanel > [data-dataType='graphList']").on("change", "input[type='text']", function (e){			
		// Define input text
		var inputText = $(this);

		// get z_index and save
		var z_index = inputText.val();
		orderLayer[inputText.attr("data-graphName")] = z_index;

		// change placehold value
		inputText.attr("placeholder", z_index);

		// svg move up!
		var svgClass = inputText.attr("data-graphClass");
		var svgName = inputText.attr("data-graphName");
		var svgSelector = "svg." + svgClass + "[name='" + svgName + "']";

		d3.select("#map")
		   .select(".leaflet-map-pane")
		   .select(".leaflet-objects-pane")
		   .select(".leaflet-overlay-pane")
		   .select(svgSelector)
		   .style("z-index", z_index);

		// show top svg legend
		wendy.graph.showTopLegend();

		// hide z-index equal zero svg
		wendy.graph.hideZeroZindexGraph();
	});
	
	/***** AddTablePanel *****/
	$("#csvSelect").on("click", function (e){
		e.preventDefault(); // prevent navigation to "#"
		$("#csvFiles")[0].click();

		// set button group css style
		$("#csvSelect")
		.css("color", "white")
		.css("background-color", "gray");

		$("#tsvSelect")
		.css("color", "gray")
		.css("background-color", "white");

		// set csvFlag and tsvFlag
		csvFlag = 1;
		tsvFlag = 0;
	});

	$("#tsvSelect").on("click", function (e){
		e.preventDefault(); // prevent navigation to "#"
		$("#tsvFiles")[0].click();

		// set button group css style
		$("#csvSelect")
		.css("color", "gray")
		.css("background-color", "white");

		$("#tsvSelect")
		.css("color", "white")
		.css("background-color", "gray");

		// set csvFlag and tsvFlag
		csvFlag = 0;
		tsvFlag = 1;
	});


	$("#tableParse").on("click", function (e){
	 	// prevent navigation to "#"
		e.preventDefault();

		// csv selected
		if(csvFlag){
			var tableFiles = $("#csvFiles")[0].files;			
			
			// check user already select csv files
			if(tableFiles.length === 0){
				alert("請選擇逗點分隔(.csv)檔案，\n"+
					  "可以一次選取多個檔案喔!");
				return 0;
			}
		}

		// tsv selected
		if(tsvFlag){
			var tableFiles = $("#tsvFiles")[0].files;

			// check user already select csv files
			if(tableFiles.length === 0){
				alert("請選擇空白分隔(.txt)檔案，\n"+
					  "可以一次選取多個檔案喔!");
				return 0;
			}
		}

		// parse table files
		for(var i=0, max=tableFiles.length; i<max; i++){
			// run FileReader onload ajax event by using immediate function 
			(function (tableFile){					
		  		// indentify file type
	  			var fileName = tableFile.name.split('.')[0];
	  			var fileExt  = tableFile.name.split('.').pop();
				var reader = new FileReader();										
				reader.readAsText(tableFile, "UTF-8");
				
				reader.onload = function(e){
		  			var tableContent = e.target.result;
		  			
		  			if(fileExt === "csv"){
		  				var table = wendy.csv.parse(tableContent);
						wendy.user.table[fileName] = table;
		  			
		  			}else if(fileExt === "txt"){
		  				var table = wendy.tsv.parse(tableContent);						
						wendy.user.table[fileName] = table;
		  			
		  			}else{
		  				alert("您所選的檔案格式，本系統目前不支援!");
		  				return 0;
		  			}

		  			var columnHeader = Object.keys(table[0]);			  			
		  			wendy.user.tableField[fileName] = columnHeader;
		  			
		  			/**** add options to ChoroplethPanel and InterpolationPanel ****/
		  			// Choropleth table file options
		  			d3.select("#ChoroplethPanel").select("[data-dataType='table']")
		  				.append("div")
		  				.attr("class", "item")
		  				.attr("data-file", fileName)
		  				.text(fileName)	  			


		  			/**** Show table Content ****/ 
		  			d3.select('#tableList')
	  				  .select(".FileContent")
	  				  .append("h2")
	  				  .attr("class", "ui header")
	  				  .attr("name", fileName)
	  				  .html('<i class="table icon"></i>' + fileName)
	  				  .node();

	  				// table Name header event 
		  			$("#tableList .FileContent h2")
			  			.mouseover(function (){
			  				$(this).css("cursor", "pointer");
			  			})			  			
			  			.toggle(
		  					function (){
		  						$(this).next("table").fadeOut();
		  					},			  					
		  					function (){
		  						$(this).next("table").slideDown();
		  					}
			  			);

		  			/// Create table Contains csv content			  			
		  			//  (1)Create table framework
		  			var tableSelector = d3.select("#tableList")
		  								  .select(".FileContent")			  				
		  								  .append("table")
		  				                  .attr("class", "ui table segment")
		  				                  .attr("tableName", fileName);		  			
					
					//  (2)Create table header
		  			var tableHeader = tableSelector.append("thead").append("tr");
		  			
		  			for(var col=0, maxCol=columnHeader.length; col<maxCol; col+=1){			  				
		  					var fieldName = columnHeader[col];			  					
		  					tableHeader.append("th")
		  							   .text(fieldName);
		  			}
		  			
		  			//  (3)Create table Content
		  			var tableBody = tableSelector.append("tbody");

		  			for(var row=0, maxRow=table.length; row<maxRow; row+=1){
						var tableBodyContent = tableBody.append("tr");

						if(row%2 === 1){
							tableBodyContent.style("background-color", "#EDEDED");
						}

		  				for(var col=0, maxCol=columnHeader.length; col<maxCol; col+=1){
		  					var fieldName = columnHeader[col];
		  					tableBodyContent.append("td").text(table[row][fieldName]);
		  				}
		  			}

				}// End of reader.onload			
			
			})(tableFiles[i]);		
		
		}// End of for loop
	});//End of "#tableParse" click

	/***** AddTopoPanel *****/
	/// dropbox
	$("#vector_dropbox").on("dragenter", function (e){
		e.stopPropagation();
		e.preventDefault();
	});
	
	$("#vector_dropbox").on("dragover", function (e){
		e.stopPropagation();
		e.preventDefault();	
	});
	
	$("#vector_dropbox").on("drop", function (e){
		e.stopPropagation();
  		e.preventDefault();
  		$(this).css("backgroundColor", "gray").text("完成選取");

  		// file reader
  		var data = e.originalEvent.dataTransfer;
  		var files = data.files;  		
  		
  		for(var i=0, max=files.length; i<max; i+=1){
  			(function (file){		  		
		  		// indentify file type
		  		var fileName = file.name.split('.')[0],
		  			fileExt  = file.name.split('.').pop(); //副檔名
		  		
		  		// read selected files content
		  		var reader = new FileReader();
		  		reader.readAsText(file);

		  		// // after read file content....
		  		reader.onload = function (e) {	
		  			// identify file format and convert to object
		  			var content = reader.result;
		  			switch(fileExt){
		  				case("topojson"):
				  			var topo = wendy.topo.parse(content);				  			
				  			console.log(topo);
				  			break;
				  		
				  		case("geojson"):				  			
				  			var topo = JSON.parse(content);				  			
				  			console.log(topo);
				  			break;
				  		
				  		case("kml"):
				  			var kmlObj = $.parseXML(content);
				  			var topo = toGeoJSON.kml(kmlObj)["features"];
				  			console.log(topo);
			  				break;

			  			case("gpx"):
			  				var gpxObj = $.parseXML(content);
			  				var topo = toGeoJSON.gpx(gpxObj);
			  				console.log(topo);
			  				break;

			  			default:
			  				alert('請確認您的"檔案格式"或"副檔名"符合以下所列的任一項:' + 
			  					  '(1) .topojson\n' +
			  					  '(2) .geojson\n' +
			  					  '(3) .kml\n' +
			  					  '(4) .gpx'
			  					 );
			  				return 0;
			  		}		
		  			
		  			d3.select("#vectorList")			  				
		  				.append("p")
		  				.text(fileName + '.' + fileExt +" 載入完成!");

		  		}  	

  			}(files[i]));
		}
	
	});// end of drop file into box

	/***** ChoroplethPanel *****/
	// 1.select vector file	and create vector joined field options
	$("#ChoroplethPanel [data-dataType='topo']").on("click", "[data-file]", function (){
		// set button style
		$("#ChoroplethPanel [data-dataType='topo'] [data-file]")
			.css("background-color", "white")
			.css("color", "gray");

		$(this).css("background-color", "gray")
				.css("color", "white");
		
		// remove exist vector fields
		$("#ChoroplethPanel [data-dataType='topoField'] div[data-field]").remove();
		
		// save plot Chopleth variaborle
		var topoName = $(this).attr("data-file");	
		choropleth.topoName = topoName;	
		
		/*** check vector file is wendy's or user's ***/
		var topoClass = $(this).attr("class").split(" ")[0];
		
		/// topo from wendy built-In
		if(topoClass === "wendy"){		
			// save plot Choropleth variable
			choropleth.isTopoFromWendy = true;
			
			// Create vector joined fields
			var topoFields = wendy.builtIn.topoField[$(this).attr("data-file")];
			
			if(topoFields === undefined){	
				d3.json(wendy.topo.getTopoUrl(topoName), function (json){					
					var topoFile   = topo.parse(json),
						topoFields = Object.keys(topoFile[0].properties);				

					for(var i=0, max=topoFields.length; i<max; i++){
						d3.select("#ChoroplethPanel").select("[data-dataType='topoField']")
							.append("div")
							.attr("class", "item")
							.attr("data-field", topoFields[i])
							.text(topoFields[i]);
					}

					// save into grobal variable 
					wendy.builtIn.topo[topoName] = topoFile;				
					wendy.builtIn.topoField[topoName] = topoFields;
				});
				// end event 
				return 0;		
			}
			for(var i=0, max=topoFields.length; i<max; i++){
				d3.select("#ChoroplethPanel").select("[data-dataType='topoField']")
					.append("div")
					.attr("class", "item")
					.attr("data-field", topoFields[i])
					.text(topoFields[i]);
			}
		
		}else{
			/// topo from user			
			// storage plot Choropleth variable
			choropleth.isTopoFromWendy = false;

			// Create vector joined fields
			var topoFile   = wendy.user.topo[topoName],
				topoFields = Object.keys(topoFile[0].properties);				

			for(var i=0, max=topoFields.length; i<max; i++){
				d3.select("#ChoroplethPanel").select("[data-dataType='topoField']")
					.append("div")
					.attr("class", "item")
					.attr("data-field", topoFields[i])
					.text(topoFields[i]);
			}
		}

	});

	// 2.select table file and create table joined field options - *use .on() delegated events 
	$("#ChoroplethPanel [data-dataType='table']").on("click", "div[data-file]", function (e){
		// set button style
		$("#ChoroplethPanel [data-dataType='table'] div[data-file]")
			.css("background-color", "white")
			.css("color", "gray");

		$(this).css("background-color", "gray")
				.css("color", "white");

		// remove exist table joined fields options and output field options
		$("#ChoroplethPanel [data-dataType='tableField'] div[data-field]").remove();
		$("#ChoroplethPanel [data-dataType='outputField'] div[data-field]").remove();

		// storage plot Chopleth variaborle
		choropleth.tableName = $(this).attr("data-file");

		// Create table joined field options and output field options			  			
		var tableFields = wendy.user.tableField[$(this).attr("data-file")];
		for(var j=0, maxCol=tableFields.length; j<maxCol; j+=1){			
			// joined field options
			d3.select("#ChoroplethPanel").select("[data-dataType='tableField']")
			.append("div")
			.attr("class", "item")
			.attr("data-field", tableFields[j])
			.text(tableFields[j])
			.style("color", "gray");

			// output field options
			d3.select("#ChoroplethPanel").select("[data-dataType='outputField']")
			.append("div")
			.attr("class", "item")
			.attr("data-field", tableFields[j])
			.text(tableFields[j])
			.style("color", "gray");	  				
		}		
	});

	// 3-1.select topo field
	$("#ChoroplethPanel [data-dataType='topoField']").on("click", "[data-field]", function(){
		// set button style
		$("#ChoroplethPanel [data-dataType='topoField'] [data-field]")
			.css("background-color", "white")
			.css("color", "gray");
		$(this).css("background-color", "gray")
			.css("color", "white");

		// storage plot Chopleth variaborle
		choropleth.topoJoinField = $(this).attr("data-field");
	});

	// 3-2.select table field
	$("#ChoroplethPanel [data-dataType='tableField']").on("click", "[data-field]", function(){
		// set button style
		$("#ChoroplethPanel [data-dataType='tableField'] [data-field]")
			.css("background-color", "white")
			.css("color", "gray");
		$(this).css("background-color", "gray")
			.css("color", "white");

		// storage plot Chopleth variaborle
		choropleth.tableJoinField = $(this).attr("data-field");
	});

	// 4.select outputField
	$("#ChoroplethPanel [data-dataType='outputField']").on("click", "[data-field]", function(){
		// set button style
		$("#ChoroplethPanel [data-dataType='outputField'] [data-field]")
			.css("background-color", "white")
			.css("color", "gray");
		$(this).css("background-color", "gray")
			.css("color", "white");

		// storage plot Chopleth variaborle
		choropleth.tableOutputField = $(this).attr("data-field");
	});

	// 5.plot Choropleth
	$("#ChoroplethPanel [data-action='plot']").on("click", function(){
		// define topo join table function's variable
		var topoName  	     = choropleth.topoName || false,
			topoJoinField    = choropleth.topoJoinField || false,
			tableName        = choropleth.tableName || false,
			tableJoinField   = choropleth.tableJoinField || false,
			tableOutputField = choropleth.tableOutputField || false;

		// check all options are all selected
		if(!topoName){
			alert("請選擇向量資料");
			return 0;
		}
		if(!tableName){
			alert("請選擇屬性資料");
			return 0;
		}
		if(!topoJoinField){
			alert("請選擇要進行合併的向量欄位");
			return 0;
		}
		if(!tableJoinField){
			alert("請選擇要進行合併的屬性欄位");
			return 0;
		}
		if(!tableOutputField){
			alert("請選擇要畫圖的屬性欄位");
			return 0;
		}

		// define svg variable
		var newTopoName = tableName + "_" + tableOutputField;
		var svgSelector ="svg.user[name='"+ newTopoName +"']";
		var svg = d3.select("#map")
					.select(".leaflet-map-pane")
					.select(".leaflet-objects-pane")
					.select(".leaflet-overlay-pane")
					.select(svgSelector);
		
		// check svg is exist or not
		if(svg[0][0] !== null){
			alert("您所選的資料已經繪製完成,\n" +
				  "請點選【圖層清單】進行確認!");
			return 0;
		}

		// get table and topo object
		var table = wendy.user.table[tableName];		
		if(choropleth.isTopoFromWendy){
			var topo = wendy.builtIn.topo[topoName];
		}else{
			var topo = wendy.user.topo[topoName];
		}

		// create topo file has table properties
		var topoShape = wendy.topo.joinCsv({
							csv            : table,
							topo           : topo,
							topoJoinField  : topoJoinField,
							csvJoinField   : tableJoinField,
							joinSingle	   : true,
							outputField    : tableOutputField
						});
		
		// set progress bar
		$("#progressBar").show();
		$("#progressBar div.bar").attr("style", "width:50%").text("開始畫圖");

		// polt choropleth		
		wendy.graph.plotChoropleth(map, topoShape, tableOutputField, newTopoName);

		// save choropleth selector
		wendy.user.choropleth[newTopoName] = d3.select("#map")
											   .select(".leaflet-map-pane")
											   .select(".leaflet-objects-pane")
											   .select(".leaflet-overlay-pane")
											   .select(svgSelector)
											   .style("z-index", 1);

		// // create button at UserPanel		
		// d3.select("#UserPanel [data-graphType='choropleth']")
		// 	.append("div").attr("class", "item")
		// 	.attr("data-graphName", newTopoName)
		// 	.text(newTopoName)
		// 	.style("background-color", "gray")
		// 	.style("color", "white");

		//set progress bar		
		$("#progressBar div.bar").attr("style", "width:100%").text("");
		$("#progressBar").fadeOut();

	})
	.mouseover(function(){
		$(this).css("background-color", "gray")
				.css("color", "white");
	})
	.mouseout(function(){
		$(this).css("background-color", "white")
				.css("color", "gray");
	})
	.mousedown(function(){
		$(this).css("background-color", "#CC0066")
			.css("color", "white");
	});

	// hide and show file and field options
	$("#ChoroplethPanel .header").toggle(
		function (argument){
			$(this).next('div').slideUp();
		},
		function (argument){
			$(this).next('div').slideDown();
		}
	)
	.mouseover(function (){
			$(this).css("cursor", "pointer");
	});
	
});