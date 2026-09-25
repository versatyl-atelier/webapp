import { AppBreadcrumb } from "@/components/AppBreadcrumb";

type SubBreadcrumbProps = {
  params: Promise<{ catchAll: string[] }>;
};

export async function SubBreadcrumb({ params }: SubBreadcrumbProps) {
  const { catchAll } = await params;
  return <AppBreadcrumb segments={catchAll} />;
}
