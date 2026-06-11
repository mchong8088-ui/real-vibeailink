import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });
  
  // Get user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users?.find(u => u.email === email);
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();
  
  if (existingProfile) {
    return NextResponse.json({ message: 'Profile already exists' });
  }
  
  // Create profile
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      credits: 100,
      subscription_plan: 'Free Explorer',
      created_at: new Date().toISOString()
    });
  
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}