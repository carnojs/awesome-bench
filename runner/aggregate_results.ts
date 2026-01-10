import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

interface FrameworkResult {
  framework_id: string;
  language: string;
  framework: string;
  measured_at: string;
  contract_version: number;
  runner_version: string;
  environment: {
    os: string;
    ci: string;
    oha_version: string;
  };
  benchmarks: Record<
    string,
    {
      duration_seconds: number;
      requests_per_sec: number;
      latency_ms: {
        p50: number;
        p95: number;
        p99: number;
      };
      errors: number;
    }
  >;
}

interface IndexEntry {
  id: string;
  language: string;
  framework: string;
  measured_at: string;
  latest: string;
}

interface IndexFile {
  generated_at: string;
  contract_version: number;
  frameworks: IndexEntry[];
}

async function main() {
  const scriptDir = dirname(new URL(import.meta.url).pathname);
  const resultsDir = join(scriptDir, "..", "site", "public", "results");
  const frameworksDir = join(resultsDir, "frameworks");
  const contractFile = join(scriptDir, "..", "benchmarks", "contract.json");

  if (!existsSync(frameworksDir)) {
    console.log("No frameworks directory found. Creating empty index.");
    await mkdir(frameworksDir, { recursive: true });
  }

  const contract = JSON.parse(await readFile(contractFile, "utf-8"));
  const contractVersion = contract.version;

  const frameworks: IndexEntry[] = [];

  let entries: string[] = [];
  try {
    entries = await readdir(frameworksDir);
  } catch {
    entries = [];
  }

  for (const entry of entries) {
    const frameworkDir = join(frameworksDir, entry);

    try {
      // Find the most recent JSON file (excluding latest.json)
      const files = await readdir(frameworkDir);
      const jsonFiles = files
        .filter(f => f.endsWith('.json') && f !== 'latest.json')
        .sort()
        .reverse();

      if (jsonFiles.length === 0) {
        console.log(`No result files found for ${entry}, skipping`);
        continue;
      }

      const mostRecentFile = jsonFiles[0];
      const mostRecentPath = join(frameworkDir, mostRecentFile);
      const latestPath = join(frameworkDir, "latest.json");

      const result: FrameworkResult = JSON.parse(
        await readFile(mostRecentPath, "utf-8")
      );

      // Update latest.json to point to the most recent result
      await writeFile(latestPath, JSON.stringify(result, null, 2));
      console.log(`Updated latest.json for ${entry} -> ${mostRecentFile}`);

      frameworks.push({
        id: result.framework_id,
        language: result.language,
        framework: result.framework,
        measured_at: result.measured_at,
        latest: `results/frameworks/${entry}/latest.json`,
      });

      console.log(`Added: ${result.framework_id}`);
    } catch (error) {
      console.error(`Error processing ${entry}:`, error);
    }
  }

  frameworks.sort((a, b) => a.id.localeCompare(b.id));

  const index: IndexFile = {
    generated_at: new Date().toISOString(),
    contract_version: contractVersion,
    frameworks,
  };

  const indexPath = join(resultsDir, "index.json");
  await writeFile(indexPath, JSON.stringify(index, null, 2));

  console.log(`\nIndex generated with ${frameworks.length} frameworks`);
  console.log(`Saved to: ${indexPath}`);
}

main().catch(console.error);
