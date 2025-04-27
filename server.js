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

    $("table.standings tbody tr").each((_, row) => {
      const team = $(row).find(".team-name a").text().trim();
      const wins = parseInt($(row).find("td").eq(1).text().trim(), 10);
      const losses = parseInt($(row).find("td").eq(2).text().trim(), 10);

      if (team && !isNaN(wins) && !isNaN(losses)) {
        standings[team] = { wins, losses };
      }
    });

    if (Object.keys(standings).length === 0) {
      standings["No Data"] = { wins: 0, losses: 0 };
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

    $(".calendar-table tbody tr").each((_, row) => {
      const dateText = $(row).find(".calendar-date").text().trim();
      const matchText = $(row).find(".calendar-opponent").text().trim();
      const locationText = $(row).find(".calendar-location").text().trim();
      const date = new Date(dateText);

      if (!isNaN(date) && date >= today && matchText && locationText) {
        const isHome = !matchText.startsWith("at ");
        const home = isHome ? locationText : matchText.replace("at ", "");
        const away = isHome ? matchText : locationText;

        series.push({
          id: `${home}_vs_${away}_${date.toISOString().split('T')[0]}`,
          home: home,
          away: away,
          date: date.toISOString().split('T')[0],
          display: `${away} at ${home} (${dateText})`
        });
      }
    });

    if (series.length === 0) {
      series.push({ id: "Sample_vs_Team", home: "Sample", away: "Team", date: "TBD", display: "No games scheduled" });
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
