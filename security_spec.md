# ForgeFit Security Specification

## Data Invariants
- User profile must have a matching `userId` to the document ID.
- Weight logs, workout logs, nutrition logs, and hydration logs must belong to the authenticated user (`userId` field matches `auth.uid`).
- Users can only read/write their own data.
- Global PII isolation for user profiles.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempting to create a user profile for a different UID.
2. **Resource Poisoning**: Writing a weight log with a massive 1MB string.
3. **State Shortcutting**: Updating a goal to an invalid enum value.
4. **Unauthorized Read**: User A attempting to read User B's weight logs.
5. **Unauthorized Delete**: User A attempting to delete User B's workout.
6. **PII Leak**: Unauthenticated user attempting to list all user profiles.
7. **Bypassing Validation**: Creating a workout log without a date.
8. **Orphaned Writes**: Writing a workout log for a user profile that doesn't exist.
9. **Timestamp Manipulation**: Manually setting `createdAt` to a past date.
10. **Shadow Update**: Adding a hidden `isAdmin` field to a user profile.
11. **Negative Hydration**: Writing a hydration log with `-500ml`.
12. **Future Weight**: Writing a weight log dated 10 years in the future.

## Test Runner (Conceptual)
The following rules will be audited against these vulnerabilities.
