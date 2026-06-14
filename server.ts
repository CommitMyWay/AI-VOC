import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const CACHE_DIR = path.join(process.cwd(), ".cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Load seed data safely
const SEED_PATH = path.join(process.cwd(), "data", "seed.json");
let seedData: any = {};
if (fs.existsSync(SEED_PATH)) {
  try {
    seedData = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
  } catch (err) {
    console.error("Error reading seed data:", err);
  }
}

// Clean target name for lookup
function cleanName(n: string) {
  return n.trim().toLowerCase();
}

// Programmatic search & scraping pipeline with fallback
async function scrapeAndAnalyzeCompany(companyName: string, focusArea?: string): Promise<any> {
  const targetKey = Object.keys(seedData).find(
    (key) => cleanName(key) === cleanName(companyName)
  );

  const cacheFile = path.join(CACHE_DIR, `${cleanName(companyName)}.json`);

  // If focusArea is specified, bypass cache to generate a custom-tailored analysis
  if (!focusArea) {
    // Fallback 1: Seed data matches
    if (targetKey) {
      return seedData[targetKey];
    }

    // Fallback 2: Cached data matches
    if (fs.existsSync(cacheFile)) {
      try {
        return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      } catch {
        // ignore and generate
      }
    }
  }

  // Fallback 3: Live generation with Gemini representation
  console.log(`Generating synthetic live scrape analysis for: ${companyName}, focus area: ${focusArea || 'none'}`);
  try {
    let prompt = `Perform a comprehensive, realistic product sentiment and app store scrape analysis for the app or product: "${companyName}".
Please generate detailed metric evaluations representing public feed/reviews from iOS App Store and Play Store.
Include realistic topic distributions, insights featuring real patterns, and PO/QA/Marketing actionable items. 
Make sure the rating, metrics list, and trend details make complete sense for this type of product.`;

    if (focusArea) {
      prompt += `\n\nCRITICAL USER DIRECTIVE: The user has set the specific review analysis focus to: "${focusArea}". Please construct the insights, complaint topic percentages, and actionable PO/QA/Marketing items to directly address, analyze, and reflect patterns concerning "${focusArea}". Make it highly specific and actionable.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rating: { type: Type.NUMBER, description: "Average app rating from 1.0 to 5.0" },
            reviewCount: { type: Type.INTEGER, description: "Total review count, e.g. 1200" },
            sentimentBreakdown: {
              type: Type.OBJECT,
              properties: {
                pos: { type: Type.INTEGER, description: "Percentage of positive reviews (0-100)" },
                neu: { type: Type.INTEGER, description: "Percentage of neutral reviews (0-100)" },
                neg: { type: Type.INTEGER, description: "Percentage of negative reviews (0-100)" }
              },
              required: ["pos", "neu", "neg"]
            },
            topicCounts: {
              type: Type.OBJECT,
              properties: {
                Login: { type: Type.INTEGER },
                Payment: { type: Type.INTEGER },
                UI: { type: Type.INTEGER },
                Performance: { type: Type.INTEGER },
                Promo: { type: Type.INTEGER }
              },
              required: ["Login", "Payment", "UI", "Performance", "Promo"]
            },
            trendData: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "Exactly 30 daily negative sentiment percentages (ranging standard between 10 to 50)"
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  severity: { type: Type.STRING, description: "one of 'high', 'medium', or 'low'" },
                  text: { type: Type.STRING, description: "Detailed 1-2 sentence market research insight based on reviewer feedback" }
                },
                required: ["topic", "severity", "text"]
              }
            },
            actions: {
              type: Type.OBJECT,
              properties: {
                PO: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 actionable items for Product Owner" },
                QA: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 actionable items for QA Engineers" },
                Marketing: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 actionable items for Marketing team" }
              },
              required: ["PO", "QA", "Marketing"]
            }
          },
          required: ["rating", "reviewCount", "sentimentBreakdown", "topicCounts", "trendData", "insights", "actions"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    // Ensure negative, positive and neutral sum to 100
    const sum = (parsedData.sentimentBreakdown?.pos || 0) + (parsedData.sentimentBreakdown?.neu || 0) + (parsedData.sentimentBreakdown?.neg || 0);
    if (sum !== 100 && parsedData.sentimentBreakdown) {
      parsedData.sentimentBreakdown.pos = 100 - parsedData.sentimentBreakdown.neu - parsedData.sentimentBreakdown.neg;
    }

    // Cache the result if there is no custom focusArea
    if (!focusArea) {
      fs.writeFileSync(cacheFile, JSON.stringify(parsedData, null, 2), "utf-8");
    }
    return parsedData;
  } catch (error) {
    console.error("Gemini live scrape generation failed:", error);
    // Absolute fallback: pick random seed or generate default structure
    const randomKey = Object.keys(seedData)[0] || "MoMo";
    return seedData[randomKey];
  }
}

// 1. API: Prepare Confirmation Parameters (Human-in-the-loop)
app.post("/api/prepare_confirmation", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const prompt = `You are an elite product research analyst assistant. The user wants to perform reviews and sentiment analysis based on this query: "${query}".
Extract and recommend:
1. The most probable main target product, application, or company name mentioned (capitalized nicely).
2. A list of 1 to 2 logical direct competitor brands in the same category or region for baseline benchmarking.
3. Exactly two (2) smart, custom, contextual clarification questions that help the user refine and specify their analysis priorities. (For example, asking which specific features to check or what their primary analytical objective is). Include 3 logical choices for each question, and keep choices concise, readable, and highly helpful.

Return standard JSON output strictly matching the requested format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryProduct: { 
              type: Type.STRING, 
              description: "Extracted nicely formatted main company/app name" 
            },
            suggestedCompetitors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "1 to 2 direct competitors" 
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  choices: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "question", "choices"]
              },
              description: "Exactly two custom feedback-tuning questions"
            }
          },
          required: ["primaryProduct", "suggestedCompetitors", "suggestedQuestions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("prepare_confirmation failed, returning fallback:", error);
    res.json({
      primaryProduct: query.substring(0, 30),
      suggestedCompetitors: ["MoMo", "VNPay"],
      suggestedQuestions: [
        {
          id: "q_focus",
          question: "Which topic is your prime focus for this review exploration?",
          choices: ["Transaction failures & speed", "UI/UX & usability issues", "Rewards & promo satisfaction"]
        },
        {
          id: "q_scope",
          question: "What is your primary analytical objective?",
          choices: ["QA debugging & bug sweeps", "Direct competitor feature gap benchmark", "Product roadmap design"]
        }
      ]
    });
  }
});

