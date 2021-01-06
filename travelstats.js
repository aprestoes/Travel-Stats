/*Based off of https://www.amcharts.com/visited_countries/, https://www.amcharts.com/demos/selecting-multiple-areas-map/, and   
    https://www.amcharts.com/demos/drill-down-to-countries/ AmChart 4 demos.
*/

//Declared outside for updateColors()
var worldSeries;
var worldPolygon;
var countrySeries;
var countryPolygon;
var hs;
var activeStateWorld;
var activeStateCountry;
var chart;
var legend;

var provinces; // Format: {countryCode: ["CN-AB"], CN: ["CN-AB"], etc.}

var countriesCount;
var provincesCount;
var citiesCount;
var continentsCount;

var countryElement;
var provinceElement;
var notElement;
var hoverElement;

var countryColor;
var provinceColor;
var notColor;
var hoverColor;

//Continent list from Interactive Visited Countries Map amcharts.com/visited_countries
var continents = [
    ["AO","BF","BI","BJ","BW","CD","CF","CG","CI","CM","DJ","DZ","EG","ER","ET","GA","GH","GM","GN","GQ","GW","KE","LR","LS","LY","MA","MU","MG","ML","MR","MW","MZ","NA","NE","NG","RE","RW","SD","SL","SN","SO","SS","SZ","TD","TG","TN","TZ","UG","ZA","ZM","ZW","EH","KM","GO","JU","SH","ST","YT","BV","CV","SC"],
		["AE","AF","BD","BN","IO","BT","CN","ID","IL","IN","IQ","IR","JO","JP","KG","KH","KP","KR","KW","KZ","LA","LB","LK","MO","MM","MN","MY","NP","OM","PH","PK","PS","QA","SA","SY","TH","TJ","TL","TM","TW","UZ","VN","YE","HK","MV","BH","SG"],
		["AL","AM","AT","AZ","BA","BE","BG","BY","CH","CY","CZ","DE","DK","EE","ES","JE","FI","FR","GB","GE","GR","HR","HU","IE","IS","IT","LT","LU","LV","MD","ME","MK","NL","NO","PL","PT","RO","RS","SE","SI","SJ","SK","TR","UA","RU","VA","MT","MC","XK","LI","IM","GI","FO","AD","AX","GG","SM"],
		["BS","BZ","CA","CR","CU","DO","GL","GT","HN","HT","JM","MX","NI","PA","PR","SV","US","AG","AW","BB","BL","GD","KN","LC","MQ","TC","VG","AI","BM","DM","PM","GP","KY","MF","MS","SX","TT","VC","VI","BQ","CW"],
		["AR","BO","BR","CL","CO","EC","FK","GF","GY","PE","PY","SR","UY","VE","GS"],
		["AS","AU","UM-FQ","CC","CX","FJ","FM","GU","HM","UM-HQ","UM-DQ","UM-JQ","KI","MH","UM-MQ","MP","NC","NF","NR","NU","NZ","PG","PW","SB","TF","TK","TL","TO","TV","VU","UM-WQ","WF","WS","CK","PF","PN"]
	];


//===Functions===
//Used in provinces tab
function addCountryLabel(countryCode) {
  var countryName = am4geodata_data_countries2[countryCode].country;
  
  var tableRow = jQuery("<tr>").addClass(countryCode + "-label").appendTo($("#provinces-table tbody"));
  var tableData = jQuery("<td>").appendTo(tableRow);
  var label = jQuery("<label>").appendTo(tableData).text(countryName).addClass("form-check-label");
  
  tableRow.on("click", function(e) {
    $("." + countryCode + "-province-row").toggle();
  });
}

