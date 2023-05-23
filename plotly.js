// A function to unwrap the data, learnt from DECO3100 tutorial class
const unpack = (data, key) => data.map(row => row[key]);





/* Main functions */
function plasticPollution() {
	Plotly.d3.csv("csv/plastic-pollution.csv", data => {
		const plotDiv = document.getElementById('plastic-pollution-plot');
		plotDiv.addEventListener("click", () => {colorBarSelected(chart1_colorbar, 1, null);});

		const country = unpack(data, 'Entity');
		const location = unpack(data, 'Code');
		const mpw = unpack(data, 'MPW');

		// As the amount of MPW of Philippines is too high and skews the chart, I scaled the color bar for better visualisation
		var mpw_Scaled = scaleColorbar(mpw, mpwDivision);

		// Create custom hover text to fix the null data text
		var mpw_Txt = [];

		mpw.forEach(element => {
			var txt = "No data";
			if (element > 0) txt = element + " tons";
			mpw_Txt.push(txt);
		});

		const hover_Text = country.map((name, index) => ` Country: ${name} <br> MPW released into oceans: <b>${mpw_Txt[index]}</b> `);

		const chart_data = [{
			type: 'choropleth',
			locations: location,
			z: mpw_Scaled,

			// Making no data object different color, concept from https://community.plotly.com/t/visually-marking-numpys-nan-as-grey/17007/2
			colorscale: chart1_colorScale,
			
			marker: {
				line: {
					color: 'rgb(255,255,255)',
					width: 0.3
				}
			},
			
			// Hide the colorbar and create a new one by myself
			showscale: false, 

			text: hover_Text,
			hovertemplate: '%{text}<extra></extra>',
		}];

		const chart_layout = {
			geo: {
				showframe: false,
				bgcolor: 'rgba(0,0,0,0)',
				projection: { type: 'mercator' },

				// Hide Antartica as it has no data to show, this allows users to focus on the main objects 
				// Concept inspired by https://stackoverflow.com/questions/73999494/how-to-remove-antarctica-from-plotly-world-map
				lataxis: { range: [-3, 90] } 
			},
			margin: {
				l: 0,
				r: 0,
				b: 30,
				t: 100
			},
			responsive: true,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',

			// Fix the plot to disable default scroll / drag movement (users can still do so by using the pan function)
			dragmode: false 
		};

		Plotly.newPlot(plotDiv, chart_data, chart_layout);
	});
}

