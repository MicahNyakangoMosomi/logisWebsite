document.addEventListener("DOMContentLoaded", function () {
  const paymentStatus = localStorage.getItem("payment") === "true";
  if (!paymentStatus) {
    alert("Make payment first!");
    window.location.href = "pricing.php";
  }

  if (document.getElementById("orders-container")) {
    renderOrders(); // Only run renderOrders if container exists
  }

});



// Load from localStorage or use default orders
let orders = JSON.parse(localStorage.getItem("orders")) || [
  
  {
    image_url: "../img/packaging-service.jpg",
    id: 'TRK791244',
    category: "completed",
    discription: "Your parcel was successfully delivered. Thank you for choosing us!",
    weight: 100,
    warehouse: 'Ngong Road',
    destination: "Nairobi",
    total: 16700,
    order_date: "2025-05-20 09:00",
    delivered_date: "2025-05-23 16:45"
  }
];

function patchOrdersWithMethods() {
  orders.forEach(order => {
    order.warehouse = "Ngong Road"; 
    order.generateMap = function () {
      generateMap(["-1.299477", "36.785817"], this.destination, `map-${this.id}`);
    };
  });
}
patchOrdersWithMethods();

function renderOrders() {
  const container = document.getElementById("orders-container");
  if (!container) return;

  container.innerHTML = "";

  orders.forEach(order => {
    const deliveredDateHTML = order.delivered_date
      ? `<p class="mb-0 small text-muted">Delivered: ${order.delivered_date}</p>`
      : `<p class="mb-0 small text-muted text-warning">Delivered: Pending</p>`;
  
    const card = `
      <div class="border mb-4 p-3 rounded shadow-sm">
        <div class="d-flex justify-content-between small mb-2">
          <span class="text-muted">Order ID: ${order.id}</span>
          <span class="badge ${
            order.category === 'completed' ? 'bg-success' :
            order.category === 'unpaid' ? 'bg-danger' :
            'bg-warning text-dark'
          } text-capitalize">${order.category}</span>
        </div>
        <div class="row">
          <div class="col-md-6 d-flex">
            <img src="${order.image_url}" class="me-3 rounded" style="width: 80px; height: 80px; object-fit: cover;" alt="Product">
            <div>
              <p class="mb-1 fw-semibold"><b class='text-success'></b>${order.discription}</p>
              <p class="mb-0 small text-muted">Warehouse: ${order.warehouse}</p>
              <p class="mb-0 small text-muted">Destination: ${order.destination}</p>
              <p class="mb-0 small text-muted">Weight: ${order.weight} kg</p>
            </div>
          </div>
          <div class="col-md-3 align-self-center">
            <p class="mb-0 small text-muted">Ordered: ${order.order_date}</p>
            ${deliveredDateHTML}
          </div>
          <div class="col-md-3 align-self-center text-end">
            <div class="fw-bold text-primary mb-2">KSh ${order.total.toLocaleString()}</div>
            ${
              order.category === 'completed'
                ? ''
                : `<button class="btn btn-outline-success btn-sm" onclick="trackOrder('${order.id}')">Track Order</button>`
            }
          </div>
        </div>
        ${
          order.category === 'completed'
            ? ''
            : `<div id="map-${order.id}" class="mt-3" style="height: 300px;"></div>`
        }
      </div>
    `;
  
    container.innerHTML += card;
  });
  
}



function addOrder({trackingId,weight,cost,destination}) {
  const now = new Date();
  const order_date = now.toISOString().slice(0, 16).replace("T", " ");



  const newOrder = {
    image_url: "../img/storage-service.jpg",
    id: trackingId,
    category: "unpaid",
    discription: "We have received your request and will process it within 3 business days.",
    weight: parseFloat(weight),
    warehouse: "Ngong Road",
    destination,
    total: parseFloat(cost),
    order_date,
    delivered_date: null,
    generateMap: function () {
      generateMap(["-1.299477", "36.785817"], destination, `map-${trackingId}`);
    }
  };

  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders));
  console.log("Order saved:", newOrder);
  patchOrdersWithMethods();
  renderOrders();
}


function trackOrder(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return alert("Order not found.");

  const mapContainer = document.getElementById(`map-${id}`);
  if (!mapContainer) return alert("Map container missing.");

  mapContainer.style.display = "block"; // make it visible

  // Wait for browser to reflow before initializing the map
  setTimeout(() => {
    if (typeof order.generateMap === "function") {
      order.generateMap();
    }
  }, 100); // Slight delay to ensure DOM has updated

}


function initMapjs(containerId, center = [36.785817, -1.299477], zoom = 13) {
  return new maplibregl.Map({
    container: containerId,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256
        }
      },
      layers: [
        {
          id: "osm-layer",
          type: "raster",
          source: "osm",
          minzoom: 0,
          maxzoom: 19
        }
      ]
    },
    center,
    zoom
  });
}

async function generateMap(storedWarehouse, storedDestination, containerId) {
  const mapContainer = document.getElementById(containerId);
  if (!mapContainer) return;

  mapContainer.style.display = "block";
  mapContainer.innerHTML = ""; // Clear existing map instance

  const map = initMapjs(containerId);

  new maplibregl.Marker()
    .setLngLat([parseFloat(storedWarehouse[1]), parseFloat(storedWarehouse[0])])
    .addTo(map);

  const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(storedDestination)}`);
  const geoData = await geoResponse.json();

  if (geoData.length > 0) {
    const destCoords = [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)];

    new maplibregl.Marker().setLngLat(destCoords).addTo(map);

    map.on("load", () => {
      map.addLayer({
        id: `route-${containerId}`,
        type: "line",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [[parseFloat(storedWarehouse[1]), parseFloat(storedWarehouse[0])], destCoords]
            }
          }
        },
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#007bff", "line-width": 4 }
      });
    });
    
  } else {
    alert("Destination not found. Please enter a valid place name.");
  }
}



// Make available globally
window.addOrder = addOrder;
window.renderOrders = renderOrders;
window.trackOrder = trackOrder;


