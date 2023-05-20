var checkboxGenerated = false;
const unpack = (data, key) => data.map(row => row[key]);





/* Main functions */
function plasticPollution(colorScale) {
	Plotly.d3.csv("csv/plastic-pollution.csv", data => {
		const plotDiv = document.getElementById('plastic-pollution-plot');

		const country = unpack(data, 'Entity');
		const location = unpack(data, 'Code');
		const mpw = unpack(data, 'MPW');

		// As the amount of MPW of Philippines is too high and skews the charge, scaling it down for better visualisation would help 
		var mpw_Scaled = scaleColorbar(mpw);

		// Create custom hover text to fix the null data text
		var mpw_Txt = [];

		mpw.forEach(element => {
			var txt = "No data";
			if (element > 0) txt = element + " (tons)";
			mpw_Txt.push(txt);
		});

		const hover_Text = country.map((name, index) => ` Country: ${name}<br> MPW released into oceans: <b>${mpw_Txt[index]}</b> `);

		const chart_data = [{
			type: 'choropleth',
			locations: location,
			z: mpw_Scaled,

			// Making no data object different color, concept from https://community.plotly.com/t/visually-marking-numpys-nan-as-grey/17007/2
			colorscale: colorScale,
			marker: {
				line: {
					color: 'rgb(255,255,255)',
					width: 0.3
				}
			},
			showscale: false, // Hide the colorbar and create a new one by myself
			text: hover_Text,
			hovertemplate: '%{text}<extra></extra>',
		}];

		const chart_layout = {
			geo: {
				showframe: false,
				bgcolor: 'rgba(0,0,0,0)',
				projection: { type: 'mercator' },
				lataxis: { range: [-3, 90] } // hide Antartica as it has no data to show, this allows users to focus on the main objects
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
			dragmode: false // fix the plot to disable default scroll / drag movement (users can still do so by using the pan function)
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

		for (var i = 0; i < group.length; i += 3) {
			// Check any animal group is deselected
			if (skipLst != null && skipLst.includes(i / 3)) continue;

			var known_x = [parseInt(year[i]), parseInt(year[i + 1]), parseInt(year[i + 2])];
			var known_y = [parseInt(number[i]), parseInt(number[i + 1]), parseInt(number[i + 2])];
			// console.log(group[i], known_x, known_y);

			var lr = linearRegression(known_y, known_x);
			// console.log(lr.intercept, lr.slope);
			var prediction = []
			prediction.push(Math.round(lr.intercept + lr.slope * 2023));
			prediction.push(Math.round(lr.intercept + lr.slope * 2024));

			var trace = {
				x: [year[i], year[i + 1], year[i + 2]],
				y: [number[i], number[i + 1], number[i + 2]],
				mode: 'lines',
				name: group[i],
				line: {
					color: colorGroup[i / 3]
				},
				
				text: [group[i], group[i], group[i]],
				hovertemplate: ' %{text} threaten species: <b>%{y}</b><extra></extra> ',

				// Change the text color to improve readability https://community.plotly.com/t/change-hover-text-color/28039/8
				hoverlabel: {
					font: {
						color: 'black'
					}
				},
			};

			// Function created by myself but Idea inspired by http://www.java2s.com/example/javascript/chart.js/line-chart-with-partial-dashed-line.html
			// Create dash line for prediction https://plotly.com/javascript/line-charts/
			var tracePrediction = {
				x: [2023, 2024],
				y: [prediction[0], prediction[1]],
				mode: 'lines',
				name: group[i] + " (Prediction)",
				line: {
					dash: 'dot',
					color: colorGroup[i / 3]
				},

				text: [group[i], group[i], group[i]],
				hovertemplate: ' %{text} threaten species <i>(prediction)</i>: <b>%{y}</b><extra></extra> ',

				// Change the text color to improve readability https://community.plotly.com/t/change-hover-text-color/28039/8
				hoverlabel: {
					font: {
						color: '#212121'
					}
				},
			};

			// Connect the orginal trace & prediction trace together
			// Remove the duplicated hover info https://stackoverflow.com/questions/32319619/disable-hover-information-on-trace-plotly
			var traceTransition = {
				x: [year[i + 2], 2023],
				y: [number[i + 2], prediction[0]],
				mode: 'lines',
				line: {
					dash: 'dot',
					color: colorGroup[i / 3]
				},
				hoverinfo: 'skip'
			};

			chart_data.push(trace);
			chart_data.push(tracePrediction);
			chart_data.push(traceTransition);
		}

		var chart_layout = {
			title: {
				font: { family: "Open Sans", size: 18, color: "#8E8E8E" },
				text: 'Number of species threatened with extinction (Animals)',
			},
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
				range: [0, 4500],
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
			dragmode: false // fix the plot to disable default scroll / drag movement (users can still do so by using the pan function)
		};

		Plotly.newPlot(plotDiv, chart_data, chart_layout);

		if (!checkboxGenerated) {
			generateCheckbox(group, colorGroup)
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

		var chart_data = [{
			labels: trend,
			values: number,

			textfont: {
				color: "#fff" // Change the text color to increase readability and accessibility https://community.plotly.com/t/pie-chart-label-colors/10595
			},
			textinfo: "label+percent",

			sort: false,
			hoverinfo: 'none',

			marker: { colors: col },
			hole: .5,
			type: 'pie'
		}]

		var chart_layout = {
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
			displayModeBar: false, // this is the line that hides the bar
		};

		Plotly.newPlot(plotDiv, chart_data, chart_layout, config);
	})
}

function seafoodConsumption(selectedYear) {
	Plotly.d3.csv("csv/seafood-consumption.csv", data => {
		const plotDiv = document.getElementById('seafood-demand-plot');

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

		// Create custom hover text to fix the null data text
		var consumption_Txt = [];

		// Fix the scale of the consumptionLst to avoid scale changes
		var consumptionLst_Scaled = []

		consumptionLst.forEach(element => {
			var txt = "No data";
			var scaled_Value = element;

			// Round to two decimal places https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
			if (element > 0) txt = Math.round(element * 100) / 100 + " (kg)";
			if (element > 80) scaled_Value = 89;

			consumptionLst_Scaled.push(scaled_Value);
			consumption_Txt.push(txt);
		});

		// Fix the min value of the consumptionLst
		consumptionLst_Scaled.push(-1);

		const hover_Text = countryLst.map((name, index) => ` Country: ${name}<br> Consumption per capita in ${selectedYear}: <b>${consumption_Txt[index]}</b> `);

		const chart_data = [{
			type: 'choropleth',
			locations: locationLst,
			z: consumptionLst_Scaled,

			colorscale: [
				[0, 'rgb(30, 30, 30)'],
				[0.001, 'rgb(30, 30, 30)'],
				[0.001, '#ccccff'],
				[0.2, '#0099cc'],
				[0.8, '#24478f'],
				[1, '#142952']
			],
			colorbar: {
				autotic: false,
				ticksuffix: ' (kg)'
			},
			marker: {
				line: {
					color: 'rgb(255,255,255)',
					width: 0.3
				}
			},
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
				lataxis: { range: [-3, 90] } // hide Antartica as it has no data to show, this allows users to focus on the main objects
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
			dragmode: false // fix the plot to disable default scroll / drag movement (users can still do so by using the pan function)
		};

		Plotly.newPlot(plotDiv, chart_data, chart_layout);
	});
}





/* Additional chart */
// function pollutionComparison(data) {
// 	const plotDiv = document.querySelector('#problem-cause > .plot');

// 	var trace1 = {
// 		x: data,
// 		type: 'box',
// 		boxpoints: 'suspectedoutliers'
// 	};

// 	var selectedCountry = {
// 		x: [4.5],
// 		type: 'scatter',
// 		mode: 'markers',
// 		name: 'Specific Point'
// 	};

// 	var chart_data = [trace1, selectedCountry];

// 	var chart_layout = {
// 		title: 'Horizontal Box Plot'
// 	};

// 	Plotly.newPlot(plotDiv, chart_data, chart_layout);
// }

const isHover = e => e.parentElement.querySelector(':hover') === e;
const seafoodConsumptionPlot = document.querySelector('#seafood-demand > .plotly-container > .plot');
const trendPlot = document.getElementById('trend-plot');
document.addEventListener('mousemove', function checkHover() {
	// https://stackoverflow.com/questions/14795099/pure-javascript-to-check-if-something-has-hover-without-setting-on-mouseover-ou
	if (isHover(seafoodConsumptionPlot)) {
		const hoverTemplate = document.querySelector('.hovertext > .nums');
		if (hoverTemplate != null) {
			var country = hoverTemplate.firstChild.innerHTML.split(': ')[1];
			trendPlot.style.display = "block";
			consumptionTrend(country);
		} else {
			trendPlot.style.display = "none";
		}
	} else {
		if (trendPlot.style.display != "none") {
			trendPlot.style.display = "none";
		}
	}
});

function consumptionTrend(selectedCountry) {
	const plotDiv = document.getElementById('trend-plot');
	const hoverTemplate = document.querySelector('.hovertext');

	// https://stackoverflow.com/questions/294250/how-do-i-retrieve-an-html-elements-actual-width-and-height
	var width = hoverTemplate.getBoundingClientRect().width;
	var height = hoverTemplate.getBoundingClientRect().height;
	var transform = hoverTemplate.getAttribute("transform");

	// Extract numeric values using regular expressions https://stackoverflow.com/questions/1183903/regex-using-javascript-to-return-just-numbers
	var regex = /-?\d+\.?\d*/g;
	var matches = transform.match(regex);
	var x = parseFloat(matches[0]);
	var y = parseFloat(matches[1]);

	plotDiv.style.width = width + "px";
	plotDiv.style.left = x + "px";
	plotDiv.style.top = y + height + "px";
	
	Plotly.d3.csv("csv/seafood-consumption.csv", data => {
		const plotDiv = document.getElementById('trend-plot');

		const country = unpack(data, 'Entity');
		const year = unpack(data, 'Year');
		const consumption = unpack(data, 'Consumption');

		const yearLst = [];
		const consumptionLst = [];
		for (var i = 0; i < country.length; i++) {
			if (country[i] == selectedCountry) {
				yearLst.push(year[i]);
				consumptionLst.push(consumption[i]);
			}
		}

		var chart_data = [{
			x: yearLst,
			y: consumptionLst,
			mode: 'lines'
		}];

		var chart_layout = {
			showlegend: false,
			title: {
				font: { family: "Open Sans", size: 12, color: "#8E8E8E" },
				text: `${selectedCountry} seafood<br>consumption per capita (kg)`,
				y: 0.9,
			},
			xaxis: {
				// Avoid the year be treated as number https://community.plotly.com/t/use-a-list-of-number-string-as-xaxis/18876/3
				type: 'category',
				gridcolor: 'rgba(0,0,0,0)',
				color: "#8E8E8E"
			},
			yaxis: {
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
			dragmode: false // fix the plot to disable default scroll / drag movement (users can still do so by using the pan function)
		};

		const config = {
			displayModeBar: false, // this is the line that hides the bar
		};

		Plotly.newPlot(plotDiv, chart_data, chart_layout, config);
	})
}



/* Sub functions */
const mpwMax = [300000, 100000, 70000, 50000, 30000, 20000, 10000, 5000, 3000, 1000, 500, 1];
const colorbarContainer = document.getElementById("plot-colorbar");
const mpwColorbar = ['#107400', '#0CF23A', '#7FB057', '#98F97D', '#E2C768', '#FCDD2B', '#ED993D', '#FF8500', '#D74848', '#FA1717', '#AC4AB5', '#740090'];
function scaleColorbar(mpw) {
	var mpwLst = [];
	mpw.forEach(element => {
		var new_Mpw = -1;

		for (var i = 0; i < mpwMax.length; i++) {
			if (element >= mpwMax[i]) {
				new_Mpw = mpwMax[i];
				break;
			}
		}

		mpwLst.push(new_Mpw);
	});

	return (mpwLst);
}

function generateColorScale(selected) {
	// By testing different colorscale setting, I found that plotly colorscale are scaled based on the (provided number : max number) => which means 100:300000 = 0.000333
	// Thus, I can simply use the array of [0.0000034, #fff] to set the colorscale of country that has 1 tons mpw
	var colorScale = [];

	// To make the colorscale array valid, I have to start from small number (0.1) to big number (1)
	var lastPercent = 0.00000001;

	// Setting a dark grey color for countries that have no data (-1)
	colorScale.push([0, 'rgb(30, 30, 30)']);
	colorScale.push([lastPercent, 'rgb(30, 30, 30)']);

	for (var i = mpwMax.length - 1; i >= 0; i--) {
		var index = mpwMax.length - 1 - i;
		var colorCode = 'rgb(30, 30, 30)';

		if (selected == null || index == selected) colorCode = mpwColorbar[index];

		var percent = mpwMax[i] / mpwMax[0];

		if (i == (mpwMax.length - 1)) { percent *= 2; }

		// A function to ensure that the percent is actually greater than the actual
		percent = addDecimal(percent);

		colorScale.push([lastPercent, colorCode]);
		colorScale.push([percent, colorCode]);
		lastPercent = percent;
	}

	// console.log(colorScale);
	return colorScale;
}

function addDecimal(num) {
	if (num >= 1) return num;

	const decimal = num.toString().split('.')[1] || '';
	const decimalPlaces = decimal.length;

	// Formula created by myself but Concept inspired by https://www.tutorialspoint.com/How-can-I-round-a-number-to-1-decimal-place-in-JavaScript
	// Avoid no digit after the first digit
	const numStr = num.toFixed(decimalPlaces + 1).toString().split(".")[1].split("");
	var newNum = [0, "."];
	for (var i = 0; i < numStr.length; i++) {
		// First digit find
		if (numStr[i] != "0") {
			// Check whether it will adds up more than 9
			if (numStr[i + 1] == 9) {
				if (numStr[i] == 9) {
					newNum[i - 1] = 1;
					break
				} else {
					newNum.push(parseInt(numStr[i]) + 1);
					break
				}
			}

			newNum.push(parseInt(numStr[i]));
			newNum.push(parseInt(numStr[i + 1]) + 1);
			break;
		} else {
			newNum.push(0);
		}
	}

	return newNum.join("");
}

function numAbbr(num) {
	// Formula created by myself but inspired by https://stackoverflow.com/questions/2685911/is-there-a-way-to-round-numbers-into-a-reader-friendly-format-e-g-1-1k
	var numSplit = num.toString().split('');
	var newNum = [];

	if (numSplit.length > 3 && numSplit.length < 7) {
		for (var i = 0; i < numSplit.length - 3; i++) newNum.push(numSplit[i]);
		return newNum.join("") + "k";
	} else {
		return num;
	}
}

generateColorbar();
function generateColorbar() {
	for (var i = 0; i < mpwColorbar.length; i++) {
		var num = i;
		var color = document.createElement("span");
		color.style.backgroundColor = mpwColorbar[i];

		// Hover effect to focus -> Inspired by https://ourworldindata.org/plastic-pollution#
		// Onmouseover & onmouseout https://www.w3schools.com/jsref/event_onmouseover.asp
		color.onmouseover = highlightPlot;
		color.onmouseout = highlightPlot;
		colorbarContainer.appendChild(color);

		var txt = document.createElement("p");
		txt.innerText = numAbbr(mpwMax[mpwMax.length - 1 - i]) + " (tons)";
		color.appendChild(txt);
	}
}

function highlightPlot() {
	const colorBarLst = document.querySelectorAll("#plot-colorbar > span");
	for (var i = 0; i < colorBarLst.length; i++) {
		// Check if matches https://stackoverflow.com/questions/14795099/pure-javascript-to-check-if-something-has-hover-without-setting-on-mouseover-ou
		if (colorBarLst[i].matches(':hover')) {
			plasticPollution(generateColorScale(i));
			return;
		}
	}

	plasticPollution(generateColorScale());
}

// Linear regression function that predicts the amount of threaten species 
// Code was taken from https://stackoverflow.com/questions/6195335/linear-regression-in-javascript
// Concept was learn from https://oliverjumpertz.com/simple-linear-regression-theory-math-and-implementation-in-javascript/
function linearRegression(y, x) {
	var lr = {};
	var n = y.length;
	var sum_x = 0;
	var sum_y = 0;
	var sum_xy = 0;
	var sum_xx = 0;
	var sum_yy = 0;

	for (var i = 0; i < y.length; i++) {

		sum_x += x[i];
		sum_y += y[i];
		sum_xy += (x[i] * y[i]);
		sum_xx += (x[i] * x[i]);
		sum_yy += (y[i] * y[i]);
	}

	lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
	lr['intercept'] = (sum_y - lr.slope * sum_x) / n;
	lr['r2'] = Math.pow((n * sum_xy - sum_x * sum_y) / Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)), 2);

	return lr;
}

function generateCheckbox(lst, colorGroup) {
	const container = document.querySelector(".checkbox-container");
	for (var i = 0; i < lst.length; i += 3) {
		let parent = document.createElement("div");

		let checkbox = document.createElement("div");
		checkbox.setAttribute("class", "checkbox");
		checkbox.style.color = colorGroup[i / 3];
		parent.appendChild(checkbox);

		let input = document.createElement("input");
		input.setAttribute("type", "checkbox");
		input.setAttribute("name", lst[i]);
		input.setAttribute("value", i / 3);
		input.checked = true;
		checkbox.appendChild(input);

		let label = document.createElement("label");
		label.setAttribute("for", lst[i]);
		label.innerText = lst[i];
		checkbox.appendChild(label);

		input.onchange = threatenedSpecies;
		container.appendChild(parent);
	}
	checkboxGenerated = true;
}

var addedMissedData = false;
let seafoodConsumptionData = [];
function addMissedData(data) {
	var country = unpack(data, 'Entity');
	var location = unpack(data, 'Code');
	var year = unpack(data, 'Year');
	var consumption = unpack(data, 'Consumption');

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
					missedYear += 1;
				}
			}
		}
	}

	addedMissedData = true;
	seafoodConsumptionData = [country, location, year, consumption];
}