const unpack = (data, key) => data.map(row => row[key]);

function buildPlots () {
	plasticPollution();
	threatenedSpecies();
	marineSpeciesPopulation();
	seafoodConsumption(2020);
}

function plasticPollution() {
    Plotly.d3.csv("csv/plastic-pollution.csv", data => {
        const plotDiv = document.querySelector('#problem-cause > .plot');
    
        const country = unpack(data, 'Entity');
        const location = unpack(data, 'Code');
        const mpw = unpack(data, 'MPW');

		// As the amount of MPW of Philippines is too high and skews the charge, scaling it down for better visualisation would help 
		var mpw_Scaled = [];

		// Create custom hover text to fix the null data text
		var mpw_Txt = [];
        
		mpw.forEach(element => {
			var new_Mpw = element;
			var txt = "No data found";

			if (element > 0) txt = element + " (tons)";
            if (element > 10000) new_Mpw = 10999;

            mpw_Scaled.push(new_Mpw);
			mpw_Txt.push(txt);
        });

		const hover_Text = country.map((name, index) => `Country: ${name} <br>MPW released into oceans: ${mpw_Txt[index]}`);

        const chart_data = [{
            type: 'choropleth',
            locations: location,
            z: mpw_Scaled,
    
			// Making no data object different color, concept from https://community.plotly.com/t/visually-marking-numpys-nan-as-grey/17007/2
            colorscale: [
                [0, 'rgb(30, 30, 30)'],
				[0.001, 'rgb(30, 30, 30)'],
				[0.001, 'rgb(12, 242, 58)'],
                [0.05, 'rgb(255, 228, 23)'],
                [0.7, 'rgb(255, 102, 0)'],
                [1, 'rgb(255, 0, 0)']
            ],
            colorbar: {
                autotic: false,
                ticksuffix: ' (tons)'
            },
            marker: {
                line:{
                    color: 'rgb(255,255,255)',
                    width: 0.3
                }
            },
            
            text: hover_Text,
            hovertemplate: '%{text}<extra></extra>',
        }];
    
        const chart_layout = {
            width: 1440,
            height: 800,
            title: {
                font: {family: "Open Sans" , size: 24, color: "#8E8E8E"},
                text: 'Amount of mismanaged plastic waste emitted to the ocean (2021)',
            },
            font: {
                family: 'Courier New, monospace',
                color: '#EAEAEA'
            },
            geo:{
                showframe: false,
                bgcolor: 'rgba(0,0,0,0)',
                projection:{type: 'mercator'},
                lataxis: {range: [-3, 90]} // hide Antartica as it has no data to show, this allows users to focus on the main objects
            },
            margin: {
                l: 0,
                r: 0,
                b: 30,
                t: 100
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            dragmode: false // fix the plot to disable default scroll / drag movement (users can still do so by using the pan function)
        };
    
        Plotly.newPlot(plotDiv, chart_data, chart_layout);
    });
}

function threatenedSpecies(skipLst) {
    Plotly.d3.csv("csv/number-species-threatened.csv", data => {
        const plotDiv = document.querySelector('#threaten-species > .plot');

        const group = unpack(data, 'Entity');
        const year = unpack(data, 'Year');
        const number = unpack(data, 'Number');
    
        const hover_Text = group.map((name, index) => `Animal Group: ${name} <br>Number of threatened species: ${number[index]}`);

		const colorGroup = ['rgb(255, 99, 132)','rgb(54, 162, 235)','rgb(153, 50, 204)','rgb(128, 0, 0)','rgb(153, 102, 255)','rgb(255, 159, 64)','rgb(255, 192, 203)','rgb(135, 206, 235)','rgb(255, 215, 0)'];
		var chart_data = [];

		for (var i = 0; i < group.length; i += 3) {
			// Check any animal group is deselected
			if (skipLst != null && skipLst.includes(i/3)) continue;

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
				}
			};

			// Idea inspired by http://www.java2s.com/example/javascript/chart.js/line-chart-with-partial-dashed-line.html
			// Create dash line for prediction https://plotly.com/javascript/line-charts/
			var tracePrediction = {
				x: [2023, 2024],
				y: [prediction[0], prediction[1]],
				mode: 'lines',
				name: group[i] + "(Prediction)",
				line: {
					dash: 'dot',
					color: colorGroup[i / 3]
				}
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
			width: 1440,
            height: 600,
            title: {
                font: {family: "Open Sans" , size: 18, color: "#8E8E8E"},
                text: 'Number of species threatened with extinction (Animals)',
            },
            font: {
                family: 'Courier New, monospace',
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
			showlegend: false,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
        };
      
        Plotly.newPlot(plotDiv, chart_data, chart_layout);
    } )
}

function marineSpeciesPopulation() {
    Plotly.d3.csv("csv/threaten-marine-species.csv", data => {
        const plotDiv = document.querySelector('#population-trend > div > .plot');
        let col = ['rgba(223, 46, 56, 1)', 'rgba(223, 46, 56, .45)', 'rgba(223, 46, 56, .35)'];
		
		const trend = unpack(data, 'Trend');
        const number = unpack(data, 'Number');
        for (let i = 0; i < number.length; i++){ number[i] = parseInt(number[i]);}
		
        var chart_data = [{
			labels: trend,
			values: number,
		
			textinfo: "label+percent",
		
			// Follow the design pattern used in tutorial task 2: https://community.plotly.com/t/plotly-pie-chart-order-of-slices/35484
			direction: 'clockwise',
			sort: false,
			
			marker: {colors: col},
			hole: .5,
			type: 'pie'
        }]
      
        var chart_layout = {
            title: {
                font: {family: "Open Sans" , size: 18, color: "#8E8E8E"},
                text: 'Marine species threatened by waste pollution <br> (Population trend)',
            },
            font: {
                family: 'Courier New, monospace',
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
			height: 550,
			width: 550,
			showlegend: false,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			margin: {t: 150, l: 150},
        };
      
        Plotly.newPlot(plotDiv, chart_data, chart_layout);
    } )
}

function seafoodConsumption(selectedYear) {
    Plotly.d3.csv("csv/seafood-consumption.csv", data => {
        const plotDiv = document.querySelector('#seafood-demand > .plot');
    
        const country = unpack(data, 'Entity');
        const location = unpack(data, 'Code');
		const year = unpack(data, 'Year');
        const consumption = unpack(data, 'Consumption');
    
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
			var txt = "No data found";
			var scaled_Value = element;

			// Round to two decimal places https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
			if (element > 0) txt = Math.round(element * 100) / 100 + " (kg)";
			if (element > 80) scaled_Value = 89;
			
			consumptionLst_Scaled.push(scaled_Value);
			consumption_Txt.push(txt);
        });

		// Fix the min value of the consumptionLst
		consumptionLst_Scaled.push(-1);

		const hover_Text = countryLst.map((name, index) => `Country: ${name} <br>Consumption per capita in ${selectedYear}: ${consumption_Txt[index]}`);

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
                line:{
                    color: 'rgb(255,255,255)',
                    width: 0.3
                }
            },
            
            text: hover_Text,
            hovertemplate: '%{text}<extra></extra>',
        }];
    
        const chart_layout = {
            width: 1440,
            height: 800,
            title: {
                font: {family: "Open Sans" , size: 24, color: "#8E8E8E"},
                text: 'Global fish & seafood consumption per capita from 1990 to 2020',
            },
            font: {
                family: 'Courier New, monospace',
                color: '#EAEAEA'
            },
            geo:{
                showframe: false,
                bgcolor: 'rgba(0,0,0,0)',
                projection:{type: 'mercator'},
                lataxis: {range: [-3, 90]} // hide Antartica as it has no data to show, this allows users to focus on the main objects
            },
            margin: {
                l: 0,
                r: 0,
                b: 30,
                t: 100
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            dragmode: false // fix the plot to disable default scroll / drag movement (users can still do so by using the pan function)
        };
    
        Plotly.newPlot(plotDiv, chart_data, chart_layout);
    });
}

