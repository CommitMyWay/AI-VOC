import { Router } from "express";
import { getReport, query } from "../lib/db/index.ts";
import { pipelineEvents } from "../lib/events.ts";

const router = Router();

router.get("/api/reports/:id", async (req, res) => {
  try {
    const report = await getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const payload = report.company_data || { data: {}, market: null };
    return res.json({
      id: report.id,
      status: report.status,
      created_at: Number(report.created_at),
      completed_at: report.completed_at ? Number(report.completed_at) : null,
      data: payload.data || {},
      market: payload.market || null,
    });
  } catch (error: any) {
    console.error("[reports:get] failed:", error);
    return res.status(500).json({ error: error?.message || "Failed to load report", code: error?.code || null });
  }
});

router.get("/api/reports/:id/stream", async (req, res) => {
  try {
    const reportId = req.params.id;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const report = await getReport(reportId);
    if (report && (report.status === "ready" || report.status === "error")) {
      res.write(`event: ${report.status === "ready" ? "done" : "error"}\ndata: ${JSON.stringify({ reportId, message: report.status })}\n\n`);
      res.end();
      return;
    }

    const unsubscribe = pipelineEvents.subscribe(reportId, (event) => {
      res.write(`event: ${String(event.type)}\ndata: ${JSON.stringify(event)}\n\n`);
      if (event.type === "done" || event.type === "error") {
        unsubscribe();
        res.end();
      }
    });

    req.on("close", () => {
      unsubscribe();
    });
  } catch (error: any) {
    console.error("[reports:stream] failed:", error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error?.message || "Failed to stream report", code: error?.code || null })}\n\n`);
    res.end();
  }
});

router.get("/api/reports/:id/reviews", async (req, res) => {
  try {
    const { topic, sentiment, limit = "20" } = req.query;
    const rowsResult = await query(
      `SELECT r.id, r.app, r.source, r.author, r.rating, r.content, r.published_at, r.source_url,
              c.topic, c.sentiment, c.confidence
       FROM reviews r
       LEFT JOIN classifications c ON c.review_id = r.id
       WHERE r.report_id = $1
         AND ($2 IS NULL OR c.topic = $2)
         AND ($3 IS NULL OR c.sentiment = $3)
       ORDER BY COALESCE(r.published_at, 0) DESC
       LIMIT $4`,
      [req.params.id, topic ?? null, sentiment ?? null, Number(limit)]
    );

    return res.json({ reviews: rowsResult.rows });
  } catch (error: any) {
    console.error("[reports:reviews] failed:", error);
    return res.status(500).json({ error: error?.message || "Failed to load reviews", code: error?.code || null });
  }
});

router.get("/api/reports/:id/references", async (req, res) => {
  try {
    const rowsResult = await query(
      `SELECT rr.id, rr.topic, rr.rank, r.app, r.source, r.content, r.source_url
       FROM report_references rr
       JOIN reviews r ON r.id = rr.review_id
       WHERE rr.report_id = $1
       ORDER BY rr.rank ASC`,
      [req.params.id]
    );

    return res.json({ references: rowsResult.rows });
  } catch (error: any) {
    console.error("[reports:references] failed:", error);
    return res.status(500).json({ error: error?.message || "Failed to load references", code: error?.code || null });
  }
});

export default router;
