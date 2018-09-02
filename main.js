var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    radius = 150;

var tooltip = d3.select("body")
    .append("div")
    .attr('class', 'tooltip');

function color (prop_name) {

    let prop_colors = {
        "WFH": "#C0C0C0",
        "work": "#BBDD00",
        "Vacation": "#8899CC",
        "sick": "#77BBDD"
    };
    return prop_colors[prop_name];
}

function getPercent (part, total) {
    let val = Math.round((part / total) * 100);
    return val;
}

d3.csv("TeamAttendance2018.csv", function(d) { return d; }, _dataLoaded);

function _dataLoaded (error, data) {

    let num_days = data.length;
    let devs = [];
    let names = Object.keys(data[0]);

    names.forEach((n, i) => {

        let cur_name = n;
        let name_exists = devs.filter( (d) => { d.name === cur_name; })[0] != null;

        // filter out unneeded column
        if (name_exists === false && cur_name !== "") {
            devs.push({
                name: cur_name,
                total: 0,
                index: i,
                stats: []
            });
        }
    });
 
    data.forEach((d) => {

        function isOK (value) {
            var is_ok = value !== "---" &&
                    value !== "1/2 day" &&
                    value !== "x"
            return is_ok;
        }

        devs.forEach( (dev) => {

            let status = d[dev.name];

            // clean up properties
            if (status === "") { status = "work"; }
            if (status === "1/2 day WFH") { status = "1/2 day"; }

            let prop_obj = dev.stats.filter( (prop) => {
                return prop.name === status;
            })[0];

            if (prop_obj != null) {
                prop_obj.value += 1;
            } else if (isOK(status)) {
                dev.stats.push({name: status, value: 1});
            }
            if (status !== "x" && status !== "---") { dev.total += 1; }
        });
    });

    devs.push({
        index: 8,
        name: "IGT",
        total: 252,
        stats: [
            { name: "WFH", value: 24, percent: 10 },
            { name: "work", value: 208, percent: 82 },
            { name: "sick", value: 5, percent: 2 },
            { name: "Vacation", value: 15, percent: 6 }
        ]
    });

    // add percent data
    devs.forEach( (dev) => {
        dev.stats.forEach( (d) => {
            d.percent = getPercent(d.value, dev.total);
        });
        dev.stats.sort((a, b) => {
            return a.name < b.name;
        });
    });

    

    render(devs);
}

function render (data) {

    console.log(data);

    let x_pos = 0;
    let y_pos = 0;
    data.forEach( (dev) => {

        x_pos = (radius * 2) * dev.index - radius;
        y_pos = radius + 50;
        if (x_pos > 1200) { 
            x_pos -= 1200;
            y_pos = radius * 3 + 100;
        }
        let g = svg.append("g").attr("transform", `translate(${x_pos},${y_pos})`);

        var pie = d3.pie()
            .sort(null)
            .value(function(d) {
                return d.value;
            });

        var path = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var label = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        var arc = g.selectAll(".arc")
            .data(pie(dev.stats))
            .enter().append("g")
            .attr("class", "arc");

        g.append("text")
            .attr("class", "dev_name")
            .attr("transform", `translate(0,-155)`)
            .attr("dy", "0.35em")
            .text(function(d) { return dev.name; });

        arc.append("path")
            .attr("d", path)
            .attr("fill", function(d) {
                return color(d.data.name);
            })

            // Tooltip!
            .on("mouseover", function(d) {
                return tooltip.style("visibility", "visible")
                .text(`${d.data.value} days (${d.data.percent}%)`);
            })
            .on("mousemove", function() {
                return tooltip.style("top", (event.pageY - 30) + "px")
                .style("left", event.pageX + "px");
            })
            .on("mouseout", function() {
                return tooltip.style("visibility", "hidden");
            });

        arc.append("text")
            .attr("transform", function(d) {
                return `translate(${label.centroid(d)})`;
            })
            .attr("dy", "0.35em")
            .text(function(d) {
                return d.data.name;
            });
    });
}