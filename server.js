import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/standings", async (req, res) => {
  try {
    const response = await fetch("https://ivyleague.com/standings.aspx?path=softball");
    const html = await response.text();
    const $ = cheerio.load(html);
    const standings = {};

    // Debug log to see if any table rows match
    const rows = $("table tbody tr");
    console.log("Rows found in standings:", rows.length);

    rows.each((_, row) => {
      const team = $(row).find("td a").first().text().trim();
      const wins = parseInt($(row).find("td").eq(1).text().trim(), 10);
      const losses = parseInt($(row).find("td").eq(2).text().trim(), 10);
      if (team) {
        standings[team] = { wins, losses };
      }
    });

    if (Object.keys(standings).length === 0) {
      standings["Data Not Found"] = { wins: 0, losses: 0 };
    }

    res.json(standings);
  } catch (error) {
    console.error("Error fetching standings:", error);
    res.status(500).json({ error: "Unable to fetch standings" });
  }
});

app.get("/api/schedule", async (req, res) => {
  try {
    const response = await fetch("https://ivyleague.com/calendar.aspx?path=softball");
    const html = await response.text();
    const $ = cheerio.load(html);
    const today = new Date();
    const series = [];

    const rows = $("table tbody tr");
    console.log("Rows found in schedule:", rows.length);

    rows.each((_, row) => {
      const dateText = $(row).find("td").eq(0).text().trim();
      const matchText = $(row).find("td").eq(2).text().trim();
      const isHome = !matchText.startsWith("at ");
      const [home, away] = isHome ? [matchText, "TBD"] : ["TBD", matchText.replace("at ", "")];
      const date = new Date(dateText);

      if (!isNaN(date) && date >= today) {
        series.push({ id: `${home}_vs_${away}`, home, away });
      }
    });

    if (series.length === 0) {
      series.push({ id: "Sample_vs_Team", home: "Sample", away: "Team" });
    }

    res.json(series);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ error: "Unable to fetch schedule" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
