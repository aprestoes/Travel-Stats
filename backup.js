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

var countryElement;
var provinceElement;
var cityElement;
var notElement;
var hoverElement;

var countryColor;
var provinceColor;
var cityColor;
var notColor;
var hoverColor;


//===Functions===
  function addCollapsibleProvince(countryName) {
    var tableRow = jQuery("<tr>").appendTo($("#provinces-table tbody"));
    var tableData = jQuery("<td>").appendTo(tableRow);
    var accordionDiv = jQuery("<div id='" + countryName + "Accordion'>").appendTo(tableData).addClass("accordion");
  }
  
  function addCheckbox(type, id, countryName) {
    var tableRow;
    var name;
    //console.log(id);

    switch (type) {
      case "country":
        tableRow = jQuery("<tr>").appendTo($("#countries-table tbody"));
        name = am4geodata_data_countries2[id].country;
        break;
      case "province":
        tableRow = jQuery("<tr>").appendTo($("#provinces-table tbody"));
        name = provinces[countryName][id].name; //First two letters of province id is country id. CA-AB -> CA
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
      countryName: countryName,
      checked: false,
      value: this //Returns country object
    }).appendTo(checkboxDiv).addClass("form-check-input");

    if (type == "province") {
      checkboxInput.attr({
        cc: id.substring(0, 2)
      });
    }

    var checkboxLabel = jQuery("<label>").attr({
      for: id
    }).appendTo(checkboxDiv).text(name).addClass("form-check-label");


    tableRow.on("click", function (e) {
      updateSelections(worldSeries);
    });
  };

  //Update Functions
  function updateSelections(polygonSeries) {
    //console.log("Countries: " + countriesCount);
    countriesCount = 0;
    provincesCount = 0;
    citiesCount = 0;

    var selectedCountries = [];
    countries = []; //Empty countries array

    //Countries Table
    jQuery("#countries-table input").each(function () { //Loop through different tabs for checked items
      var countryCode = this.id;
      var countryName = this.name;
      if ($(this).is(":checked")) {
        selectedCountries.push({
          id: countryCode,
          name: countryName,
          showAsSelected: true,
          isActive: true
        });
        countriesCount++;

        //Add provinces
        if (!(countryName in provinces)) { //If key isn't in provinces, add provinces to table
          var countryJSON = $.getJSON("https://www.amcharts.com/lib/4/geodata/json/" + am4geodata_data_countries2[countryCode].maps[0] + ".json", function (response) {
            var tempProvinces = [];


            $.each(response.features, function () {
              var tempCountry = this.properties.CNTRY;
              if (this.properties.CNTRYNAME != undefined) {
                tempCountry = this.properties.CNTRYNAME;
              }
              var tempObject = {
                name: this.properties.name,
                id: this.properties.id,
                country: tempCountry,
                cc: countryCode, //Country code
                countryName: countryName,
                isActive: false
              };
              //console.log(this.properties.CNTRYNAME);
              tempProvinces[this.properties.id] = tempObject;
              provinces[countryName] = tempProvinces;
              //tempProvinces.push(tempProvince);
            });

            for (var id in provinces[countryName]) {
              console.log(id);
              
              
              
              addCheckbox("province", id, countryName);
            }
          }); //Loads smaller version
        }

        polygonSeries.getPolygonById(countryCode).isActive = true;
      } else {
        polygonSeries.getPolygonById(countryCode).isActive = false;
        //TODO: delete provinces
      }
    });

    //Provinces Table
    jQuery("#provinces-table input").each(function () {
      //TODO: Change hacky workaround of using button attributes to pass arguments.
      if ($(this).is(":checked")) {
        provinces[$(this).attr("countryName")][this.id].isActive = true;
        provincesCount++;
      } else {
        console.log($(this).attr("countryName"));
        provinces[$(this).attr("countryName")][this.id].isActive = false;
      }
    });

    console.log(selectedCountries);
    chart.dataProvider.areas = selectedCountries;
    countries = selectedCountries;
    chart.validateData();
    
    updateStats();
  };
  
  function updateColors() {
    worldPolygon.fill = am4core.color(notColor);
    hs.properties.fill = hoverColor;
    activeStateWorld.properties.fill = countryColor;
    countryPolygon.fill = am4core.color(notColor);
    hs.properties.fill = am4core.color(hoverColor);
    activeStateCountry.properties.fill = am4core.color(provinceColor);
  }

  function updateSettings() {
    
  }
  
  function updateStats() {
    var countryStat = $("#country-stat");
    var provinceStat = $("#province-stat");
    var cityStat = $("#city-stat");
    var continentStat = $("#continent-stat");
    
    countryStat.text(countriesCount.toString());
    provinceStat.text(provincesCount.toString());
  }

  function resetFilters() {
    console.log("Filter reset");
    $("input.filter").val("");
    jQuery(".table").each(function () {
      $(this).find("tr").toggle(true);
    });
  }
  

