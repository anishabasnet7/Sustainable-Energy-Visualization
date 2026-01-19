
//Spatial View (World Map)
export function draw_access_gap_map(fullData, year, containerId, top5Names) {
    const svg = d3.select(containerId);
    const width = 800; const height = 400;
    const tip = d3.select("#tooltip"); 
    svg.selectAll("*").remove();

    const g = svg.append("g");
    const projection = d3.geoNaturalEarth1().scale(130).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);
    
    // Purple for Access Gap intensity
    const colorScale = d3.scaleSequential(d3.interpolatePurples).domain([0, 80]);
    const topSet = new Set(top5Names);

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
        const yearData = fullData.filter(d => +d.year === year);
        const dataMap = new Map(yearData.map(d => [
            d.country, 
            (+d.access_to_electricity || 0) - (+d.access_to_clean_fuels_for_cooking || 0)
        ]));

        g.selectAll("path")
            .data(world.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                let name = (d.properties.name === "USA") ? "United States" : d.properties.name;
                const gap = dataMap.get(name);
                return (gap !== undefined && gap > 0) ? colorScale(gap) : "#f1f5f9";
            })
            .attr("stroke", d => {
                let name = (d.properties.name === "USA") ? "United States" : d.properties.name;
                return topSet.has(name) ? "#4c1d95" : "#cbd5e1"; //thick dark purple for top 5
            })
            .attr("stroke-width", d => {
                let name = (d.properties.name === "USA") ? "United States" : d.properties.name;
                return topSet.has(name) ? 2 : 0.5;
            })
            .style("cursor", "pointer")
             .on("mouseover", function(event, d) {
                let name = (d.properties.name === "USA") ? "United States" : d.properties.name;
                const gap = dataMap.get(name);
                
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);

                tip.transition().duration(100).style("opacity", 1);
                tip.html(`
                    <div class="font-bold border-b border-gray-600 mb-1">${name}</div>
                    <div>Year: ${year}</div>
                    <div>Access Gap: ${gap !== undefined ? gap.toFixed(1) + '%' : 'No Data'}</div>
                    ${topSet.has(name) ? '<div class="text-purple-400 font-bold mt-1">★ In Top 5 Gap</div>' : ''}
                `);
            })
            .on("mousemove", function(event) {
                tip.style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                let name = (d.properties.name === "USA") ? "United States" : d.properties.name;
                d3.select(this)
                    .attr("stroke", topSet.has(name) ? "#4c1d95" : "#cbd5e1")
                    .attr("stroke-width", topSet.has(name) ? 2 : 0.5);

                tip.transition().duration(100).style("opacity", 0);
            })
            .on("click", (event, d) => {
                let name = (d.properties.name === "USA") ? "United States" : d.properties.name;   
                 });
    });
}

//Controller and Bar Chart
export function electricity_vs_cleancooking(csvPath, svgId) {
    d3.csv(csvPath).then(data => {
        const latestYear = d3.max(data, d => +d.year);
        let currentYear = latestYear;

        //Slider UI
        const sliderDiv = d3.select("#slider-container");
        sliderDiv.html(`
            <div class="flex flex-col gap-2 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-indigo-800">Year: <span id="year-val" class="text-xl">${latestYear}</span></span>
                    <span class="text-xs text-indigo-600 bg-white px-2 py-1 rounded border">Filtering: GDP ≤ 2000</span>
                </div>
                <input type="range" id="year-slider" min="2000" max="${latestYear}" value="${latestYear}" class="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer">
            </div>
        `);

        const svg = d3.select(svgId);
        const width = 600; const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 150 };
        const x = d3.scaleLinear().range([margin.left, width - margin.right]);
        const y = d3.scaleBand().range([margin.top, height - margin.bottom]).padding(0.2);

        function runLogic() {
            //Filter slice (Year + GDP)
            const slice = data.filter(d => +d.year === currentYear && +d.gdp_per_capita <= 2000);
            
            //Gap column for this slice
            slice.forEach(d => {
                d.gap = (+d.access_to_electricity || 0) - (+d.access_to_clean_fuels_for_cooking || 0);
            });

            //Rank and keep Top 5
            const top5 = slice.sort((a, b) => b.gap - a.gap).slice(0, 5);
            const top5Names = top5.map(d => d.country);

            //Update Bar Chart (Ranking)
            svg.selectAll("*").remove();
            x.domain([0, 100]);
            y.domain(top5Names);
            svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
            svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
            svg.selectAll(".bar").data(top5).join("rect")
                .attr("x", margin.left).attr("y", d => y(d.country)).attr("height", y.bandwidth())
                .attr("fill", "#7c3aed").attr("width", d => x(d.gap) - margin.left);

            //Pass names to Spatial Map (Slot 1)
            draw_access_gap_map(data, currentYear, "#svg-slot-1", top5Names);

            //Pass names to Trend Line (Slot 3) - Full Data
            draw_historical_trend(data, "#svg-slot-3", top5Names);
            document.getElementById('title-slot-3').textContent = `Historical Clean Cooking Trend: Top 5 of ${currentYear}`;
        }

        document.getElementById('year-slider').addEventListener('input', function() {
            currentYear = +this.value;
            document.getElementById('year-val').textContent = currentYear;
            runLogic();
        });

        runLogic();
    });
}

//Historical Trend (Full Time Series)
export function draw_historical_trend(fullData, svgId, top5Names) {
    const svg = d3.select(svgId);
    svg.selectAll("*").remove();
    const width = 600; const height = 350;
    const margin = { top: 30, right: 120, bottom: 50, left: 60 };

    //ALL historical rows for the selected countries
    const history = fullData.filter(d => top5Names.includes(d.country));
    
    const x = d3.scaleLinear().domain(d3.extent(fullData, d => +d.year)).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(top5Names);
    const groups = d3.group(history, d => d.country);

    groups.forEach((values, key) => {
        values.sort((a, b) => +a.year - +b.year);
        svg.append("path").datum(values).attr("fill", "none").attr("stroke", color(key)).attr("stroke-width", 2.5)
           .attr("d", d3.line().x(d => x(+d.year)).y(d => y(+d.access_to_clean_fuels_for_cooking || 0)));

        const last = values[values.length - 1];
        svg.append("text").attr("x", x(+last.year) + 5).attr("y", y(+last.access_to_clean_fuels_for_cooking || 0))
           .text(key).attr("fill", color(key)).style("font-size", "11px").attr("alignment-baseline", "middle");
    });
}