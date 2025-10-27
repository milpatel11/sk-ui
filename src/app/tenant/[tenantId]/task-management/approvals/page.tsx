import ApprovalsTable from "@/components/task-management/approvals/ApprovalsTable";

export default function ApprovalsPage(props: any) {
  const tenantId = props?.params?.tenantId as string
  return <ApprovalsTable tenantId={tenantId} />
}