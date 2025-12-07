export function fossil_vs_lowcarbon(csvPath, svgId) {
    d3.csv(csvPath).then(data => {
        
        //process Data
        data.forEach(d => {
            d.country = d.country; 
            d.year = +d.year;
            d.fossil_val = +d.electricity_from_fuels || 0;
            d.nuclear_val = +d.electricity_from_nuclear || 0;
            d.renewables_val = +d.electricity_from_renewables || 0;
            d.low_carbon_pct = +d.low_carbon_electricity_percentage || 0;
        });

        const minYear = d3.min(data, d => d.year);
        const maxYear = d3.max(data, d => d.year);
        
        let currentYear = maxYear;
        let currentSort = 'fossil';

        //UI
        const controls = d3.select("#slider-container");
        
        //clearing anything that might be there for issue 
        controls.html("");
        controls.attr("class", "mb-4 p-3 bg-gray-100 rounded border flex flex-wrap justify-center items-center gap-6");

        //dropdown
        const sortGroup = controls.append("div").attr("class", "flex items-center");
        sortGroup.append("span").text("Sort by: ").style("font-weight", "bold").style("margin-right", "8px");
        
        const select = sortGroup.append("select")
            .attr("class", "p-1 border rounded text-gray-700")
            .on("change", function() {
                currentSort = this.value;
                updateChart();
            });

        select.append("option").text("Highest Fossil Dependence").attr("value", "fossil");
        select.append("option").text("Leading in Low-Carbon").attr("value", "green");

        //slider
        const sliderGroup = controls.append("div").attr("class", "flex items-center");
        sliderGroup.append("label").text("Year: ").style("font-weight", "bold").style("margin-right", "8px");
        
        const yearLabel = sliderGroup.append("span")
            .text(maxYear)
            .style("font-weight", "bold")
            .style("color", "#4f46e5")
            .style("min-width", "40px")
            .style("margin-right", "10px");

        sliderGroup.append("input")
            .attr("type", "range")
            .attr("min", minYear)
            .attr("max", maxYear)
            .attr("value", maxYear)
            .attr("step", 1)
            .style("width", "150px")
            .style("cursor", "pointer")
            .on("input", function() {
                currentYear = +this.value;
                yearLabel.text(currentYear);
                updateChart();
            });

        const svg = d3.select(svgId);
        svg.selectAll("*").remove();

        const width = parseInt(svg.style("width")) || 600;
        const height = parseInt(svg.style("height")) || 500;
        const margin = { top: 50, right: 30, bottom: 50, left: 160 };

        const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
        const y = d3.scaleBand().range([margin.top, height - margin.bottom]).padding(0.3);

        const xAxisG = svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`);
        const yAxisG = svg.append("g").attr("transform", `translate(${margin.left},0)`);
        
        const title = svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold");

        const tooltip = d3.select("#tooltip");

        //legend
        const legendX = width - margin.right - 150;
        const legendY = margin.top - 40;
        svg.append("rect").attr("x", legendX).attr("y", legendY).attr("width", 12).attr("height", 12).attr("fill", "#ef4444");
        svg.append("text").attr("x", legendX + 20).attr("y", legendY + 10).text("Fossil Fuel %").attr("font-size", "12px").attr("alignment-baseline", "middle");
        svg.append("rect").attr("x", legendX).attr("y", legendY + 20).attr("width", 12).attr("height", 12).attr("fill", "#22c55e");
        svg.append("text").attr("x", legendX + 20).attr("y", legendY + 30).text("Low Carbon %").attr("font-size", "12px").attr("alignment-baseline", "middle");

        function updateChart() {
            const yearData = data.filter(d => d.year === currentYear && (d.fossil_val > 0 || d.low_carbon_pct > 0));

            yearData.forEach(d => {
                const totalGen = d.fossil_val + d.nuclear_val + d.renewables_val;
                d.fossil_pct = totalGen > 0 ? (d.fossil_val / totalGen) * 100 : 0;
            });

            let top10;
            if (currentSort === 'fossil') {
                top10 = yearData.sort((a, b) => b.fossil_pct - a.fossil_pct).slice(0, 10);
                title.text(`Highest Fossil Fuel Dependence (${currentYear})`);
            } else {
                top10 = yearData.sort((a, b) => b.low_carbon_pct - a.low_carbon_pct).slice(0, 10);
                title.text(`Leading in Low-Carbon Energy (${currentYear})`);
            }

            y.domain(top10.map(d => d.country));
            const barHeight = y.bandwidth() / 2;

            yAxisG.transition().duration(800).call(d3.axisLeft(y));
            xAxisG.transition().duration(800).call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

            //red bars
            svg.selectAll(".fossil-bar").data(top10, d => d.country)
                .join(
                    enter => enter.append("rect").attr("class", "fossil-bar").attr("x", margin.left).attr("fill", "#ef4444").attr("width", 0),
                    update => update,
                    exit => exit.remove()
                )
                .attr("height", barHeight)
                .transition().duration(800)
                .attr("y", d => y(d.country))
                .attr("width", d => x(d.fossil_pct) - margin.left);

            //green bars
            svg.selectAll(".lowcarbon-bar").data(top10, d => d.country)
                .join(
                    enter => enter.append("rect").attr("class", "lowcarbon-bar").attr("x", margin.left).attr("fill", "#22c55e").attr("width", 0),
                    update => update,
                    exit => exit.remove()
                )
                .attr("height", barHeight)
                .transition().duration(800)
                .attr("y", d => y(d.country) + barHeight)
                .attr("width", d => x(d.low_carbon_pct) - margin.left);

            //tooltip
            svg.selectAll(".fossil-bar, .lowcarbon-bar")
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1).html(`<strong>${d.country}</strong><br>Fossil: ${d.fossil_pct.toFixed(1)}%<br>Low-Carbon: ${d.low_carbon_pct.toFixed(1)}%`);
                })
                .on("mousemove", (event) => tooltip.style("left", (event.pageX+10)+"px").style("top", (event.pageY-20)+"px"))
                .on("mouseout", () => tooltip.style("opacity", 0));
        }

        updateChart();
    });
}