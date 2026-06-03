import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for retrying Gemini calls
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isTransient = error.message?.includes("503") || 
                        error.message?.includes("UNAVAILABLE") || 
                        error.message?.includes("overloaded");
                        
      if (isTransient && i < maxRetries - 1) {
        console.warn(`Gemini API transient error (attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

// AI Coach endpoint
app.post("/api/coach/chat", async (req, res) => {
  const { messages, userProfile, context } = req.body;

  try {
    const systemInstruction = `
You are Forge AI Coach, an elite AI fitness expert. You possess expert-level knowledge in exercise science, muscle anatomy, biomechanics, nutrition, recovery, and performance optimization.

CORE ROLE:
Function as a Personal Trainer, Bodybuilding Coach, Strength Coach, Nutritionist, Recovery Specialist, and Sports Science Advisor. Help the user with meal nutritions and workout planning.

PERSONALIZATION ENGINE RULES:
* ALWAYS use the stored User Profile and Context Data to tailor responses.
* DO NOT unnecessarily repeat profile data (e.g., don't list their age/weight unless directly relevant).
* SMART ADAPTATION: If data shows lack of progress, suggest adjustments to calories, intensity, or volume.
* EXPERIENCE AWARENESS: Simplify guidance for beginners; increase specificity/volume for advanced trainees.
* MEMORY & TRACKING: Use provided Workout History, Weight History, and Nutrition Context to assess compliance and effectiveness. Prioritize recent data.
* GOAL ALIGNMENT: Your tactical strategy must shift based on the Athlete's current goal (e.g., Bulking = Surplus/Volume, Cutting = Deficit/Intensity). If the goal changes, update your recommendations immediately.

COACHING PRINCIPLES:
* ANSWER ONLY THE QUESTION ASKED. Focus on the user's specific query first.
* PRIORITIZE SAFETY: Emphasize proper form, neutral spine, and joint alignment.
* PROGRESSIVE OVERLOAD: Guide how to increase weight, reps, or sets safely.
* NATURAL CONVERSATION: Be human, friendly, and professional. Avoid robotic jargon (e.g., no "Protocol Activated", "Neural Link").

FORMATTING GUIDELINES:
* MEAL PLANS: Use a clear Markdown table with headers (e.g., | Day | Breakfast | Lunch | Dinner |). Keep descriptions concise within cells.
* WORKOUT ROUTINES: Use bold exercise names, followed by bullet points for sets, reps, and specific coaching cues.
* SECTIONING: Use horizontal dividers (---) to separate distinct sections of a long response (e.g., separating a meal plan from general advice).
* RICH TEXT: Use **bold** for key metrics and *italics* for coaching cues.
* ORGANIZATION: Start with a brief summary, provide the structured data (table/list), and end with 2-3 specific "Next Steps" or "Coach's Notes".

CALCULATION ENGINE:
When relevant (BMR/TDEE), use Mifflin-St Jeor:
- Male: (10 × weight kg) + (6.25 × height cm) − (5 × age) + 5
- Female: (10 × weight kg) + (6.25 × height cm) − (5 × age) − 161
TDEE multipliers: Sedentary(1.2), Light(1.375), Moderate(1.55), Active(1.725), Athlete(1.9).

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

RECENT ACTIVITY CONTEXT:
${JSON.stringify(context, null, 2)}
`;

    const model = "gemini-3.1-flash-lite";
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history
    });

    const lastMessage = messages[messages.length - 1].text;
    const result = await retryWithBackoff(() => chat.sendMessage({ message: lastMessage }));
    
    res.json({ text: result.text });
  } catch (error: any) {
    console.error("AI Coach Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Meal Analysis endpoint
app.post("/api/nutrition/analyze", async (req, res) => {
  const { mealDescription, userProfile } = req.body;

  try {
    const goalContext = userProfile ? `User's current goal is ${userProfile.goal}. Their current weight is ${userProfile.weight}kg and target weight is ${userProfile.targetWeight}kg.` : "";

    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `You are a practical nutrition coach and meal analyst. 
      Analyze this meal: "${mealDescription}".
      ${goalContext}
      
      CORE GUIDELINES:
      1. Estimate calories, protein, carbs, and fat based on typical servings.
      2. Filipino & Fast Food Focus: Recognize adobo, sinigang, silog, and standard chains (Jollibee, McDonald's).
      3. Rating System: Rate 1-10 based on protein quality, calorie density, and processing.
      4. Avoid overly scientific terms. Be practical.
      
      Return ONLY a JSON object:
      {
        "mealName": "string",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "healthScore": number,
        "healthReason": "string (why the score was given)",
        "coachingInsight": "string (what this meal means for fitness goals)",
        "improvementSuggestion": "string (healthier alternative or adjustment)"
      }`,
      config: {
        responseMimeType: "application/json"
      }
    }));

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Nutrition Analysis Error:", error);
    res.status(500).json({ 
      error: "Nutrition analysis is currently experiencing high demand (Quota reached). Please try again in 1 minute.",
      details: error.message 
    });
  }
});

// Workout Generation endpoint
app.post("/api/workouts/generate", async (req, res) => {
  const { goal, experience, equipment, targetFocus } = req.body;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `You are an AI Workout Generator/Program Builder. Create a high-performance training plan for:
      Goal: ${goal}
      Level: ${experience}
      Equipment: ${equipment}
      Focus: ${targetFocus}

      PLAN RULES:
      - Sets/Reps: Hypertrophy (8-12 reps, 3-4 sets, 60-90s rest), Strength (3-6 reps, 3-5 sets, 2-3m rest).
      - Progression: Include guidance on how to increase weight/difficulty.
      - Safety: Focus on form and recovery.

      Return ONLY a JSON object:
      { 
        "routineName": "string",
        "weeklySplit": "string (e.g. Mon: Upper, Tue: Lower...)",
        "exercises": [
          { "name": "string", "sets": number, "reps": "string", "rest": "string", "notes": "string (form cues)" }
        ],
        "progressionPlan": "string (how to progress weekly)",
        "coachingNotes": "string (practical advice on form/recovery)"
      }`,
      config: {
        responseMimeType: "application/json"
      }
    }));

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Workout Generation Error:", error);
    res.status(500).json({ 
      error: "Workout generation is currently experiencing high demand (Quota reached). Please try again in 1 minute.",
      details: error.message 
    });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ForgeFit server running at http://localhost:${PORT}`);
  });
}

setupVite();
