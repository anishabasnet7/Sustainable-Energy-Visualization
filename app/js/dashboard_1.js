export function draw_overall_co2_timeseries(data_path, containerId = '#d3-chart') {
    const svg = d3.select(containerId);
    const container = svg.node() ? svg.node().parentNode : { clientWidth: 800 }; 
    const width = container.clientWidth || 800;
    const height = 400;

    d3.select("#chart-tooltip").remove();

    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "chart-tooltip")
        .style("position", "absolute")
        .style("z-index", "9999")
        .style("opacity", 0)
        .style("background", "white")
        .style("color", "#000")
        .style("padding", "10px")
        .style("border", "2px solid #67acd4")
        .style("border-radius", "8px")
        .style("pointer-events", "none") 
        .style("font-family", "sans-serif")
        .style("font-size", "12px")
        .style("box-shadow", "0 4px 10px rgba(0,0,0,0.1)");

    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMinYMin meet");

    const margin = { top: 40, right: 30, bottom: 50, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv(data_path).then(raw_data => {
        const startYear = 2000;
        const endYear = 2019;

        const aggregatedData = d3.rollup(
            raw_data,
            v => d3.sum(v, d => +d.total_co2_emissions /1000000000), 
            d => +d.year 
        );

        let data = Array.from(aggregatedData, ([year, total_emission]) => ({
            year: year, 
            total_emission: total_emission
        }))
        .filter(d => d.year >= startYear && d.year <= endYear)
        .sort((a, b) => a.year - b.year);
        
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year)) 
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total_emission) * 1.05])
            .range([innerHeight, 0]);

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.total_emission))
            .curve(d3.curveMonotoneX);

        // AXES (Black)
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSizeOuter(0).ticks(10))
            .attr("class", "text-black font-medium");

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")))
            .attr("class", "text-black font-medium");
        
        // LINE (Blue)
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#67acd4")
            .attr("stroke-width", 4)
            .attr("d", line);

        // DOTS (Blue)
        g.selectAll("dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "data-point")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.total_emission))
            .attr("r", 5) 
            .attr("fill", "#67acd4")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 8).attr("fill", "#000"); // Highlight black
                tooltip.transition().duration(100).style("opacity", 1);
                tooltip.html(`<strong>Year:</strong> ${d.year}<br><strong>Emissions:</strong> ${d3.format(".3s")(d.total_emission)}`);
            })
            .on("mousemove", function(event) {
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                tooltip.style("left", (event.clientX + scrollX + 15) + "px").style("top", (event.clientY + scrollY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("r", 5).attr("fill", "#67acd4");
                tooltip.transition().duration(100).style("opacity", 0);
            });
            
        // LABELS (Black)
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 15)
            .attr("x", 0 - (innerHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("fill", "#000")
            .attr("class", "text-sm font-bold")
            .text("Total CO2 Emissions (Billion Tons)");

    });
}

export function draw_top10_co2_emiters(data_path, containerId = '#d3-chart') {
    const svg = d3.select(containerId);
    const container = svg.node() ? svg.node().parentNode : { clientWidth: 800 }; 
    const width = container.clientWidth || 800;
    const height = 400;

    d3.select("#chart-tooltip2").remove();

    const tooltip2 = d3.select("body")
        .append("div")
        .attr("id", "chart-tooltip2")
        .style("position", "absolute")
        .style("z-index", "9999")
        .style("opacity", 0)
        .style("background", "white")
        .style("color", "#000")
        .style("padding", "10px")
        .style("border", "2px solid #67acd4")
        .style("border-radius", "8px")
        .style("pointer-events", "none") 
        .style("font-family", "sans-serif")
        .style("font-size", "12px")
        .style("box-shadow", "0 4px 10px rgba(0,0,0,0.1)");

    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMinYMin meet");

    const margin = { top: 40, right: 30, bottom: 80, left: 70 }; 
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv(data_path).then(raw_data => {
        const aggregatedData = d3.rollup(
            raw_data,
            v => d3.sum(v, d => +d.total_co2_emissions/1000000000), 
            d => d.country
        );

        let data = Array.from(aggregatedData, ([country, total_emission]) => ({
            country: country, 
            total_emission: total_emission
        }))
        .sort((a, b) => b.total_emission - a.total_emission)
        .slice(0, 10);

        const x = d3.scaleBand()
            .domain(data.map(d => d.country)) 
            .range([0, innerWidth])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total_emission) * 1.05])
            .range([innerHeight, 0]);

        // AXES (Black)
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .attr("class", "text-black font-medium")
            .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end");

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s"))) 
            .attr("class", "text-black font-medium");
        
        // BARS (Blue)
        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.country))
            .attr("y", innerHeight)
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", "#67acd4") 
            .attr("rx", 4)
            .on("mouseover", function(event, d) {
                d3.select(this).style("opacity", 0.5);
                tooltip2.transition().duration(200).style("opacity", 1);
                tooltip2.html(`<strong>Country:</strong> ${d.country}<br><strong>Total Emissions:</strong> ${d3.format(".3s")(d.total_emission)}`);
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                tooltip2.style("left", (event.clientX + scrollX + 15) + "px").style("top", (event.clientY + scrollY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 1);
                tooltip2.transition().duration(100).style("opacity", 0);
            })
            .transition()
            .duration(800)
            .attr("y", d => y(d.total_emission))
            .attr("height", d => innerHeight - y(d.total_emission));
        
        // LABELS (Black)
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 15)
            .attr("x", 0 - (innerHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("fill", "#000")
            .attr("class", "text-sm font-bold")
            .text("Total CO2 Emissions (Billion Tons)");

    });
}