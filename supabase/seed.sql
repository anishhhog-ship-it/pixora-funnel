-- PIXORA FUNNEL - Seed Data
-- Demo Business: Your Business (Jaipur, India)
-- Notice: This is synthetic development seed data and not live customer data.

DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
  demo_profile_id UUID := '11111111-1111-1111-1111-111111111111';
  demo_biz_id UUID := '22222222-2222-2222-2222-222222222222';
  demo_funnel_id UUID := '33333333-3333-3333-3333-333333333333';
  demo_menu_id UUID := '44444444-4444-4444-4444-444444444444';
  cat_starters_id UUID := '55555555-5555-5555-5555-555555555551';
  cat_mains_id UUID := '55555555-5555-5555-5555-555555555552';
  cat_breads_id UUID := '55555555-5555-5555-5555-555555555553';
  cat_desserts_id UUID := '55555555-5555-5555-5555-555555555554';
  qr_counter_id UUID := '66666666-6666-6666-6666-666666666661';
  qr_table1_id UUID := '66666666-6666-6666-6666-666666666662';
BEGIN
  -- 1. Demo Profile
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    demo_profile_id,
    'Vikram Joshi',
    'vikram@yourbusiness.in',
    '+91 92573 78047',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Demo Business
  INSERT INTO public.businesses (
    id, owner_id, name, slug, category, description, tagline,
    phone, email, website, address, city, state, country,
    logo_url, cover_image_url, primary_color, secondary_color,
    font_style, default_language, menu_enabled, services_enabled, status
  )
  VALUES (
    demo_biz_id,
    demo_profile_id,
    'Your Business',
    'your-business',
    'Restaurant & Fine Dining',
    'Authentic Rajasthani & North Indian Royal Dining in the heart of the Pink City.',
    'Royal Flavours of Rajasthan & Traditional Hospitality',
    '+91 92573 78047',
    'hello@yourbusiness.in',
    'https://yourbusiness.in',
    '12, Hawa Mahal Road, Badi Choupad',
    'Jaipur',
    'Rajasthan',
    'India',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop',
    '#0B3D2E',
    '#D4AF37',
    'Modern',
    'English',
    true,
    false,
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3. Business Member
  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (demo_biz_id, demo_profile_id, 'owner')
  ON CONFLICT (business_id, user_id) DO NOTHING;

  -- 4. 1-Day Trial (active)
  INSERT INTO public.trials (user_id, business_id, started_at, expires_at, status)
  VALUES (demo_profile_id, demo_biz_id, now(), now() + interval '1 day', 'active')
  ON CONFLICT DO NOTHING;

  -- 5. Business Settings
  INSERT INTO public.business_settings (
    business_id, auto_reply_enabled, auto_reply_tone, auto_reply_language, custom_reply_instructions
  )
  VALUES (
    demo_biz_id,
    true,
    'Warm & Professional',
    'English',
    'Always thank guests warmly and invite them back to taste our signature Dal Baati Churma.'
  )
  ON CONFLICT (business_id) DO NOTHING;

  -- 6. Funnel
  INSERT INTO public.funnels (id, business_id, slug, status, review_enabled, smart_review_enabled, menu_enabled)
  VALUES (demo_funnel_id, demo_biz_id, 'your-business', 'active', true, true, true)
  ON CONFLICT (id) DO NOTHING;

  -- 7. QR Codes
  INSERT INTO public.qr_codes (
    id, business_id, funnel_id, name, location_name, table_name, short_code,
    destination_url, status, primary_color, secondary_color, cta_text
  )
  VALUES 
    (qr_counter_id, demo_biz_id, demo_funnel_id, 'Billing Counter QR', 'Reception / Billing Desk', 'Counter', 'bm-cntr', 'https://funnel.pixoraautomations.com/f/your-business?qr=bm-cntr', 'active', '#0B3D2E', '#D4AF37', 'Tap or Scan for Menu & Review'),
    (qr_table1_id, demo_biz_id, demo_funnel_id, 'Courtyard Table 01', 'Heritage Courtyard', 'Table 01', 'bm-t01', 'https://funnel.pixoraautomations.com/f/your-business?qr=bm-t01', 'active', '#0B3D2E', '#D4AF37', 'Scan to View Royal Menu')
  ON CONFLICT (id) DO NOTHING;

  -- 8. Menus
  INSERT INTO public.menus (id, business_id, name, description, status)
  VALUES (demo_menu_id, demo_biz_id, 'Royal Heritage Dining Menu', 'Curated royal Rajasthani recipes cooked with cold-pressed ghee and clay ovens.', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- 9. Menu Categories
  INSERT INTO public.menu_categories (id, menu_id, name, description, sort_order, active)
  VALUES
    (cat_starters_id, demo_menu_id, 'Royal Starters & Kebabs', 'Clay oven tandoor skewers and traditional royal snacks', 1, true),
    (cat_mains_id, demo_menu_id, 'Heritage Curries & Dal', 'Slow-cooked royal curries and rich gravies', 2, true),
    (cat_breads_id, demo_menu_id, 'Tandoor Breads & Rice', 'Artisanal naans, rotis and fragrant basmati biryanis', 3, true),
    (cat_desserts_id, demo_menu_id, 'Royal Desserts', 'Artisanal sweet concoctions prepared with saffron and mawa', 4, true)
  ON CONFLICT (id) DO NOTHING;

  -- 10. Menu Items
  INSERT INTO public.menu_items (menu_id, category_id, name, description, price, sort_order, active, bestseller, tags)
  VALUES
    (demo_menu_id, cat_starters_id, 'Dahi Ke Kebab', 'Hung yogurt patties delicately spiced and pan-seared with crushed cardamoms.', 345.00, 1, true, true, '["Chef Special", "Veg"]'::jsonb),
    (demo_menu_id, cat_starters_id, 'Paneer Tikka Angara', 'Smoked cottage cheese cubes steeped in degi mirch marinade and roasted over charcoal.', 395.00, 2, true, false, '["Tandoor", "Spicy"]'::jsonb),
    (demo_menu_id, cat_mains_id, 'Paneer Tikka Masala', 'Charcoal-grilled paneer simmered in an aromatic rich tomato, cashew nut and butter gravy.', 465.00, 1, true, true, '["Bestseller", "Rich"]'::jsonb),
    (demo_menu_id, cat_mains_id, 'Dal Your Business (Dal Makhani)', 'Black lentils slow simmered overnight over live charcoal, finished with white butter.', 425.00, 2, true, true, '["Signature", "Slow-Cooked"]'::jsonb),
    (demo_menu_id, cat_mains_id, 'Rajasthani Gatta Curry', 'Steamed gram flour dumplings in a tempered yogurt curry with royal asafoetida.', 385.00, 3, true, false, '["Traditional"]'::jsonb),
    (demo_menu_id, cat_breads_id, 'Butter Garlic Naan', 'Leavened clay oven bread brushed with crushed fresh garlic and clarified butter.', 125.00, 1, true, false, '["Tandoor"]'::jsonb),
    (demo_menu_id, cat_breads_id, 'Kashmiri Saffron Pulao', 'Fragrant aged long-grain basmati tossed with golden fried onions, saffron and dry fruits.', 345.00, 2, true, false, '["Royal"]'::jsonb),
    (demo_menu_id, cat_desserts_id, 'Kesariya Malpua with Rabdi', 'Heritage fried sweet pancakes dunked in saffron syrup, served with chilled condensed milk.', 275.00, 1, true, true, '["Chef Recommended"]'::jsonb)
  ON CONFLICT DO NOTHING;

  -- 11. Google Reviews (Seed)
  INSERT INTO public.google_reviews (
    business_id, google_review_id, reviewer_name, reviewer_photo_url,
    rating, review_text, review_time, sentiment, reply_status, reply_text
  )
  VALUES
    (
      demo_biz_id,
      'g_rev_001',
      'Aarav Sharma',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      5,
      'Exceptional dining experience! The Dal Your Business was so rich and flavorful, easily the best Dal in Jaipur. The courtyard ambiance and royal treatment made our anniversary unforgettable.',
      now() - interval '2 days',
      'positive',
      'replied',
      'Thank you so much Aarav! It was an absolute pleasure hosting your anniversary. We look forward to welcoming you back for another royal feast soon!'
    ),
    (
      demo_biz_id,
      'g_rev_002',
      'Ananya Sen',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      5,
      'Scanned the QR at the table and received smart review assistance. The Paneer Tikka Masala and Kesariya Malpua were divine. Highly recommend visiting when in Jaipur!',
      now() - interval '5 days',
      'positive',
      'unanswered',
      NULL
    ),
    (
      demo_biz_id,
      'g_rev_003',
      'Rohan Singhania',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      4,
      'Great ambiance and courteous staff. A small delay during peak weekend rush, but the manager handled it gracefully with complimentary spiced buttermilk. Will return!',
      now() - interval '7 days',
      'positive',
      'draft',
      'Dear Rohan, thank you for visiting Your Business and for your kind appreciation of our staff. We apologize for the weekend wait and are delighted you enjoyed the complimentary spiced buttermilk!'
    )
  ON CONFLICT (business_id, google_review_id) DO NOTHING;

  -- 12. Reply Templates
  INSERT INTO public.reply_templates (
    business_id, category, rating_range, sentiment, topic, tone, language, template_text
  )
  VALUES
    (
      demo_biz_id,
      'Restaurant',
      '5',
      'positive',
      'Food & Hospitality',
      'Warm & Professional',
      'English',
      'Thank you so much for dining with us at Your Business! We are thrilled that you relished our royal culinary offerings. We cannot wait to welcome you back!'
    ),
    (
      demo_biz_id,
      'Restaurant',
      '4-5',
      'positive',
      'Ambiance & Experience',
      'Warm & Professional',
      'English',
      'We truly appreciate your kind feedback! Our team takes immense pride in delivering authentic Rajasthani warmth and heritage ambiance. See you soon!'
    )
  ON CONFLICT DO NOTHING;

  -- 13. Reply Rules
  INSERT INTO public.reply_rules (
    business_id, rating_min, rating_max, auto_reply_enabled, approval_required, sensitive_issue_review
  )
  VALUES (demo_biz_id, 4, 5, false, true, true)
  ON CONFLICT DO NOTHING;

  -- 14. Demo Customers
  INSERT INTO public.customers (
    business_id, name, phone, email, first_seen_at, last_seen_at, visit_count, source, status
  )
  VALUES
    (demo_biz_id, 'Aarav Sharma', '+91 98234 56789', 'aarav.sharma@gmail.com', now() - interval '30 days', now() - interval '2 days', 4, 'qr_scan', 'active'),
    (demo_biz_id, 'Ananya Sen', '+91 97112 33445', 'ananya.sen@outlook.com', now() - interval '5 days', now() - interval '5 days', 1, 'qr_scan', 'active'),
    (demo_biz_id, 'Rohan Singhania', '+91 99887 66554', 'rohan.s@gmail.com', now() - interval '14 days', now() - interval '7 days', 2, 'qr_scan', 'active')
  ON CONFLICT DO NOTHING;

  -- 15. Analytics Events (Seed for charts)
  INSERT INTO public.analytics_events (business_id, session_id, event_type, metadata, created_at)
  VALUES
    (demo_biz_id, 'sess_01', 'qr_scan', '{"source": "table_01"}'::jsonb, now() - interval '3 days'),
    (demo_biz_id, 'sess_01', 'experience_started', '{"rating": 5}'::jsonb, now() - interval '3 days'),
    (demo_biz_id, 'sess_01', 'suggestion_selected', '{"index": 1}'::jsonb, now() - interval '3 days'),
    (demo_biz_id, 'sess_01', 'google_clicked', '{}'::jsonb, now() - interval '3 days'),
    (demo_biz_id, 'sess_02', 'qr_scan', '{"source": "counter"}'::jsonb, now() - interval '2 days'),
    (demo_biz_id, 'sess_02', 'menu_view', '{}'::jsonb, now() - interval '2 days'),
    (demo_biz_id, 'sess_02', 'menu_saved', '{}'::jsonb, now() - interval '2 days'),
    (demo_biz_id, 'sess_03', 'qr_scan', '{"source": "table_01"}'::jsonb, now() - interval '1 day'),
    (demo_biz_id, 'sess_03', 'experience_started', '{"rating": 5}'::jsonb, now() - interval '1 day'),
    (demo_biz_id, 'sess_03', 'google_clicked', '{}'::jsonb, now() - interval '1 day')
  ON CONFLICT DO NOTHING;

END $$;