//On Amcharts ready
am4core.ready(function () {
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

  //TODO: Change format to provinces {country-name: {etc}} to fix error with province codes that don't have same 2 characters as country code
  var provinces = {}; // Format: {country: ["CN-AB"], canada: ["CN-AB"], etc.}
  var names = {};

  var countriesCount = 0;
  var provincesCount = 0;
  var citiesCount = 0;

  //Everything else
  //Add listeners
  jQuery(".nav-link").on("click", function () {
    resetFilters();
  });

  jQuery("input.filter").each(function () { //Filter for each tab
    $(this).on("keyup", function () {
      var query = $(this).val().toLowerCase();

      if (query == "") {
        resetFilters();
      } else {
        $(this).parent().parent().find("tr:not(.filter-row)").filter(function () { //Select <tbody> then search for <tr>
          $(this).toggle($(this).text().toLowerCase().indexOf(query) > -1)
        });
      }
    });
  });

  //Define color picker elements
  //var countryElement = $("#country-color");
  countryElement = $("#country-color");
  provinceElement = $("#province-color");
  cityElement = $("#city-color");
  notElement = $("#not-color");
  hoverElement = $("#hover-color");


  //Define colors
  countryColor = chart.colors.getIndex(1);
    provinceColor = chart.colors.getIndex(4);
    notColor = "#C0C0C0";
    hoverColor = chart.colors.getIndex(9);

  //Color pickers
  // TODO: Update map colors on color picker change
  jscolor.install();
  $("#country-color").onchange = function () {
    countryColor = $("#country-color").jscolor.toHEXString();
    updateColors();
  };
  
  $("#province-color").onchange = function () {
    provinceColor = $("#province-color").jscolor.toHEXString();
    updateColors();
  };
  
  $("#city-color").onchange = function () {
    cityColor = $("#city-color").jscolor.toHEXString();
    updateColors();
  };
  
  $("#not-color").onchange = function () {
    notColor = $("#not-color").jscolor.toHEXString();
    updateColors();
  };
  
  $("#hover-color").onchange = function () {
    hoverColor = $("#hover-color").jscolor.toHEXString();
    updateColors();
  };

  //console.log(document.querySelector("#country-color").jscolor.toHEXString());

  // Create map polygon series for world map
  worldSeries = chart.series.push(new am4maps.MapPolygonSeries());
  worldSeries.useGeodata = true;
  worldSeries.geodata = am4geodata_worldLow;
  worldSeries.exclude = ["AQ"];

  worldPolygon = worldSeries.mapPolygons.template;
  worldPolygon.tooltipText = "{name}";
  worldPolygon.nonScalingStroke = true;
  worldPolygon.strokeOpacity = 0.5;
  //worldPolygon.fill = am4core.color(notColor);
  worldPolygon.propertyFields.fill = "color";

  hs = worldPolygon.states.create("hover");
  //hs.properties.fill = hoverColor;

  // Create active states
  activeStateWorld = worldPolygon.states.create("active");
  //activeStateWorld.properties.fill = countryColor;


  // Create country specific series (but hide it for now)
  countrySeries = chart.series.push(new am4maps.MapPolygonSeries());
  countrySeries.useGeodata = true;
  countrySeries.hide();
  countrySeries.geodataSource.events.on("done", function (ev) {
    worldSeries.hide();
    countrySeries.show();
  });

  countryPolygon = countrySeries.mapPolygons.template;
  countryPolygon.tooltipText = "{name}";
  countryPolygon.nonScalingStroke = true;
  countryPolygon.strokeOpacity = 0.5;
  //countryPolygon.fill = am4core.color(notColor);

  hs = countryPolygon.states.create("hover");
  //hs.properties.fill = chart.colors.getIndex(9);
  //hs.properties.fill = am4core.color(hoverColor);

  activeStateCountry = countryPolygon.states.create("active");
  //activeStateCountry.properties.fill = am4core.color(provinceColor);
  
  updateColors();

  //TODO: If province is clicked in country not selected, select country in table
  countryPolygon.events.on("hit", function (event) {
    event.target.isActive = !event.target.isActive;
  });

  // Set up click events
  worldPolygon.events.on("hit", function (ev) {
    ev.target.series.chart.zoomToMapObject(ev.target);
    var map = ev.target.dataItem.dataContext.map;
    console.log(ev);
    if (map) { //Make sure country isn't already loaded
      var countryCode = ev.target.dataItem.dataContext.id;
      var countryName = ev.target.dataItem.dataContext.name;
      console.log(countryName);
      ev.target.isHover = false;
      countrySeries.geodataSource.url = "https://www.amcharts.com/lib/4/geodata/json/" + map + ".json";
      countrySeries.geodataSource.load();
      console.log(ev.target.dataItem.dataContext);

      countrySeries.events.on("datavalidated", function () {
        if (countryName in provinces) {
          for (var pid in provinces[countryName]) {
            console.log(pid);
            //console.log(provinces[countryCode][pid]);
            if (provinces[countryName][pid].isActive) {
              console.log(countrySeries.getPolygonById(pid));
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
        addCheckbox("country", id, countryName);

        data.push({
          id: id,
          //color: chart.colors.getIndex(continents[country.continent_code]),
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
  homeButton.events.on("hit", function () {
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
  var legend = new am4maps.Legend();
  legend.parent = chart.chartContainer;
  legend.background.fill = am4core.color("#000");
  legend.background.fillOpacity = 0.05;
  legend.width = 120;
  legend.align = "right";
  legend.padding(10, 15, 10, 15);
  legend.data = [{
    "name": "Country Visited",
    "fill": "#72A6B2"
  }, {
    "name": "Province Visited",
    "fill": "#667E93"
  }, {
    "name": "City Visited",
    "fill": "#488BB2"
  }];
  legend.itemContainers.template.clickable = false;
  legend.itemContainers.template.focusable = false;

  var legendTitle = legend.createChild(am4core.Label);
  legendTitle.text = "Legend";

}); // end am4core.ready()
