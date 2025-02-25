const map = new maplibregl.Map({
  container: "map", // ID of the container element
  style: `https://api.maptiler.com/maps/streets/style.json?key=${mapToken}`,
  center: listing.geometry.coordinates, // Longitude, Latitude
  zoom: 10, // Initial zoom level
});

// Add zoom and rotation controls to the map
map.addControl(new maplibregl.NavigationControl());

console.log(listing.geometry.coordinates);

const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
  `<h4>${listing.title}</h4><p>Exact Location will be provided after booking</p>`
);

new maplibregl.Marker({ color: "red" })
  .setLngLat(listing.geometry.coordinates) // Set marker at listing location
  .setPopup(popup)
  .addTo(map);
