import { draw_overall_co2_timeseries, draw_top10_co2_emiters } from './dashboard_1.js';
import { electricity_vs_cleancooking, clean_cooking_trend } from "./dashboard_4.js";
import {fossil_vs_lowcarbon} from "./dashboard_5.js";


const dashboardConfigs = {
    'dashboard-1': {
        title: 'Overall CO2 Emission Trend (2000-2019)',
        explanationTitle: 'Analysis and Interpretation: Bar Chart',
        explanation: `
            <p class="mb-4">
                Based on the two charts provided, here is an analysis of CO$_2$ emissions between the years 2000 and 2019.
                The most striking feature is the magnitude of China's emissions. The blue bar for China reaches over 200M on the chart's scale. Visually, China's total emissions for this period appear to be roughly 4 times higher than the next highest contributor.
                India and the United States represent the next distinct grouping. After the top three nations, there is a massive disparity. Countries like Japan, Indonesia, Brazil, and Germany contribute significantly less to the total global volume compared to the top three. Their bars are barely visible relative to China's.
                The slope is relatively steep and consistent from 2000 to 2011. There is a slight leveling off around 2014–2016, but the upward trend resumes by 2017.
            </p>
        `,

        charts: [{ 
            title: 'Overall CO2 Emission (kT x 1e6) Trend 2000-2019',
            drawFunction: draw_overall_co2_timeseries, 
            data_path: '../../data/processed_data.csv'
        }, { 
            title: 'Top 10 Countris of CO2 Emission (kT x 1e6) 2000-2019',
            drawFunction: draw_top10_co2_emiters, 
            data_path: '../../data/processed_data.csv'
        }]
    },
    'dashboard-2': {
        title: 'Overall CO2 Emission Trend (2000-2019)',
        explanationTitle: 'Analysis and Interpretation: Bar Chart',
        explanation: `
            <p class="mb-4">
                Based on the two charts provided, here is an analysis of CO$_2$ emissions between the years 2000 and 2019.
                The most striking feature is the magnitude of China's emissions. The blue bar for China reaches over 200M on the chart's scale. Visually, China's total emissions for this period appear to be roughly 4 times higher than the next highest contributor.
                India and the United States represent the next distinct grouping. After the top three nations, there is a massive disparity. Countries like Japan, Indonesia, Brazil, and Germany contribute significantly less to the total global volume compared to the top three. Their bars are barely visible relative to China's.
                The slope is relatively steep and consistent from 2000 to 2011. There is a slight leveling off around 2014–2016, but the upward trend resumes by 2017.
            </p>
        `,

        charts: [{ 
            title: 'Overall CO2 Emission (kT x 1e6) Trend 2000-2019',
            drawFunction: draw_overall_co2_timeseries, 
            data_path: '../../data/processed_data.csv'
        }, { 
            title: 'Top 10 Countris of CO2 Emission (kT x 1e6) 2000-2019',
            drawFunction: draw_top10_co2_emiters,
            data_path: '../../data/processed_data.csv'
        }]
    },
    'dashboard-3': {
        title: 'Overall CO2 Emission Trend (2000-2019)',
        explanationTitle: 'Analysis and Interpretation: Bar Chart',
        explanation: `
            <p class="mb-4">
                Based on the two charts provided, here is an analysis of CO$_2$ emissions between the years 2000 and 2019.
                The most striking feature is the magnitude of China's emissions. The blue bar for China reaches over 200M on the chart's scale. Visually, China's total emissions for this period appear to be roughly 4 times higher than the next highest contributor.
                India and the United States represent the next distinct grouping. After the top three nations, there is a massive disparity. Countries like Japan, Indonesia, Brazil, and Germany contribute significantly less to the total global volume compared to the top three. Their bars are barely visible relative to China's.
                The slope is relatively steep and consistent from 2000 to 2011. There is a slight leveling off around 2014–2016, but the upward trend resumes by 2017.
            </p>
        `,

        charts: [{ 
            title: 'Overall CO2 Emission (kT x 1e6) Trend 2000-2019',
            drawFunction: draw_overall_co2_timeseries,
            data_path: '../../data/processed_data.csv'
        }, { 
            title: 'Top 10 Countris of CO2 Emission (kT x 1e6) 2000-2019',
            drawFunction: draw_top10_co2_emiters,
            data_path: '../../data/processed_data.csv'
        }]
    },
    'dashboard-4': {
        title: 'Energy Access Assessment for Low Income Countries',
        explanationTitle: 'Analysis and Interpretation: ....',
        explanation: `
            <p class="mb-4">
            The 1st chart show top 10 low-income countries with the 
            hoghest gap between electricity access and clean cooking fuel 
            access for that year. The 2nd chart shows how access 
            to clean cooking fuels has changed over time for those countries, 
            allowing Jane to see trends and improvements.
            </p>
        `,

        charts: [{ 
            title: 'Electricity Access vs Clean Cooking Access (2000–2020)',
            drawFunction: (data_path, svgId) => electricity_vs_cleancooking(data_path, svgId)
            .then(top10Countries => {
                clean_cooking_trend(data_path, '#svg-slot-2', top10Countries);
            }),
            data_path: '../../data/processed_data.csv'
        }, { 
            title: 'Clean Cooking Fuel Access Trend',
            drawFunction: (data_path, svgId) => { 
            const svg = d3.select(svgId);
            svg.selectAll("*").remove();
            svg.append("text")
               .attr("x", parseInt(svg.style("width"))/2)
               .attr("y", parseInt(svg.style("height"))/2)
               .attr("text-anchor", "middle")
               .attr("fill", "#999");
        },
            data_path: '../../data/processed_data.csv'
        }]
    },
    'dashboard-5': {
        title: 'John',
        explanationTitle: 'Analysis and Interpretation: Bar Chart',
        explanation: `
            <p class="mb-4">
                Test 
            </p>
        `,

        charts: [{ 
            title: ' Trend 2000-2019',
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