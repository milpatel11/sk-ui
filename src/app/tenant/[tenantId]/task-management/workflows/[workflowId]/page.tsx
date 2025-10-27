import WorkflowDetail from "@/components/task-management/workflows/WorkflowDetail";

export default function WorkflowDetailPage(props: any) {
  const tenantId = props?.params?.tenantId as string
  const workflowId = props?.params?.workflowId as string
  return <WorkflowDetail tenantId={tenantId} workflowId={workflowId} />
}