const dashboard_control = document.getElementById('controls');
const csvPath = '../../data/processed_data.csv';
const regionSelect = d3.select("#region-select");
const yearSelect = d3.select("#year-select");


// Global state
let globalData = [];

d3.select("#chart-tooltip").remove();

const tooltip = d3.select("body")
    .append("div")
    .attr("id", "chart-tooltip")
    .style("position", "absolute")
    .style("z-index", "9999")
    .style("opacity", 0)
    .style("background", "rgba(255, 255, 255, 0.95)")
    .style("color", "#333")
    .style("padding", "10px")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("pointer-events", "none") 
    .style("font-family", "sans-serif")
    .style("font-size", "12px")
    .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");
// ───────────────────────────────────────────────
// 1) LOAD & PREPARE DATA
// ───────────────────────────────────────────────

d3.csv(csvPath).then(data => {
    globalData = data; // Store in global scope
    
    const regions = Array.from(new Set(data.map(d => d.region))).sort();
    regionSelect.append("option").attr("value", "All").text("All Regions");
    regionSelect.selectAll("option.region")
        .data(regions).enter()
        .append("option")
        .attr("class", "region")
        .attr("value", d => d)
        .text(d => d);

    const years = Array.from(new Set(data.map(d => d.year))).sort().reverse();
    yearSelect.append("option").attr("value", "All").text("All Years");
    yearSelect.selectAll("option.year")
        .data(years).enter()
        .append("option")
        .attr("class", "year")
        .attr("value", d => d)
        .text(d => d);

    // Initial draw
    refreshAll();
});

// Event listeners for selects
regionSelect.on("change", refreshAll);
yearSelect.on("change", refreshAll);


// ───────────────────────────────────────────────
// 2) REFRESH ALL CHARTS
// ───────────────────────────────────────────────

function refreshAll() {
    const region = regionSelect.node().value;
    const year = yearSelect.node().value;

    let data_without_year_filter = globalData.filter(d=>
        (region==="All"||d.region===region)
    ); 

    let filteredData = globalData.filter(d=>
        (region==="All"||d.region===region) && (year==="All"||d.year===year)
    );

    update_co2_trend(data_without_year_filter);
    update_top_10_countries_co2_emission(filteredData);
    update_correlation_energy_consumption_gdp_per_capita(filteredData)
    update_countries_gdp(filteredData)
    update_no_countries_with_gdp_less_than_2000(filteredData)
    update_no_countries_with_gdp_more_than_2000(filteredData)
    update_comparison_of_greenest(filteredData)
}

// ───────────────────────────────────────────────
// 3) CO2 Trend
// ───────────────────────────────────────────────

function update_co2_trend(data) {
    const co2_trend_svg = d3.select('#co2_trend');
    if (co2_trend_svg.empty()) return;
    const container = co2_trend_svg.node().parentNode;

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
        requestAnimationFrame(() => renderTestResultsBar(data))
        return
    };

    co2_trend_svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');

    const margin = { top: 70, right: 20, bottom: 40, left: 70 }
    const startYear = 2000, endYear = 2019;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    co2_trend_svg.selectAll("*").remove();

    co2_trend_svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', 12)
        .text('Overall CO2 Emission (kT x 1e6) Trend 2000-2019')

    const g = co2_trend_svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const aggregatedMap = d3.rollup(
        data,
        v => d3.sum(v, d => +d.total_co2_emissions / 1000000000), 
        d => +d.year 
    );

    const chartData = Array.from(aggregatedMap, ([year, total_emission]) => ({
        year: year, 
        total_emission: total_emission
    }))
    .filter(d => d.year >= startYear && d.year <= endYear)
    .sort((a, b) => a.year - b.year);

    const x = d3.scaleLinear()
        .domain(d3.extent(chartData, d => d.year)) 
        .range([0, innerWidth]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.total_emission) * 1.05 || 10])
        .range([innerHeight, 0]);

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.total_emission));

    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10));

    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));
    
    g.append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 3)
        .attr("d", line);

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10 - margin.left)
        .attr("x", 0 - (innerHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("fill", "#4b5563")
        .text("Total CO2 Emissions");

    g.selectAll("circle")
        .data(chartData)
        .enter().append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.total_emission))
        .attr("r", 5) 
        .attr("fill", "#ef4444")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 7).attr("fill", "#10b981"); 
            tooltip.style("opacity", 1)
                   .html(`<strong>Year:</strong> ${d.year}<br><strong>Emissions:</strong> ${d3.format(".3s")(d.total_emission)}`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 5).attr("fill", "#ef4444");
            tooltip.style("opacity", 0);
        });
}


