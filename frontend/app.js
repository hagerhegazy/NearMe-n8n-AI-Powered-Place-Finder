// ======================================
// n8n Webhook URL
// ======================================

const N8N_WEBHOOK_URL = "https://hager30.app.n8n.cloud/webhook/near-me";


// ======================================
// MAP
// ======================================

let map = L.map("map").setView([30.0444, 31.2357], 12);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// Store markers

let markers = [];


// ======================================
// SEARCH BUTTON
// ======================================

document
    .getElementById("searchBtn")
    .addEventListener("click", searchPlaces);


// Press Enter

document
    .getElementById("query")
    .addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            searchPlaces();
        }

    });


// ======================================
// SEARCH FUNCTION
// ======================================

async function searchPlaces() {

    const input = document.getElementById("query");

    const query = input.value.trim();

    if (!query) {

        alert("Please enter what you are looking for.");

        return;
    }


    const loading = document.getElementById("loading");

    const results = document.getElementById("results");

    const resultCount = document.getElementById("resultCount");


    // Clear previous

    results.innerHTML = "";

    resultCount.innerText = "";

    loading.style.display = "block";


    // Remove old markers

    markers.forEach(marker => {

        map.removeLayer(marker);

    });

    markers = [];


    try {

        // ======================================
        // SEND REQUEST TO N8N
        // ======================================

        const response = await fetch(
            N8N_WEBHOOK_URL,
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    query: query

                })

            }
        );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        const data = await response.json();


        console.log("n8n response:", data);


        // ======================================
        // RESULTS
        // ======================================

        const places = data.results || [];


        loading.style.display = "none";


        resultCount.innerText =
            `${places.length} found`;


        if (places.length === 0) {

            results.innerHTML = `
                <div class="empty-state">
                    <h3>No places found</h3>
                    <p>Try another location or category.</p>
                </div>
            `;

            return;
        }


        // ======================================
        // DISPLAY PLACES
        // ======================================

        places.forEach((place, index) => {

            displayPlace(place, index);

        });


        // ======================================
        // MAP
        // ======================================

        showPlacesOnMap(places);


    } catch (error) {

        console.error(error);


        loading.style.display = "none";


        results.innerHTML = `

            <div class="empty-state">

                <h3>Something went wrong</h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;

    }

}


// ======================================
// DISPLAY ENTRY
// ======================================

function displayPlace(place, index) {

    const results =
        document.getElementById("results");


    const rating =
        place.rating
        ? `⭐ ${place.rating} rating`
        : "No rating listed";


    const address =
        place.address || "Address unavailable";


    const mapsUrl =
        place.mapsUrl || "#";


    const entry = document.createElement("div");

    entry.className = "entry";


    entry.innerHTML = `

        <div class="entry-index">
            ${String(index + 1).padStart(2, "0")}
        </div>

        <div class="entry-body">

            <div class="entry-name">
                ${escapeHTML(place.name)}
            </div>

            <div class="entry-rating">
                ${rating}
            </div>

            <div class="entry-info">
                ${escapeHTML(address)}
            </div>

            ${
                place.phone
                ?
                `
                <div class="entry-info">
                    ${escapeHTML(place.phone)}
                </div>
                `
                :
                ""
            }

            <a
                class="entry-link"
                href="${mapsUrl}"
                target="_blank"
            >
                Open in Google Maps →
            </a>

        </div>

    `;


    results.appendChild(entry);

}


// ======================================
// SHOW ON MAP
// ======================================

function showPlacesOnMap(places) {

    const validPlaces =
        places.filter(
            place =>
                place.lat !== undefined &&
                place.lng !== undefined
        );


    if (validPlaces.length === 0) {
        return;
    }


    const bounds = [];


    validPlaces.forEach((place, index) => {

        const lat = Number(place.lat);

        const lng = Number(place.lng);


        const pinIcon = L.divIcon({

            className: "",

            html: `<div class="pin-marker"><span>${index + 1}</span></div>`,

            iconSize: [26, 26],

            iconAnchor: [13, 13]

        });


        const marker =
            L.marker([lat, lng], { icon: pinIcon }).addTo(map);


        marker.bindPopup(`

            <strong class="popup-name">
                ${escapeHTML(place.name)}
            </strong>

            <span class="popup-meta">
                ${place.rating ? place.rating + " rating · " : ""}${escapeHTML(place.address || "")}
            </span>

        `);


        markers.push(marker);

        bounds.push([lat, lng]);

    });


    map.fitBounds(bounds, {

        padding: [40, 40]

    });

}


// ======================================
// EXAMPLE BUTTONS
// ======================================

function useExample(text) {

    document.getElementById("query").value = text;

    searchPlaces();

}


// ======================================
// SECURITY
// ======================================

function escapeHTML(text) {

    if (!text) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
