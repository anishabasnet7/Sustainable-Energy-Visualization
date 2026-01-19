import { draw_overall_co2_timeseries, draw_top10_co2_emiters } from './dashboard_1.js';
import { draw_germany_renewables_timeseries } from './dashboard_2.js'
import { draw_correlation_scatter } from './dashboard_3.js'
import { electricity_vs_cleancooking, draw_access_gap_map, draw_historical_trend } from "./dashboard_4.js";
import {fossil_vs_lowcarbon, draw_energy_mix_map} from "./dashboard_5.js";


const dashboardConfigs = {
    'dashboard-1': {
        title: 'Overall CO2 Emission Trend (2000-2019)',
        explanationTitle: 'Analysis and Interpretation: Line Chart & Bar Chart',
        explanation: `
            <p class="mb-4">
                Based on the two charts, global COsub>2</sub> emissions steadily increased from 2000 to 2019. 
                In 2000, total emissions were about 9 billion tons, and by 2019 they had risen sharply to around 22 billion tons. 
                This shows a strong and continuous upward trend over the years. China is the largest contributor to CO₂ emissions. 
                Its emissions are much higher than any other country, appearing to be about four times larger than the next highest country in the chart. 
                The United States and India are the next biggest contributors, followed by other countries such as Japan, Indonesia, Brazil, and Germany.
            </p>
        `,

        charts: [{ 
            title: 'User Story1: Overall CO2 Emission (kT x 1e6) Trend 2000-2019',
            drawFunction: draw_overall_co2_timeseries, 
            data_path: '../../data/processed_data.csv'
        }, { 
            title: 'User Story1: Top 10 Countris of CO2 Emission (kT x 1e6) 2000-2019',
            drawFunction: draw_top10_co2_emiters, 
            data_path: '../../data/processed_data.csv'
        }]
    },
    'dashboard-2': {
        title: 'Trend of Electricity Generation from Renewable Sources',
        explanationTitle: 'Analysis and Interpretation: Line Chart',
        explanation: `
            <p class="mb-4">
                The chart shows that renewable energy in Germany increased steadily in the first two decades of the 21st century, with the biggest growth happening in the later years. 
                At the start, renewable electricity generation was low, at about 35–40 TWh. By 2020, it had increased sharply to around 250 TWh.
            </p>
        `,

        charts: [{ 
            title: 'User Story2: Trend of Electricity Generation from Renewable Sources in Germany',
            drawFunction: draw_germany_renewables_timeseries, 
            data_path: '../../data/processed_data.csv'
        }]
    },
    'dashboard-3': {
        title: 'Correlation of Energy consumption per capita vs GDP per capita',
        explanationTitle: 'Correlation of Energy consumption per capita vs GDP per capita',
        explanation: `
            <p class="mb-4">
                The scatter plot shows the relationship between average GDP per person (x-axis) and average energy use per person (y-axis). 
                The chart shows a clear pattern: as a country becomes richer, people tend to use more energy. 
                Countries with very low GDP per person (below $1,000) use very little energy. 
                As countries become middle- and high-income nations, energy use increases quickly. 
                This is because of more factories, better infrastructure, and higher living standards. 
                However, among rich countries, the data points are more spread out. 
                Some wealthy countries use a lot of energy because of large industries or cold climates, while others use less energy even with high GDP. 
                This suggests that some countries are more energy-efficient than others.
            </p>
        `,

        charts: [{ 
            title: 'User Story3: Correlation of Energy consumption per capita vs GDP per capita',
            drawFunction: draw_correlation_scatter, 
            data_path: '../../data/processed_data.csv'
        }]
    },
   'dashboard-4': {
    title: 'Gap & Trend Analysis: Access Inequality',
    explanationTitle: 'Dynamic Workflow Analysis',
    explanation: `
        <p>This dashboard uses a three-step filtering process:
        <br>1. <strong>Spatial Context:</strong> The map shows the global Access Gap (Electricity - Clean Cooking).
        <br>2. <strong>Identification:</strong> The slider selects the Top 5 countries with the highest gap and GDP ≤ 2000 for that year.
        <br>3. <strong>Historical Context:</strong> Once identified, we query the <em>entire 20-year history</em> for those 5 countries to see if their clean-cooking access is improving.</p>
    `,
    charts: [
        { title: 'Global Access Gap (Purple) & Top 5 Highlighted', drawFunction: () => {}, data_path: '../../data/processed_data.csv' },
        { title: 'Top 5 Gaps (Selected Year)', drawFunction: (path, id) => electricity_vs_cleancooking(path, id), data_path: '../../data/processed_data.csv' },
        { title: 'Clean Cooking Historical Progress', drawFunction: () => {}, data_path: '../../data/processed_data.csv' }
    ]
},      
    'dashboard-5': {
        title: 'User Story5: John Smith - Energy Analyst',
        explanationTitle: 'Analysis and Interpretation: Bar Chart',
        explanation: `
            <p class="mb-4">
                This chart will help analysts identify which countries are 
                leading the green energy transition and which is dependent on traditional fuel 
                sources. Red Bar show the percentage of electricity generated from Fossil Fuels (Coal, Oil, Gas).
                Green Bar is for the percentage from Low-Carbon sources (Nuclear, Hydro, Solar, Wind).
                John can use the dropdown to toggle "Most Dependent on Fossil Fuels" and "Leading in Low-Carbon" countries.
                There is a slider to observe how energy profiles have evolved over time from 2000 to 2019.
            </p>
        `,

        charts: [
            { 
            title: 'Map: Geographical Location of Top 10 Countries',
             drawFunction: (path, id) => {
                d3.csv(path).then(data => draw_energy_mix_map(data, 2019, 'fossil', id));
            }, 
            data_path: '../../data/processed_data.csv' 
        },
        { 
            title: 'Top Performers Comparison',
            drawFunction: fossil_vs_lowcarbon, 
            data_path: '../../data/processed_data.csv'
        }]
    },
};