// ───────────────────────────────────────────────
// 4) Top 10 Countries CO2 Emission
// ───────────────────────────────────────────────
function update_top_10_countries_co2_emission(data) {
    const top_10_countries_co2_emission_svg = d3.select('#top_10_countries_co2_emission');
    if (top_10_countries_co2_emission_svg.empty()) return;
    
    const container = top_10_countries_co2_emission_svg.node().parentNode;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
        requestAnimationFrame(() => update_top_10_countries_co2_emission(data));
        return;
    };

    top_10_countries_co2_emission_svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');

    const margin = { top: 70, right: 20, bottom: 80, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    top_10_countries_co2_emission_svg.selectAll("*").remove();

    // Chart Title
    top_10_countries_co2_emission_svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', 14)
        .text('Top 10 Countries by CO2 Emission');

    const g = top_10_countries_co2_emission_svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const aggregatedData = d3.rollup(
        data,
        v => d3.sum(v, d => +d.total_co2_emissions / 1000000000), 
        d => d.country
    );

    const topData = Array.from(aggregatedData, ([country, total_emission]) => ({
        country: country, 
        total_emission: total_emission
    }))
    .sort((a, b) => b.total_emission - a.total_emission)
    .slice(0, 10);

    const x = d3.scaleBand()
        .domain(topData.map(d => d.country)) 
        .range([0, innerWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(topData, d => d.total_emission) * 1.05 || 10])
        .range([innerHeight, 0]);

    // X Axis
    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em");

    // Y Axis
    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));
    
    // Bars with Transition
    g.selectAll(".bar")
        .data(topData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.country))
        .attr("y", innerHeight)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", "#4f46e5") 
        .attr("rx", 4)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "#3730a3"); 
            tooltip.style("opacity", 1)
                   .html(`<strong>Country:</strong> ${d.country}<br><strong>Emissions:</strong> ${d3.format(".3s")(d.total_emission)}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "#4f46e5");
            tooltip.style("opacity", 0);
        })
        .transition()
        .duration(800)
        .attr("y", d => y(d.total_emission))
        .attr("height", d => innerHeight - y(d.total_emission));
    
    // Y-Axis Label
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10 - margin.left)
        .attr("x", 0 - (innerHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("fill", "#4b5563")
        .text("Total CO2 Emissions");
}



// ───────────────────────────────────────────────
// 5) Correlation of Energy consumption per capita vs GDP per capita
// ───────────────────────────────────────────────
function update_correlation_energy_consumption_gdp_per_capita(data) {
    const correlation_energy_consumption_gdp_per_capita_svg = d3.select('#correlation_energy_consumption_gdp_per_capita');
    if (correlation_energy_consumption_gdp_per_capita_svg.empty()) return;
    
    const container = correlation_energy_consumption_gdp_per_capita_svg.node().parentNode;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
        requestAnimationFrame(() => update_correlation_energy_consumption_gdp_per_capita(data));
        return;
    };

    correlation_energy_consumption_gdp_per_capita_svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');
    const margin = { top: 60, right: 30, bottom: 60, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    correlation_energy_consumption_gdp_per_capita_svg.selectAll("*").remove();

    // 1. DATA
    let cleanedData = data.filter(d => !isNaN(+d.gdp_per_capita) && !isNaN(+d.energy_consumption_per_person));
    const aggregated = Array.from(d3.rollup(cleanedData, v => ({
        avg_gdp: d3.mean(v, d => +d.gdp_per_capita),
        avg_energy: d3.mean(v, d => +d.energy_consumption_per_person)
    }), d => d.country)).map(([country, v]) => ({ country, gdp: v.avg_gdp, energy: v.avg_energy }))
    .filter(d => d.gdp > 0 && d.energy > 0);

    // 2. SCALES
    const x = d3.scaleLog().domain([d3.min(aggregated, d => d.gdp), d3.max(aggregated, d => d.gdp) * 1.1]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, d3.max(aggregated, d => d.energy) * 1.05]).range([innerHeight, 0]);

    const xAxis = d3.axisBottom(x).ticks(5, d3.format("$,.0s"));
    const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s"));

    // 3. GROUPS
    correlation_energy_consumption_gdp_per_capita_svg.append("defs").append("clipPath").attr("id", "scat-clip").append("rect").attr("width", innerWidth).attr("height", innerHeight);
    
    const g = correlation_energy_consumption_gdp_per_capita_svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const gX = g.append("g").attr("transform", `translate(0,${innerHeight})`).call(xAxis);
    const gY = g.append("g").call(yAxis);

    // 4. ZOOM RECT (Placed BEFORE dots so dots are on top)
    const zoom = d3.zoom().scaleExtent([0.5, 20]).on("zoom", (event) => {
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);
        gX.call(xAxis.scale(newX));
        gY.call(yAxis.scale(newY));
        dots.attr("cx", d => newX(d.gdp)).attr("cy", d => newY(d.energy));
    });

    g.append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(zoom);

    // 5. DOTS (Placed AFTER zoom rect)
    const plotArea = g.append("g").attr("clip-path", "url(#scat-clip)");
    const dots = plotArea.selectAll(".dot")
        .data(aggregated)
        .enter().append("circle")
        .attr("cx", d => x(d.gdp))
        .attr("cy", d => y(d.energy))
        .attr("r", 6)
        .attr("fill", "#4f46e5")
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 9).attr("opacity", 1).attr("stroke", "#000");
            tooltip.style("opacity", 1)
                .html(`<strong>${d.country}</strong><br>GDP per Capita: ${d3.format("$,.0f")(d.gdp)}<br>Energy: ${d3.format(".2s")(d.energy)}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 6).attr("opacity", 0.7).attr("stroke", "#fff");
            tooltip.style("opacity", 0);
        });

    // 6. LABELS
    g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + margin.bottom - 10)
        .style("text-anchor", "middle")
        .attr("fill", "#4b5563")
        .text("Average GDP Per Capita (US$)");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10 - margin.left)
        .attr("x", 0 - (innerHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "x-small")
        .attr("fill", "#4b5563")
        .text("Average Energy Consumption Per Person");
    correlation_energy_consumption_gdp_per_capita_svg.append('text').attr('x', width / 2).attr('y', 30).attr('text-anchor', 'middle').attr('font-weight', 'bold').text('GDP per Capita vs. Energy Consumption');
}

