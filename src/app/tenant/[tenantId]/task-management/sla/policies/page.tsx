import SlaPolicyList from "@/components/task-management/sla copy/SlaPolicyList";

export default function SlaPoliciesPage(props: any) {
  const tenantId = props?.params?.tenantId as string
  return <SlaPolicyList tenantId={tenantId} />
}