function addCheckbox(type, id, countryCode) {
    var tableRow;
    var name;
    //console.log(id);

    switch (type) {
        case "country":
            tableRow = jQuery("<tr>").appendTo($("#countries-table tbody"));
            name = am4geodata_data_countries2[id].country;
            break;
        case "province":
            tableRow = jQuery("<tr>").addClass(countryCode + "-province-row").appendTo($("#provinces-table tbody"));
            name = provinces[countryCode][id].name; //First two letters of province id is country id. CA-AB -> CA
            break;
        case "city":
            break;
    }

    var tableData = jQuery("<td>").appendTo(tableRow);
    var checkboxDiv = jQuery("<div>").appendTo(tableData).addClass("form-check checkbox");
    var checkboxInput = jQuery("<input>").attr({
        type: "checkbox",
        name: name, //TODO: Remove
        id: id,
        countryCode: countryCode,
        checked: false,
        value: this //Returns country object
    }).appendTo(checkboxDiv).addClass("form-check-input");


    var checkboxLabel = jQuery("<label>").attr({
        for: id
    }).appendTo(checkboxDiv).text(name).addClass("form-check-label");

    checkboxInput.on("click", function(e) {
        updateSelections(worldSeries);
    });
};

//Update Functions
function updateSelections(polygonSeries) {
    //console.log("Countries: " + countriesCount);
    countriesCount = 0;
    provincesCount = 0;
    citiesCount = 0;
    continentsCount = 0;
  
    var tempSelectedCountries = [];
    var tempCountries = []; //Empty countries array

    //Countries Table
    jQuery("#countries-table input").each(function() { //Loop through different tabs for checked items
        var countryCode = this.id;
        var countryName = this.name;
        if ($(this).is(":checked")) {
            tempSelectedCountries.push({
                id: countryCode,
                name: countryName,
                showAsSelected: true,
                isActive: true
            });
            countriesCount++;

            //Add provinces
            if (!(countryCode in provinces)) { //If key isn't in provinces, add provinces to table
                var countryJSON = $.getJSON("https://www.amcharts.com/lib/4/geodata/json/" + am4geodata_data_countries2[countryCode].maps[0] + ".json", function(response) {
                    var tempProvinces = [];

                    $.each(response.features, function() {
                        var tempCountry = this.properties.CNTRY;
                        if (this.properties.CNTRYNAME != undefined) {
                            tempCountry = this.properties.CNTRYNAME;
                        }
                        var tempObject = {
                            name: this.properties.name,
                            id: this.properties.id,
                            country: tempCountry,
                            countryCode: countryCode, //Country code
                            countryName: countryName,
                            isActive: false
                        };
                        tempProvinces[this.properties.id] = tempObject;
                        provinces[countryCode] = tempProvinces;
                        //tempProvinces.push(tempProvince);
                    });

                    addCountryLabel(countryCode);
                    for (var id in provinces[countryCode]) {
                        addCheckbox("province", id, countryCode);
                    }
                }); //Loads smaller version
            }

            polygonSeries.getPolygonById(countryCode).isActive = true;
        } else {
            polygonSeries.getPolygonById(countryCode).isActive = false;
            $("." + countryCode + "-province-row").remove();
            $("." + countryCode + "-label").remove();
            delete provinces[countryCode];
        }
    });

    //Provinces Table
    jQuery("#provinces-table input").each(function() {
        //TODO: Change hacky workaround of using button attributes to pass arguments.
        if ($(this).is(":checked")) {
            provinces[$(this).attr("countryCode")][this.id].isActive = true;
            provincesCount++;
        } else {
            provinces[$(this).attr("countryCode")][this.id].isActive = false;
        }
    });
    
    //Count continents
    for (let continent of continents) {
        console.log(continent);
        for (let country of tempSelectedCountries) {
            console.log(country.id);
            console.log(continent);
            if (continent.includes(country.id)) {
                continentsCount++;
                break;
            }
        }
    }

    chart.dataProvider.areas = tempSelectedCountries;
    countries = tempSelectedCountries;
    chart.validateData();

    updateStats();
};

