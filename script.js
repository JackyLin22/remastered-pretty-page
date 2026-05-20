function initMap() {
  console.log('Map initialized');

  const map = L.map('map').setView([38.9869, -76.9426], 10);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 13,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  return map;
}

/*
  Remove all old markers before adding new ones
*/
function clearMarkers(map) {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
}

/*
  Add markers with popups
*/
function markerPlace(array, map) {
  clearMarkers(map);

  array.forEach((restaurant) => {
    const coordinates = restaurant.geocoded_column_1?.coordinates;

    if (!coordinates) return;

    const longitude = coordinates[0];
    const latitude = coordinates[1];

    const name = restaurant.name || 'Unknown Restaurant';
    const address = restaurant.address_line_1 || 'No address available';
    const category = restaurant.category || 'No category listed';

    const marker = L.marker([latitude, longitude]).addTo(map);

    marker.bindPopup(`
      <div>
        <h3>${name}</h3>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Address:</strong> ${address}</p>
      </div>
    `);
  });
}

/*
  Create restaurant result cards
*/
function injectHTML(list) {
  console.log('Injecting restaurant cards');

  const target = document.querySelector('#restaurant_list');

  target.innerHTML = '';

  if (list.length === 0) {
    target.innerHTML = `
      <p class="placeholder">
        No matching restaurants found.
      </p>
    `;
    return;
  }

  list.forEach((restaurant) => {
    const name = restaurant.name || 'Unknown Restaurant';
    const address =
      restaurant.address_line_1 || 'No address available';

    const city = restaurant.city || '';
    const category =
      restaurant.category || 'No category listed';

    const inspection =
      restaurant.inspection_type || 'No inspection data';

    const card = document.createElement('div');

    card.className = 'restaurant-card';

    card.innerHTML = `
      <h3>${name}</h3>

      <p>
        <strong>Category:</strong>
        ${category}
      </p>

      <p>
        <strong>Inspection Type:</strong>
        ${inspection}
      </p>

      <p>
        <strong>Address:</strong>
        ${address}, ${city}
      </p>
    `;

    target.appendChild(card);
  });
}

/*
  Main App
*/
async function mainEvent() {
  const map = initMap();

  const form = document.querySelector('.main_form');
  const submit = document.querySelector(
    'button[type="submit"]'
  );

  const loadAnimation =
    document.querySelector('.lds-ellipsis');

  const restoName = document.querySelector('#resto');

  submit.style.display = 'none';

  /*
    Fetch restaurant data
  */
  const results = await fetch(
    'https://data.princegeorgescountymd.gov/resource/umjn-t2iz.json?$limit=1000'
  );

  const arrayFromJson = await results.json();

  if (arrayFromJson.length > 0) {
    submit.style.display = 'block';

    loadAnimation.classList.remove('lds-ellipsis');

    loadAnimation.classList.add(
      'lds-ellipsis_hidden'
    );

    /*
      Start with all restaurants that have coordinates
    */
    let currentArray = arrayFromJson.filter(
      (item) => Boolean(item.geocoded_column_1)
    );

    /*
      Show all restaurants initially
    */
    injectHTML(currentArray);

    markerPlace(currentArray, map);

    /*
      Search on form submit
    */
    form.addEventListener('submit', (submitEvent) => {
      submitEvent.preventDefault();

      const searchValue =
        restoName.value.toLowerCase();

      const filteredRestaurants =
        currentArray.filter((item) => {
          const lowerCaseName =
            item.name?.toLowerCase() || '';

          return lowerCaseName.includes(searchValue);
        });

      injectHTML(filteredRestaurants);

      markerPlace(filteredRestaurants, map);
    });

    /*
      Live search while typing
    */
    restoName.addEventListener('input', (event) => {
      const query =
        event.target.value.toLowerCase();

      const filteredRestaurants =
        currentArray.filter((item) => {
          const lowerCaseName =
            item.name?.toLowerCase() || '';

          return lowerCaseName.includes(query);
        });

      injectHTML(filteredRestaurants);

      markerPlace(filteredRestaurants, map);
    });
  }
}

document.addEventListener(
  'DOMContentLoaded',
  async () => mainEvent()
);