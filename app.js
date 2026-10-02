const map = L.map('map').setView([-26.5, -60.5], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const searchInput = document.getElementById('localidad-search');
const localidadList = document.getElementById('localidad-list');
const toggleButton = document.getElementById('toggle-localidades');
const filtersPanel = document.getElementById('filters-panel');
let markers = [];
let activeMarker = null;

if (toggleButton && filtersPanel) {
  toggleButton.addEventListener('click', () => {
    const isHidden = filtersPanel.classList.toggle('hidden');
    toggleButton.setAttribute('aria-expanded', String(!isHidden));
    toggleButton.textContent = isHidden ? 'Filtrar' : 'Cerrar';
  });
}

const focusMarker = (marker, localidad) => {
  if (activeMarker) {
    activeMarker.setIcon(new L.Icon.Default());
  }

  const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  marker.setIcon(customIcon);
  activeMarker = marker;
  map.flyTo(marker.getLatLng(), 10, { duration: 1.2 });
  marker.bindPopup(`<b>${localidad.nombre}</b>`).openPopup();
  const item = document.querySelector(`[data-localidad="${localidad.nombre}"]`);
  if (item) {
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

fetch('data/localidades.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error('No se pudo cargar data/localidades.json');
    }
    return response.json();
  })
  .then((localidades) => {
    const puntos = [];

    localidades.forEach((localidad) => {
      const marker = L.marker([localidad.lat, localidad.lng]).addTo(map);
      marker.bindPopup(`<b>${localidad.nombre}</b>`);
      marker.on('click', () => focusMarker(marker, localidad));
      markers.push({ nombre: localidad.nombre, marker, latlng: [localidad.lat, localidad.lng] });
      puntos.push([localidad.lat, localidad.lng]);
    });

    localidadList.innerHTML = localidades
      .map(
        (localidad) => `
          <li>
            <button
              type="button"
              data-localidad="${localidad.nombre}"
              class="localidad-item w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-900/20"
            >
              ${localidad.nombre}
            </button>
          </li>
        `
      )
      .join('');

    document.querySelectorAll('.localidad-item').forEach((button) => {
      button.addEventListener('click', () => {
        const nombre = button.dataset.localidad;
        const item = markers.find((entry) => entry.nombre === nombre);
        if (item) {
          focusMarker(item.marker, { nombre });
        }
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        const query = event.target.value.trim().toLowerCase();

        document.querySelectorAll('.localidad-item').forEach((button) => {
          const visible = button.textContent.toLowerCase().includes(query);
          button.parentElement.style.display = visible ? 'block' : 'none';
        });
      });
    }

    map.fitBounds(puntos, { padding: [30, 30] });
  })
  .catch((error) => {
    console.error(error);
    const errorText = document.createElement('div');
    errorText.textContent = 'No se pudieron cargar las localidades.';
    errorText.style.padding = '12px';
    errorText.style.color = '#a11';
    errorText.style.fontWeight = 'bold';
    document.getElementById('map').appendChild(errorText);
  });
