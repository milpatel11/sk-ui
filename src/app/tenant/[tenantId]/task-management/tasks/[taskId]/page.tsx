import TaskDetails from "@/components/task-management/TaskDetails";

export default function TaskDetailPage(props: any) {
  const tenantId = props?.params?.tenantId as string
  const taskId = props?.params?.taskId as string
  return <TaskDetails tenantId={tenantId} taskId={taskId} />
}