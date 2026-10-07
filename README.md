# Fridge Chef

A small Node.js command-line app that turns a list of ingredients into a recipe using the Claude API. Claude returns the recipe as structured JSON, which the app parses and prints.

Built as a hands-on experiment with **structured output**: getting an LLM to return data your code can use, not just chatty text.

## What it does

1. Takes a hardcoded list of ingredients.
2. Sends them to Claude with a system prompt that asks for a single recipe in a fixed JSON shape.
3. Parses the reply and prints it.

Example output shape:

```json
{
  "name": "Cheesy Spinach Fried Rice with Scrambled Eggs",
  "timeMinutes": 20,
  "ingredientsUsed": ["eggs", "spinach", "leftover rice"],
  "missingIngredients": [],
  "steps": ["Dice the onion...", "Melt the butter..."]
}
```

## Setup

Requires Node.js 20.12 or later (uses `process.loadEnvFile`).

```bash
npm install
```

Create a `.env` file in the project folder:

```
ANTHROPIC_API_KEY=your-key-here
```

## Run

```bash
node chef.js
```

To try other inputs, change which ingredient list is sent in `chef.js` (`ingredients`, `weirdIngredients`, or `emptyIngredients`).

## What I learned

- **Prompting for JSON is best effort, not a guarantee.** Even with "reply with ONLY valid JSON," the model sometimes wrapped its reply in Markdown code fences.
- **The prompt format influences the reply format.** Wrapping my own input in code fences made the model more likely to fence its output.
- **Edge cases surface real failures.** An odd ingredient list worked well; an empty list made the model add a sentence before the JSON, which broke parsing.
- **Handle model output defensively.** Parse errors are caught separately from API errors, and the raw reply is printed so failures are easy to diagnose.

## Phase 2 improvements

- [ ] **Validate input before calling the API.** Reject an empty ingredient list in code instead of sending it to the model. This is cheaper, faster, and predictable.
- [ ] **Extract JSON tolerantly.** Pull out everything from the first `{` to the last `}`, so fences, a leading sentence, or a sign-off don't break parsing.
- [ ] **Validate the recipe's shape, not just its syntax.** Check that each field exists and has the right type (for example, `timeMinutes` is a number and `steps` is a non-empty array).
- [ ] **Use a schema library.** Replace hand-written checks with a schema (for example, Zod) that validates and documents the shape in one place.
- [ ] **Use schema-enforced output.** Move from "ask for JSON in the prompt" to the API's structured-output support, or a tool whose input schema is the recipe shape, so the structure is enforced rather than requested.
- [ ] **Accept ingredients as input.** Read them from the command line instead of a hardcoded list.
