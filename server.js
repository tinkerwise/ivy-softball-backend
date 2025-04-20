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

    $("table tbody tr").each((_, row) => {
      const columns = $(row).find("td");
      const team = $(columns[0]).text().trim();
      const confRecord = $(columns[2]).text().trim(); // e.g. '5-10'
      const [wins, losses] = confRecord.split('-').map(x => parseInt(x, 10));

      if (team && !isNaN(wins) && !isNaN(losses)) {
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
