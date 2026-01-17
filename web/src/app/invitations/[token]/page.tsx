import InvitationAccept from '@/components/circles/InvitationAccept';

export default function InvitationPage({
  params,
}: {
  params: { token: string };
}) {
  return <InvitationAccept token={params.token} />;
}
