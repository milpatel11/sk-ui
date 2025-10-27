import WorkflowList from "@/components/task-management/workflows/WorkflowList";

export default function WorkflowsPage(props: any) {
  const tenantId = props?.params?.tenantId as string
  return <WorkflowList tenantId={tenantId} />
}