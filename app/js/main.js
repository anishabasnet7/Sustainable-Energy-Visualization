import { draw_overall_co2_timeseries, draw_top10_co2_emiters } from './dashboard_1.js';
import { draw_germany_renewables_timeseries } from './dashboard_2.js';
import { draw_correlation_scatter } from './dashboard_3.js';
import { electricity_vs_cleancooking } from "./dashboard_4.js";
import { draw_fossil_vs_lowcarbon } from "./dashboard_5.js";

let selectedD4Year = 2020;
let selectedD5Year = 2020;
let selectedD5Country = null;
let currentMapMode = "none"; 
let currentMapYear = 2020;
const DATA_PATH = '../../data/processed_data.csv';

const dashboardConfigs = {
    // 'dashboard-home': {
    //     title: 'Global Energy: Spatial Overview',
    //     explanationTitle: 'Project Introduction',
    //     explanation: `<p class="text-lg">Select a dashboard (user story) from the dropdown above to view the analysis.</p>`,
    //     charts: [
    //         { 
    //             title: 'Atlas Map', 
    //             drawFunction: (path, id) => draw_landing_map(path, id, currentMapMode, currentMapYear), 
    //             data_path: DATA_PATH 
    //         }
    //     ]
    // },
    'dashboard-1': {
        title: 'Overall CO2 Emission Trend (2000-2019)',
        explanationTitle: 'Analysis and Interpretation: Line Chart & Bar Chart',
        explanation: `<p>Based on the two charts, global COsub>2</sub> emissions steadily increased from 2000 to 2019. 
                In 2000, total emissions were about 9 billion tons, and by 2019 they had risen sharply to around 22 billion tons. 
                This shows a strong and continuous upward trend over the years. China is the largest contributor to CO₂ emissions. 
                Its emissions are much higher than any other country, appearing to be about four times larger than the next highest country in the chart. 
                The United States and India are the next biggest contributors, followed by other countries such as Japan, Indonesia, Brazil, and Germany.</p>`,
        charts: [
            { title: 'User Story1: Overall CO2 Emission (kT x 1e6) Trend 2000-2019', 
                drawFunction: draw_overall_co2_timeseries, 
                data_path: DATA_PATH 
            },
            { title: 'User Story1: Top 10 Countris of CO2 Emission (kT x 1e6) 2000-2019',
                drawFunction: draw_top10_co2_emiters, 
                data_path: DATA_PATH }
        ]
    },
    'dashboard-2': {
        title: 'Trend of Electricity Generation from Renewable Sources',
        explanationTitle: 'Analysis and Interpretation: Line Chart',
        explanation: `<p>  The chart shows that renewable energy in Germany increased steadily in the first two decades of the 21st century, with the biggest growth happening in the later years. 
                At the start, renewable electricity generation was low, at about 35–40 TWh. By 2020, it had increased sharply to around 250 TWh. </p>`,
        charts: [{ title: 'User Story2: Trend of Electricity Generation from Renewable Sources in Germany', 
            drawFunction: draw_germany_renewables_timeseries, 
            data_path: DATA_PATH }]
    },
    'dashboard-3': {
        title: 'Correlation of Energy consumption per capita vs GDP per capita',
        explanationTitle: 'Correlation of Energy consumption per capita vs GDP per capita',
        explanation: `<p> The scatter plot shows the relationship between average GDP per person (x-axis) and average energy use per person (y-axis). 
                The chart shows a clear pattern: as a country becomes richer, people tend to use more energy. 
                Countries with very low GDP per person (below $1,000) use very little energy. 
                As countries become middle- and high-income nations, energy use increases quickly. 
                This is because of more factories, better infrastructure, and higher living standards. 
                However, among rich countries, the data points are more spread out. 
                Some wealthy countries use a lot of energy because of large industries or cold climates, while others use less energy even with high GDP. 
                This suggests that some countries are more energy-efficient than others.</p>`,
        charts: [{ title: 'User Story3: Correlation of Energy consumption per capita vs GDP per capita',
            drawFunction: draw_correlation_scatter, 
            data_path: DATA_PATH }]
    },
   'dashboard-4': {
        title: 'Access Gap (GDP ≤ 2000)',
        explanationTitle: 'Jane Doe\'s Analysis: Clean Cooking vs Electricity',
        explanation: `
        <p>
        This map display the countries with GDP greater than 2000 using d3.interpolateBlues and countries with lower GDP are outlined with a border stroke. 
        Initially, the secondary visuals show a country with lowest GDP of that year, and when a country is selected, its specific data diagrams are displayed. 
        The accompanying line chart shows trend over the years to compare energy access over time.
        </p>`,
        charts: [
            { title: 'GDP Interactive Map (Click a country)', 
                drawFunction: (path, id) => electricity_vs_cleancooking(path, id), 
                data_path: DATA_PATH }
        ]
    },
    'dashboard-5': {
    title: 'Energy: Fossil vs Renewable Energy',
    explanationTitle: 'John Smith\'s Analysis',
    explanation: 
    `<p>
    Select a country from the map and use the slider to change the year. The chart will show a comparison between energy sources.
    Sky / cornflower blue (#67acd4) represent fossil fuels and light pastel / baby blue (#a5cce5) represent low-carbon energy (renewables + nuclear). 
    By default, chart display Top 10 Leaders— greenest countries in low-carbon energy share. 
    When a country on the map is clicked, that specific country is added to the list, allowing users to compare its energy with the default Top 10.
    </p>`,
    charts: [
        { 
            title: 'Percentage of Renewable Energy Interactive Map (Click a country)', 
            drawFunction: (path, id) => draw_interactive_atlas_d5(path, id), 
            data_path: DATA_PATH 
        },
        { 
            title: 'Comparison on Greenest', 
            drawFunction: (path, id) => draw_fossil_vs_lowcarbon(path, id, selectedD5Year, selectedD5Country), 
            data_path: DATA_PATH 
        }
    ]
},
    
};

