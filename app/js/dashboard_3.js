export function draw_correlation_scatter(data_path, containerId = '#d3-chart') {
    const svg = d3.select(containerId);
    const container = svg.node() ? svg.node().parentNode : { clientWidth: 800 }; 
    const width = container.clientWidth || 800;
    const height = 450; 
    const tooltip = d3.select("#tooltip");

    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMinYMin meet");

    const margin = { top: 60, right: 30, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv(data_path).then(raw_data => {
        let cleanedData = raw_data
            .filter(d => 
                !isNaN(+d.gdp_per_capita) && 
                !isNaN(+d.energy_consumption_per_person)
            );

        const aggregatedData = Array.from(d3.rollup(
            cleanedData, 
            v => ({
                avg_gdp: d3.mean(v, d => +d.gdp_per_capita),
                avg_energy: d3.mean(v, d => +d.energy_consumption_per_person),
                num_years: v.length
            }),
            d => d.country 
        )).map(([country, values]) => ({
            country: country,
            gdp: values.avg_gdp,
            energy: values.avg_energy,
            num_years: values.num_years
        }));
        
        let data = aggregatedData.filter(d => d.gdp > 0 && d.energy > 0); 

        if (data.length === 0) {
            g.append("text")
                .attr("x", innerWidth / 2)
                .attr("y", innerHeight / 2)
                .attr("text-anchor", "middle")
                .attr("fill", "red")
                .text(`No valid aggregated data found.`);
            return;
        }
        
        const x = d3.scaleLog() 
            .domain([d3.min(data, d => d.gdp), d3.max(data, d => d.gdp) * 1.1])
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.energy) * 1.05])
            .range([innerHeight, 0]);

        // AXES
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).ticks(5, d3.format("$,.0s")))
            .attr("class", "text-black font-medium");

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")))
            .attr("class", "text-black font-medium");

        // DATA POINTS (DOTS)
        g.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.gdp))
            .attr("cy", d => y(d.energy))
            .attr("r", 5) 
            .attr("fill", "#67acd4") // BLUE
            .attr("opacity", 0.7)
            .attr("stroke", "#4fa0c0") // Slightly darker blue for contrast
            
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("r", 8)
                    .attr("opacity", 1)
                    .attr("stroke", "#000"); // Black highlight on hover

                tooltip.transition()
                    .duration(100)
                    .style("opacity", 1);
                
                tooltip.html(`
                    <strong>${d.country}</strong><br>
                    Avg. GDP p/c: ${d3.format("$,.0f")(d.gdp)}<br>
                    Avg. Energy p/c: ${d3.format(".2s")(d.energy)}
                `);
            })
            .on("mousemove", function(event) {
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                tooltip.style("left", (event.clientX + scrollX + 15) + "px")
                       .style("top", (event.clientY + scrollY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("r", 5)
                    .attr("opacity", 0.7)
                    .attr("stroke", "#4fa0c0");

                tooltip.transition()
                    .duration(100)
                    .style("opacity", 0);
            });

        // LABELS & TITLES (BLACK/GRAY)
        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 10)
            .style("text-anchor", "middle")
            .attr("fill", "#000")
            .attr("class", "text-sm font-bold")
            .text("Average GDP Per Capita (US$)");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 20)
            .attr("x", 0 - (innerHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("fill", "#000")
            .attr("class", "text-sm font-bold")
            .text("Average Energy Consumption Per Person");

        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", 0 - margin.top + 30)
            .attr("text-anchor", "middle")
            .attr("class", "text-xl font-black")
            .attr("fill", "#000")
            .text(`Global Wealth vs. Energy Consumption`);
            
    });
}