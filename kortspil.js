(function() {
/*
 * Workaround for 1px lines appearing in some browsers due to fractional transforms
 * and resulting anti-aliasing.
 * https://github.com/Leaflet/Leaflet/issues/3575
 */
if (window.navigator.userAgent.indexOf('Chrome') > -1) {
    let originalInitTile = L.GridLayer.prototype._initTile;
    L.GridLayer.include({
        _initTile: function (tile) {
            originalInitTile.call(this, tile);

            var tileSize = this.getTileSize();

            tile.style.width = tileSize.x + 1 + 'px';
            tile.style.height = tileSize.y + 1 + 'px';
        }
    });
}

var token = "044fdd5c2943beba8d764969fbc81343";
var attribution = '&copy; <a target="_blank" href="https://download.kortforsyningen.dk/content/vilk%C3%A5r-og-betingelser">Styrelsen for Dataforsyning og Effektivisering</a>';

// Make the map object using the custom projection
//proj4.defs('EPSG:25832', "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs");
var crs = new L.Proj.CRS('EPSG:25832',
'+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs', {
    resolutions: [1638.4,819.2,409.6,204.8,102.4,51.2,25.6,12.8,6.4,3.2,1.6,0.8,0.4,0.2],
    origin: [120000,6500000],
    bounds: L.bounds([120000, 5661139.2],[1378291.2, 6500000])
});

window.addEventListener("load", () => {

	var mymap = L.map("kortspil", {
        crs: crs,
        continuousWorld: true,
        center: [55.67, 12.55], // Set center location
        zoom: 9, // Set zoom level
        minzoom: 10,
        maxzoom: 10
    });

    var ortofotowmts = L.tileLayer('https://services.kortforsyningen.dk/orto_foraar?token=' + token + '&request=GetTile&version=1.0.0&service=WMTS&Layer=orto_foraar&style=default&format=image/jpeg&TileMatrixSet=View1&TileMatrix={zoom}&TileRow={y}&TileCol={x}', {
        maxZoom: 10,
        minZoom: 10,
        attribution: attribution,
        crossOrigin: true,
        zoom: function () {
            var zoomlevel = mymap._animateToZoom ? mymap._animateToZoom : mymap.getZoom();
            if (zoomlevel < 10)
                return 'L0' + zoomlevel;
            else
                return 'L' + zoomlevel;
        }
	}).addTo(mymap);

    // SkÃ¦rmkort [WMTS:topo_skaermkort]
    var toposkaermkortwmts = L.tileLayer.wms('https://services.kortforsyningen.dk/topo_skaermkort', {
        layers: 'dtk_skaermkort',
        token: token,
        format: 'image/png',
        attribution: attribution
	});

	// Hillshade overlay [WMS:dhm]
	var hillshade = L.tileLayer.wms('https://services.kortforsyningen.dk/dhm', {
		transparent: true,
		layers: 'dhm_terraen_skyggekort_transparent_overdrevet',
		token: token,
		format: 'image/png',
		attribution: attribution,
		continuousWorld: true,
	});

	// Define layer groups for layer control
    var baseLayers = {
        "Ortofoto WMTS": ortofotowmts,
        "Skærmkort WMTS": toposkaermkortwmts
    };
    var overlays = {
		"Hillshade": hillshade
    };

    // Add layer control to map
    L.control.layers(baseLayers, overlays).addTo(mymap);

    // Add scale line to map
	L.control.scale({imperial: false}).addTo(mymap); // disable feet units


	//let marker = L.circle(L.latLng(55.7, 12.6), 10).addTo(mymap);
  let nissefar = L.icon({
    iconUrl: "Nissefar.png",
    iconSize: [45, 45],
    iconAnchor: [23, 23],
    shadowUrl: null,
    popupAnchor: [0, -23]
  });

  fetch("nisserute.json").then(res => res.json()).then(data => {
    L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        let nfar = L.Marker.movingMarker(feature.geometry.coordinates.map(e => [e[1], e[0]]), 30000, {
          icon: nissefar,
          loop: true
        }).addTo(mymap);
        nfar.bindPopup('Sign up for our newsletter and get your 10% off <a href="newsletter.html">here</a>');
        nfar.on('click', e => {
          nfar.stop();
        });
        nfar.start();
      }
    });
  });



});

})();
