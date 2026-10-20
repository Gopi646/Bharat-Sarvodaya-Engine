from flask import Flask, render_template, request, jsonify
import sqlite3
from pathlib import Path

app = Flask(__name__)
DB = Path(__file__).with_name("community.db")

def init_db():
    with sqlite3.connect(DB) as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS scenarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                community TEXT NOT NULL,
                problem TEXT NOT NULL,
                resources TEXT NOT NULL,
                skills TEXT NOT NULL,
                demand TEXT NOT NULL,
                opportunity TEXT NOT NULL,
                readiness INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Safely upgrade a database created by the first prototype.
        columns = {row[1] for row in con.execute("PRAGMA table_info(scenarios)")}
        if "readiness" not in columns:
            con.execute("ALTER TABLE scenarios ADD COLUMN readiness INTEGER NOT NULL DEFAULT 0")

def build_ideas(problem, resources, skills, demand):
    all_text = " ".join([problem, resources, skills, demand]).lower()
    categories = []
    if any(k in all_text for k in ["farm", "agri", "crop", "farmer", "vegetable", "fruit", "by-product"]):
        categories.append(("Agro-processing micro-enterprise", "Connect local produce or agricultural by-products with processing demand.", 8, 250000, 65, ["Survey seasonal produce and farmers", "Validate food-safety and licensing requirements", "Pilot one product with a small batch"]))
    if any(k in all_text for k in ["waste", "plastic", "recycle", "scrap"]):
        categories.append(("Community sorting and recycling unit", "Organize recoverable waste and connect it with authorized recycling buyers.", 6, 180000, 70, ["Map waste types and collection points", "Contact authorized recycling partners", "Pilot safe segregation and weighing"]))
    if any(k in all_text for k in ["solar", "electricity", "energy", "power"]):
        categories.append(("Solar and energy service team", "Build local capacity for basic energy-use support and maintenance.", 5, 150000, 30, ["Partner with qualified technicians", "Train youth on safety fundamentals", "Pilot energy-use audits"]))
    if any(k in all_text for k in ["computer", "digital", "internet", "student", "education", "graduate", "skill"]):
        categories.append(("Digital community service hub", "Use local digital skills to help residents access services and learning.", 4, 120000, 40, ["List services residents need", "Check device and connectivity access", "Set up privacy and consent practices"]))
    if any(k in all_text for k in ["water", "rain", "irrigation"]):
        categories.append(("Water-efficiency support initiative", "Identify water-use needs and support locally validated conservation measures.", 3, 90000, 25, ["Map water-use points", "Consult local water experts", "Track usage before and after a pilot"]))
    if not categories:
        categories.append(("Local skills and services cooperative", "Match available skills and community demand with a small, testable service.", 4, 100000, 35, ["Interview residents and local businesses", "List skills and service gaps", "Pilot one service and collect feedback"]))

    # Transparent prototype score: demand 40%, resource fit 35%, skill fit 25%.
    demand_score = 75 if demand.strip() else 45
    resource_score = min(95, 45 + min(len(resources.split()), 10) * 5)
    skill_score = min(95, 40 + min(len(skills.split()), 11) * 5)
    readiness = round(demand_score * .40 + resource_score * .35 + skill_score * .25)

    ideas = []
    for title, why, jobs, cost, reuse, actions in categories[:4]:
        ideas.append({
            "title": title, "why": why, "jobs": jobs, "investment": cost,
            "reuse": reuse, "actions": actions, "readiness": readiness,
            "score_breakdown": {
                "Demand fit": demand_score,
                "Resource fit": resource_score,
                "Skill fit": skill_score
            }
        })
    return ideas

@app.route("/")
def home():
    with sqlite3.connect(DB) as con:
        total = con.execute("SELECT COUNT(*) FROM scenarios").fetchone()[0]
        recent = con.execute("SELECT community, opportunity, created_at FROM scenarios ORDER BY id DESC LIMIT 5").fetchall()
    return render_template("index.html", total=total, recent=recent)

@app.post("/api/analyze")
def analyze():
    data = request.get_json(force=True)
    community = data.get("community", "").strip() or "Unnamed Community"
    problem = data.get("problem", "").strip()
    resources = data.get("resources", "").strip()
    skills = data.get("skills", "").strip()
    demand = data.get("demand", "").strip()
    if not problem or not resources:
        return jsonify({"error": "Please enter at least a community problem and available resources."}), 400

    ideas = build_ideas(problem, resources, skills, demand)
    primary = ideas[0]
    with sqlite3.connect(DB) as con:
        con.execute(
            """INSERT INTO scenarios (community, problem, resources, skills, demand, opportunity, readiness)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (community, problem, resources, skills, demand, primary["title"], primary["readiness"])
        )
        total = con.execute("SELECT COUNT(*) FROM scenarios").fetchone()[0]
        recent = con.execute("SELECT community, opportunity, created_at FROM scenarios ORDER BY id DESC LIMIT 5").fetchall()

    return jsonify({
        "community": community, "ideas": ideas, "total": total,
        "recent": [{"community": r[0], "opportunity": r[1], "created_at": r[2]} for r in recent],
        "note": "Transparent prototype scoring based on entered text. Estimates are illustrative, not verified costs, forecasts, or guaranteed jobs."
    })



@app.get("/api/history")
def history():
    with sqlite3.connect(DB) as con:
        rows = con.execute(
            """SELECT id, community, problem, resources, skills, demand,
                      opportunity, readiness, created_at
               FROM scenarios ORDER BY id DESC LIMIT 100"""
        ).fetchall()
    return jsonify([
        {"id": r[0], "community": r[1], "problem": r[2], "resources": r[3],
         "skills": r[4], "demand": r[5], "opportunity": r[6],
         "readiness": r[7], "created_at": r[8]}
        for r in rows
    ])

@app.get("/api/stats")
def stats():
    with sqlite3.connect(DB) as con:
        total = con.execute("SELECT COUNT(*) FROM scenarios").fetchone()[0]
        communities = con.execute("SELECT COUNT(DISTINCT community) FROM scenarios").fetchone()[0]
    return jsonify({"scenarios": total, "communities": communities})

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
