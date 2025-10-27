import SlaTimerSearch from "@/components/task-management/sla/SlaTimerSearch";

export default function SlaTimersPage(props: any) {
  const tenantId = props?.params?.tenantId as string
  return <SlaTimerSearch tenantId={tenantId} />
}