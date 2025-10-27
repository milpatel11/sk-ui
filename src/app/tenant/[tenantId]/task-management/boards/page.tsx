import BoardsView from "@/components/task-management/BoardsView";

export default function BoardsPage(props: any) {
  const tenantId = props?.params?.tenantId as string
  return <BoardsView tenantId={tenantId} />
}
