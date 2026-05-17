const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const NOTION_KEY = process.env.NOTION_KEY;
const DB_ID = process.env.DB_ID;

app.get("/tasks", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(
      "https://api.notion.com/v1/databases/" + DB_ID + "/query",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + NOTION_KEY,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filter: {
            and: [
              {
                property: "Status",
                status: { does_not_equal: "Done" }
              },
              {
                or: [
                  {
                    property: "Due Date",
                    date: { equals: today }
                  },
                  {
                    property: "Priority",
                    select: { equals: "🔴 High" }
                  }
                ]
              }
            ]
          },
          sorts: [
            { property: "Priority", direction: "ascending" },
            { property: "Due Date", direction: "ascending" }
          ]
        })
      }
    );

    const data = await response.json();

    if (!data.results) {
      return res.json({ tasks: [] });
    }

    const tasks = data.results.map(page => {
      const props = page.properties;
      const name = props.Name?.title?.[0]?.plain_text || "Untitled";
      const status = props.Status?.status?.name || "";
      const priority = props.Priority?.select?.name || "🟢 Low";
      const category = props.Category?.select?.name || "";
      const dueDate = props["Due Date"]?.date?.start || null;
      const icon = page.icon?.emoji || null;
      return { name, status, priority, category, dueDate, icon };
    });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));