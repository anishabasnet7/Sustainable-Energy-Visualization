export function draw_landing_map(csvPath, containerId) {
    const svg = d3.select(containerId);
    const width = 1000;
    const height = 500;
    const tip = d3.select("#tooltip");

    //unique countries list from python script
    const myCountryList = [
        "Afghanistan", "Albania", "Algeria", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bosnia and Herzegovina", "Botswana", "Brazil", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "French Guiana", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar", "Romania", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Tajikistan", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Yemen", "Zambia", "Zimbabwe"
    ];

    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    //atlas-style pastel colors
    const atlasColors = ["#fef3c7", "#d1fae5", "#fee2e2", "#e0e7ff", "#f3e8ff", "#ffedd5"];
    const colorScale = d3.scaleOrdinal(atlasColors);

    const projection = d3.geoNaturalEarth1()
        .scale(180) //scaled for betetr view
        .translate([width / 2, height / 2]); //centered

    const path = d3.geoPath().projection(projection);

    //matching name func
    const getMatchedName = (geoName) => {
        if (!geoName) return null;
        
        //check for Exact Match
        if (myCountryList.includes(geoName)) return geoName;

        //check for Manual Fixes (Standard GeoJSON mismatches)
        const manualFixes = {
            "United States of America": "United States",
            "Democratic Republic of the Congo": "Congo",
            "Republic of the Congo": "Congo",
            "Czech Republic": "Czechia",
            "South Korea": "Korea",
            "United Republic of Tanzania": "Tanzania"
        };
        if (manualFixes[geoName]) return manualFixes[geoName];
        return myCountryList.find(c => geoName.includes(c) || c.includes(geoName));
    };

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
        const g = svg.append("g");

        g.selectAll("path")
            .data(world.features)
            .join("path")
            .attr("d", path)
            .attr("fill", (d, i) => {
                const matched = getMatchedName(d.properties.name);
                return matched ? colorScale(i) : "#f1f5f9";
            }) 
            .attr("stroke", "#94a3b8") 
            .attr("stroke-width", 0.4)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                const displayName = getMatchedName(d.properties.name) || d.properties.name;
                
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.2);

                tip.transition().duration(100).style("opacity", 1);
                tip.html(`
                    <div class="font-bold border-b border-gray-200 mb-1">${displayName}</div>                `);
            })
            .on("mousemove", (event) => {
                tip.style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke", "#94a3b8").attr("stroke-width", 0.4);
                tip.transition().duration(100).style("opacity", 0);
            })
            .on("click", (event, d) => {
                const selectedCountry = getMatchedName(d.properties.name);
                console.log("Navigating to:", selectedCountry);
            });

        // Centered Footer
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 10)
            .attr("text-anchor", "middle")
            .attr("class", "text-[12px] fill-gray-400 font-serif italic")
            .text("Global Energy Atlas");
    });
}