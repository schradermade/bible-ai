import CircleHome from '@/components/circles/CircleHome';

export default async function CircleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CircleHome circleId={id} />;
}
