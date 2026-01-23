export function draw_fossil_vs_lowcarbon(data_path, containerId, year, selectedCountry = null) {
    const svg = d3.select(containerId);
    const width = 1000;
    const height = 500;
    const margin = { top: 40, right: 150, bottom: 60, left: 180 };

    // Tooltip initialization
    d3.select("#chart-tooltip").remove();
    const tip = d3.select("body").append("div")
        .attr("id", "chart-tooltip")
        .style("position", "absolute").style("z-index", "9999").style("opacity", 0)
        .style("background", "white").style("padding", "10px").style("border", "2px solid #67acd4")
        .style("border-radius", "8px").style("pointer-events", "none")
        .style("font-family", "sans-serif").style("font-size", "12px")
        .style("box-shadow", "0 4px 10px rgba(0,0,0,0.1)");

    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet")
       .classed("w-full h-auto", true);

    d3.csv(data_path).then(data => {
        let yearData = data.filter(d => +d.year === year && d.country !== "World");
        
        yearData.forEach(d => {
            const fossil = +d.electricity_from_fuels || 0;
            const lowCarbon = (+d.electricity_from_nuclear || 0) + (+d.electricity_from_renewables || 0);
            const total = fossil + lowCarbon;
            
            d.fossil_pct = total > 0 ? (fossil / total) * 100 : 0;
            d.low_carbon_pct = total > 0 ? (lowCarbon / total) * 100 : 0;
        });

        let displayData = yearData.sort((a, b) => b.low_carbon_pct - a.low_carbon_pct).slice(0, 10);
        
        if (selectedCountry) {
            const countryStats = yearData.find(d => d.country === selectedCountry);
            if (countryStats && !displayData.find(d => d.country === selectedCountry)) {
                displayData.pop(); 
                displayData.push(countryStats);
            }
        }

        const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
        const y = d3.scaleBand().domain(displayData.map(d => d.country)).range([margin.top, height - margin.bottom]).padding(0.3);

        const g = svg.append("g");

        // Helper for mouse events to avoid repetition
        const showTooltip = (event, d) => {
            tip.style("opacity", 1)
               .html(`
                <div class="font-bold border-b mb-1">${d.country}</div>
                <div style="color: #4682b4">● Fossil: ${Math.round(d.fossil_pct)}%</div>
                <div style="color: #87ceeb">● Low Carbon: ${Math.round(d.low_carbon_pct)}%</div>
               `);
        };

        const moveTooltip = (event) => {
            tip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
        };

        const hideTooltip = () => tip.style("opacity", 0);

        // Fossil Part
        g.selectAll(".bar-fossil")
            .data(displayData)
            .join("rect")
            .attr("class", "bar-fossil")
            .attr("y", d => y(d.country))
            .attr("x", margin.left)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.fossil_pct) - margin.left)
            .attr("fill", "#67acd4")
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip);

        // Low Carbon Part
        g.selectAll(".bar-green")
            .data(displayData)
            .join("rect")
            .attr("class", "bar-green")
            .attr("y", d => y(d.country))
            .attr("x", d => x(d.fossil_pct))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.fossil_pct + d.low_carbon_pct) - x(d.fossil_pct))
            .attr("fill", "#a5cce5")
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip);

        // Label
        g.selectAll(".pct-label")
            .data(displayData)
            .join("text")
            .attr("x", d => x(100) + 10)
            .attr("y", d => y(d.country) + y.bandwidth()/2 + 5)
            .text(d => `${Math.round(d.low_carbon_pct)}% Green`)
            .attr("class", "text-sm font-bold")
            .attr("fill", "#000000"); 

        // Axes
        svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat(d => d + "%"));
        svg.append("g").attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-weight", d => d === selectedCountry ? "900" : "normal")
            .style("fill", "#000000"); 
        
        // Legend
        const legend = svg.append("g").attr("transform", `translate(${width/2 - 100}, 15)`);
        legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", "#67acd4");
        legend.append("text").attr("x", 20).attr("y", 12).text("Fossil").attr("class", "text-xs font-bold").attr("fill", "#000");
        legend.append("rect").attr("x", 80).attr("width", 15).attr("height", 15).attr("fill", "#a5cce5");
        legend.append("text").attr("x", 100).attr("y", 12).text("Low Carbon").attr("class", "text-xs font-bold").attr("fill", "#000");
    });
}