function threatenedSpecies() {
	const checkbox = document.querySelectorAll(".checkbox-container input");

	Plotly.d3.csv("csv/number-species-threatened.csv", data => {
		const plotDiv = document.getElementById('threaten-species-plot');

		const group = unpack(data, 'Entity');
		const year = unpack(data, 'Year');
		const number = unpack(data, 'Number');

		const colorGroup = ['rgb(255, 99, 132)', 'rgb(153, 102, 255)', 'rgb(153, 50, 204)', 'rgb(3, 172, 19)', 'rgb(54, 162, 235)', 'rgb(255, 159, 64)', 'rgb(255, 192, 203)', 'rgb(135, 206, 235)', 'rgb(255, 215, 0)'];
		var chart_data = [];

		// Check any animal group is deselected
		var skipLst = [];
		for (var index = 0; index < checkbox.length; index++) {
			if (checkbox[index].checked) continue
			skipLst.push(index);
		}

		var totalYear = 11;
		for (var i = 0; i < group.length; i += totalYear) {
			// Check any animal group is deselected
			if (skipLst != null && skipLst.includes(i / totalYear)) continue;

			// For calculating the predicition
			const known_x = [];
			const known_y = [];

			// To display on the graph
			const show_x = [];
			const show_y = [];

			for (var j = 0; j < totalYear - 1; j++) {
				var yr = parseInt(year[i+j]);
				var num = parseInt(number[i+j])
				known_x.push(yr);
				known_y.push(num);
				
				if (yr >= 2016) {
					show_x.push(yr);
					show_y.push(num);
				}
			}

			var lr = linearRegression(known_y, known_x);
			
			var predictionYear = [2022, 2023, 2024, 2025, 2026];
			var prediction = [];
			for (var j = 0; j < predictionYear.length; j++) {
				prediction.push(Math.round(lr.intercept + lr.slope * predictionYear[j]));
			}

			// Including 2022 for display but not for calculating the linear regression to avoid bias
			show_x.push(parseInt(year[i+totalYear-1]));
			show_y.push(parseInt(number[i+totalYear-1]));

			const hoverText = [];
			for (var j = 0; j < totalYear; j++) {
				hoverText.push(group[i]);
			}

			const trace = {
				x: show_x,
				y: show_y,
				mode: 'lines',
				name: group[i],
				line: {
					color: colorGroup[i / totalYear]
				},
				
				text: hoverText,
				hovertemplate: ' %{text} threaten species in %{x} (actual): <b>%{y}</b><extra></extra> ',

				// Change the text color to improve readability https://community.plotly.com/t/change-hover-text-color/28039/8
				hoverlabel: {
					font: {
						color: 'black'
					}
				},
			};

			// Function created by myself but Idea inspired by http://www.java2s.com/example/javascript/chart.js/line-chart-with-partial-dashed-line.html
			// Create dash line for prediction https://plotly.com/javascript/line-charts/
			const tracePrediction = {
				x: predictionYear,
				y: prediction,
				mode: 'lines',
				name: group[i] + " (Prediction)",
				line: {
					dash: 'dot',
					color: colorGroup[i / totalYear]
				},

				text: hoverText,
				hovertemplate: ' %{text} threaten species in %{x} <i>(prediction)</i>: <b>%{y}</b><extra></extra> ',

				// Change the text color to improve readability https://community.plotly.com/t/change-hover-text-color/28039/8
				hoverlabel: {
					font: {
						color: '#212121'
					}
				},
			};

			// Connect the orginal trace & prediction trace together
			// Remove the duplicated hover info https://stackoverflow.com/questions/32319619/disable-hover-information-on-trace-plotly
			const traceTransition = {
				x: [year[i + known_x.length - 1], predictionYear[0]],
				y: [number[i + known_y.length - 1], prediction[0]],
				mode: 'lines',
				line: {
					dash: 'dot',
					color: colorGroup[i / totalYear]
				},
				hoverinfo: 'skip'
			};

			chart_data.push(trace);
			chart_data.push(tracePrediction);
			chart_data.push(traceTransition);
		}

		const chart_layout = {
			font: {
				family: 'Open Sans',
				color: '#EAEAEA'
			},
			xaxis: {
				// Avoid the year be treated as number https://community.plotly.com/t/use-a-list-of-number-string-as-xaxis/18876/3
				type: 'category',
				gridcolor: '#454545',
			},
			yaxis: {
				range: [0, 4000],
				autorange: false,
				zerolinecolor: '#454545',
				gridcolor: '#454545',
			},
			margin: {
				pad: 10
			},
			responsive: true,
			showlegend: false,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			dragmode: false
		};

		Plotly.newPlot(plotDiv, chart_data, chart_layout);

		// Create the checkbox to allow users deselect any animal groups
		if (!checkboxGenerated) {
			generateCheckbox(group, totalYear, colorGroup);
		}
	})
}

