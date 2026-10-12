import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = 'admin@pixoraautomations.com';
  const password = 'Anish#2007';

  // 1. Create or get user in GoTrue
  console.log('Creating auth user...');
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId;
  if (authErr) {
    if (authErr.message.includes('already exists') || authErr.message.includes('already registered')) {
       console.log('User already exists in Auth, getting ID...');
       const { data: usersData } = await supabase.auth.admin.listUsers();
       const existingUser = usersData.users.find(u => u.email === email);
       if (!existingUser) {
          console.error("Could not find existing user");
          return;
       }
       userId = existingUser.id;
       // Update password just in case
       await supabase.auth.admin.updateUserById(userId, { password });
       console.log('Updated existing user password.');
    } else {
       console.error("Auth error:", authErr);
       return;
    }
  } else {
    userId = authData.user.id;
    console.log('Created auth user with ID:', userId);
  }

  // 2. Ensure user is in platform_admins
  console.log('Adding to platform_admins...');
  const { data: adminRecord, error: adminQueryErr } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('auth_user_id', userId)
    .single();

  if (!adminRecord) {
    const { error: insertErr } = await supabase
      .from('platform_admins')
      .insert({
        auth_user_id: userId,
        email: email,
        role: 'super_admin',
        is_active: true
      });
      
    if (insertErr) {
      console.error("Failed to insert into platform_admins:", insertErr);
    } else {
      console.log("Successfully added to platform_admins!");
    }
  } else {
    console.log("User is already in platform_admins!");
  }
}

main().catch(console.error);
