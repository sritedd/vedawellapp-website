/**
 * VedaWell — GitHub Awesome-List PR Creator
 * Usage: node scripts/submit-github-prs.mjs YOUR_GITHUB_TOKEN
 *
 * Your GitHub token needs: repo scope (to fork + create PRs)
 * Create at: https://github.com/settings/tokens/new
 */

const TOKEN = process.argv[2];
if (!TOKEN) {
  console.error("Usage: node scripts/submit-github-prs.mjs YOUR_GITHUB_TOKEN");
  process.exit(1);
}

const GITHUB_USER = "sritedd"; // your GitHub username
const VEDAWELL_URL = "https://vedawell.tools";
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
  "User-Agent": "VedaWell-Reach-Bot/1.0",
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function gh(method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

// ─── PR TARGETS ───────────────────────────────────────────────────────────────
// Each entry: the repo, where to add in the README, and the line to insert
const PR_TARGETS = [
  {
    owner: "bradtraversy",
    repo: "design-resources-for-developers",
    branch: "master",
    description: "Design resources for developers — 55k+ stars",
    section: "## Online Tools",
    addition: `| [VedaWell Tools](${VEDAWELL_URL}/tools) | 90+ free browser-based tools: image compressor, PDF tools, QR generator, password generator, color picker, and more | Free |`,
  },
  {
    owner: "goabstract",
    repo: "Awesome-Design-Tools",
    branch: "master",
    description: "Awesome Design Tools — 30k+ stars",
    section: "### Color Tools",
    addition: `- [VedaWell Color Tools](${VEDAWELL_URL}/tools/color-palette-generator) — Free browser-based color palette generator, color picker from image, gradient generator and more.`,
  },
  {
    owner: "jnv",
    repo: "list-of-lists",
    branch: "master",
    description: "List of lists",
    section: "## Software",
    addition: `- [VedaWell Tools](${VEDAWELL_URL}/tools) — 90+ free online tools for developers and everyday users.`,
  },
  {
    owner: "neutralinojs",
    repo: "awesome-neutralinojs",
    branch: "main",
    description: "Skip — not relevant",
    skip: true,
  },
];

// ─── FORK + PR FLOW ───────────────────────────────────────────────────────────
async function createPR({ owner, repo, branch, section, addition, description, skip }) {
  if (skip) return;

  console.log(`\n📝 ${owner}/${repo} (${description})`);

  // 1. Fork
  const fork = await gh("POST", `/repos/${owner}/${repo}/forks`, { organization: undefined });
  if (fork.status !== 202 && fork.status !== 200) {
    console.log(`  ❌ Fork failed: ${fork.status} — ${JSON.stringify(fork.data).slice(0, 100)}`);
    return;
  }
  console.log(`  ✅ Forked → ${GITHUB_USER}/${repo}`);
  await sleep(3000); // wait for fork to be ready

  // 2. Get current README SHA
  const readmeRes = await gh("GET", `/repos/${GITHUB_USER}/${repo}/contents/README.md`);
  if (readmeRes.status !== 200) {
    console.log(`  ❌ README not found: ${readmeRes.status}`);
    return;
  }
  const { sha, content } = readmeRes.data;
  const currentContent = Buffer.from(content, "base64").toString("utf-8");

  // 3. Find insertion point and add VedaWell
  if (currentContent.includes("vedawell.tools")) {
    console.log(`  ⏭️  Already listed — skipping`);
    return;
  }
  if (!currentContent.includes(section)) {
    console.log(`  ⚠️  Section "${section}" not found — skipping`);
    return;
  }

  const newContent = currentContent.replace(
    section,
    `${section}\n${addition}`
  );

  // 4. Create a new branch
  const branchName = `add-vedawell-tools-${Date.now()}`;
  const baseRef = await gh("GET", `/repos/${GITHUB_USER}/${repo}/git/ref/heads/${branch}`);
  if (baseRef.status !== 200) {
    console.log(`  ❌ Could not get base branch ref: ${baseRef.status}`);
    return;
  }
  const sha_ref = baseRef.data.object.sha;

  const branchRes = await gh("POST", `/repos/${GITHUB_USER}/${repo}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: sha_ref,
  });
  if (branchRes.status !== 201) {
    console.log(`  ❌ Branch creation failed: ${branchRes.status}`);
    return;
  }
  console.log(`  ✅ Branch created: ${branchName}`);

  // 5. Update README on new branch
  const updateRes = await gh("PUT", `/repos/${GITHUB_USER}/${repo}/contents/README.md`, {
    message: "Add VedaWell Tools — 90+ free browser-based tools",
    content: Buffer.from(newContent).toString("base64"),
    sha,
    branch: branchName,
  });
  if (updateRes.status !== 200) {
    console.log(`  ❌ README update failed: ${updateRes.status}`);
    return;
  }
  console.log(`  ✅ README updated`);

  // 6. Create PR
  const prRes = await gh("POST", `/repos/${owner}/${repo}/pulls`, {
    title: "Add VedaWell Tools — 90+ free browser-based tools",
    body: `## What is VedaWell Tools?

[VedaWell Tools](${VEDAWELL_URL}/tools) is a collection of **90+ free, browser-based tools** for developers and everyday users:

- 🔐 Password Generator, UUID Generator, Hash Generator
- 📄 PDF merge/split/compress/convert, PDF to Word
- 🖼️ Image compressor, resizer, cropper, background remover
- 🎨 Color palette, gradient generator, CSS grid/flexbox
- 📊 BMI calculator, loan calculator, mortgage calculator
- { } JSON formatter, Base64, regex tester, JWT decoder
- 🕐 Pomodoro timer, countdown, stopwatch, focus timer
- ✍️ Word counter, markdown editor, text summarizer

All tools run **100% in the browser** — no upload, no server, no signup.

**Tech**: Next.js, deployed on Netlify — [vedawell.tools](${VEDAWELL_URL})`,
    head: `${GITHUB_USER}:${branchName}`,
    base: branch,
  });
  if (prRes.status === 201) {
    console.log(`  ✅ PR created: ${prRes.data.html_url}`);
  } else {
    console.log(`  ❌ PR failed: ${prRes.status} — ${JSON.stringify(prRes.data).slice(0, 200)}`);
  }
  await sleep(2000);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
console.log("=".repeat(60));
console.log("🐙 GitHub Awesome-List PR Creator");
console.log("=".repeat(60));

for (const target of PR_TARGETS) {
  await createPR(target);
}

console.log("\n✅ Done! Check your GitHub notifications for PR updates.");
