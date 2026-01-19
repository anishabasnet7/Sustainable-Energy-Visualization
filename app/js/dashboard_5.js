// dashboard_5.js

// --- 1. THE MAP (Primary View) ---
export function draw_energy_mix_map(data, year, mode, containerId, top10Names) {
    const svg = d3.select(containerId);
    const width = 800; const height = 400;
    const tip = d3.select("#tooltip");
    svg.selectAll("*").remove();
    
    // Mode A: Deep Grape Purple (from D4)
    // Mode B: Deep Plum / Fuchsia (The "Similar" color)
    const colorA = "#4c1d95"; 
    const colorB = "#701a75";   
    const topSet = new Set(top10Names);

    const g = svg.append("g");
    const projection = d3.geoNaturalEarth1().scale(130).translate([width/2, height/2]);
    const path = d3.geoPath().projection(projection);

    // Mode A Scale: Purples
    // Mode B Scale: Red-Purples (interpolateRdPu)
    const colorScale = mode === 'fossil' 
        ? d3.scaleSequential(d3.interpolatePurples).domain([0, 100]) 
        : d3.scaleSequential(d3.interpolateRdPu).domain([0, 100]); 

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
        const yearData = data.filter(d => +d.year === year);
        const dataMap = new Map(yearData.map(d => {
            const fossil = +d.electricity_from_fuels || 0;
            const total = fossil + (+d.electricity_from_nuclear || 0) + (+d.electricity_from_renewables || 0);
            let val = mode === 'fossil' ? (total > 0 ? (fossil/total)*100 : 0) : (+d.low_carbon_electricity_percentage || 0);
            return [d.country, val];
        }));

        g.selectAll("path")
            .data(world.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                let name = d.properties.name === "USA" ? "United States" : d.properties.name;
                const v = dataMap.get(name);
                return v !== undefined ? colorScale(v) : "#f1f5f9"; 
            })
            .attr("stroke", d => {
                let name = d.properties.name === "USA" ? "United States" : d.properties.name;
                return topSet.has(name) ? (mode === 'fossil' ? colorA : colorB) : "#cbd5e1";
            })
            .attr("stroke-width", d => {
                let name = d.properties.name === "USA" ? "United States" : d.properties.name;
                return topSet.has(name) ? 3 : 0.5;
            })
            .on("mouseover", function(event, d) {
                let name = d.properties.name === "USA" ? "United States" : d.properties.name;
                const v = dataMap.get(name);
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);

                tip.transition().duration(100).style("opacity", 1);
                tip.html(`
                    <div class="font-bold border-b border-gray-300 mb-1" style="color: ${mode === 'fossil' ? '#7c3aed' : '#d946ef'}">${name}</div>
                    <div class="text-xs">Intensity (${year}):</div>
                    <div class="text-xl font-bold">${v !== undefined ? v.toFixed(1) + '%' : 'N/A'}</div>
                    ${topSet.has(name) ? `<div class="mt-1 text-[10px] font-bold text-indigo-600">★ TOP PERFORMER</div>` : ''}
                `);
            })
            .on("mousemove", (event) => tip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px"))
            .on("mouseout", function(event, d) {
                let name = d.properties.name === "USA" ? "United States" : d.properties.name;
                d3.select(this)
                    .attr("stroke", topSet.has(name) ? (mode === 'fossil' ? colorA : colorB) : "#cbd5e1")
                    .attr("stroke-width", topSet.has(name) ? 3 : 0.5);
                tip.transition().duration(100).style("opacity", 0);
            });
    });
}

// --- 2. CONTROLS & BARS ---
export function fossil_vs_lowcarbon(csvPath, svgId) {
    d3.csv(csvPath).then(data => {
        data.forEach(d => {
            d.year = +d.year;
            d.fossil_val = +d.electricity_from_fuels || 0;
            d.nuclear_val = +d.electricity_from_nuclear || 0;
            d.renewables_val = +d.electricity_from_renewables || 0;
            d.low_carbon_pct = +d.low_carbon_electricity_percentage || 0;
        });

        let currentYear = 2019;
        let currentMode = 'fossil';

        const controls = d3.select("#slider-container");
        controls.html(`
            <div class="flex flex-col gap-3 bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-sm">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-indigo-800">Observation Year: <span id="year-disp" class="text-xl">2019</span></span>
                    <select id="mode-toggle" class="bg-white border border-indigo-300 text-indigo-900 rounded px-2 py-1 outline-none text-sm font-bold">
                        <option value="fossil">Fossil Dependency (Violet)</option>
                        <option value="green">Low-Carbon Leaders (Fuchsia)</option>
                    </select>
                </div>
                <input type="range" id="y-slider" min="2000" max="2019" value="2019" class="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">
            </div>
        `);

        const svg = d3.select(svgId);
        const width = 600; const height = 400;
        const margin = { top: 20, right: 30, bottom: 40, left: 150 };
        const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
        const y = d3.scaleBand().range([margin.top, height - margin.bottom]).padding(0.3);

        function update() {
            const yearData = data.filter(d => d.year === currentYear);
            yearData.forEach(d => {
                const total = d.fossil_val + d.nuclear_val + d.renewables_val;
                d.fossil_pct = total > 0 ? (d.fossil_val / total) * 100 : 0;
            });

            let top10 = (currentMode === 'fossil') 
                ? yearData.sort((a, b) => b.fossil_pct - a.fossil_pct).slice(0, 10)
                : yearData.sort((a, b) => b.low_carbon_pct - a.low_carbon_pct).slice(0, 10);

            const topNames = top10.map(d => d.country);

            svg.selectAll("*").remove();
            y.domain(topNames);
            svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat(d => d + "%"));
            svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

            svg.selectAll(".bar").data(top10).join("rect")
                .attr("x", margin.left).attr("y", d => y(d.country)).attr("height", y.bandwidth())
                // Fossil: Violet (#7c3aed) | Low-Carbon: Fuchsia (#d946ef)
                .attr("fill", currentMode === 'fossil' ? "#7c3aed" : "#d946ef")
                .attr("width", d => x(currentMode === 'fossil' ? d.fossil_pct : d.low_carbon_pct) - margin.left);

            draw_energy_mix_map(data, currentYear, currentMode, "#svg-slot-1", topNames);
        }

        document.getElementById('mode-toggle').addEventListener('change', (e) => { currentMode = e.target.value; update(); });
        document.getElementById('y-slider').addEventListener('input', (e) => { 
            currentYear = +e.target.value; 
            document.getElementById('year-disp').innerText = currentYear;
            update(); 
        });

        update();
    });
}