function marineSpeciesPopulation() {
	Plotly.d3.csv("csv/threaten-marine-species.csv", data => {
		const plotDiv = document.getElementById('population-trend-plot');
		let col = ['rgba(223, 46, 56, 1)', 'rgba(223, 46, 56, .45)', 'rgba(223, 46, 56, .35)'];

		const trend = unpack(data, 'Trend');
		const number = unpack(data, 'Number');
		for (let i = 0; i < number.length; i++) { number[i] = parseInt(number[i]); }

		const chart_data = [{
			labels: trend,
			values: number,

			textfont: {
				// Change the text color to increase readability and accessibility https://community.plotly.com/t/pie-chart-label-colors/10595
				color: "#fff"
			},
			textinfo: "label+percent",

			sort: false,
			hoverinfo: 'none',

			marker: { colors: col },
			hole: .5,
			type: 'pie'
		}]

		const chart_layout = {
			font: {
				family: 'Open Sans',
				color: '#EAEAEA'
			},
			images: [{
				// https://plotly.com/javascript/reference/layout/images/
				x: 0.5,
				y: 0.75,
				sizex: .5,
				sizey: .5,
				opacity: .7,
				source: "./image/plot/icon.png",
				xanchor: "center",
				yanchor: "center",
			}],
			responsive: true,
			showlegend: false,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			margin: {t: 90, b: 0, l: 0, r: 0},
		};

		const config = {
			 // Only display the chart and hide other display elements
			displayModeBar: false
		};

		Plotly.newPlot(plotDiv, chart_data, chart_layout, config);
	})
}

function seafoodConsumption(selectedYear) {
	Plotly.d3.csv("csv/seafood-consumption.csv", data => {
		const plotDiv = document.getElementById('seafood-demand-plot');
		plotDiv.addEventListener("click", () => {colorBarSelected(chart2_colorbar, 2, null);});

		// Check any missed data from all countries (1990-2020)
		if (!addedMissedData) addMissedData(data);

		const country = seafoodConsumptionData[0];
		const location = seafoodConsumptionData[1];
		const year = seafoodConsumptionData[2];
		const consumption = seafoodConsumptionData[3];

		var countryLst = [];
		var locationLst = [];
		var consumptionLst = [];
		for (var i = 0; i < country.length; i++) {
			if (year[i] != selectedYear) continue
			countryLst.push(country[i]);
			locationLst.push(location[i]);
			consumptionLst.push(consumption[i]);
		}

		// Fix the scale of the consumptionLst to avoid scale changes
		var consumptionLst_Scaled = scaleColorbar(consumptionLst, seafoodDivision);

		// Create custom hover text to fix the null data text
		var consumption_Txt = [];

		consumptionLst.forEach(element => {
			var txt = "No data";
			// Round to two decimal places https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
			if (element > 0) txt = Math.round(element * 100) / 100 + " (kg)";
			consumption_Txt.push(txt);
		});

		// Fix the min and max value of the consumptionLst
		consumptionLst_Scaled.push(-1);
		consumptionLst_Scaled.push(80);

		const hover_Text = countryLst.map((name, index) => ` Country: ${name}<br> Consumption per capita in ${selectedYear}: <b>${consumption_Txt[index]}</b> `);

		const chart_data = [{
			type: 'choropleth',
			locations: locationLst,
			z: consumptionLst_Scaled,

			// Making no data object different color, concept from https://community.plotly.com/t/visually-marking-numpys-nan-as-grey/17007/2
			colorscale: chart2_colorScale,
			
			marker: {
				line: {
					color: 'rgb(255,255,255)',
					width: 0.3
				}
			},
			
			// Hide the colorbar and create a new one by myself
			showscale: false, 
			text: hover_Text,
			hovertemplate: '%{text}<br><extra></extra>',
			hoverlabel: {
				bgcolor: "#212121"
			}
		}];

		const chart_layout = {
			font: {
				family: 'Open Sans',
				color: '#EAEAEA'
			},
			geo: {
				showframe: false,
				bgcolor: 'rgba(0,0,0,0)',
				projection: { type: 'mercator' },
				lataxis: { range: [-3, 90] }
			},
			margin: {
				l: 0,
				r: 0,
				b: 30,
				t: 100
			},
			responsive: true,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			dragmode: false
		};

		Plotly.newPlot(plotDiv, chart_data, chart_layout);
	});
}