/*function updateColors() {
    countryColor = countryElement.jscolor.toHEXString();
    provinceColor = provinceElement.jscolor.toHEXString();
    notColor = notElement.jscolor.toHEXString();
    hoverColor = hoverElement.jscolor.toHEXString();

    worldPolygon.fill = am4core.color(notColor);
    hs.properties.fill = am4core.color(hoverColor);
    activeStateWorld.properties.fill = am4core.color(countryColor);
    countryPolygon.fill = am4core.color(notColor);
    hs.properties.fill = am4core.color(hoverColor);
    activeStateCountry.properties.fill = am4core.color(provinceColor);
  
    for (let tempCountry in chart.dataProvider.areas) {
      let area = chart.dataProvider.areas;
      if (area.showAsSelected) {
        area.color = countryColor;
      }
    }

    chart.validateData();

    legend.data = [{
        "name": "Country Visited",
        "fill": countryColor
    }, {
        "name": "Province Visited",
        "fill": provinceColor
    }];
    legend.validateData();

    console.log("Colour updated");
}*/

function updateSettings() {

}

function updateStats() {
    var countryStat = $("#country-stat");
    var provinceStat = $("#province-stat");
    var continentStat = $("#continent-stat");

    countryStat.text(countriesCount.toString());
    provinceStat.text(provincesCount.toString());
    continentStat.text(continentsCount.toString());
}

function resetFilters() {
    $("input.filter").val("");
    jQuery(".table").each(function() {
        $(this).find("tr").toggle(true);
    });
}


