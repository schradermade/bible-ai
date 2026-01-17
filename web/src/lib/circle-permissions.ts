/**
 * Circle Permissions Utilities
 *
 * Centralized permission checking for Study Circles feature.
 * All API endpoints should use these functions to verify access rights.
 */

import { prisma } from './prisma';

/**
 * Verify that a user is a member of a circle
 * @returns The member record if found, null otherwise
 */
export async function verifyCircleMember(circleId: string, userId: string) {
  const member = await prisma.studyCircleMember.findUnique({
    where: { circleId_userId: { circleId, userId } },
    include: {
      circle: true,
    },
  });

  return member;
}

/**
 * Verify that a user is the owner or admin of a circle
 * @returns The member record if they have admin access, null otherwise
 */
export async function verifyCircleAdmin(circleId: string, userId: string) {
  const member = await prisma.studyCircleMember.findUnique({
    where: { circleId_userId: { circleId, userId } },
  });

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    return null;
  }

  return member;
}

/**
 * Verify that a user is the owner of a circle
 * @returns The member record if they are the owner, null otherwise
 */
export async function verifyCircleOwner(circleId: string, userId: string) {
  const member = await prisma.studyCircleMember.findUnique({
    where: { circleId_userId: { circleId, userId } },
  });

  if (!member || member.role !== 'owner') {
    return null;
  }

  return member;
}

/**
 * Check if a user can view another member's reflections
 */
export async function canViewReflections(
  circleId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<boolean> {
  // Users can always view their own reflections
  if (targetUserId === requestingUserId) {
    return true;
  }

  // Check if the target user has enabled reflection sharing
  const targetMember = await prisma.studyCircleMember.findUnique({
    where: { circleId_userId: { circleId, userId: targetUserId } },
    select: { shareReflections: true },
  });

  return targetMember?.shareReflections ?? false;
}

/**
 * Check if a user can view another member's progress
 */
export async function canViewProgress(
  circleId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<boolean> {
  // Users can always view their own progress
  if (targetUserId === requestingUserId) {
    return true;
  }

  // Check if the target user has enabled progress sharing
  const targetMember = await prisma.studyCircleMember.findUnique({
    where: { circleId_userId: { circleId, userId: targetUserId } },
    select: { shareProgress: true },
  });

  return targetMember?.shareProgress ?? false;
}

/**
 * Check if a user can view another member's saved verses
 */
export async function canViewVerses(
  circleId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<boolean> {
  // Users can always view their own verses
  if (targetUserId === requestingUserId) {
    return true;
  }

  // Check if the target user has enabled verse sharing
  const targetMember = await prisma.studyCircleMember.findUnique({
    where: { circleId_userId: { circleId, userId: targetUserId } },
    select: { shareVerses: true },
  });

  return targetMember?.shareVerses ?? false;
}

/**
 * Check if a user can view another member's prayers
 */
export async function canViewPrayers(
  circleId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<boolean> {
  // Users can always view their own prayers
  if (targetUserId === requestingUserId) {
    return true;
  }

  // Check if the target user has enabled prayer sharing
  const targetMember = await prisma.studyCircleMember.findUnique({
    where: { circleId_userId: { circleId, userId: targetUserId } },
    select: { sharePrayers: true },
  });

  return targetMember?.sharePrayers ?? false;
}

/**
 * Check if a circle has reached its maximum member limit
 */
export async function isCircleFull(circleId: string): Promise<boolean> {
  const circle = await prisma.studyCircle.findUnique({
    where: { id: circleId },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  if (!circle) {
    return true; // Circle doesn't exist, so it's "full" for safety
  }

  return circle._count.members >= circle.maxMembers;
}

/**
 * Get member privacy settings for a user in a circle
 */
export async function getMemberPrivacySettings(circleId: string, userId: string) {
  const member = await prisma.studyCircleMember.findUnique({
    where: { circleId_userId: { circleId, userId } },
    select: {
      shareProgress: true,
      shareReflections: true,
      shareVerses: true,
      sharePrayers: true,
    },
  });

  return member || {
    shareProgress: false,
    shareReflections: false,
    shareVerses: false,
    sharePrayers: false,
  };
}

/**
 * Filter reflections based on privacy settings
 * Returns only reflections that the requesting user can see
 */
export async function filterVisibleReflections(
  reflections: Array<{ userId: string; [key: string]: any }>,
  circleId: string,
  requestingUserId: string
) {
  const visibilityChecks = await Promise.all(
    reflections.map(async (reflection) => {
      const canView = await canViewReflections(
        circleId,
        reflection.userId,
        requestingUserId
      );
      return { reflection, canView };
    })
  );

  return visibilityChecks
    .filter(({ canView }) => canView)
    .map(({ reflection }) => reflection);
}

/**
 * Filter prayers based on privacy settings
 * Returns only prayers that the requesting user can see
 */
export async function filterVisiblePrayers(
  prayers: Array<{ userId: string; [key: string]: any }>,
  circleId: string,
  requestingUserId: string
) {
  const visibilityChecks = await Promise.all(
    prayers.map(async (prayer) => {
      const canView = await canViewPrayers(
        circleId,
        prayer.userId,
        requestingUserId
      );
      return { prayer, canView };
    })
  );

  return visibilityChecks
    .filter(({ canView }) => canView)
    .map(({ prayer }) => prayer);
}

/**
 * Filter verses based on privacy settings
 * Returns only verses that the requesting user can see
 */
export async function filterVisibleVerses(
  verses: Array<{ userId: string; [key: string]: any }>,
  circleId: string,
  requestingUserId: string
) {
  const visibilityChecks = await Promise.all(
    verses.map(async (verse) => {
      const canView = await canViewVerses(
        circleId,
        verse.userId,
        requestingUserId
      );
      return { verse, canView };
    })
  );

  return visibilityChecks
    .filter(({ canView }) => canView)
    .map(({ verse }) => verse);
}