/* Additional chart */
const isHover = e => e.parentElement.querySelector(':hover') === e;
const seafoodConsumptionPlot = document.querySelector('#seafood-demand > .plotly-container > .plot');
const trendPlot = document.getElementById('trend-plot');
document.addEventListener('mousemove', function checkHover() {
	// Check if the chart is hovered https://stackoverflow.com/questions/14795099/pure-javascript-to-check-if-something-has-hover-without-setting-on-mouseover-ou
	if (isHover(seafoodConsumptionPlot)) {
		const hoverTemplate = document.querySelector('.hovertext > .nums');
		
		// If any country is hovered and the hover template is showing, create a new chart that shows the country consumption trend
		if (hoverTemplate != null) {
			var country = hoverTemplate.firstChild.innerHTML.split(': ')[1];
			var reverse = hoverTemplate.firstChild.getAttribute("x") < 0;
			trendPlot.style.display = "block";
			consumptionTrend(country, reverse);
		} else {
			trendPlot.style.display = "none";
		}
	} else {
		if (trendPlot.style.display != "none") {
			trendPlot.style.display = "none";
		}
	}
});

function consumptionTrend(selectedCountry, reverse) {
	const plotDiv = document.getElementById('trend-plot');
	const hoverTemplate = document.querySelector('.hovertext');

	// Get the hover template position https://stackoverflow.com/questions/294250/how-do-i-retrieve-an-html-elements-actual-width-and-height
	var width = hoverTemplate.getBoundingClientRect().width;
	var height = hoverTemplate.getBoundingClientRect().height;
	var transform = hoverTemplate.getAttribute("transform");

	// Extract numeric values using regular expressions https://stackoverflow.com/questions/1183903/regex-using-javascript-to-return-just-numbers
	var regex = /-?\d+\.?\d*/g;
	var matches = transform.match(regex);
	var x = parseFloat(matches[0]);
	var y = parseFloat(matches[1]);

	// Set the size of the plot
	plotDiv.style.width = width + "px";
	if (reverse) plotDiv.style.left = x - width + "px";
	else plotDiv.style.left = x + "px";
	plotDiv.style.top = y + height + "px";

	const country = seafoodConsumtionTrend[0];
	const year = seafoodConsumtionTrend[1];
	const consumption = seafoodConsumtionTrend[2];

	let trendLst = [];
	for (var i = 0; i < country.length; i++) {
		if (country[i] == selectedCountry) {
			trendLst.push([parseInt(year[i]), consumption[i]])
		}
	}

	// Sorting the trendLst by the year in descending order (from 1990 to 2020)
	trendLst.sort((a, b) => {
        if (a[0] > b[0]) return 1; 
        else return -1;
    });

	const yearLst = [];
	const consumptionLst = [];
	trendLst.forEach(element => {
		yearLst.push(element[0]);
		consumptionLst.push(element[1]);
	});

	const chart_data = [{
		x: yearLst,
		y: consumptionLst,
		mode: 'lines'
	}];

	const chart_layout = {
		showlegend: false,
		title: {
			font: { family: "Open Sans", size: 12, color: "#8E8E8E" },
			text: `${selectedCountry} seafood<br>consumption per capita (kg)`,
			y: 0.9,
		},
		xaxis: {
			type: 'category',
			gridcolor: 'rgba(0,0,0,0)',
			color: "#8E8E8E"
		},
		yaxis: {
			constrain: "domain",
			zerolinecolor: '#454545',
			gridcolor: 'rgba(0,0,0,0.3)',
			color: "#8E8E8E"
		},
		margin: {
			t: 60,
			l: 40,
			b: 60,
			r: 20,
			pad: 10
		},
		paper_bgcolor: '#212121',
		plot_bgcolor: '#212121',
		dragmode: false
	};

	const config = {
		displayModeBar: false
	};

	Plotly.newPlot(plotDiv, chart_data, chart_layout, config);
}





