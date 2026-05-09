import { notFound } from "next/navigation";
import path from "path";
import fs from "fs";
import { MDXRemote } from "next-mdx-remote/rsc";
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

  return (
    <div className="h-full overflow-hidden -m-6 flex">
      {/* Concept panel — rendered entirely in the Server Component.
          MDXRemote never crosses the RSC boundary, so MDXContent (a function)
          is never serialized into the client payload. */}
      <aside className="w-[340px] shrink-0 flex flex-col overflow-hidden border-r border-surface-600 bg-surface-900">
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <div className="mb-4 rounded-lg border border-amber-600/30 bg-amber-600/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">Scenario</p>
            <p className="text-xs text-amber-200/80 leading-relaxed">{lab.scenario}</p>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-gray-300 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-4 [&_code]:text-teal-400 [&_pre]:bg-surface-700 [&_pre]:text-xs [&_table]:text-xs [&_a]:text-teal-400">
            <MDXRemote source={mdxSource} />
          </div>
        </div>
      </aside>

      {/* Interactive area — only serialisable props cross the boundary */}
      <LessonClient lab={lab} labId={id} hiddenSetupYaml={hiddenSetupYaml} />
    </div>
  );
}
