export function fossil_vs_lowcarbon(csvPath, svgId) {
    d3.csv(csvPath).then(data => {
        // Convert numeric columns
        data.forEach(d => {
            d.electricity_from_fuels = +d.electricity_from_fuels;
            d.electricity_from_nuclear = +d.electricity_from_nuclear;
            d.electricity_from_renewables = +d.electricity_from_renewables;
            d.low_carbon_electricity_percentage = +d.low_carbon_electricity_percentage;
            d.energy_consumption_per_person = +d.energy_consumption_per_person;
            d.year = +d.year;
        });

        // Get latest year
        const latestYear = d3.max(data, d => d.year);
        const latestData = data.filter(d => d.year === latestYear);

        // Compute fossil fuel dependence %
        latestData.forEach(d => {
            const total = d.electricity_from_fuels + d.electricity_from_nuclear + d.electricity_from_renewables;
            d.fossil_dependence = total ? (d.electricity_from_fuels / total) * 100 : 0;
        });

        // Get top 10 countries by fossil dependence
        const top10 = latestData.sort((a, b) => b.fossil_dependence - a.fossil_dependence).slice(0, 10);

        const svg = d3.select(svgId);
        svg.selectAll("*").remove();

        const width = parseInt(svg.style("width"));
        const height = parseInt(svg.style("height"));
        const margin = { top: 40, right: 50, bottom: 50, left: 120 };

        const xMax = d3.max(top10, d => Math.max(d.fossil_dependence, d.low_carbon_electricity_percentage));
        const x = d3.scaleLinear().domain([0, xMax]).range([margin.left, width - margin.right]);

        const y = d3.scaleBand()
            .domain(top10.map(d => d.country))
            .range([margin.top, height - margin.bottom])
            .padding(0.3);

        const barHeight = y.bandwidth() / 2;

        // Axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + "%"));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        // Labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 10)
            .attr("text-anchor", "middle")
            .text("Percentage (%)");

        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", 20)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .text("Country");

        // Bars
        svg.selectAll(".fossil-bar")
            .data(top10)
            .enter()
            .append("rect")
            .attr("class", "fossil-bar")
            .attr("x", x(0))
            .attr("y", d => y(d.country))
            .attr("height", barHeight)
            .attr("width", d => x(d.fossil_dependence) - x(0))
            .attr("fill", "#dc2626")
            .append("title")
            .text(d => `Fossil: ${d.fossil_dependence.toFixed(1)}%`);

        svg.selectAll(".lowcarbon-bar")
            .data(top10)
            .enter()
            .append("rect")
            .attr("class", "lowcarbon-bar")
            .attr("x", x(0))
            .attr("y", d => y(d.country) + barHeight)
            .attr("height", barHeight)
            .attr("width", d => x(d.low_carbon_electricity_percentage) - x(0))
            .attr("fill", "#2563eb")
            .append("title")
            .text(d => `Low-Carbon: ${d.low_carbon_electricity_percentage}%`);

        // Optional: add legend
        svg.append("rect").attr("x", width - margin.right - 100).attr("y", margin.top - 30).attr("width", 15).attr("height", 15).attr("fill", "#dc2626");
        svg.append("text").attr("x", width - margin.right - 80).attr("y", margin.top - 18).text("Fossil").attr("alignment-baseline", "middle");
        svg.append("rect").attr("x", width - margin.right - 50).attr("y", margin.top - 30).attr("width", 15).attr("height", 15).attr("fill", "#2563eb");
        svg.append("text").attr("x", width - margin.right - 30).attr("y", margin.top - 18).text("Low-Carbon").attr("alignment-baseline", "middle");
    });
}
