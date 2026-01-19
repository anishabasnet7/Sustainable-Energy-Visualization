import { draw_overall_co2_timeseries, draw_top10_co2_emiters } from './dashboard_1.js';
import { draw_germany_renewables_timeseries } from './dashboard_2.js';
import { draw_correlation_scatter } from './dashboard_3.js';
import { electricity_vs_cleancooking } from "./dashboard_4.js";
import { fossil_vs_lowcarbon } from "./dashboard_5.js";
import { draw_landing_map } from './landing_map.js';

let selectedD4Year = 2019;
let currentMapMode = "none"; 
let currentMapYear = 2019;
const DATA_PATH = '../../data/processed_data.csv';

const dashboardConfigs = {
    'dashboard-home': {
        title: 'Global Energy Transition: A Spatial Overview',
        explanationTitle: 'Project Introduction',
        explanation: `<p class="text-lg">Select a User Story from the dropdown above to begin the analysis.</p>`,
        charts: [
            { 
                title: 'World Data Overview', 
                drawFunction: (path, id) => draw_landing_map(path, id, currentMapMode, currentMapYear), 
                data_path: DATA_PATH 
            }
        ]
    },
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
        title: 'The Access Gap (GDP ≤ 2000)',
        explanationTitle: 'John\'s Analysis: Clean Cooking vs Electricity',
        explanation: `<p>This chart shows the top 5 countries where the gap between electricity and clean cooking is largest.</p>`,
        charts: [
            { title: 'Interactive Atlas & Access Gap Analysis', 
                drawFunction: (path, id) => electricity_vs_cleancooking(path, id), 
                data_path: DATA_PATH }
        ]
    },
    'dashboard-5': {
        title: 'Energy Transition: Fossil vs Low-Carbon',
        explanationTitle: 'Lead vs Dependency Analysis',
        explanation: `<p>Identify which countries are leading the green energy transition.</p>`,
        charts: [
            { title: 'Energy Mix Map', drawFunction: (path, id) => draw_landing_map(path, id, 'dashboard-5', currentMapYear), data_path: DATA_PATH },
            { title: 'Fossil vs Low-Carbon Performers', drawFunction: fossil_vs_lowcarbon, data_path: DATA_PATH }
        ]
    },
};

/* Clears the UI slots before loading new charts */
function resetChartSlots() {
    for (let i = 1; i <= 5; i++) {
        const slot = document.getElementById(`chart-slot-${i}`);
        if (slot) {
            slot.classList.add('hidden');
            d3.select(`#svg-slot-${i}`).selectAll("*").remove(); 
        }
    }
}

/* Main function to load dashboard */
function loadDashboard(id) {
    const config = dashboardConfigs[id] || dashboardConfigs['dashboard-home'];
    
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

// Event Listeners
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