//countries_gdp_svg
// ───────────────────────────────────────────────
// 6) Countries GDP
// ───────────────────────────────────────────────

function update_countries_gdp(data) {
    const countries_gdp_svg = d3.select('#countries_gdp');
    if (countries_gdp_svg.empty()) return;
    
    const container = countries_gdp_svg.node().parentNode;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
        requestAnimationFrame(() => update_countries_gdp(data));
        return;
    };

    countries_gdp_svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');
    countries_gdp_svg.selectAll("*").remove();

    const margin = { top: 50, right: 20, bottom: 60, left: 20 };

    const gdpMap = new Map();
    data.forEach(d => {
        const val = +d.gdp_per_capita;
        if (!isNaN(val)) {
            let name = d.country;
            // Manual overrides to match GeoJSON standards
            if (name === "United States") name = "USA";
            if (name === "Democratic Republic of the Congo") name = "Dem. Rep. Congo";
            if (name === "Congo") name = "Republic of the Congo";
            if (name === "Czechia") name = "Czech Republic";
            
            gdpMap.set(name, val);
        }
    });

    const maxGdp = d3.max(Array.from(gdpMap.values())) || 100000;
    const colorScale = d3.scaleSequential().domain([0, maxGdp]).interpolator(d3.interpolateBlues);

    const projection = d3.geoNaturalEarth1();
    const path = d3.geoPath().projection(projection);
    const g = countries_gdp_svg.append("g");

    const mapZoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => g.attr("transform", event.transform));
    countries_gdp_svg.call(mapZoom);

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
        
        projection.fitExtent([
            [margin.left, margin.top], 
            [width - margin.right, height - margin.bottom - 20]
        ], world);

        g.selectAll("path")
            .data(world.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const val = gdpMap.get(d.properties.name);
                return val ? colorScale(val) : "#f1f5f9";
            })
            .attr("stroke", "#cbd5e1")
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) {
                const val = gdpMap.get(d.properties.name);
                d3.select(this).attr("stroke", "#4338ca").attr("stroke-width", 1).raise();
                tooltip.transition().duration(100).style("opacity", 1);
                tooltip.html(`<b>${d.properties.name}</b><br>GDP per Capita: ${val ? d3.format("$,.0f")(val) : 'No Data'}`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke", "#cbd5e1").attr("stroke-width", 0.5);
                tooltip.transition().duration(100).style("opacity", 0);
            });
    });

    // Legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legendX = width / 2 - legendWidth / 2;
    const legendY = height - 40;

    const defs = countries_gdp_svg.append("defs");
    const linearGradient = defs.append("linearGradient").attr("id", "gdp-gradient");

    linearGradient.selectAll("stop")
        .data(d3.range(11))
        .join("stop")
        .attr("offset", d => d * 10 + "%")
        .attr("stop-color", d => colorScale(maxGdp * (d / 10)));

    const legendGroup = countries_gdp_svg.append("g").attr("transform", `translate(${legendX}, ${legendY})`);

    legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gdp-gradient)");

    const legendScale = d3.scaleLinear().domain([0, maxGdp]).range([0, legendWidth]);
    const legendAxis = d3.axisBottom(legendScale).ticks(3).tickFormat(d3.format("$.0s"));

    legendGroup.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis)
        .select(".domain").remove();

    countries_gdp_svg.append('text')
        .attr('x', width / 2).attr('y', 30).attr('text-anchor', 'middle')
        .attr('font-weight', 'bold').attr('font-size', '16px')
        .text('World GDP per Capita Distribution');
}