function resetChartSlots(maxSlots = 3) {
    for (let i = 1; i <= maxSlots; i++) {
        const slot = document.getElementById(`chart-slot-${i}`);
        if (slot) {
            slot.classList.add('hidden');
            d3.select(`#svg-slot-${i}`).selectAll("*").remove(); 
        }
    }
}

function loadDashboard(id) {
    const config = dashboardConfigs[id];
    if (!config) return;

    document.getElementById('viz-panel-title').textContent = config.title;
    document.getElementById('viz-explanation-title').textContent = config.explanationTitle;
    document.getElementById('viz-explanation-text').innerHTML = config.explanation;
    document.getElementById('slider-container').innerHTML = '';
    resetChartSlots(5); 

    config.charts.forEach((chartConfig, index) => {
        const slotNumber = index + 1;
        const chartSlotId = `#chart-slot-${slotNumber}`;
        const svgId = `#svg-slot-${slotNumber}`;
        const titleId = `#title-slot-${slotNumber}`;
        
        const slotElement = document.querySelector(chartSlotId);
        if (!slotElement) return;

        slotElement.classList.remove('hidden');
        document.querySelector(titleId).textContent = chartConfig.title;
        chartConfig.drawFunction(chartConfig.data_path, svgId); 
    });

    document.querySelectorAll('#dashboard-menu a').forEach(a => {
        a.classList.remove('bg-indigo-600', 'font-bold');
        a.classList.add('hover:bg-gray-700');
    });

    const activeLink = document.querySelector(`a[data-dashboard-id="${id}"]`);
    if (activeLink) {
        activeLink.classList.add('bg-indigo-600', 'font-bold');
        activeLink.classList.remove('hover:bg-gray-700');
    }
}

const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    if (!sidebar.classList.contains('-translate-x-full')) {
        setTimeout(() => { document.addEventListener('click', closeSidebarOutside); }, 300); 
    } else {
        document.removeEventListener('click', closeSidebarOutside);
    }
});

function closeSidebarOutside(event) {
    const isMobile = window.innerWidth < 768;
    if (isMobile && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
        sidebar.classList.add('-translate-x-full');
        document.removeEventListener('click', closeSidebarOutside);
    }
}

const dashboardToggle = document.getElementById('dashboard-toggle');
const dashboardMenu = document.getElementById('dashboard-menu');
const dashboardIcon = document.getElementById('dashboard-icon');

if(dashboardToggle) { 
    dashboardToggle.addEventListener('click', () => {
        const isHidden = dashboardMenu.classList.contains('hidden');
        
        if (isHidden) {
            dashboardMenu.classList.remove('hidden');
            dashboardIcon.textContent = ' ▲';
        } else {
            dashboardMenu.classList.add('hidden');
            dashboardIcon.textContent = ' ▼';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const homeLink = document.getElementById('home-link');
    const dashboardMenu = document.getElementById('dashboard-menu');

    if (homeLink) {
        homeLink.addEventListener('click', (event) => {
            event.preventDefault(); 
            loadDashboard('dashboard-1'); 
            if (!dashboardMenu.classList.contains('hidden')) {
                dashboardMenu.classList.add('hidden');
                
                const dashboardIcon = document.getElementById('dashboard-icon');
                if (dashboardIcon) {
                    dashboardIcon.textContent = '▼';
                }
            }

            if (window.innerWidth < 768) {
                 sidebar.classList.add('-translate-x-full');
            }
        });
    }

    document.querySelectorAll('#dashboard-menu a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 
            const dashboardId = event.target.getAttribute('data-dashboard-id');
            loadDashboard(dashboardId);

            if (window.innerWidth < 768) {
                 sidebar.classList.add('-translate-x-full');
            }
        });
    });

    loadDashboard('dashboard-1');

    window.addEventListener('resize', () => {
        const currentId = document.querySelector('#dashboard-menu a.bg-indigo-600')?.getAttribute('data-dashboard-id') || 'dashboard-1';
        loadDashboard(currentId);
    });
});