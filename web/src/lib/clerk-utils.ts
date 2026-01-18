import { clerkClient } from '@clerk/nextjs/server';

/**
 * Get formatted user name as "FirstName L." from Clerk
 */
export async function getFormattedUserName(userId: string): Promise<string> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const firstName = user.firstName || 'Unknown';
    const lastName = user.lastName || '';

    if (lastName) {
      return `${firstName} ${lastName.charAt(0)}.`;
    }

    return firstName;
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    return 'Unknown User';
  }
}

/**
 * Get multiple formatted user names in parallel
 */
export async function getFormattedUserNames(
  userIds: string[]
): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    userIds.map(async (userId) => ({
      userId,
      name: await getFormattedUserName(userId),
    }))
  );

  const nameMap: Record<string, string> = {};

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      nameMap[result.value.userId] = result.value.name;
    }
  });

  return nameMap;
}