// ───────────────────────────────────────────────
// 7) Number of countries with gdp less and more than 2000
// ───────────────────────────────────────────────
function update_no_countries_with_gdp_less_than_2000(data) {
    const no_countries_with_gdp_less_than_2000_svg = d3.select('#no_countries_with_gdp_less_than_2000');
    if (no_countries_with_gdp_less_than_2000_svg.empty()) return;

    const container = no_countries_with_gdp_less_than_2000_svg.node().parentNode;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
        requestAnimationFrame(() => update_no_countries_with_gdp_less_than_2000(data));
        return;
    }

    no_countries_with_gdp_less_than_2000_svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');
    no_countries_with_gdp_less_than_2000_svg.selectAll("*").remove();

    // 1. Calculate unique count of countries with GDP <= 2000
    const lowGdpCountries = new Set(
        data.filter(d => !isNaN(+d.gdp_per_capita) && +d.gdp_per_capita <= 2000)
            .map(d => d.country)
    );
    const count = lowGdpCountries.size;

    // 2. Add Title on top
    no_countries_with_gdp_less_than_2000_svg.append('text')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', '14px')
        .attr('fill', '#1f2937')
        .text('Number of Countries with GDP ≤ $2000');

    // 3. Add the Big Number in the center
    no_countries_with_gdp_less_than_2000_svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 + 10)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', '54px')
        .attr('fill', '#4f46e5')
        .text(count);

    // 4. Subtext
    no_countries_with_gdp_less_than_2000_svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 + 50)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#6b7280')
        .text('Countries');
}

function update_no_countries_with_gdp_more_than_2000(data) {
    const no_countries_with_gdp_more_than_2000_svg = d3.select('#no_countries_with_gdp_more_than_2000');
    if (no_countries_with_gdp_more_than_2000_svg.empty()) return;

    const container = no_countries_with_gdp_more_than_2000_svg.node().parentNode;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
        requestAnimationFrame(() => update_no_countries_with_gdp_more_than_2000(data));
        return;
    }

    no_countries_with_gdp_more_than_2000_svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');
    no_countries_with_gdp_more_than_2000_svg.selectAll("*").remove();

    // 1. Calculate unique count of countries with GDP > 2000
    const highGdpCountries = new Set(
        data.filter(d => !isNaN(+d.gdp_per_capita) && +d.gdp_per_capita > 2000)
            .map(d => d.country)
    );
    const count = highGdpCountries.size;

    // 2. Add Title on top
    no_countries_with_gdp_more_than_2000_svg.append('text')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', '14px')
        .attr('fill', '#1f2937')
        .text('Number of Countries with GDP > $2000');

    // 3. Add the Big Number in the center
    no_countries_with_gdp_more_than_2000_svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 + 10)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', '54px')
        .attr('fill', '#4f46e5')
        .text(count);

    // 4. Subtext
    no_countries_with_gdp_more_than_2000_svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 + 50)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#6b7280')
        .text('Countries');
}

