export function electricity_vs_cleancooking(csvPath, svgId) {
    return d3.csv(csvPath).then(data => {
        data.forEach(d => {
            d.access_to_electricity = +d.access_to_electricity;
            d.access_to_clean_fuels_for_cooking = +d.access_to_clean_fuels_for_cooking;
            d.gdp_per_capita = +d.gdp_per_capita;
            d.year = +d.year;
        });

        // latest year
        const latestYear = d3.max(data, d => d.year);
        let currentYear = latestYear;

        const svg = d3.select(svgId);
        svg.selectAll("*").remove();

        const width = parseInt(svg.style("width"));
        const height = parseInt(svg.style("height"));
        const margin = { top: 40, right: 50, bottom: 40, left: 150 };

        const x = d3.scaleLinear().range([margin.left, width - margin.right]);
        const y = d3.scaleBand().range([margin.top, height - margin.bottom]).padding(0.2);

        // axes
        svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height - margin.bottom})`);
        svg.append("g").attr("class", "y-axis").attr("transform", `translate(${margin.left},0)`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 5)
            .attr("text-anchor", "middle")
            .text("Gap: Electricity Access - Clean Cooking Access (%)");

        function updateBars(year) {
            const lowIncomeData = data.filter(d => d.gdp_per_capita <= 2000 && d.year === year);

            lowIncomeData.forEach(d => d.gap = d.access_to_electricity - d.access_to_clean_fuels_for_cooking);

            const top10 = lowIncomeData.sort((a, b) => b.gap - a.gap).slice(0, 10);

            console.log(`Top 10 low-income countries in ${year}:`);
            top10.forEach((d, i) => {
                console.log(`${i + 1}. ${d.country} — Electricity: ${d.access_to_electricity}%, Clean Cooking: ${d.access_to_clean_fuels_for_cooking}%`);
            });

            x.domain([0, d3.max(top10, d => d.gap)]);
            y.domain(top10.map(d => d.country));

            svg.select(".x-axis").transition().duration(500).call(d3.axisBottom(x));
            svg.select(".y-axis").transition().duration(500).call(d3.axisLeft(y));

            const bars = svg.selectAll("rect").data(top10, d => d.country);

            bars.enter()
                .append("rect")
                .attr("x", margin.left)
                .attr("y", d => y(d.country))
                .attr("height", y.bandwidth())
                .attr("width", 0)
                .attr("fill", "#dc2626")
                .merge(bars)
                .transition()
                .duration(500)
                .attr("width", d => x(d.gap) - margin.left);

            bars.exit().remove();

            const labels = svg.selectAll(".label").data(top10, d => d.country);
            labels.enter()
                .append("text")
                .attr("class", "label")
                .attr("x", d => x(d.gap) + 5)
                .attr("y", d => y(d.country) + y.bandwidth() / 2)
                .attr("alignment-baseline", "middle")
                .attr("fill", "#333")
                .text(d => d.gap.toFixed(1) + "%")
                .merge(labels)
                .transition().duration(500)
                .attr("x", d => x(d.gap) + 5)
                .attr("y", d => y(d.country) + y.bandwidth() / 2)
                .text(d => d.gap.toFixed(1) + "%");

            labels.exit().remove();

            return top10.map(d => d.country); // top10 countries
        }

        // slider 
        const sliderContainer = d3.select("#slider-container");
        sliderContainer.html(`
            <label for="year-slider">Year:</label>
            <input type="range" id="year-slider" min="${d3.min(data, d => d.year)}" max="${latestYear}" step="1" value="${latestYear}">
            <span id="year-label">${latestYear}</span>
        `);

        const slider = document.getElementById('year-slider');
        const yearLabel = document.getElementById('year-label');
        slider.addEventListener('input', () => {
            currentYear = +slider.value;
            yearLabel.textContent = currentYear;
            const top10Countries = updateBars(currentYear);
            clean_cooking_trend(csvPath, "#svg-slot-2", top10Countries);

        });

        const top10Countries = updateBars(currentYear);
        clean_cooking_trend(csvPath, "#svg-slot-2", top10Countries);

        return top10Countries;
    });
}
export function clean_cooking_trend(csvPath, svgId, top10Countries) {
    return d3.csv(csvPath).then(data => {
        data.forEach(d => {
            d.access_to_clean_fuels_for_cooking = +d.access_to_clean_fuels_for_cooking;
            d.year = +d.year;
        });

        const filtered = data.filter(d => top10Countries.includes(d.country));

        const svg = d3.select(svgId);
        svg.selectAll("*").remove();

        const width = parseInt(svg.style("width"));
        const height = parseInt(svg.style("height"));
        const margin = { top: 40, right: 120, bottom: 50, left: 60 };

        const x = d3.scaleLinear()
            .domain(d3.extent(filtered, d => d.year))
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(filtered, d => d.access_to_clean_fuels_for_cooking)])
            .range([height - margin.bottom, margin.top]);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        const color = d3.scaleOrdinal()
            .domain(top10Countries)
            .range(d3.schemeSet2);

        const countries = d3.group(filtered, d => d.country);

        countries.forEach((values, key) => {
            svg.append("path")
                .datum(values)
                .attr("fill", "none")
                .attr("stroke", color(key))
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.access_to_clean_fuels_for_cooking))
                );

            const lastValue = values[values.length - 1].access_to_clean_fuels_for_cooking;
            svg.append("text")
                .attr("x", width - margin.right + 5)
                .attr("y", y(lastValue))
                .text(key)
                .attr("alignment-baseline", "middle")
                .attr("fill", color(key));
        });
    });
}