export function draw_germany_renewables_timeseries(data_path, containerId = '#d3-chart') {
    const svg = d3.select(containerId);
    const container = svg.node() ? svg.node().parentNode : { clientWidth: 800 }; 
    const width = container.clientWidth || 800;
    const height = 400;
    // const tooltip = d3.select("#tooltip");

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

    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMinYMin meet");

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv(data_path).then(raw_data => {
        
        const startYear = 2000;

        const filteredData = raw_data.filter(d => 
            d.country === 'Germany' && +d.year >= startYear && !isNaN(+d.electricity_from_renewables)
        );

        const aggregatedData = d3.rollup(
            filteredData,
            v => d3.sum(v, d => +d.electricity_from_renewables), 
            d => +d.year 
        );

        let data = Array.from(aggregatedData, ([year, renewables_generation]) => ({
            year: year, 
            renewables_generation: renewables_generation
        }))
        .sort((a, b) => a.year - b.year);

        if (data.length === 0) {
            g.append("text")
                .attr("x", innerWidth / 2)
                .attr("y", innerHeight / 2)
                .attr("text-anchor", "middle")
                .attr("fill", "#ef4444")
                .text("No data found for Germany from " + startYear + " onwards.");
            return;
        }

        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year)) 
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.renewables_generation) * 1.05])
            .range([innerHeight, 0]);

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.renewables_generation));

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSizeOuter(0).ticks(10))
            .attr("class", "text-gray-600");

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")))
            .attr("class", "text-gray-600");
        
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#10b981")
            .attr("stroke-width", 3)
            .attr("d", line);

        g.selectAll("dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "data-point")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.renewables_generation))
            .attr("r", 5) 
            .attr("fill", "#10b981")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("r", 7)
                    .attr("fill", "#3b82f6"); 

                tooltip.transition()
                    .duration(100)
                    .style("opacity", 1);
                
                tooltip.html(`
                    <strong>Year:</strong> ${d.year}<br>
                    <strong>Renewables:</strong> ${d3.format(".3s")(d.renewables_generation)}
                `);
            })
            .on("mousemove", function(event) {
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                tooltip.style("left", (event.clientX + scrollX + 15) + "px")
                       .style("top", (event.clientY + scrollY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .attr("r", 5)
                    .attr("fill", "#10b981"); 

                tooltip.transition()
                    .duration(100)
                    .style("opacity", 0);
            });
            
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (innerHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("fill", "#4b5563")
            .text("Renewables Generation (TWh)");

         g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 10)
            .style("text-anchor", "middle")
            .attr("fill", "#4b5563")
            .text("Year");


    });
}