-- Create Activation Keys Table
CREATE TABLE IF NOT EXISTS public.activation_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_string TEXT NOT NULL UNIQUE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who generated it
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;

-- Admins can manage all keys
CREATE POLICY "Admins can manage activation keys"
ON public.activation_keys
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM platform_admins WHERE auth_user_id = auth.uid()
    )
);

-- Users can read their own business's keys
CREATE POLICY "Users can read their own activation keys"
ON public.activation_keys
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM businesses WHERE id = activation_keys.business_id AND owner_id = auth.uid()
    )
);

-- Users can update keys (i.e. to mark as used)
CREATE POLICY "Users can use activation keys"
ON public.activation_keys
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM businesses WHERE id = activation_keys.business_id AND owner_id = auth.uid()
    )
)
WITH CHECK (
    is_used = true
);
