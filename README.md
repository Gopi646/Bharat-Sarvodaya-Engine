# Bharat Sarvodaya Engine
### Community Opportunity & Inclusive Development Decision-Support Prototype

A local Flask web application that turns community needs, available resources, local skills, and demand into a short list of opportunity concepts. It includes a transparent readiness indicator, an illustrative impact simulator, saved scenario history, side-by-side comparison, and a printable report.

## Run on Windows (PowerShell)

1. Extract this ZIP into a folder.
2. Open that folder in VS Code.
3. In the VS Code terminal, run:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

4. Open **http://127.0.0.1:5000** in your browser.
5. To stop the server, return to the terminal and press **Ctrl+C**.

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate the environment again.

## Features

- **Opportunity Engine:** suggests community opportunity concepts based on entered problem, resources, skills, and demand.
- **Explainable readiness indicator:** shows demand, resource, and skill-fit components.
- **Impact Simulator:** interactive sliders and a chart for exploring assumptions.
- **Scenario History:** stores generated scenarios in a local SQLite database (`community.db`).
- **Scenario Comparison:** choose two saved scenarios to compare their recorded inputs and indicators.
- **Printable Report:** generate a report and use the browser's Print dialog → **Save as PDF**.
- **Sample and reset controls:** quickly demonstrate the app.

## Suggested demo flow

1. Click **Load sample scenario** and generate an opportunity.
2. Point out the opportunity options and the three-part readiness breakdown.
3. Change the Impact Simulator sliders and show the chart update.
4. Generate a second scenario with a different problem or demand.
5. In **Compare community scenarios**, select two different saved entries and click **Compare scenarios**.
6. Use the report button and choose **Print → Save as PDF**.

## Important limitations

This is a **decision-support prototype**, not a validated forecasting system. Opportunity matching is keyword/rule-based; readiness values, costs, resource indicators, and potential-role counts are illustrative estimates, not verified outcomes or guarantees. Validate needs, costs, safety, regulations, and community consent with real stakeholders before using any suggestion in practice.

The impact chart uses Chart.js from a CDN and therefore needs an internet connection for that chart. The core Flask app and SQLite history run locally.

## Project structure

```text
Bharat_Sarvodaya_Engine_Final/
├── app.py
├── requirements.txt
├── README.md
├── DEMO_GUIDE.md
├── community.db       # created automatically on first run
├── templates/
│   └── index.html
└── static/
    ├── app.js
    └── style.css
```
