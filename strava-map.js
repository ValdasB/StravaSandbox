const accessToken = localStorage['access_token'];
const map = L.map('map').setView([0,0],2);
const activitiesList = document.getElementById('activities');
const loadMoreBtn = document.getElementById('load-more');

let currentPage = 1;
const perPage = 200; // maximum allowed to reduce API calls

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. <a href="#" id="save-view" onclick="saveCurrentView(); return false;">save current view</a>'
}).addTo(map);
initializeMap();
loadMoreBtn.addEventListener('click', loadMoreActivities);
loadMoreActivities();

async function loadMoreActivities() {
  const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}&per_page=${perPage}&page=${currentPage}`);
  const activities = await response.json();

  if (activities.length === 0) {
    loadMoreBtn.disabled = true;
    return;
  }

  for (const activity of activities) {
    if (activity.map && activity.map.summary_polyline) {
      const polyline = L.Polyline.fromEncoded(activity.map.summary_polyline, {
        color: 'red',
        weight: 4,
        opacity: 0.7,
        lineJoin: 'round'
      }).on('click', () => onPolylineClick(activity.id));
      addActivityToList(activity, polyline);
    }
  }

  if (activities.length < perPage) {
    loadMoreBtn.disabled = true;
  }

  currentPage++;
}
const activities = [];

function addActivityToList(activity, polyline) {
  activities[activity.id] = {activity:activity,polyline:polyline};
  const listItem = document.createElement('div');
  const checkBox = document.createElement('input');
  listItem.id = `checkbox-${activity.id}`;

  checkBox.type = 'checkbox';
  checkBox.checked = true;
  checkBox.onchange = function () {
    if (checkBox.checked) {
      polyline.addTo(map);
    } else {
      polyline.remove();
    }
  };
  polyline.addTo(map);
  listItem.appendChild(checkBox);

  const label = document.createElement('span');
  label.innerText = `${activity.name} (${activity.type},c=${activity.commute?1:0},v=${activity.visibility})`;
  label.setAttribute('onclick',`onPolylineClick(${activity.id})`);
  listItem.appendChild(label);
  const activityLink = document.createElement('a');
  activityLink.innerText = '(link)';
  activityLink.setAttribute('href', `https://www.strava.com/activities/${activity.id}`);
  listItem.appendChild(activityLink);

  activitiesList.appendChild(listItem);
}
const activityFilter = document.getElementById('activity-filter');
activityFilter.addEventListener('input', filterActivities);

function filterActivities() {
  const filterText = activityFilter.value.toLowerCase();
  const activityItems = activitiesList.getElementsByTagName('div');
  for (let i = 0; i < activityItems.length; i++) {
    const activityLabel = activityItems[i].getElementsByTagName('span')[0];
    const activityName = activityLabel.textContent || activityLabel.innerText;
    if (activityName.toLowerCase().indexOf(filterText) > -1) {
      activityItems[i].style.display = '';
    } else {
      activityItems[i].style.display = 'none';
    }
  }
}
const toggleAllCheckbox = document.getElementById('toggle-all');
toggleAllCheckbox.addEventListener('change', toggleAllActivities);

function toggleAllActivities() {
  const activityItems = activitiesList.getElementsByTagName('div');
  for (let i = 0; i < activityItems.length; i++) {
    if (activityItems[i].style.display !== 'none') {
      const checkBox = activityItems[i].getElementsByTagName('input')[0];
      checkBox.checked = toggleAllCheckbox.checked;
      checkBox.onchange();
    }
  }
}

function toggleActivityVisibility(activityId, isChecked) {
  const polyline = activities[activityId].polyline;

  const listItem = document.getElementById(`checkbox-${activityId}`);
  if (listItem) {
    listItem.classList.toggle('highlighted', isChecked);
  }

  const polylineColor = isChecked ? 'blue' : 'red';
  polyline.setStyle({ color: polylineColor });

  if (isChecked) listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function onPolylineClick(activityId) {
  const checkBox = document.getElementById(`checkbox-${activityId}`).getElementsByTagName('input')
  checkBox.checked = !checkBox.checked;
  toggleActivityVisibility(activityId, checkBox.checked);
}

function saveCurrentView() {
  const mapView = {
    center: map.getCenter(),
    zoom: map.getZoom()
  };
  localStorage.setItem('map-view', JSON.stringify(mapView));
}

function initializeMap() {
  const initialMapView = localStorage.getItem('map-view');
  let initialCenter;
  let initialZoom;

  if (initialMapView) {
    const mapView = JSON.parse(initialMapView);
    initialCenter = mapView.center;
    initialZoom = mapView.zoom;
  } else {
    initialCenter = [55.23842016113108,23.82392085676572];
    initialZoom = 8;
  }

  map.setView(initialCenter, initialZoom);
}
