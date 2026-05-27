import { notFound } from "next/navigation";
import path from "path";
import fs from "fs";
import matter from "gray-matter";
import { marked } from "marked";
import yaml from "js-yaml";
import type { LabDefinition } from "@/lib/verifiers/types";
import { LessonClient } from "./LessonClient";

export const dynamic = "force-dynamic";

async function loadLab(id: string): Promise<LabDefinition | null> {
  const labPath = path.join(process.cwd(), "content", "labs", `${id}.json`);
  if (!fs.existsSync(labPath)) return null;
  return JSON.parse(fs.readFileSync(labPath, "utf8")) as LabDefinition;
}

async function loadMdxSource(id: string): Promise<string | null> {
  const mdxPath = path.join(process.cwd(), "content", "lessons", `${id}.mdx`);
  if (!fs.existsSync(mdxPath)) return null;
  return fs.readFileSync(mdxPath, "utf8");
}

function buildHiddenSetupYaml(lab: LabDefinition): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setup = (lab as any).hiddenSetup as unknown[] | undefined;
  if (!setup || setup.length === 0) return undefined;
  return setup.map((doc) => yaml.dump(doc)).join("---\n");
}

export default async function LessonPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [lab, mdxSource] = await Promise.all([loadLab(id), loadMdxSource(id)]);

  if (!lab || !mdxSource) return notFound();

  const hiddenSetupYaml = buildHiddenSetupYaml(lab);

  // Strip frontmatter and convert markdown to HTML on the server.
  // Avoids next-mdx-remote/rsc which leaks an MDXContent function into the
  // RSC streaming payload and crashes in Next.js 14 production mode.
  const { content: mdBody } = matter(mdxSource);
  const conceptHtml = await marked(mdBody, { gfm: true });

  return (
    <div className="h-full overflow-hidden -m-6 flex">
      <LessonClient
        lab={lab}
        labId={id}
        hiddenSetupYaml={hiddenSetupYaml}
        scenarioHtml={conceptHtml}
        scenarioText={lab.scenario}
      />
    </div>
  );
}
