export const USER_LEVEL_OPTIONS = ["User", "Developer", "Master"] as const;
export const USER_ACTIVITY_OPTIONS = ["Active", "Deactive"] as const;
export const USER_VERIFICATION_OPTIONS = ["Verified", "Pending"] as const;

export type UserLevel = (typeof USER_LEVEL_OPTIONS)[number];
export type UserActivity = (typeof USER_ACTIVITY_OPTIONS)[number];
export type UserVerification = (typeof USER_VERIFICATION_OPTIONS)[number];

export type UserRow = {
  name: string;
  email: string;
  level: UserLevel;
  photo: string;
  verification: UserVerification;
  activity: UserActivity;
};