// ───────────────────────────────────────────────
// 8) Comparison on Greenest
// ───────────────────────────────────────────────
function update_comparison_of_greenest(data, selectedCountry = null) {
    const comparison_of_greenest_svg = d3.select('#comparison_of_greenest');
    if (comparison_of_greenest_svg.empty()) return;

    const container = comparison_of_greenest_svg.node().parentNode;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
        requestAnimationFrame(() => update_comparison_of_greenest(data, selectedCountry));
        return;
    }

    comparison_of_greenest_svg.attr("viewBox", `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');
    comparison_of_greenest_svg.selectAll("*").remove();

    let tooltip = d3.select("body").select(".chart-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "chart-tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "white")
            .style("border", "1px solid #ccc")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)");
    }

    const margin = { top: 70, right: 120, bottom: 40, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const countryMap = d3.rollup(data.filter(d => d.country !== "World"), 
        v => {
            const fossil = d3.sum(v, d => +d.electricity_from_fuels || 0);
            const nuclear = d3.sum(v, d => +d.electricity_from_nuclear || 0);
            const renewables = d3.sum(v, d => +d.electricity_from_renewables || 0);
            const lowCarbon = nuclear + renewables;
            const total = fossil + lowCarbon;
            return {
                fossil_val: fossil,
                nuclear_val: nuclear,
                renew_val: renewables,
                fossil_pct: total > 0 ? (fossil / total) * 100 : 0,
                low_carbon_pct: total > 0 ? (lowCarbon / total) * 100 : 0
            };
        }, 
        d => d.country
    );

    let displayData = Array.from(countryMap, ([country, stats]) => ({ country, ...stats }))
        .sort((a, b) => b.low_carbon_pct - a.low_carbon_pct)
        .slice(0, 10);

    const x = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
    const y = d3.scaleBand().domain(displayData.map(d => d.country)).range([0, innerHeight]).padding(0.3);

    const g = comparison_of_greenest_svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);


    const showTooltip = (event, d) => {
        tooltip.style("visibility", "visible")
            .html(`
                <strong>${d.country}</strong><br/>
                Fossil: ${d.fossil_val.toFixed(2)}<br/>
                Nuclear: ${d.nuclear_val.toFixed(2)}<br/>
                Renewables: ${d.renew_val.toFixed(2)}
            `);
    };

    const moveTooltip = (event) => {
        tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
    };

    // Bars
    g.selectAll(".bar-fossil")
        .data(displayData)
        .join("rect")
        .attr("y", d => y(d.country))
        .attr("width", d => x(d.fossil_pct))
        .attr("height", y.bandwidth())
        .attr("fill", "#ef4444")
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    g.selectAll(".bar-green")
        .data(displayData)
        .join("rect")
        .attr("x", d => x(d.fossil_pct))
        .attr("y", d => y(d.country))
        .attr("width", d => x(d.low_carbon_pct))
        .attr("height", y.bandwidth())
        .attr("fill", "#22c55e")
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    // Title & Legend
    comparison_of_greenest_svg.append('text')
        .attr('x', width / 2).attr('y', 25).attr('text-anchor', 'middle')
        .attr('font-weight', 'bold').attr('font-size', '14px')
        .text('Greenest Electricity Producers');

    const legend = comparison_of_greenest_svg.append("g").attr("transform", `translate(${width/2 - 60}, 45)`);
    
    legend.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#ef4444");
    legend.append("text").attr("x", 18).attr("y", 10).text("Fossil").style("font-size", "12px").attr("alignment-baseline", "middle");
    
    legend.append("rect").attr("x", 70).attr("width", 12).attr("height", 12).attr("fill", "#22c55e");
    legend.append("text").attr("x", 88).attr("y", 10).text("Green").style("font-size", "12px").attr("alignment-baseline", "middle");

    // Axes
    g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));
    g.append("g").call(d3.axisLeft(y));
}