/* Sub functions */
const mpwDivision = [0, 500, 1000, 3000, 5000, 10000, 20000, 30000, 50000, 70000, 100000, 300000];
const mpwColorbar = ['#a1d6ff', '#7FB057', '#20a12b', '#107400', '#E2C768', '#ED993D', '#FF8500', '#FCDD2B', '#D74848', '#FA1717', '#b5006a', '#740090'];
const chart1_colorbar = document.querySelector("#problem-cause > .plot-colorbar");
const chart1_colorbarLst = document.querySelectorAll("#problem-cause > .plot-colorbar > span");
let chart1_colorScale = [];

const seafoodDivision = [0, 5, 10, 20, 30, 40, 50, 60, 80];
const seafoodColorbar = ['#f5ece4','#e8ee90','#ddc798','#90ee90','#42bff5','#0099cc','#1e90ff','#24478f','#142952'];
const chart2_colorbar = document.querySelector("#seafood-demand > .plot-colorbar");
const chart2_colorbarLst = document.querySelectorAll("#seafood-demand > .plot-colorbar > span");
let chart2_colorScale = [];

function scaleColorbar(lst, division) {
	// A function to rescale the divison of the countries
	var newLst = [];
	lst.forEach(element => {
		var scaledElement = -1;

		for (var i = 0; i < division.length; i++) {
			var index = division.length - 1 - i;
			if (element >= division[index]) {
				if (index == 0) scaledElement = 1;
				else scaledElement = division[index];
				break;
			}
		}

		newLst.push(scaledElement);
	});

	return (newLst);
}

function colorBarHover(colorBarContainer) {
	// Only color the countries that match user hover selection from the colorbar
	var colorBarLst = colorBarContainer.childNodes;

	for (var i = 0; i < colorBarLst.length; i++) {
		// Check if matches user hover element https://stackoverflow.com/questions/14795099/pure-javascript-to-check-if-something-has-hover-without-setting-on-mouseover-ou
		if (colorBarLst[i].matches(':hover')) {
			// Return the index of the hovered element
			return i;
		}
	}
}

var chart1_selectedLst = [];
var chart2_selectedLst = [];
function colorBarSelected(colorBarContainer, chartNum, selected) {
	var colorBarLst = colorBarContainer.childNodes;

	var lst = [];
	if (chartNum == 1) lst = chart1_selectedLst;
	else lst = chart2_selectedLst;

	// When the user clicks the ocean
	if (selected == null && lst.length > 0) {
		colorBarLst.forEach(element => {element.removeAttribute("class");});
		if (chartNum == 1) chart1_selectedLst = [];
		else chart2_selectedLst = [];
	} else {
		for (var i = 0; i < colorBarLst.length; i++) {	
			if (selected == colorBarLst[i]) {
				if (selected.getAttribute("class") == "chart-selected") {
					// Remove specific element from array https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array-in-javascript
					if (chartNum == 1) chart1_selectedLst.splice(chart1_selectedLst.indexOf(i), 1);
					else chart2_selectedLst.splice(chart2_selectedLst.indexOf(i), 1);
					selected.removeAttribute("class");
				} else {
					if (chartNum == 1) chart1_selectedLst.push(i);
					else chart2_selectedLst.push(i);
					selected.setAttribute("class", "chart-selected");
				}
				break;
			}
		}
	}

	setColorScale();
	plasticPollution();
	yearIndicator();
}

function setColorScale() {
	chart1_colorScale = generateColorScale(mpwDivision, mpwColorbar, null, chart1_selectedLst);
    chart2_colorScale = generateColorScale(seafoodDivision, seafoodColorbar, null, chart2_selectedLst);
}

