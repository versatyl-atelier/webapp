import { notFound } from "next/navigation";

import { getProject } from "@/actions/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { TabsContent } from "@/components/ui/tabs";
import { PROJECT_TAB_PARAM, PROJECT_TABS } from "@/constants/projects";
import { projectPath } from "@/lib/paths";
import { parseProjectTab } from "@/lib/projectTabs";
import { requireActiveSession } from "@/lib/session";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: ProjectPageProps) {
  const { id } = await params;
  await requireActiveSession(projectPath(id));
  const project = await getProject(id);

  if (!project) {
    return notFound();
  }

  const query = await searchParams;
  const tab = parseProjectTab(query[PROJECT_TAB_PARAM]);

  return (
    <>
      <h1>{project.name}</h1>
      <ProjectTabs tab={tab}>
        {PROJECT_TABS.map(({ value }) => (
          <TabsContent key={value} value={value}>
            …
          </TabsContent>
        ))}
      </ProjectTabs>
    </>
  );
}
