# NearMe — AI-Powered Place Finder

NearMe lets you search for places near you using plain, natural language — "5 restaurants in Dokki" or "dentists in Giza" — instead of filling out a form. A frontend map/list interface sends the request to an n8n workflow, which uses an LLM to interpret the query, calls the Google Places API, and returns structured results.

## What is NearMe AI?

A natural-language local place finder powered by an LLM and the Google Places API, orchestrated with n8n.

The user doesn't have to fill out a form like:

```
Category: Restaurant
Location: Dokki
Number: 5
```

Instead, they can simply type:

> "5 restaurants in Dokki"

The system understands that request and converts it into structured information.

## The complete architecture

This is the most important thing to understand — how a plain sentence becomes real places on a map:

```    --publish mode--

             USER
               │
               ▼
       ┌────────────────┐
       │   Frontend     │
       │ HTML/CSS/JS    │
       └───────┬────────┘
               │
               │ HTTP POST
               ▼
       ┌────────────────┐
       │ n8n Webhook    │
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │ Basic LLM Chain│
       │  Understand     │
       │  user request   │
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │ Code Node      │
       │ Parse/validate │
       │ JSON           │
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │ HTTP Request   │
       │ Google Places  │
       │ API            │
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │ Final Code     │
       │ Format results │
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │ Respond to     │
       │ Webhook        │
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │   Frontend     │
       │ Cards + Map    │
       └────────────────┘
```

## Node-by-node breakdown

1. **Webhook** — receives the search request (`{ "query": "..." }`) from the frontend.
2. **Basic LLM Chain** (using **OpenAI Chat Model**) — parses the natural-language query into structured search parameters (e.g. place type, location, count).
3. **Code in JavaScript** — formats those parameters into a valid Google Places API request.
4. **HTTP Request** — calls the Google Places API with the formatted request.
5. **Code in JavaScript1** — reshapes the raw API response into the simple `{ results: [...] }` format the frontend expects (`name`, `rating`, `address`, `phone`, `mapsUrl`, `lat`, `lng`).
6. **Respond to Webhook** — sends the formatted results back to the frontend.

## Project structure

```
├── frontend/ (by help of AI)
│   ├── index.html        # page markup
│   ├── style.css         # styling
│   ├── app.js             # search logic, map rendering
│   └── favicon.svg        # logo / browser tab icon
├── workflow/
│   ├── nearme-workflow.json   # exported n8n workflow
|   └── n8n-workflow.png        # workflow canvas
└── screenshots/
    ├── input-ui.png       # example search input
    └── output-ui.png      # example results output
```


## Setup

### Frontend
Open `frontend/index.html` in a browser, or serve the folder with any static file server. It calls the n8n webhook URL directly, so no build step is required.

### Workflow (n8n)
1. Import `workflow/nearme-workflow.json` into your n8n instance.
2. Add your **Google Places API key** to the HTTP Request node (or as an environment variable / credential, depending on how the node is configured).
3. Activate the workflow and copy its production webhook URL into `N8N_WEBHOOK_URL` in `frontend/app.js`.


## Notes

- No API keys or secrets should be committed to this repo — store them in n8n credentials or environment variables instead.
- The frontend and workflow are decoupled: any workflow that accepts `{ query: string }` and returns `{ results: [...] }` in the shape above will work with the existing frontend unchanged.
