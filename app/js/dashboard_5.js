export function draw_fossil_vs_lowcarbon(data_path, containerId, year, selectedCountry = null) {
    const svg = d3.select(containerId);
    const width = 1000;
    const height = 450;
    const margin = { top: 40, right: 150, bottom: 60, left: 180 };

    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    d3.csv(data_path).then(data => {
        // process Data & Calculate Percentages
        let yearData = data.filter(d => +d.year === year && d.country !== "World");
        
        yearData.forEach(d => {
            const fossil = +d.electricity_from_fuels || 0;
            const lowCarbon = (+d.electricity_from_nuclear || 0) + (+d.electricity_from_renewables || 0);
            const total = fossil + lowCarbon;
            
            d.fossil_pct = total > 0 ? (fossil / total) * 100 : 0;
            d.low_carbon_pct = total > 0 ? (lowCarbon / total) * 100 : 0;
        });

        // show Top 10 and selected Country is visible
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

        // Bars (Stacked)
        const g = svg.append("g");

        // Fossil Part (Red)
        g.selectAll(".bar-fossil")
            .data(displayData)
            .join("rect")
            .attr("y", d => y(d.country))
            .attr("x", margin.left)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.fossil_pct) - margin.left)
            .attr("fill", "#ef4444");

        // Low Carbon Part (Green) - Stacks after Fossil
        g.selectAll(".bar-green")
            .data(displayData)
            .join("rect")
            .attr("y", d => y(d.country))
            .attr("x", d => x(d.fossil_pct))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.fossil_pct + d.low_carbon_pct) - x(d.fossil_pct))
            .attr("fill", "#22c55e");

        // Labels
        g.selectAll(".pct-label")
            .data(displayData)
            .join("text")
            .attr("x", d => x(100) + 10)
            .attr("y", d => y(d.country) + y.bandwidth()/2 + 5)
            .text(d => `${Math.round(d.low_carbon_pct)}% Green`)
            .attr("class", "text-sm font-bold fill-emerald-700");

        // axes
        svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat(d => d + "%"));
        svg.append("g").attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-weight", d => d === selectedCountry ? "900" : "normal")
            .style("fill", d => d === selectedCountry ? "#065f46" : "#374151");
        
        // Legend
        const legend = svg.append("g").attr("transform", `translate(${width/2 - 100}, 15)`);
        legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", "#ef4444");
        legend.append("text").attr("x", 20).attr("y", 12).text("Fossil").attr("class", "text-xs");
        legend.append("rect").attr("x", 80).attr("width", 15).attr("height", 15).attr("fill", "#22c55e");
        legend.append("text").attr("x", 100).attr("y", 12).text("Low Carbon").attr("class", "text-xs");
    });
}