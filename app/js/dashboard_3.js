export function draw_correlation_scatter(data_path, containerId = '#d3-chart') {
    const svg = d3.select(containerId);
    const container = svg.node() ? svg.node().parentNode : { clientWidth: 800 }; 
    const width = container.clientWidth || 800;
    const height = 450; 
    const margin = { top: 60, right: 30, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

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

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight);

    const mainGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv(data_path).then(raw_data => {
        let cleanedData = raw_data.filter(d => !isNaN(+d.gdp_per_capita) && !isNaN(+d.energy_consumption_per_person));

        const aggregatedData = Array.from(d3.rollup(
            cleanedData, 
            v => ({
                avg_gdp: d3.mean(v, d => +d.gdp_per_capita),
                avg_energy: d3.mean(v, d => +d.energy_consumption_per_person)
            }),
            d => d.country 
        )).map(([country, values]) => ({
            country: country,
            gdp: values.avg_gdp,
            energy: values.avg_energy
        }));
        
        let data = aggregatedData.filter(d => d.gdp > 0 && d.energy > 0); 

        const x = d3.scaleLog() 
            .domain([d3.min(data, d => d.gdp), d3.max(data, d => d.gdp) * 1.1])
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.energy) * 1.05])
            .range([innerHeight, 0]);

        // Create axis containers
        const xAxisG = mainGroup.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .attr("class", "x-axis text-black font-medium");

        const yAxisG = mainGroup.append("g")
            .attr("class", "y-axis text-black font-medium");

        const xAxis = d3.axisBottom(x).ticks(5, d3.format("$,.0s"));
        const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s"));

        xAxisG.call(xAxis);
        yAxisG.call(yAxis);

        // Dot container with clip-path
        const dotGroup = mainGroup.append("g")
            .attr("clip-path", "url(#clip)");

        const dots = dotGroup.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.gdp))
            .attr("cy", d => y(d.energy))
            .attr("r", 5) 
            .attr("fill", "#67acd4")
            .attr("opacity", 0.7)
            .attr("stroke", "#4fa0c0")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 8).attr("opacity", 1).attr("stroke", "#000");
                tooltip.transition().duration(100).style("opacity", 1);
                tooltip.html(`<strong>${d.country}</strong><br>Avg. GDP: ${d3.format("$,.0f")(d.gdp)}<br>Avg. Energy: ${d3.format(".2s")(d.energy)}`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("r", 5).attr("opacity", 0.7).attr("stroke", "#4fa0c0");
                tooltip.transition().duration(100).style("opacity", 0);
            });

        // ZOOM LOGIC
        const zoom = d3.zoom()
            .scaleExtent([0.5, 20])
            .extent([[0, 0], [innerWidth, innerHeight]])
            .on("zoom", (event) => {
                const newX = event.transform.rescaleX(x);
                const newY = event.transform.rescaleY(y);

                // Update Axes
                xAxisG.call(xAxis.scale(newX));
                yAxisG.call(yAxis.scale(newY));

                // Update Dots
                dots.attr("cx", d => newX(d.gdp))
                    .attr("cy", d => newY(d.energy));
            });

        svg.call(zoom);

        // Labels (drawn on svg directly to stay fixed)
        mainGroup.append("text")
            .attr("x", innerWidth / 2).attr("y", innerHeight + margin.bottom - 10)
            .attr("text-anchor", "middle").attr("class", "text-sm font-bold").text("Average GDP Per Capita (US$)");

        mainGroup.append("text")
            .attr("transform", "rotate(-90)").attr("y", -60).attr("x", -innerHeight / 2)
            .attr("text-anchor", "middle").attr("class", "text-sm font-bold").text("Average Energy Consumption");

        mainGroup.append("text")
            .attr("x", innerWidth / 2).attr("y", -20)
            .attr("text-anchor", "middle").attr("class", "text-xl font-black").text("Global Wealth vs. Energy Consumption");
    });
}