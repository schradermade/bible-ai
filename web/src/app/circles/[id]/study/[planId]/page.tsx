import SharedStudyView from '@/components/circles/SharedStudyView';

export default function CircleStudyPage({
  params,
}: {
  params: { id: string; planId: string };
}) {
  return <SharedStudyView circleId={params.id} studyPlanId={params.planId} />;
}
