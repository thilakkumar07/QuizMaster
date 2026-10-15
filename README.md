# My Exam Practice — 12-Week Interactive Exam Practice Quiz App

An interactive, responsive web application for practicing course exam questions with a **strict 100% weekly mastery requirement**, question management, team collaboration, and persistent progress tracking.

---

## 🚀 How to Run Locally

### Prerequisites
Install [Node.js](https://nodejs.org/) **20.19 or newer, or 22.12 or newer** (Node 22 LTS is recommended). These versions meet the requirements of the Vite version used by this project.

### 1. Download / Extract the Project
Extract the project folder onto your computer and open your terminal (Terminal on macOS/Linux or Command Prompt / PowerShell / VS Code on Windows) inside the project directory:

```bash
cd my-exam-practice
```

### 2. Install Dependencies
Run npm install to download all required packages:

```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

You will see output in the terminal:
```
  VITE v8.x.x  ready in 200 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Open your browser and visit **`http://localhost:3000`**.

### Add questions for everyone using the app

Put your shared starter questions in [`src/data/initialQuestions.ts`](./src/data/initialQuestions.ts) inside the `INITIAL_QUESTIONS` array. For example:

```ts
export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'w1-q1',
    weekNumber: 1,
    questionNumber: 1,
    text: 'What is the capital of France?',
    options: {
      A: 'Paris',
      B: 'Rome',
      C: 'Madrid',
      D: 'Berlin'
    },
    correctAnswer: 'A',
    explanation: 'Paris is the capital of France.',
    topic: 'Geography',
    isDraft: false
  }
];
```

The file already imports the `Question` type. Add each question as another object, using a unique `id`, a week number from 1 to 12, a question number, all four options, and the correct answer (`A`, `B`, `C`, or `D`). You can omit `explanation`, `topic`, and `isDraft`; for real questions use `isDraft: false` or omit it.

When someone opens the app for the first time in a browser, it loads these starter questions. If the array is empty, the app uses its existing blank 12-week template. Changes to this file do not overwrite questions already saved in a browser's local storage. To test the updated starter bank locally, clear this app's site data in the browser (or use a private window), then reload. Commit and push your changes to publish the shared starter bank.

---

## 🔒 Safe Setup & Pushing to GitHub

We have configured `.gitignore` so your environment secrets, temporary logs, and `node_modules` will **never** be pushed to GitHub.

### Step 1: Initialize Git
In your project directory:

```bash
git init
git branch -M main
```

### Step 2: Verify Status
Make sure `node_modules` and `.env` are ignored:
```bash
git status
```

### Step 3: Commit Files
```bash
git add .
git commit -m "Initial commit: 12-week exam practice quiz app"
```

### Step 4: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Choose a repository name (e.g., `my-exam-practice`).
3. Set visibility to **Public** or **Private**.
4. Leave "Initialize this repository with a README" **unchecked** (since you already have one).
5. Click **Create repository**.

### Step 5: Push Code to GitHub
Copy the commands shown on GitHub or run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/my-exam-practice.git
git push -u origin main
```

---

## 🌐 Free Deployment & Free Domains (Not Vercel)

Here are free hosting options for this static app. Free-plan limits and terms may change.

### Option 1: Cloudflare Pages (Recommended)
- **Domain Provided**: Free `https://<your-project>.pages.dev` subdomain.
- **Cost**: Available on Cloudflare's free plan. A custom domain requires a domain you own, which may have a registration cost.

**Steps:**
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) (free account).
2. Go to **Compute (Workers) > Pages** (or **Workers & Pages**) → click **Create application** → **Pages** → **Connect to Git**.
3. Select your GitHub repository (`my-exam-practice`).
4. Set build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**. Cloudflare will provide your `https://<your-app>.pages.dev` URL after the build completes.
6. *(Optional)* Under Pages project settings → **Custom Domains**, connect a domain you own.

---

### Option 2: GitHub Pages
- **Domain Provided**: Free `https://<your-username>.github.io/<repo-name>`
- **Cost**: Available for public repositories on GitHub Free.

**Steps:**
1. Push this project to a GitHub repository.
2. In the repository, go to **Settings** → **Pages** and set **Build and deployment > Source** to **GitHub Actions**.
3. The included `.github/workflows/deploy.yml` workflow builds the app and deploys `dist/`. It sets Vite's base path from the repository name automatically.
4. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to finish. The site will be available at `https://<your-username>.github.io/<repo-name>/`.

---

### Option 3: Netlify manual deploy
- **Domain Provided**: Free `https://<your-app>.netlify.app`
- **Cost**: Available on Netlify's free plan, subject to its current terms and limits.

**Steps:**
1. Run `npm run build` on your computer. A `dist/` folder will be generated.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop the `dist/` folder onto the page.
4. Your application is live immediately!

---

## 👥 How to Collaborate on Questions with Your Team

1. **Shared Google Sheet**:
   - In the app, go to **Manage Questions** → **Team Share & Sync** → **Google Sheets / Paste**.
   - Click **Copy Column Headers** and paste into a shared Google Sheet.
   - Team members write their assigned weeks (e.g., Member 1 does Weeks 1–4, Member 2 does Weeks 5–8).
   - Copy the spreadsheet cells, paste into the app, and click **Merge with Existing Questions**.

2. **Smart Merge Files**:
   - Teammates can click **Export .JSON** or **Export .CSV** and send the file over WhatsApp / Slack / Email.
   - Open **Team Share & Sync** → **File Sync & Merge** → **Smart Merge File**.
   - Questions from both members are safely merged into the master bank.

---

## 🧪 Testing and Verification
Run the automated test suite locally:
```bash
npm run test
```
Build for production:
```bash
npm run build
```
Preview production build:
```bash
npm run preview
```