// Linear regression function that predicts the amount of threaten species 
// Code was taken from https://stackoverflow.com/questions/6195335/linear-regression-in-javascript
// Concept was learn from https://oliverjumpertz.com/simple-linear-regression-theory-math-and-implementation-in-javascript/
function linearRegression(y,x){
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
		sum_xy += (x[i]*y[i]);
		sum_xx += (x[i]*x[i]);
		sum_yy += (y[i]*y[i]);
	} 

	lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
	lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
	lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);

	return lr;
}
//     const plotDiv = document.querySelector('#problem-cause > .plot');

//     const country = unpack(data, 'Entity');
//     const location = unpack(data, 'Code');
//     const electricity = unpack(data, 'Electricity');

//     const electricity_Scaled = [];
//     const hover_Text = country.map((name, index) => `Country: ${name} <br>Solar electricity: ${electricity[index]} (TWh)`);

//     electricity.forEach(element => {
//         if (element > 60) element = 69;
//         electricity_Scaled.push(element);
//     });

//     const chart_data = [{
//         x: mfr_x,
//         y: mfr_y,
//         type: 'bar',
//         marker: {color: mfr_color},
//         transforms: [{
//             type: 'sort',
//             target: 'y',
//             order: 'descending'
//         }],
    
//         text: round(mfr_y, 1).map(String),
//         textposition: 'outside',
//         hoverinfo: 'none'
//     }];
    
//     const chart_layout = {
//         title: 'Which manufacturers manufacture healthier cereals',
//         xaxis: {
//             title: 'Manufacturers'
//         },
//         yaxis: {
//             title: 'Health rating',
//             range: [0, 100],
//         }
//     };

//     Plotly.newPlot(plotDiv, chart_data, chart_layout);
// });