// 1.5. API: Process App Lookup / Analyze Request
app.post("/api/analyze", async (req, res) => {
  const { query, companies = [], focusArea } = req.body;
  if (!query && companies.length === 0) {
    return res.status(400).json({ error: "Query or companies list is required" });
  }

  try {
    let resultCompanies: string[] = [];
    let targetCompany = "";

    if (Array.isArray(companies) && companies.length > 0) {
      resultCompanies = Array.from(new Set(companies)) as string[];
      targetCompany = resultCompanies[0];
    } else {
      // Fallback
      targetCompany = query.trim();
      if (query.length > 3) {
        try {
          const parseRes = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Extract the single main application or company name mentioned in this market query: "${query}". Return ONLY the company name (e.g. "ShopeePay" or "VNPay"), capitalized nicely. Do not write any other letters. If no app name is found, return the query itself.`,
          });
          const extracted = parseRes.text?.trim();
          if (extracted && extracted.length > 0 && extracted.length < 30) {
            targetCompany = extracted;
          }
        } catch {
          // ignore
        }
      }
      resultCompanies = [targetCompany];
    }

    // Always fetch target company
    const responseData: { [name: string]: any } = {};
    for (const c of resultCompanies) {
      responseData[c] = await scrapeAndAnalyzeCompany(c, focusArea);
    }

    res.json({
      targetCompany,
      companies: resultCompanies,
      data: responseData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Pipeline error" });
  }
});

// 2. API: Classify user instructions and fetch answers or block mutations
app.post("/api/classify", async (req, res) => {
  const { message, companies = [], filters = {}, summaryText = "No summary data" } = req.body;

  try {
    const prompt = `User Message: "${message}"

Active Companies: ${JSON.stringify(companies)}
Current Filters: ${JSON.stringify(filters)}
Current active reports summarized text: ${summaryText}

Classify the user intent into one or more actions (ASK, ADD_BLOCK, REMOVE_BLOCK, ADD_COMPANY, REMOVE_COMPANY, FILTER, ADD_CUSTOM_BLOCK).
Return a JSON array of actions as specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an intent classifier and expert fintech product researcher for a market review analytics dashboard.
Given the user's message, classify the user intent into a list of actions.
Supported action types:
  - ASK: For informational questions or follow-ups. You MUST return payload.answer (analytical 2-3 sentence summary) and payload.citations (array of 2-3 specific simulated review items with "source" and "text" reflecting user complaints on active products). If the question mentions specific complaints like "refund" or "login", search the context and provide realistic matched citations like "[Google Play Review]" or "[App Store Review]".
  - ADD_COMPANY: When user wants to include another company, competitor, or app to compare (e.g. "Add ZaloPay to compare"). Return payload.company_name with the requested app name (e.g. "ZaloPay").
  - REMOVE_COMPANY: When user requests to remove or delete a company. Return payload.company_name.
  - ADD_CUSTOM_BLOCK: When user wants to modify their dashboard to add custom analytics, custom chart topic, or customized KPI monitoring (e.g. "Add a chart for refund complaints over time"). Return payoad.custom_block_title (e.g. "Refund complaints over time") and payload.custom_block_prompt (instructions for building this specialized analysis block).
  - ADD_BLOCK or REMOVE_BLOCK: To toggle native blocks. Available block IDs: metrics, insights, sentiment_pie, topic_bar, trend, actions
  - FILTER: Set filter values. filter_key is "sentiment" or "dateRange".

Return only valid JSON matching the schema. No markdown wrapping.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "Must be: ASK, ADD_BLOCK, REMOVE_BLOCK, ADD_COMPANY, REMOVE_COMPANY, FILTER, or ADD_CUSTOM_BLOCK" },
              payload: {
                type: Type.OBJECT,
                properties: {
                  block_id: { type: Type.STRING, description: "One of: metrics, insights, sentiment_pie, topic_bar, trend, actions" },
                  company_name: { type: Type.STRING, description: "Company string to add/remove" },
                  filter_key: { type: Type.STRING, description: "One of: sentiment, dateRange, sources" },
                  filter_value: { type: Type.STRING, description: "Target value (e.g. positive, negative, 7d, 30d, etc.)" },
                  answer: { type: Type.STRING, description: "Polished 2-3 sentence answer specifically responding to the user's question, citing rates, counts or complaints from the active context." },
                  custom_block_title: { type: Type.STRING, description: "Title of the custom dashboard block requested" },
                  custom_block_prompt: { type: Type.STRING, description: "Detailed directive prompts to run the custom block generator" },
                  citations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        source: { type: Type.STRING, description: "E.g. iOS App Store #421 or Play Store Review (Aug 2024)" },
                        text: { type: Type.STRING, description: "Detailed 1-sentence raw user review snippet with dates and relevant complaints matching the query topic" }
                      },
                      required: ["source", "text"]
                    },
                    description: "List of 2 to 3 detailed citations mapping to raw user reviews corroborating this answer"
                  }
                }
              }
            },
            required: ["type", "payload"]
          }
        }
      }
    });

    const actions = JSON.parse(response.text || "[]");

    // For any ADD_COMPANY actions, we pre-fetch the data first so the client can receive it directly!
    const updatedData: { [name: string]: any } = {};
    for (const action of actions) {
      if (action.type === "ADD_COMPANY" && action.payload?.company_name) {
        const cName = action.payload.company_name;
        updatedData[cName] = await scrapeAndAnalyzeCompany(cName);
      }
    }

    res.json({ actions, updatedData });
  } catch (error: any) {
    console.error("Classifier error:", error);
    res.status(500).json({ error: error.message || "Classifier pipeline failed" });
  }
});

