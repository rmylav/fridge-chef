import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";

const ingredients = [
  "eggs",
  "spinach",
  "cheddar cheese",
  "half an onion",
  "garlic",
  "leftover rice",
  "soy sauce",
  "butter",
];

// For later, to test edge cases:
const weirdIngredients = ["ketchup", "one egg", "pickles"];
const emptyIngredients = [];

const MODEL = "claude-sonnet-4-6"; //keep this pinned; update deliberately when you want a newer model
const MAX_TOKENS = 2000;
const REVIEW_SYSTEM_PROMPT = `You are a creative home chef. The user will give you a list of ingredients they have.
Suggest ONE recipe that uses mostly those ingredients. Common pantry staples (salt, pepper, oil, water) are allowed.

Reply with ONLY valid JSON, no other text, in exactly this shape:
{
  "name": "string",
  "timeMinutes": number,
  "ingredientsUsed": ["string"],
  "missingIngredients": ["string"],
  "steps": ["string"]
}

If the ingredients can't make a reasonable dish, still reply in the same JSON shape,
with a playful "name" and steps that explain what to buy.`;

const pathAbs = import.meta.dirname; //current folder path

const envPath = path.join(pathAbs, ".env"); //append .env to get path for env file

try {
  process.loadEnvFile(envPath); //read Key value into process.env
} catch (error) {
  if (error.code === "ENOENT") {
    console.error(`No .env found at ${envPath}`);
  } else {
    console.error(error.message);
  }
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC API KEY not found, did you assign it?");
  process.exit(1);
}

const client = new Anthropic();

function extractJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "") // remove opening ``` or ```json
    .replace(/\s*```$/, ""); // remove closing ```
  return JSON.parse(cleaned);
}
console.error("Let me check...");
if (ingredients.length === 0) {
  console.error("Add at least one ingredient first.");
  process.exit(1);
}

try {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: REVIEW_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `I have:${ingredients.join(", ")}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  let recipe;
  try {
    recipe = extractJson(text);
  } catch {
    console.error("Model didn't return valid JSON. Raw reply:\n", text);
    process.exit(1);
  }

  console.log(JSON.stringify(recipe, null, 2));
} catch (error) {
  if (error instanceof Anthropic.NotFoundError) {
    console.error(`Model "${MODEL}" not found, please check the model name`);
  } else if (error instanceof Anthropic.AuthenticationError) {
    console.error(`Invalid API Key. Check ${envPath}`);
  } else if (error instanceof Anthropic.APIConnectionError) {
    console.error(
      "Could not reach the Anthropic API. Check your network connection.",
    );
  } else if (error instanceof Anthropic.APIError) {
    console.error(`API error ${error.status}: ${error.message}`);
  } else {
    throw error;
  }
  process.exit(1);
}