/* Clear UI slots before loading new chart */
function resetChartSlots() {
    const d4Controls = document.getElementById('dashboard-4-extra-controls');
    const d5Controls = document.getElementById('dashboard-5-extra-controls');
    if (d4Controls) d4Controls.classList.add('hidden');
    if (d5Controls) d5Controls.classList.add('hidden');
    if(document.getElementById('poor-country-count')) document.getElementById('poor-country-count').textContent = "0";
    if(document.getElementById('selected-country-5')) document.getElementById('selected-country-5').textContent = "Global Top 10";
    for (let i = 1; i <= 5; i++) {
        const slot = document.getElementById(`chart-slot-${i}`);
        const title = document.getElementById(`title-slot-${i}`);
        const svg = d3.select(`#svg-slot-${i}`);
        if (slot) {
            slot.classList.add('hidden');
        }
        if (title) {
            title.textContent = ""; 
        }
        if (svg) {
            svg.selectAll("*").remove();
        }
    }
}

/* Main function to load dashboard */
function loadDashboard(id) {
    const config = dashboardConfigs[id] || dashboardConfigs['dashboard-1'];
    
    document.getElementById('viz-panel-title').textContent = config.title;
    document.getElementById('viz-explanation-title').textContent = config.explanationTitle;
    document.getElementById('viz-explanation-text').innerHTML = config.explanation;

    resetChartSlots(); 

    // Handle Dashboard 4 Slider Visibility
    const d4Controls = document.getElementById('dashboard-4-extra-controls');
    if (id === 'dashboard-4') {
        d4Controls.classList.remove('hidden');
        document.getElementById('year-slider').oninput = function() {
            selectedD4Year = +this.value;
            document.getElementById('year-display').textContent = selectedD4Year;
            // Update the dashboard without reloading everything
            electricity_vs_cleancooking(DATA_PATH, "#svg-slot-1", selectedD4Year);
        };
    } else {
        d4Controls.classList.add('hidden');
    }    

// Handle Dashboard 5 Slider Visibility
const d5Controls = document.getElementById('dashboard-5-extra-controls');
if (id === 'dashboard-5') {
    d5Controls.classList.remove('hidden');
    document.getElementById('year-slider-5').oninput = function() {
        selectedD5Year = +this.value;
        document.getElementById('year-display-5').textContent = selectedD5Year;
        draw_fossil_vs_lowcarbon(DATA_PATH, "#svg-slot-2", selectedD5Year, selectedD5Country);
    };
} else {
    d5Controls.classList.add('hidden');
}


    //draw the charts defined in the config
    config.charts.forEach((chartConfig, index) => {
        const slotNumber = index + 1;
        const slotElement = document.getElementById(`chart-slot-${slotNumber}`);
        if (slotElement) {
            slotElement.classList.remove('hidden');
            document.getElementById(`title-slot-${slotNumber}`).textContent = chartConfig.title;
            chartConfig.drawFunction(chartConfig.data_path, `#svg-slot-${slotNumber}`)
        }
    });
}

