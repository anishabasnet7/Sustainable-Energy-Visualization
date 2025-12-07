export function electricity_vs_cleancooking(csvPath, svgId) {
    return d3.csv(csvPath).then(data => {
        data.forEach(d => {
            d.access_to_electricity = +d.access_to_electricity;
            d.access_to_clean_fuels_for_cooking = +d.access_to_clean_fuels_for_cooking;
            d.gdp_per_capita = +d.gdp_per_capita;
            d.year = +d.year;
        });

        const latestYear = d3.max(data, d => d.year);
        let currentYear = latestYear;

        const svg = d3.select(svgId);
        svg.selectAll("*").remove();

        const width = parseInt(svg.style("width")) || 600;
        const height = parseInt(svg.style("height")) || 400;
        const margin = { top: 40, right: 50, bottom: 40, left: 150 };

        const x = d3.scaleLinear().range([margin.left, width - margin.right]);
        const y = d3.scaleBand().range([margin.top, height - margin.bottom]).padding(0.2);

        //axes containers
        svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height - margin.bottom})`);
        svg.append("g").attr("class", "y-axis").attr("transform", `translate(${margin.left},0)`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 5)
            .attr("text-anchor", "middle")
            .text("Gap: Electricity Access - Clean Cooking Access (%)");

        function updateBars(year) {
            //filtering the data
            const lowIncomeData = data.filter(d => d.gdp_per_capita <= 2000 && d.year === year);
            lowIncomeData.forEach(d => d.gap = d.access_to_electricity - d.access_to_clean_fuels_for_cooking);
            
            //sorting and slicing
            const top05 = lowIncomeData.sort((a, b) => b.gap - a.gap).slice(0, 5);

            //updating the scale
            const maxGap = d3.max(top05, d => d.gap) || 0; //prevent NaN if empty
            x.domain([0, maxGap]);
            y.domain(top05.map(d => d.country));

            //update
            svg.select(".x-axis").transition().duration(500).call(d3.axisBottom(x));
            svg.select(".y-axis").transition().duration(500).call(d3.axisLeft(y));
            
            //using specifc ".bar" to prevent plot not shwoing issue
            const bars = svg.selectAll("rect.bar")
                .data(top05, d => d.country);

            bars.join(
                enter => enter.append("rect")
                    .attr("class", "bar")
                    .attr("x", margin.left)
                    .attr("y", d => y(d.country))
                    .attr("height", y.bandwidth())
                    .attr("fill", "#dc2626")
                    .attr("width", 0) 
                    .call(enter => enter.transition().duration(500)
                        .attr("width", d => Math.max(0, x(d.gap) - margin.left))
                    ),
                update => update.call(update => update.transition().duration(500)
                    .attr("y", d => y(d.country))
                    .attr("width", d => Math.max(0, x(d.gap) - margin.left))
                ),
                //removing the bars not in top 5
                exit => exit.remove()
            );

            //updating labels
            const labels = svg.selectAll(".label")
                .data(top05, d => d.country);

            labels.join(
                enter => enter.append("text")
                    .attr("class", "label")
                    .attr("y", d => y(d.country) + y.bandwidth() / 2)
                    .attr("alignment-baseline", "middle")
                    .attr("fill", "#333")
                    .attr("x", d => x(d.gap) + 5) 
                    .text(d => d.gap.toFixed(1) + "%")
                    .attr("opacity", 0) //fade in
                    .call(enter => enter.transition().duration(500).attr("opacity", 1)),
                update => update.call(update => update.transition().duration(500)
                    .attr("x", d => x(d.gap) + 5)
                    .attr("y", d => y(d.country) + y.bandwidth() / 2)
                    .text(d => d.gap.toFixed(1) + "%")
                ),
                exit => exit.remove()
            );

            return top05.map(d => d.country);
        }

        //slider
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
            const top05Countries = updateBars(currentYear);
            clean_cooking_trend(data, "#svg-slot-2", top05Countries);
        });

        const top05Countries = updateBars(currentYear);
        clean_cooking_trend(data, "#svg-slot-2", top05Countries); //taking the reloaded data instea dof the new one

        return top05Countries;
    });
}

export function clean_cooking_trend(fullData, svgId, top05Countries) {
    let filtered = fullData.filter(d => top05Countries.includes(d.country));
    //removing invalid data to prevent broken lines
    filtered = filtered.filter(d => !isNaN(d.access_to_clean_fuels_for_cooking) && !isNaN(d.year));

    const svg = d3.select(svgId);
    svg.selectAll("*").remove();

    const width = parseInt(svg.style("width")) || 600;
    const height = parseInt(svg.style("height")) || 400;
    const margin = { top: 40, right: 120, bottom: 50, left: 60 };

    if (filtered.length === 0) return;

    const x = d3.scaleLinear()
        .domain(d3.extent(filtered, d => d.year))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    const color = d3.scaleOrdinal().domain(top05Countries).range(d3.schemeSet2);
    const countries = d3.group(filtered, d => d.country);

    countries.forEach((values, key) => {
        values.sort((a, b) => a.year - b.year); //sorting years

        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .defined(d => !isNaN(d.access_to_clean_fuels_for_cooking)) //skip gap
                .x(d => x(d.year))
                .y(d => y(d.access_to_clean_fuels_for_cooking))
            );

        const lastPoint = values[values.length - 1];
        if (lastPoint) {
            svg.append("text")
                .attr("x", x(lastPoint.year) + 5)
                .attr("y", y(lastPoint.access_to_clean_fuels_for_cooking))
                .text(key)
                .attr("alignment-baseline", "middle")
                .attr("fill", color(key))
                .style("font-size", "12px");
        }
    });
}