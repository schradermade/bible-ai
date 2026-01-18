import SharedStudyView from '@/components/circles/SharedStudyView';

export default async function CircleStudyPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>;
}) {
  const { id, planId } = await params;
  return <SharedStudyView circleId={id} studyPlanId={planId} />;
}
