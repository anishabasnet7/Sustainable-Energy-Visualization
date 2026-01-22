// connects GeoJSON to 'country' column
function getCleanName(name) {
    const mapping = {
        "United States of America": "United States",
        "USA": "United States",
        "Democratic Republic of the Congo": "Congo",
        "Republic of the Congo": "Congo",
        "United Republic of Tanzania": "Tanzania",
        "South Korea": "Korea, South",
        "North Korea": "Korea, North"
    };
    return mapping[name] || name;
}

function draw_interactive_atlas(fullData, year, containerId, onCountrySelect) {
    const svg = d3.select(containerId);
    const width = 1000; 
    const height = 500;
    const tip = d3.select("#tooltip");
    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet")
       .classed("w-full h-auto", true);

    // SAME color scale as dashboard.js (Blue Choropleth)
    const maxGdp = d3.max(fullData, d => +d.gdp_per_capita) || 100000;
    const colorScale = d3.scaleSequential()
        .domain([0, maxGdp])
        .interpolator(d3.interpolateBlues);

    const projection = d3.geoNaturalEarth1().scale(175).translate([width / 2, height / 2.2]);
    const path = d3.geoPath().projection(projection);

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
        const yearData = fullData.filter(d => +d.year === year);
        const dataMap = new Map();
        yearData.forEach(d => dataMap.set(d.country, d));

        const g = svg.append("g");

        g.selectAll("path")
            .data(world.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const cleanName = getCleanName(d.properties.name);
                const stats = dataMap.get(cleanName);
                
                // Use Blue Choropleth colors for all countries with data
                if (stats && stats.gdp_per_capita !== "") {
                    return colorScale(+stats.gdp_per_capita);
                }
                return "#f1f5f9"; // Grey for missing data
            })
            .attr("stroke", d => {
                const cleanName = getCleanName(d.properties.name);
                const stats = dataMap.get(cleanName);
                // Give target countries (GDP <= 2000) a distinct border to make them "pop"
                return (stats && +stats.gdp_per_capita <= 2000) ? "#a5cce5" : "#cbd5e1";
            })
            .attr("stroke-width", d => {
                const cleanName = getCleanName(d.properties.name);
                const stats = dataMap.get(cleanName);
                return (stats && +stats.gdp_per_capita <= 2000) ? 1.0 : 0.4;
            })
            .style("cursor", d => {
                const cleanName = getCleanName(d.properties.name);
                const stats = dataMap.get(cleanName);
                return (stats && +stats.gdp_per_capita <= 2000) ? "pointer" : "default";
            })
            .on("mouseover", function(event, d) {
                const cleanName = getCleanName(d.properties.name);
                const stats = dataMap.get(cleanName);
                
                // Highlight on hover
                d3.select(this).attr("stroke", "#67acd4").attr("stroke-width", 2).raise();

                tip.transition().duration(100).style("opacity", 1);
                tip.html(`
                    <div class="font-bold border-b mb-1">${cleanName}</div>
                    <div class="text-xs">GDP: ${stats ? '$' + Math.round(stats.gdp_per_capita) : 'No Data'}</div>
                    ${(stats && +stats.gdp_per_capita <= 2000) ? 
                        '<div class="text-[10px] text-indigo-600 font-bold mt-1">Click to analyze access gap</div>' : 
                        '<div class="text-[10px] text-gray-400">GDP > $2000</div>'}
                `);
            })
            .on("mousemove", (event) => tip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px"))
            .on("mouseout", function(event, d) {
                const cleanName = getCleanName(d.properties.name);
                const stats = dataMap.get(cleanName);
                
                // Reset stroke based on original condition
                d3.select(this)
                    .attr("stroke", (stats && +stats.gdp_per_capita <= 2000) ? " #a5cce5" : "#cbd5e1")
                    .attr("stroke-width", (stats && +stats.gdp_per_capita <= 2000) ? 1 : 0.4);
                
                tip.transition().duration(100).style("opacity", 0);
            })
            .on("click", (event, d) => {
                const cleanName = getCleanName(d.properties.name);
                const stats = dataMap.get(cleanName);
                if (stats && +stats.gdp_per_capita <= 2000) {
                    onCountrySelect(cleanName);
                }
            });
    });
}