function generateColorScale(division, colorLst, hover, selectedLst) {
	// By testing different colorscale setting, I found that plotly colorscale are scaled based on the (provided number : max number) => which means 100:300000 = 0.000333
	// Thus, I can simply use the array of [0.0000034, #fff] to set the colorscale of country that has 1 tons mpw
	var colorScale = [];

	// To make the colorscale array valid, I have to start from small number (0.000000001) to big number (1)
	var lastPercent = 0.000000000001;

	// Setting a dark grey color for countries that have no data (-1)
	// The starting position of the color: 0
	colorScale.push([0, 'rgb(30, 30, 30)']);

	// The ending position of the color: lastPercent
	colorScale.push([lastPercent, 'rgb(30, 30, 30)']);

	for (var i = 0; i < division.length; i++) {
		var colorCode = 'rgb(30, 30, 30)';

		// If the no group has been hovered / selected, color all countries with their associated group
		// Or if user has hovered / selected any group, only color the countries within that group
		if ((hover == null && selectedLst.length == 0) || i == hover) colorCode = colorLst[i];
		else if (selectedLst.includes(i)) colorCode = colorLst[i];

		// Normalising the number to get the percentage
		var percent = norm(division[i], -1, division[division.length - 1]);

		// To ensure all the countries that have very little MPW being included
		// When the color scale is too samll, plotly can't compile it correctly https://community.plotly.com/t/colorscale-inaccurate/5702
		if (i == 0) { percent = 1 / division[division.length - 1] * 2; }

		// A function to ensure that the percent is greater than the actual
		percent = addDecimal(percent);

		colorScale.push([lastPercent, colorCode]);
		colorScale.push([percent, colorCode]);

		lastPercent = percent;
	}

	return colorScale;
}





var checkboxGenerated = false;
function generateCheckbox(lst, num, colorGroup) {
	// Generate checkboxs for each animal group and color them with their color on the plot
	const container = document.querySelector(".checkbox-container");
	for (var i = 0; i < lst.length; i += num) {
		let parent = document.createElement("div");

		let checkbox = document.createElement("div");
		checkbox.setAttribute("class", "checkbox");
		checkbox.style.color = colorGroup[i / num];
		parent.appendChild(checkbox);

		let input = document.createElement("input");
		input.setAttribute("type", "checkbox");
		input.setAttribute("name", lst[i]);
		input.setAttribute("value", i / num);
		input.checked = true;
		checkbox.appendChild(input);

		let label = document.createElement("label");
		label.setAttribute("for", lst[i]);
		label.innerText = lst[i];
		checkbox.appendChild(label);

		input.onchange = threatenedSpecies;
		container.appendChild(parent);
	}

	// Stop generating new checkbox when building the plot
	checkboxGenerated = true;
}






var addedMissedData = false;
let seafoodConsumptionData = []; // Main data to show through different year
let seafoodConsumtionTrend = []; // Additional data to show the trend line when hover specific country
function addMissedData(data) {
	// Add back the countries that have data in any year but not all from 1990 to 2020
	var country = unpack(data, 'Entity');
	var location = unpack(data, 'Code');
	var year = unpack(data, 'Year');
	var consumption = unpack(data, 'Consumption');
	var consumptionNull = unpack(data, 'Consumption');

	var dataRow = country.length;
	var preCountry = "";
	var preYear = "";
	for (var i = 0; i < dataRow; i++) {
		if (country[i] != preCountry) {
			// New country found
			preCountry = country[i];

			// Check whether the last row of previous country is 2020
			if (i != 0 && preYear != 2020) {
				// If the previous year is not 2020, add missed data until 2020
				var missedYear = year[i-1];
				while(missedYear < 2020) {
					missedYear += 1;
					country.push(country[i-1]);
					location.push(location[i-1]);
					year.push(missedYear);
					consumption.push(-1);
					consumptionNull.push(null);
				}
			}

			// Check whether this starting row is started with 1990
			if (year[i] != 1990) {
				// If the previous year is not 2020, add missed data until 2020
				var missedYear = 1990;
				while(missedYear < year[i]) {
					country.push(country[i]);
					location.push(location[i]);
					year.push(missedYear);
					consumption.push(-1);
					consumptionNull.push(null);
					missedYear += 1;
				}
			}
		}
	}

	addedMissedData = true;
	seafoodConsumptionData = [country, location, year, consumption];
	seafoodConsumtionTrend = [country, year, consumptionNull];
}