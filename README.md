**WordLadder Backend**

**Description:**
- **Purpose:** Backend service for a Word Ladder game. It handles user interactions, database operations, puzzle creation and retrieval, and recording user attempts and history.

**Features:**
- **Puzzles:** Generate and serve level-one and level-two puzzles.
- **Users:** Create, update and track user attempts and history in the database.
- **Utilities:** Tools to populate the database with puzzles and reorder puzzle IDs.

**Requirements:**
- **Node.js** (v14+ recommended)
- **npm**
- A running MongoDB instance and a `DATABASE_URL` configured in a `.env` file.

**Quick Start**
- Install dependencies:

```bash
npm install
```

- Start the backend service:

```bash
npm run start
```

**Environment**
- Copy or create a `.env` file at the project root with your MongoDB connection string. Example entries used by this project:

```dotenv
DATABASE_URL = mongodb+srv://<user>:<password>@cluster.example.mongodb.net/WordLadder
DATE_CONST = "MM/DD/YYYY"
```

Do not commit secrets to source control.

**Generating Puzzles**
1. Generate level-one puzzles:

```bash
node src/utils/populate-puzzles.js
```

2. Generate level-two puzzles:

```bash
node src/utils/populate-puzzles2.js
```

3. Manual curation (required):
- After generation, review the newly created puzzles and remove or fix puzzles that use overly obscure words or have extremely narrow/fragile solutions. The generator can produce imperfect puzzles; this manual pass is necessary to keep game quality high.

4. Reorder puzzle IDs (optional but recommended after deletions):

```bash
node src/utils/reorderPuzzleIds.js
```

- Running `reorderPuzzleIds.js` will renumber puzzle IDs in the database so they are sequential. This is useful after manually deleting bad puzzles because deletions can create skipped IDs.

**Utilities & Helpful Files**
- `src/utils/populate-puzzles.js`: Generate level-one puzzles.
- `src/utils/populate-puzzles2.js`: Generate level-two puzzles.
- `src/utils/reorderPuzzleIds.js`: Reorders puzzle IDs in the DB to be sequential.

**Troubleshooting**
- If the server fails to start, check `DATABASE_URL` in `.env` and ensure MongoDB is reachable.
- If puzzle generation fails, inspect the console logs produced by the generator scripts for errors (missing wordlists, database connectivity issues, etc.).

