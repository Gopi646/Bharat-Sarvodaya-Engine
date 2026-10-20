const form = document.getElementById("analyzeForm");
const results = document.getElementById("results");
let impactChart;
let latestReportData = null;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function renderIdeas(data) {
  latestReportData = data;
  document.getElementById("reportBtn").disabled = false;
  results.innerHTML = data.ideas.map((idea, i) => `
    <article class="idea">
      <div class="idea-head"><div><h4>${i + 1}. ${escapeHTML(idea.title)}</h4><p>${escapeHTML(idea.why)}</p></div><span class="number">${idea.readiness}%</span></div>
      <div class="score-title">EXPLAINABLE READINESS SCORE</div>
      <div class="score-bars">${Object.entries(idea.score_breakdown).map(([label,value]) => `<div class="score-row"><span>${escapeHTML(label)}</span><div class="score-track"><i style="width:${value}%"></i></div><b>${value}</b></div>`).join("")}</div>
      <div class="metrics"><span class="metric">≈ ${idea.jobs} potential roles</span><span class="metric">₹${Number(idea.investment).toLocaleString("en-IN")} illustrative setup</span><span class="metric">${idea.reuse}% resource indicator</span></div>
      <h5>Suggested next steps</h5><ul>${idea.actions.map(a => `<li>${escapeHTML(a)}</li>`).join("")}</ul>
    </article>`).join("") + `<div class="notice">ⓘ ${escapeHTML(data.note)}</div>`;
  document.getElementById("scenarioCount").textContent = data.total;
  const rows = data.recent.map(r => `<div class="history-row"><b>${escapeHTML(r.community)}</b><span>${escapeHTML(r.opportunity)}</span><small>${escapeHTML(r.created_at)}</small></div>`).join("");
  document.getElementById("historyRows").innerHTML = rows || '<div class="history-empty">No scenarios yet.</div>';
}
async function analyze() {
  const payload = Object.fromEntries(["community","problem","resources","skills","demand"].map(id => [id, document.getElementById(id).value]));
  results.innerHTML = '<div class="empty-state"><div class="empty-icon">↻</div><h3>Analyzing community inputs…</h3><p>Matching needs, resources, skills and demand.</p></div>';
  try {
    const response = await fetch("/api/analyze", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to analyze this scenario.");
    renderIdeas(data);
    await loadComparisonOptions();
  } catch (error) {
    results.innerHTML = `<div class="notice">${escapeHTML(error.message)} Make sure the Flask server is running.</div>`;
  }
}
form.addEventListener("submit", e => { e.preventDefault(); analyze(); });
document.getElementById("sampleBtn").addEventListener("click", () => {
  document.getElementById("community").value="Greenfield Village";
  document.getElementById("problem").value="Farmers have unsold vegetables and few local jobs";
  document.getElementById("resources").value="Agricultural by-products, unused community building";
  document.getElementById("skills").value="25 local youth, basic technical skills";
  document.getElementById("demand").value="Affordable food processing and packaging";
  analyze();
});
document.getElementById("resetBtn").addEventListener("click", () => {
  form.reset();
  document.getElementById("community").value="";
  document.getElementById("problem").value="";
  document.getElementById("resources").value="";
  document.getElementById("skills").value="";
  document.getElementById("demand").value="";
  results.innerHTML='<div class="empty-state"><div class="empty-icon">✳</div><h3>Your insights will appear here</h3><p>Enter community details and run the engine to see suggestions.</p><button type="button" class="text-btn" id="sampleBtn">Load sample scenario ↗</button></div>';
  document.getElementById("sampleBtn").addEventListener("click", () => {
    document.getElementById("community").value="Greenfield Village";
    document.getElementById("problem").value="Farmers have unsold vegetables and few local jobs";
    document.getElementById("resources").value="Agricultural by-products, unused community building";
    document.getElementById("skills").value="25 local youth, basic technical skills";
    document.getElementById("demand").value="Affordable food processing and packaging";
    analyze();
  });
});
const workers=document.getElementById("workers"), demandRange=document.getElementById("demandRange"), resourceRange=document.getElementById("resourceRange");
function updateSimulator() {
  const w=+workers.value,d=+demandRange.value,r=+resourceRange.value;
  const readiness=Math.round(d*.4+r*.35+(Math.min(w,50)/50*25));
  const jobs=Math.max(1,Math.round(w*(d/100)*(r/100)*.75));
  document.getElementById("workersOut").textContent=`${w} people`;
  document.getElementById("demandOut").textContent=`${d}%`;
  document.getElementById("resourceOut").textContent=`${r}%`;
  document.getElementById("jobsOut").textContent=jobs;
  document.getElementById("readinessOut").textContent=`${readiness}%`;
  document.getElementById("utilOut").textContent=`${r}%`;
  document.getElementById("meterFill").style.width=`${readiness}%`;
  if (impactChart) {
    impactChart.data.datasets[0].data=[w,d,r,readiness];
    impactChart.update();
  }
}
if (window.Chart) {
  impactChart = new Chart(document.getElementById("impactChart"), {
    type:"bar",
    data:{labels:["Workforce","Demand","Resources","Readiness"],datasets:[{label:"Scenario indicator (%)",data:[25,60,70,42],borderRadius:8,backgroundColor:["#7968ed","#39b88a","#f0a34b","#a29af5"]}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"},grid:{color:"#eeeef5"}},x:{grid:{display:false}}}}
  });
}
[workers,demandRange,resourceRange].forEach(el=>el.addEventListener("input",updateSimulator));
updateSimulator();


function downloadReport() {
  if (!latestReportData) return;
  const data = latestReportData;
  const rows = data.ideas.map((idea, i) => `
    <section class="idea">
      <h2>${i + 1}. ${escapeHTML(idea.title)}</h2>
      <p>${escapeHTML(idea.why)}</p>
      <p><b>Readiness index:</b> ${idea.readiness}%</p>
      <p><b>Potential roles (illustrative):</b> ${idea.jobs}</p>
      <p><b>Illustrative setup estimate:</b> ₹${Number(idea.investment).toLocaleString("en-IN")}</p>
      <p><b>Resource indicator:</b> ${idea.reuse}%</p>
      <h3>Score breakdown</h3>
      <ul>${Object.entries(idea.score_breakdown).map(([k,v]) => `<li>${escapeHTML(k)}: ${v}%</li>`).join("")}</ul>
      <h3>Suggested next steps</h3>
      <ol>${idea.actions.map(a => `<li>${escapeHTML(a)}</li>`).join("")}</ol>
    </section>`).join("");
  const report = `<!doctype html><html><head><meta charset="utf-8"><title>Bharat Sarvodaya Engine Report</title>
  <style>body{font:14px Arial,sans-serif;max-width:850px;margin:35px auto;color:#222;line-height:1.6;padding:0 20px}h1{color:#5144b8}h2{font-size:18px}section{border:1px solid #ddd;border-radius:10px;padding:18px;margin:18px 0}.meta{background:#f5f3ff;padding:12px;border-radius:8px}.note{font-size:12px;color:#666}@media print{button{display:none}}</style></head><body>
  <h1>Bharat Sarvodaya Engine</h1><h2>Community Opportunity Report</h2>
  <div class="meta"><b>Community:</b> ${escapeHTML(data.community)}<br><b>Generated:</b> ${new Date().toLocaleString()}</div>
  ${rows}<p class="note">${escapeHTML(data.note)}</p>
  <button onclick="window.print()">Print / Save as PDF</button><p class="note">To save as PDF, choose “Save as PDF” in the print destination.</p></body></html>`;
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow pop-ups for this local website to create the report."); return; }
  win.document.open(); win.document.write(report); win.document.close();
}
document.getElementById("reportBtn").addEventListener("click", downloadReport);

async function loadComparisonOptions() {
  const a = document.getElementById("scenarioA");
  const b = document.getElementById("scenarioB");
  try {
    const response = await fetch("/api/history");
    const scenarios = await response.json();
    const options = '<option value="">Select a saved scenario…</option>' + scenarios.map(s =>
      `<option value="${s.id}">${escapeHTML(s.community)} — ${escapeHTML(s.opportunity)} (#${s.id})</option>`
    ).join("");
    a.innerHTML = options; b.innerHTML = options;
    a.dataset.scenarios = JSON.stringify(scenarios);
    b.dataset.scenarios = JSON.stringify(scenarios);
  } catch {
    document.getElementById("compareResult").textContent = "Could not load saved scenarios. Check that the server is running.";
  }
}
document.getElementById("compareBtn").addEventListener("click", async () => {
  const result = document.getElementById("compareResult");
  const idA = document.getElementById("scenarioA").value;
  const idB = document.getElementById("scenarioB").value;
  if (!idA || !idB) { result.textContent = "Please choose two saved scenarios."; return; }
  if (idA === idB) { result.textContent = "Choose two different scenarios to compare."; return; }
  try {
    const response = await fetch("/api/history");
    const scenarios = await response.json();
    const A = scenarios.find(s => String(s.id) === idA);
    const B = scenarios.find(s => String(s.id) === idB);
    if (!A || !B) { result.textContent = "One scenario could not be found."; return; }
    const fields = [["Community","community"],["Primary opportunity","opportunity"],["Readiness index","readiness"],["Problem","problem"],["Available resources","resources"],["Skills","skills"],["Local demand","demand"],["Saved at","created_at"]];
    result.innerHTML = `<div class="compare-table"><div class="compare-title">Scenario comparison</div><div class="compare-grid"><b>DETAIL</b><b>${escapeHTML(A.community)}</b><b>${escapeHTML(B.community)}</b>${fields.map(([label,key]) => `<span>${escapeHTML(label)}</span><span>${key==="readiness"?escapeHTML(A[key])+"%":escapeHTML(A[key] || "—")}</span><span>${key==="readiness"?escapeHTML(B[key])+"%":escapeHTML(B[key] || "—")}</span>`).join("")}</div><p class="form-hint">Readiness values are prototype indicators based on entered text, not validated predictions. Compare the assumptions and evidence before choosing a real-world intervention.</p></div>`;
  } catch {
    result.textContent = "Could not compare scenarios. Please try again.";
  }
});

// Populate comparison dropdowns when the page opens.
loadComparisonOptions();