// 3. API: Generate Custom AI Analysis Block dynamically
app.post("/api/generate_custom_block", async (req, res) => {
  const { title, prompt, companies = [] } = req.body;
  if (!title || !prompt) {
    return res.status(400).json({ error: "Title and prompt are required" });
  }

  try {
    console.log(`Generating custom AI block for [${title}] with instructions: "${prompt}"`);
    const aiPrompt = `We are adding a new analysis block to our market research dashboard comparing multiple products.
Block Title: "${title}"
Specific Topic/Instructions: "${prompt}"
Compared Products: ${JSON.stringify(companies)}

Please analyze customer feedback, public app store reviews, and topic trends specifically for the given block title and instructions. 
For each compared product, generate:
1. An estimated category rating from 1.0 to 5.0 indicating customer satisfaction regarding this specific theme.
2. A severity level: "high" (serious critical issues), "medium" (concerning bugs), or "low" (minor friction).
3. A concise, professional summary (1-2 sentences) of reviewer comments or common problems.
4. Exactly 2 detailed bullet-point customer-feedback observations.

Make sure the information is highly realistic and tailored specifically to the compared products. Ensure complete JSON response.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: aiPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            data: {
              type: Type.OBJECT,
              description: "Map of company names to their custom analysis data details",
              properties: companies.reduce((acc, company) => {
                acc[company] = {
                  type: Type.OBJECT,
                  properties: {
                    rating: { type: Type.NUMBER, description: "Category rating from 1.0 to 5.0" },
                    severity: { type: Type.STRING, description: "Must be: high, medium, or low" },
                    summary: { type: Type.STRING, description: "1-2 sentence professional executive summary of feedback" },
                    points: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Exactly 2 bullet points of detailed findings"
                    }
                  },
                  required: ["rating", "severity", "summary", "points"]
                };
                return acc;
              }, {} as any),
              required: companies
            }
          },
          required: ["title", "data"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Custom block generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate custom AI block" });
  }
});

// Vite Middleware Setup or Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