// main function for Dashboard 4
export function electricity_vs_cleancooking(csvPath, svgId, yearOverride) {
    d3.csv(csvPath).then(data => {
        // year from the slider, or default to the latest in data
        const currentYear = yearOverride || d3.max(data, d => +d.year);
        // count countries with GDP per capita <= 2000
        const poorCountries = data.filter(d => +d.year === currentYear && +d.gdp_per_capita <= 2000 && d.gdp_per_capita != "");
        const countDisplay = document.getElementById('poor-country-count');
        if (countDisplay) countDisplay.textContent = poorCountries.length;
        // auto select the largest gap
        const topCountry = [...poorCountries].sort((a,b) => {
            const gapA = (+a.access_to_electricity || 0) - (+a.access_to_clean_fuels_for_cooking || 0);
            const gapB = (+b.access_to_electricity || 0) - (+b.access_to_clean_fuels_for_cooking || 0);
            return gapB - gapA;
        })[0];

        // Draw Slot 1 -- Map
        draw_interactive_atlas(data, currentYear, "#svg-slot-1", (countryName) => {
            updateAnalysis(data, countryName, currentYear);
        });

        // Load default analysis
        if (topCountry) {
            updateAnalysis(data, topCountry.country, currentYear);
        }

        function updateAnalysis(fullData, countryName, year) {
            //lower slots
            document.querySelectorAll('#chart-slot-2, #chart-slot-3').forEach(el => el.classList.remove('hidden'));

            draw_gap_comparison(fullData, countryName, "#svg-slot-2", year);
            draw_historical_trend(fullData, countryName, "#svg-slot-3");
        }
    });
}
// bar chart - Access Gap Analysis
function draw_gap_comparison(data, countryName, svgId, year) {
    const svg = d3.select(svgId);
    svg.selectAll("*").remove();
    const width = 800; 
    const height = 500; 
    const margin = { top: 80, right: 60, bottom: 60, left: 180 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const stats = data.find(d => d.country === countryName && +d.year === year);
    if (!stats) return;

    const metrics = [
        { name: "Electricity Access", val: +stats.access_to_electricity || 0, color: "#67acd4" },
        { name: "Clean Cooking Access", val: +stats.access_to_clean_fuels_for_cooking || 0, color:  "#a5cce5"}
    ];

    const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
    const y = d3.scaleBand().domain(metrics.map(m => m.name)).range([margin.top, height - margin.bottom]).padding(0.4);

    svg.append("text").attr("x", width/2).attr("y", 30).attr("text-anchor", "middle").attr("class", "text-xl font-black")
       .text(`Access Gap: ${countryName} (${year})`);

    svg.selectAll("rect").data(metrics).join("rect")
        .attr("x", margin.left).attr("y", d => y(d.name)).attr("width", d => x(d.val) - margin.left).attr("height", y.bandwidth())
        .attr("fill", d => d.color).attr("rx", 4); 

    //labels inside or next to bars
    svg.selectAll(".label").data(metrics).join("text")
        .attr("x", d => x(d.val) + 5).attr("y", d => y(d.name) + y.bandwidth()/2 + 5)
        .text(d => d.val.toFixed(1) + "%").attr("class", "text-sm font-bold");

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
}

//in Clean Cooking
function draw_historical_trend(data, countryName, svgId) {
    const svg = d3.select(svgId);
    svg.selectAll("*").remove();
    
    const history = data.filter(d => d.country === countryName).sort((a,b) => +a.year - +b.year);
    if (history.length === 0) return;

    const width = 800; 
    const height = 500;
    const margin = { top: 80, right: 60, bottom: 80, left: 80 };

    const x = d3.scaleLinear().domain(d3.extent(history, d => +d.year)).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);

    const line = d3.line().x(d => x(+d.year)).y(d => y(+d.access_to_clean_fuels_for_cooking || 0));

    svg.append("path").datum(history).attr("fill", "none").attr("stroke", "#67acd4").attr("stroke-width", 3).attr("d", line);
    
    svg.append("text").attr("x", width/2).attr("y", 30).attr("text-anchor", "middle").attr("class", "text-xl font-black")
       .text(`Trend: Clean Cooking Access in ${countryName}`);
    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).tickFormat(d => d + "%"));
}