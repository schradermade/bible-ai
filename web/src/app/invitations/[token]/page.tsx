import InvitationAccept from '@/components/circles/InvitationAccept';

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InvitationAccept token={token} />;
}
