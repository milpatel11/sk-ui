import TasksList from "@/components/task-management/TasksList";

export default function TasksPage(props: any) {
  const tenantId = props?.params?.tenantId as string
  return <TasksList tenantId={tenantId} />
}