//On Amcharts ready
am4core.ready(function() {
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end

    var api_key;

    //TODO: Add collapsible country sections in provinces tab

    // Create map instance
    chart = am4core.create("chartdiv", am4maps.MapChart);
    chart.dataProvider = {
        areas: []
    };
    chart.areasSettings = {
        selectable: true
    };
    //Set projection
    chart.projection = new am4maps.projections.Miller();

    provinces = {}; // Format: {country: ["CN-AB"], canada: ["CN-AB"], etc.}

    countriesCount = 0;
    provincesCount = 0;
    citiesCount = 0;

    //Everything else
    //Add listeners
    jQuery(".nav-link").on("click", function() {
        resetFilters();
    });

    jQuery("input.filter").each(function() { //Filter for each tab
        $(this).on("keyup", function() {
            var query = $(this).val().toLowerCase();

            if (query == "") {
                resetFilters();
            } else {
                $(this).parent().parent().find("tr:not(.filter-row)").filter(function() { //Select <tbody> then search for <tr>
                    $(this).toggle($(this).text().toLowerCase().indexOf(query) > -1)
                });
            }
        });
    });

    //Define color picker elements
    //var countryElement = $("#country-color");
    /*jscolor.install();
    countryElement = $("#country-color")[0]; //get DOM object, not jQuery
    provinceElement = $("#province-color")[0];
    notElement = $("#not-color")[0];
    hoverElement = $("#hover-color")[0];*/


    //Define colors
    countryColor = chart.colors.getIndex(1);
    provinceColor = chart.colors.getIndex(4);
    notColor = "#C0C0C0";
    hoverColor = chart.colors.getIndex(9);
    /*countryColor = countryElement.jscolor.toHEXString();
    provinceColor = provinceElement.jscolor.toHEXString();
    notColor = notElement.jscolor.toHEXString();
    hoverColor = hoverElement.jscolor.toHEXString();

    //Color pickers
    jscolor.install();*/
  
    // Create map polygon series for world map
    worldSeries = chart.series.push(new am4maps.MapPolygonSeries());
    worldSeries.useGeodata = true;
    worldSeries.geodata = am4geodata_worldLow;
    worldSeries.exclude = ["AQ"];

    worldPolygon = worldSeries.mapPolygons.template;
    worldPolygon.tooltipText = "{name}";
    worldPolygon.nonScalingStroke = true;
    worldPolygon.strokeOpacity = 0.5;
    worldPolygon.propertyFields.fill = "color";

    hs = worldPolygon.states.create("hover");
    hs.properties.fill = hoverColor;

    // Create active states
    activeStateWorld = worldPolygon.states.create("active");
    activeStateWorld.properties.fill = countryColor;


    // Create country specific series (but hide it for now)
    countrySeries = chart.series.push(new am4maps.MapPolygonSeries());
    countrySeries.useGeodata = true;
    countrySeries.hide();
    countrySeries.geodataSource.events.on("done", function(ev) {
        worldSeries.hide();
        countrySeries.show();
    });

    countryPolygon = countrySeries.mapPolygons.template;
    countryPolygon.tooltipText = "{name}";
    countryPolygon.nonScalingStroke = true;
    countryPolygon.strokeOpacity = 0.5;
    countryPolygon.fill = am4core.color(notColor);

    hs = countryPolygon.states.create("hover");
    //hs.properties.fill = chart.colors.getIndex(9);
    hs.properties.fill = am4core.color(hoverColor);

    activeStateCountry = countryPolygon.states.create("active");
    activeStateCountry.properties.fill = am4core.color(provinceColor);

    //TODO: If province is clicked in country not selected, select country in table
    /*countryPolygon.events.on("hit", function(event) {
        //event.target.isActive = !event.target.isActive;
        //console.log(event.target.dataItem.dataContext.id);
        $("#" + event.target.dataItem.dataContext.id).click();
        chart.validateData();
    });*/

    // Set up click events
    worldPolygon.events.on("hit", function(ev) {
        ev.target.series.chart.zoomToMapObject(ev.target);
        var map = ev.target.dataItem.dataContext.map;
        if (map) { //Make sure country isn't already loaded
            var countryCode = ev.target.dataItem.dataContext.id;
            var countryName = ev.target.dataItem.dataContext.name;
            ev.target.isHover = false;
            countrySeries.geodataSource.url = "https://www.amcharts.com/lib/4/geodata/json/" + map + ".json";
            countrySeries.geodataSource.load();

            countrySeries.events.on("datavalidated", function() {
                if (countryCode in provinces) {
                    for (var pid in provinces[countryCode]) {
                        console.log(pid);
                        if (provinces[countryCode][pid].isActive) {
                            countrySeries.getPolygonById(pid).isActive = true;
                        } else {
                            countrySeries.getPolygonById(pid).isActive = false;
                        }
                    }
                    chart.validateData();

                    /*countryPolygon.events.on("hit", function (ev) {
                      
                    });*/
                }
            });

        }
        /*else if (ev.target.dateItem.dataContext.name in provinces) { //Else load from countriesSeries object
             countriesSeries[ev.target.dataItem.dataContext.id];
           }*/ //&& !(ev.target.dataItem.dataContext.name in provinces)
    });

    //TODO: Add table items here
    // Set up data for countries
    var data = [];
    var countriesTable = $("#countries-table tbody");
    for (var id in am4geodata_data_countries2) {
        if (am4geodata_data_countries2.hasOwnProperty(id)) {
            var country = am4geodata_data_countries2[id];
            var countryName = country.country;
            var countryCode = id;

            if (country.maps.length) {
                addCheckbox("country", id, countryCode);

                data.push({
                    id: id,
                    color: notColor,
                    map: country.maps[0]
                });
            }
        }
    }
    worldSeries.data = data;

    // Zoom control
    chart.zoomControl = new am4maps.ZoomControl();

    var homeButton = new am4core.Button();
    homeButton.events.on("hit", function() {
        worldSeries.show();
        countrySeries.hide();
        chart.goHome();
    });

    homeButton.icon = new am4core.Sprite();
    homeButton.padding(7, 5, 7, 5);
    homeButton.width = 30;
    homeButton.icon.path = "M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8";
    homeButton.marginBottom = 10;
    homeButton.parent = chart.zoomControl;
    homeButton.insertBefore(chart.zoomControl.plusButton);

    //Add legend
    legend = new am4maps.Legend();
    legend.parent = chart.chartContainer;
    legend.background.fill = am4core.color("#000");
    legend.background.fillOpacity = 0.05;
    legend.width = 120;
    legend.align = "right";
    legend.padding(10, 15, 10, 15);
    legend.data = [{
        "name": "Country Visited",
        "fill": countryColor
    }, {
        "name": "Province Visited",
        "fill": provinceColor
    }];
    legend.itemContainers.template.clickable = false;
    legend.itemContainers.template.focusable = false;

    var legendTitle = legend.createChild(am4core.Label);
    legendTitle.text = "Legend";

    //updateColors();

}); // end am4core.ready()