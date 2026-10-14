import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { extractAuthToken } from '@/services/salesAuthService';
import { Business } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://funnel.pixoraautomations.com';

function slugBase(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'business';
}

async function generateSlug(db: any, name: string) {
  const base = slugBase(name);
  const { data: b1 } = await db.from('businesses').select('id').eq('slug', base).maybeSingle();
  if (!b1) return base;

  for (let i = 2; i <= 50; i++) {
    const candidate = `${base}-${i}`;
    const { data: bTaken } = await db.from('businesses').select('id').eq('slug', candidate).maybeSingle();
    if (!bTaken) return candidate;
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
}

/**
 * Authoritatively resolves and auto-links businesses belonging to the authenticated client.
 * Bypasses RLS using Supabase Admin client so that clients onboarded or credentialed
 * by sales reps NEVER hit a "No business profile attached to this email" dead end.
 */
async function resolveUserBusinesses(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authorization header required' }, { status: 401 });
    }

    const admin = getSupabaseAdminClient() as any;
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);

    if (userErr || !user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired user session' }, { status: 401 });
    }

    const userId = user.id;
    const email = (user.email || '').toLowerCase().trim();
    const fullName = user.user_metadata?.full_name || 'Business Owner';

    // 1. Direct owner_id query on businesses
    const { data: ownedList } = await admin
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    let businesses: any[] = ownedList ? [...ownedList] : [];

    // 2. Query business_members memberships
    try {
      const { data: memberList } = await admin
        .from('business_members')
        .select('business_id')
        .eq('user_id', userId);

      const memberBizIds = (memberList || []).map((m: any) => m.business_id).filter(Boolean);
      if (memberBizIds.length > 0) {
        const { data: memberBizs } = await admin
          .from('businesses')
          .select('*')
          .in('id', memberBizIds);
        if (memberBizs) {
          for (const mb of memberBizs) {
            if (!businesses.some((b: any) => b.id === mb.id)) {
              businesses.push(mb);
            }
          }
        }
      }
    } catch (e) {
      console.warn('business_members lookup warning:', e);
    }

    // 3. Query by client email on businesses table
    if (email) {
      try {
        const { data: emailBizs } = await admin
          .from('businesses')
          .select('*')
          .ilike('email', email)
          .order('created_at', { ascending: false });

        if (emailBizs && emailBizs.length > 0) {
          for (const eb of emailBizs) {
            if (!businesses.some((b: any) => b.id === eb.id)) {
              businesses.push(eb);
            }
            // Auto-link owner_id if not linked or mismatched
            if (eb.owner_id !== userId) {
              await admin.from('businesses').update({
                owner_id: userId,
                status: 'active',
                plan_status: 'active',
                updated_at: new Date().toISOString(),
              }).eq('id', eb.id);

              try {
                await admin.from('business_members').upsert({
                  business_id: eb.id,
                  user_id: userId,
                  role: 'owner',
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'business_id,user_id' });
              } catch {}
            }
          }
        }
      } catch (e) {
        console.warn('email businesses lookup warning:', e);
      }
    }

    // 4. Query via sales_orders (client converted by sales)
    if (businesses.length === 0 && email) {
      try {
        const { data: orders } = await admin
          .from('sales_orders')
          .select('id, business_id, customer_id, plan_snapshot')
          .or(`customer_id.eq.${userId},plan_snapshot->>customerEmail.ilike.${email}`);

        if (orders && orders.length > 0) {
          for (const ord of orders) {
            if (ord.business_id) {
              const { data: ordBiz } = await admin
                .from('businesses')
                .select('*')
                .eq('id', ord.business_id)
                .maybeSingle();

              if (ordBiz) {
                if (!businesses.some((b: any) => b.id === ordBiz.id)) {
                  businesses.push(ordBiz);
                }
                // Auto-link business and order to this user
                await admin.from('businesses').update({
                  owner_id: userId,
                  email: email,
                  status: 'active',
                  plan_status: 'active',
                  updated_at: new Date().toISOString(),
                }).eq('id', ordBiz.id);

                await admin.from('sales_orders').update({
                  customer_id: userId,
                }).eq('id', ord.id);

                try {
                  await admin.from('business_members').upsert({
                    business_id: ordBiz.id,
                    user_id: userId,
                    role: 'owner',
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'business_id,user_id' });
                } catch {}
              }
            }
          }
        }
      } catch (e) {
        console.warn('sales_orders lookup warning:', e);
      }
    }

    // 5. Query via prospects (converted by sales rep)
    if (businesses.length === 0 && email) {
      try {
        const { data: prospectRows } = await admin
          .from('prospects')
          .select('id, business_name, email, phone, category, city, converted_business_id')
          .ilike('email', email);

        if (prospectRows && prospectRows.length > 0) {
          for (const p of prospectRows) {
            if (p.converted_business_id) {
              const { data: pBiz } = await admin
                .from('businesses')
                .select('*')
                .eq('id', p.converted_business_id)
                .maybeSingle();

              if (pBiz) {
                if (!businesses.some((b: any) => b.id === pBiz.id)) {
                  businesses.push(pBiz);
                }
                await admin.from('businesses').update({
                  owner_id: userId,
                  email: email,
                  status: 'active',
                  plan_status: 'active',
                  updated_at: new Date().toISOString(),
                }).eq('id', pBiz.id);

                try {
                  await admin.from('business_members').upsert({
                    business_id: pBiz.id,
                    user_id: userId,
                    role: 'owner',
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'business_id,user_id' });
                } catch {}
              }
            }
          }
        }
      } catch (e) {
        console.warn('prospects lookup warning:', e);
      }
    }

    // 6. Absolute Guarantee: If STILL empty, auto-provision an active business tenant!
    // A client who was provisioned or logged in must NEVER be left with a dead end!
    if (businesses.length === 0) {
      try {
        const defaultName = fullName && fullName !== 'Business Owner'
          ? `${fullName}'s Business`
          : (email ? `${email.split('@')[0]} Business` : 'My Business');

        const slug = await generateSlug(admin, defaultName);
        const now = new Date().toISOString();

        const { data: newBiz, error: createBizErr } = await admin.from('businesses').insert({
          name: defaultName,
          slug,
          owner_id: userId,
          email: email || null,
          category: 'General Business',
          status: 'active',
          plan_status: 'active',
          primary_color: '#0B3D2E',
          secondary_color: '#D4AF37',
          menu_enabled: true,
          products_enabled: true,
          created_at: now,
          updated_at: now,
        }).select('*').single();

        if (newBiz) {
          businesses.push(newBiz);

          // Auto-create funnel
          const { data: funnel } = await admin.from('funnels').insert({
            business_id: newBiz.id,
            slug,
            status: 'active',
            review_enabled: true,
            smart_review_enabled: true,
            created_at: now,
            updated_at: now,
          }).select('id').single();

          // Auto-create QR code
          if (funnel) {
            await admin.from('qr_codes').insert({
              business_id: newBiz.id,
              funnel_id: funnel.id,
              name: `${defaultName} QR`,
              short_code: `px-${crypto.randomUUID().slice(0, 8)}`,
              destination_url: `${APP_URL}/f/${slug}`,
              status: 'active',
              created_at: now,
              updated_at: now,
            });
          }

          try {
            await admin.from('business_members').upsert({
              business_id: newBiz.id,
              user_id: userId,
              role: 'owner',
              created_at: now,
              updated_at: now,
            }, { onConflict: 'business_id,user_id' });
          } catch {}
        }
      } catch (e) {
        console.error('Auto-provision business tenant failure:', e);
      }
    }

    // 7. Ensure profile record exists with role: 'business_owner'
    try {
      await admin.from('profiles').upsert({
        id: userId,
        email: email,
        full_name: fullName,
        role: 'business_owner',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch {}

    // 8. Map to client Business type
    const mappedBusinesses: Business[] = businesses.map((b: any) => ({
      businessId: b.id,
      id: b.id,
      ownerId: b.owner_id || userId,
      userId: b.owner_id || userId,
      slug: b.slug,
      name: b.name,
      category: b.category || 'Local Business',
      city: b.city || 'Jaipur',
      logo: b.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop',
      coverImage: b.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop',
      googlePlaceId: b.website || b.google_place_id || 'https://maps.google.com',
      ownerName: fullName,
      phone: b.phone || '',
      email: b.email || email,
      planStatus: 'active' as const,
      trialExpiresAt: b.trial_expires_at || null,
      qrScans: b.qr_scans || 0,
      reviewsCount: b.reviews_count || 0,
      createdAt: b.created_at,
      theme: {
        primaryColor: b.primary_color || '#0B3D2E',
        secondaryColor: b.secondary_color || '#D4AF37',
        accentColor: b.accent_color || '#FDFBF7',
        logo: b.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop',
        coverImage: b.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop',
        businessName: b.name,
        category: b.category || 'Local Business',
        tagline: b.tagline || '',
        menuEnabled: b.menu_enabled ?? true,
      },
    }));

    return NextResponse.json({
      success: true,
      businesses: mappedBusinesses,
      activeSlug: mappedBusinesses[0]?.slug || '',
    });
  } catch (err: any) {
    console.error('Error resolving user businesses:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return resolveUserBusinesses(req);
}

export async function POST(req: NextRequest) {
  return resolveUserBusinesses(req);
}
