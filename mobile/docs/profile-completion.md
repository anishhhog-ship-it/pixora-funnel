# Mobile profile completion

The Account screen calculates completion from these business columns:
`name`, `category`, `phone`, `email`, `address`, `city`, `state`, `pincode`,
and `website`.

Saving uses the existing `WorkspaceProvider.updateBusiness` Supabase update
and mirrors the business phone to `updateProfile({ phone })`. The current
mobile contract therefore expects `businesses.pincode` to be present and
writeable for the signed-in business owner. If the deployed database does not
yet have that column, the editor keeps the save error visible instead of
claiming the completion was persisted.
