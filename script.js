let climateData = [];
let co2Chart, tempCo2Chart, renewableChart;


// Load CSV data
async function loadData() {
  const res = await fetch('data/climate_change_dataset.csv');
  const text = await res.text();
  const rows = text.split('\n').slice(1); // remove header
  
  climateData = rows.map(r => {
  const c = r.split(',');
  return {
    year: +c[0],
    country: c[1],
    temp: +c[2],
    co2: +c[3],
    renewable: +c[7]
  };
});


  setupDropdown();
  if(climateData.length) updateCharts(climateData[0].country);
}


// Populate country dropdown
function setupDropdown() {
  const select = document.getElementById('countrySelect');
  const countries = [...new Set(climateData.map(d => d.country))].sort();

  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });

  select.onchange = () => updateCharts(select.value);
  select.onchange = () => {
  const selectedCountry = select.value;
  updateCharts(selectedCountry);   // Existing charts update
  updateSummary(selectedCountry);  // <-- Add this line
};

}

//adding a summary box
function updateSummary(country) {
  const data = climateData.filter(d => d.country === country);
  
  const maxCo2 = Math.max(...data.map(d => d.co2)).toFixed(2);
  const avgTemp = (data.reduce((sum, d) => sum + d.temp, 0) / data.length).toFixed(2);
  const avgRenewable = (data.reduce((sum, d) => sum + d.renewable, 0) / data.length).toFixed(2);

  document.getElementById('summaryCountry').textContent = country;
  document.getElementById('maxCo2').textContent = maxCo2;
  document.getElementById('avgTemp').textContent = avgTemp;
  document.getElementById('avgRenewable').textContent = avgRenewable;
}


// Update all charts based on selected country
function updateCharts(country) {
  const data = climateData.filter(d => d.country === country);
  drawCO2(data);
  drawTempCO2(data);
  drawRenewable(data);
  updateRankingTable(); 

}

function updateRankingTable() {
  const tbody = document.getElementById('rankingTable').querySelector('tbody');
  tbody.innerHTML = ''; // Clear previous rows

  // Aggregate latest CO2 and Renewable for each country
  const latestData = {};
  climateData.forEach(d => {
    if (!latestData[d.country] || d.year > latestData[d.country].year) {
      latestData[d.country] = { co2: d.co2, renewable: d.renewable, year: d.year };
    }
  });

  // Convert to array and sort by CO2 descending
  const sortedCountries = Object.entries(latestData)
    .map(([country, data]) => ({ country, co2: data.co2, renewable: data.renewable }))
    .sort((a, b) => b.co2 - a.co2);

  // Determine CO2 range for coloring
  const co2Values = sortedCountries.map(c => c.co2);
  const maxCO2 = Math.max(...co2Values);
  const minCO2 = Math.min(...co2Values);

  sortedCountries.forEach((c, i) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer'; // Make row clickable

    // On click, update charts for that country
    tr.onclick = () => {
      updateCharts(c.country);
      // Also select country in dropdown
      const select = document.getElementById('countrySelect');
      select.value = c.country;
    };

    // Rank
    const rankTd = document.createElement('td');
    rankTd.textContent = i + 1;

    // Country
    const countryTd = document.createElement('td');
    countryTd.textContent = c.country;

    // CO2
    const co2Td = document.createElement('td');
    co2Td.textContent = c.co2.toFixed(2);

    // Color code CO2 emmision table
    const ratio = (c.co2 - minCO2) / (maxCO2 - minCO2); // 0 = min, 1 = max
    if (ratio > 0.66) co2Td.style.color = '#ff4d4d';       // High → red
    else if (ratio > 0.33) co2Td.style.color = '#ffcc00';  // Medium → yellow
    else co2Td.style.color = '#33cc33';                    // Low → green
    co2Td.style.fontWeight = 'bold';

    // Renewable
    const renewableTd = document.createElement('td');
    renewableTd.textContent = c.renewable.toFixed(1);

    tr.appendChild(rankTd);
    tr.appendChild(countryTd);
    tr.appendChild(co2Td);
    tr.appendChild(renewableTd);

    tbody.appendChild(tr);
  });
}


// CO₂ trend line chart
function drawCO2(data) {
  if (co2Chart) co2Chart.destroy();
  co2Chart = new Chart(document.getElementById('co2Chart'), {
    type: 'line',
    data: {
      labels: data.map(d => d.year),
      datasets: [{
        label: 'CO₂ Emissions (Mt)',
        data: data.map(d => d.co2),
        borderColor: '#008080',
        backgroundColor: 'rgba(0,128,128,0.2)',
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Temperature vs CO₂ scatter plot
function drawTempCO2(data) {
  if (tempCo2Chart) tempCo2Chart.destroy();
  tempCo2Chart = new Chart(document.getElementById('tempCo2Chart'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Temperature vs CO₂',
        data: data.map(d => ({ x: d.co2, y: d.temp })),
        backgroundColor: '#5f9ea0'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        x: { title: { display: true, text: 'CO₂ Emissions (Mt)' } },
        y: { title: { display: true, text: 'Temperature (°C)' } }
      }
    }
  });
}

// Renewable energy vs CO₂ scatter plot
function drawRenewable(data) {
  if (renewableChart) renewableChart.destroy();
  renewableChart = new Chart(document.getElementById('renewableChart'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Renewables vs CO₂',
        data: data.map(d => ({ x: d.renewable, y: d.co2 })),
        backgroundColor: '#6b5b95'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        x: { title: { display: true, text: 'Renewable Energy (%)' } },
        y: { title: { display: true, text: 'CO₂ Emissions (Mt)' } }
      }
    }
  });
}

// Start app
loadData();
