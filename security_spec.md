# Security Specification - Printfield

## Data Invariants
- A product must have a non-empty name, category, and description.
- Price must be a positive number.
- `createdAt` and `updatedAt` must be valid server timestamps.

## The "Dirty Dozen" Payloads (Examples)
1. **Identity Spoofing**: Attempt to write a product as an unauthenticated user.
2. **Resource Poisoning**: Document ID with 1MB junk data.
3. **Type Mismatch**: Price as a string.
4. **Missing Required Fields**: Creating a product without `description`.
5. **Future Dating**: Setting `createdAt` to a future timestamp from the client.
6. **Immutable Field Update**: Attempting to change `createdAt` on update.
7. **Role Escalation**: Attempting to write to `admins` collection.
8. **Shadow Field**: Adding `isPromoted: true` to a product when not allowed.
9. **Invalid Range**: Price set to -100.
10. **Path Poisoning**: Injecting relative paths into document IDs.
11. **Large String**: 2MB description field.
12. **Unauthorized Update**: A non-admin user attempting to update a product.

## Test Runner (Conceptual)
Verified via `firestore.rules`.