// Implement the map function in main.js
function draw_interactive_atlas_d5(csvPath, containerId) {
    const svg = d3.select(containerId);
    const width = 1000; 
    const height = 500; 

    d3.select("#chart-tooltip_d5").remove();
    const tip = d3.select("body").append("div")
        .attr("id", "chart-tooltip_d5")
        .style("position", "absolute").style("z-index", "9999").style("opacity", 0)
        .style("background", "white").style("padding", "10px").style("border", "2px solid #67acd4")
        .style("border-radius", "8px").style("pointer-events", "none")
        .style("font-family", "sans-serif").style("font-size", "12px")
        .style("box-shadow", "0 4px 10px rgba(0,0,0,0.1)");

    svg.selectAll("*").remove();
    
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g");
    const projection = d3.geoNaturalEarth1().scale(170).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom().scaleExtent([-5, 8]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    Promise.all([
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
        d3.csv(csvPath)
    ]).then(([world, data]) => {
        const yearData = data.filter(d => +d.year === selectedD5Year);
        const dataMap = new Map(yearData.map(d => {
            let name = d.country;
            
            if (name === "United States") name = "USA";
            if (name === "Democratic Republic of the Congo") name = "Dem. Rep. Congo";
            if (name === "Congo") name = "Republic of the Congo";
            if (name === "Czechia") name = "Czech Republic";
            
            return [name, +d.low_carbon_electricity_percentage];
        }));
        
        const maxVal = d3.max(yearData, d => +d.low_carbon_electricity_percentage) || 100000;
        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);

        g.selectAll("path")
            .data(world.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const name = d.properties.name === "United States of America" ? "United States" : d.properties.name;
                const val = dataMap.get(name);
                return val ? colorScale(val) : "#f1f5f9";
            })
            .attr("stroke", "#cbd5e1")
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                const name = d.properties.name === "United States of America" ? "United States" : d.properties.name;
                const val = dataMap.get(name);
                d3.select(this).attr("stroke", "#67acd4").attr("stroke-width", 2).raise();
                let tooltipHtml = `<strong>${name}</strong><br>`;
                tooltipHtml += val !== undefined ? `Renewable Energy: ${Math.round(val).toLocaleString()} %` : 'No Data';
                if (val !== undefined) {
                    tooltipHtml += ` <br><span style="color: #67acd4;">Click to analyze energy mix</span>`;
                }
                tip.style("opacity", 1).html(tooltipHtml);
            })
            .on("mousemove", (event) => tip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px"))
            .on("mouseout", function() {
                d3.select(this).attr("stroke", "#cbd5e1").attr("stroke-width", 1);
                tip.style("opacity", 0);
            })
            .on("click", (event, d) => {
                const name = d.properties.name === "United States of America" ? "United States" : d.properties.name;
                selectedD5Country = name;
                const label = document.getElementById('selected-country-5');
                if (label) label.textContent = name;
                draw_fossil_vs_lowcarbon(csvPath, "#svg-slot-2", selectedD5Year, selectedD5Country);
            });

        const legendWidth = 200;
        const legendHeight = 12;
        const legendX = width - legendWidth - 50;
        const legendY = height - 60;

        const legendContainer = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient").attr("id", "energy-gradient-d5");
        linearGradient.selectAll("stop")
            .data(d3.range(0, 1.1, 0.1))
            .join("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => d3.interpolateBlues(d));

        legendContainer.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#energy-gradient-d5)")
            .style("stroke", "#cbd5e1");

        legendContainer.append("text")
            .attr("x", 0)
            .attr("y", -8)
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .text("Low Carbon Energy (%)");

        legendContainer.append("text")
            .attr("x", 0)
            .attr("y", legendHeight + 15)
            .style("font-size", "10px")
            .text("0");

        legendContainer.append("text")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 15)
            .attr("text-anchor", "end")
            .style("font-size", "10px")
            .text(Math.round(maxVal).toLocaleString());
    });
}

// Event Listener
document.addEventListener('DOMContentLoaded', function() {
    const selector = document.getElementById('dashboard-selector');
    const homeLink = document.getElementById('home-link');

    // Select Box Navigation (primary way to switch)
    if (selector) {
        selector.addEventListener('change', (event) => {
            const val = event.target.value;
            currentMapMode = val; // Set the mode for the map
            
            if (val === "none") {
                loadDashboard('dashboard-home');
            } else {
                loadDashboard(val);
            }
        });
    }

    // Home  (Resets to the Landing Map)
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            selector.value = "none";
            currentMapMode = "none";
            loadDashboard('dashboard-home');
        });
    }

    //INITIAL LOAD
    loadDashboard('dashboard-home');
});

