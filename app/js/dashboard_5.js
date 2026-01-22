export function draw_fossil_vs_lowcarbon(data_path, containerId, year, selectedCountry = null) {
    const svg = d3.select(containerId);
    const width = 1000;
    const height = 500;
    const margin = { top: 40, right: 150, bottom: 60, left: 180 };

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

        // Fossil Part (Blue: #67acd4)
        g.selectAll(".bar-fossil")
            .data(displayData)
            .join("rect")
            .attr("y", d => y(d.country))
            .attr("x", margin.left)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.fossil_pct) - margin.left)
            .attr("fill", "#67acd4");

        // Low Carbon Part (Lighter Blue: #a5cce5)
        g.selectAll(".bar-green")
            .data(displayData)
            .join("rect")
            .attr("y", d => y(d.country))
            .attr("x", d => x(d.fossil_pct))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.fossil_pct + d.low_carbon_pct) - x(d.fossil_pct))
            .attr("fill", "#a5cce5");

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
            .style("fill", "#000000"); // Standard Black
        
        // Legend
        const legend = svg.append("g").attr("transform", `translate(${width/2 - 100}, 15)`);
        
        // Match Fossil color
        legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", "#67acd4");
        legend.append("text").attr("x", 20).attr("y", 12).text("Fossil").attr("class", "text-xs font-bold").attr("fill", "#000");
        
        // Match Low Carbon color
        legend.append("rect").attr("x", 80).attr("width", 15).attr("height", 15).attr("fill", "#a5cce5");
        legend.append("text").attr("x", 100).attr("y", 12).text("Low Carbon").attr("class", "text-xs font-bold").attr("fill", "#000");
    });
}