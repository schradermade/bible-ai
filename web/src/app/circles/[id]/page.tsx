import CircleHome from '@/components/circles/CircleHome';

export default function CircleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <CircleHome circleId={params.id} />;
}
