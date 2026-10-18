import { type ReactNode, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check, ChevronRight, ExternalLink, FileText, HelpCircle, LogOut, Mail, Pencil, Shield, Smartphone, UserRound } from 'lucide-react-native';
import { useSession } from '@/ctx';
import { useWorkspace } from '@/workspace';
import { colors, radii } from '@/theme';
import { API_URL, SUPPORT_EMAIL } from '@/lib/config';
import { formatDate, initials } from '@/lib/format';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, PrimaryButton, SecondaryButton, StatusPill } from '@/components/ui';

export default function AccountScreen() {
  const { user, signOut } = useSession();
  const { workspace, status, error, refresh, updateBusiness, updateProfile } = useWorkspace();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
  const [phone, setPhone] = useState(user?.phone || user?.user_metadata?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [businessSaveError, setBusinessSaveError] = useState<string | null>(null);
  const [businessSaved, setBusinessSaved] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [website, setWebsite] = useState('');

  // The authenticated profile can arrive after the tab mounts. This effect
  // intentionally resets the editable draft when that external record changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullName(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
    setPhone(user?.phone || user?.user_metadata?.phone || '');
  }, [user?.id, user?.phone, user?.user_metadata]);

  useEffect(() => {
    if (!workspace?.business) return;
    // Business details are remote state; align the form after the workspace is refreshed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusinessName(workspace.business.name || '');
    setCategory(workspace.business.category || '');
    setBusinessPhone(workspace.business.phone || '');
    setBusinessEmail(workspace.business.email || '');
    setAddress(workspace.business.address || '');
    setCity(workspace.business.city || '');
    setState(workspace.business.state || '');
    setPincode(workspace.business.pincode || '');
    setWebsite(workspace.business.website || '');
  }, [workspace?.business]);

  if (status === 'loading') return <LoadingState label="Loading your account…" />;
  if (status === 'error') return <ErrorState message={error || 'The account workspace could not be loaded.'} onRetry={() => void refresh()} />;
  if (status === 'empty' || !workspace) return <EmptyState icon={<UserRound color={colors.blue} size={26} />} title="No account workspace linked" description="Your authenticated account is active, but no business has been linked yet. Ask your Pixora representative to finish onboarding." actionLabel="Try again" onAction={() => void refresh()} />;

  const { business, nfcOrder } = workspace;
  const connection = business.googleConnection;
  const planLabel = business.plan_status || 'Plan status not available';
  const completionFields = [
    { label: 'Business name', value: business.name },
    { label: 'Category', value: business.category },
    { label: 'Phone', value: business.phone },
    { label: 'Email', value: business.email },
    { label: 'Address', value: business.address },
    { label: 'City', value: business.city },
    { label: 'State', value: business.state },
    { label: 'Pincode', value: business.pincode },
    { label: 'Website', value: business.website },
  ];
  const completedDetails = completionFields.filter((field) => Boolean(field.value?.trim())).length;
  const completionPercent = Math.round((completedDetails / completionFields.length) * 100);
  const missingDetails = completionFields.filter((field) => !field.value?.trim()).map((field) => field.label.toLowerCase());

  const saveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Enter the name you want to use on your Pixora account.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim() || undefined });
      setIsEditing(false);
      Alert.alert('Profile updated', 'Your account profile was saved.');
    } catch (saveError) {
      Alert.alert('Could not save profile', saveError instanceof Error ? saveError.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveBusinessDetails = async () => {
    const normalizedPhone = businessPhone.trim();
    const normalizedEmail = businessEmail.trim().toLowerCase();
    const normalizedWebsite = website.trim();
    if (!businessName.trim() || !category.trim() || !normalizedPhone || !normalizedEmail || !address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setBusinessSaveError('Business name, category, phone, email, address, city, state, and pincode are required.');
      return;
    }
    if (normalizedPhone.replace(/\D/g, '').length < 7) {
      setBusinessSaveError('Enter a valid business phone number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setBusinessSaveError('Enter a valid business email address.');
      return;
    }
    if (!/^\d{4,10}$/.test(pincode.trim())) {
      setBusinessSaveError('Enter a valid pincode using 4–10 digits.');
      return;
    }
    if (normalizedWebsite && !/^https?:\/\//i.test(normalizedWebsite)) {
      setBusinessSaveError('Website must start with https:// or http://.');
      return;
    }

    setBusinessSaveError(null);
    setIsSavingBusiness(true);
    try {
      await updateBusiness({
        name: businessName.trim(),
        category: category.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        website: normalizedWebsite || null,
      });
      await updateProfile({ phone: normalizedPhone });
      setIsEditingBusiness(false);
      setBusinessSaved(true);
      setTimeout(() => setBusinessSaved(false), 2600);
    } catch (saveError) {
      setBusinessSaveError(saveError instanceof Error ? saveError.message : 'Your business details could not be saved.');
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const confirmSignOut = () => Alert.alert('Sign out of Pixora Funnel?', 'You can sign back in with the same account at any time.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => void signOut() }]);
  const requestDeletion = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Pixora Funnel account deletion request')}&body=${encodeURIComponent(`Please help me request deletion of the Pixora Funnel account for ${user?.email || ''}.`)}`);
  const openWeb = (path: string) => Linking.openURL(`${API_URL}${path}`);

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><PageHeader title="Account" subtitle="Your Pixora Funnel profile and business settings." />
    <Card style={styles.profileCard}><View style={styles.profileTop}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(fullName || user?.email)}</Text></View><View style={styles.profileCopy}><Text style={styles.profileName}>{fullName || 'Pixora account'}</Text><Text style={styles.profileEmail}>{user?.email || 'Email not available'}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => setIsEditing((value) => !value)} style={styles.editButton}><Pencil color={colors.blue} size={16} /></TouchableOpacity></View>{isEditing ? <View style={styles.editForm}><Text style={styles.label}>Full name</Text><TextInput value={fullName} onChangeText={setFullName} placeholder="Your name" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>Phone</Text><TextInput value={phone} onChangeText={setPhone} placeholder="Optional phone number" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={styles.input} /><PrimaryButton label={isSaving ? 'Saving…' : 'Save profile'} onPress={() => void saveProfile()} disabled={isSaving} icon={<Check color="#fff" size={16} />} /></View> : null}</Card>

    <Card tone="blue" style={styles.completionCard}><View style={styles.completionHeader}><View style={styles.completionCopy}><Text style={styles.completionTitle}>Complete your business profile</Text><Text style={styles.completionBody}>{completedDetails} of {completionFields.length} details added{missingDetails.length ? ` · Missing ${missingDetails.slice(0, 2).join(' and ')}${missingDetails.length > 2 ? '…' : ''}` : ''}</Text></View><Text style={styles.completionPercent}>{completionPercent}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${completionPercent}%` }]} /></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={isEditingBusiness ? 'Close business details editor' : 'Add missing business details'} onPress={() => { setBusinessSaveError(null); setIsEditingBusiness((value) => !value); }} style={styles.completionCta}><Text style={styles.completionCtaText}>{isEditingBusiness ? 'Close details' : missingDetails.length ? 'Add missing details' : 'Review business details'}</Text><ChevronRight color={colors.blue} size={17} /></TouchableOpacity></Card>

    {isEditingBusiness ? <Card style={styles.businessEditor}><Text style={styles.editorTitle}>Business details</Text><Text style={styles.editorHint}>These details help customers find and contact your business. Website is optional to save, but adding it completes your profile.</Text><BusinessField label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="Your business name" /><BusinessField label="Category" value={category} onChangeText={setCategory} placeholder="Restaurant, salon, clinic…" /><BusinessField label="Business phone" value={businessPhone} onChangeText={setBusinessPhone} placeholder="Phone number" keyboardType="phone-pad" /><BusinessField label="Business email" value={businessEmail} onChangeText={setBusinessEmail} placeholder="hello@business.com" keyboardType="email-address" autoCapitalize="none" /><BusinessField label="Address" value={address} onChangeText={setAddress} placeholder="Street and building" /><View style={styles.fieldRow}><View style={styles.halfField}><BusinessField label="City" value={city} onChangeText={setCity} placeholder="City" /></View><View style={styles.halfField}><BusinessField label="State" value={state} onChangeText={setState} placeholder="State" /></View></View><BusinessField label="Pincode" value={pincode} onChangeText={setPincode} placeholder="Pincode" keyboardType="number-pad" /><BusinessField label="Website" value={website} onChangeText={setWebsite} placeholder="https://yourbusiness.com (optional)" keyboardType="url" autoCapitalize="none" />{businessSaveError ? <View style={styles.errorBanner}><Text style={styles.errorText}>{businessSaveError}</Text></View> : null}{businessSaved ? <View style={styles.savedBanner}><Check color={colors.mintText} size={16} /><Text style={styles.savedText}>Business details saved.</Text></View> : null}<PrimaryButton label={isSavingBusiness ? 'Saving details…' : 'Save business details'} onPress={() => void saveBusinessDetails()} disabled={isSavingBusiness} icon={<Check color="#fff" size={16} />} /></Card> : null}

    <Text style={styles.sectionTitle}>Business information</Text><Card><InfoRow label="Business" value={business.name || 'Not configured'} /><InfoRow label="Category" value={business.category || 'Not configured'} /><InfoRow label="Location" value={[business.city, business.state].filter(Boolean).join(', ') || 'Not configured'} /><InfoRow label="Published funnel" value={business.funnel?.status || 'Not configured'} last /></Card>

    <Text style={styles.sectionTitle}>Account status</Text><Card><View style={styles.statusRow}><View style={styles.statusIcon}><Shield color={colors.blue} size={19} /></View><View style={styles.statusCopy}><Text style={styles.rowTitle}>Plan</Text><Text style={styles.rowBody}>{planLabel}{business.trial_expires_at ? ` · Trial ends ${formatDate(business.trial_expires_at)}` : ''}</Text></View></View><View style={styles.statusRow}><View style={styles.statusIcon}><ExternalLink color={colors.blue} size={19} /></View><View style={styles.statusCopy}><Text style={styles.rowTitle}>Google Business Profile</Text><Text style={styles.rowBody}>{connection?.status === 'connected' ? 'Connection recorded; API sync availability is shown in Reviews.' : connection?.status === 'expired' ? 'Authorization expired; reconnect required.' : 'Not connected for automatic review sync.'}</Text></View><StatusPill label={connection?.status === 'connected' ? 'Connected' : 'Not connected'} tone={connection?.status === 'connected' ? 'mint' : 'neutral'} /></View><View style={styles.statusRow}><View style={styles.statusIcon}><Smartphone color={colors.blue} size={19} /></View><View style={styles.statusCopy}><Text style={styles.rowTitle}>NFC fulfilment</Text><Text style={styles.rowBody}>{nfcOrder ? `${nfcOrder.status} · placed ${formatDate(nfcOrder.created_at)}` : 'No NFC order recorded'}</Text></View></View></Card>

    <Text style={styles.sectionTitle}>Support and legal</Text><Card style={styles.linkCard}><AccountLink label="Contact support" description={SUPPORT_EMAIL} icon={<HelpCircle color={colors.blue} size={19} />} onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} /><AccountLink label="Privacy policy" description="How Pixora handles customer data" icon={<Shield color={colors.blue} size={19} />} onPress={() => void openWeb('/privacy')} /><AccountLink label="Terms of service" description="Terms for using Pixora Funnel" icon={<FileText color={colors.blue} size={19} />} onPress={() => void openWeb('/terms')} /><AccountLink label="Request account deletion" description="Send a request to the Pixora support team" icon={<Mail color={colors.blue} size={19} />} onPress={requestDeletion} last /></Card>

    <View style={styles.signOutWrap}><SecondaryButton label="Sign out" onPress={confirmSignOut} icon={<LogOut color={colors.blue} size={17} />} /></View><Text style={styles.version}>Pixora Funnel · Client app</Text>
  </ScrollView>;
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.infoRow, !last && styles.rowBorder]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function AccountLink({ label, description, icon, onPress, last = false }: { label: string; description: string; icon: ReactNode; onPress: () => void; last?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.accountLink, !last && styles.rowBorder]}><View style={styles.linkIcon}>{icon}</View><View style={styles.linkCopy}><Text style={styles.rowTitle}>{label}</Text><Text style={styles.rowBody}>{description}</Text></View><ChevronRight color={colors.muted} size={18} /></TouchableOpacity>;
}

function BusinessField({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'number-pad' | 'url'; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 18, paddingBottom: 40 },
  profileCard: { marginBottom: 24 },
  completionCard: { marginBottom: 20 },
  completionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  completionCopy: { flex: 1 },
  completionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  completionBody: { color: colors.body, fontSize: 12, lineHeight: 18, marginTop: 4 },
  completionPercent: { color: colors.blue, fontSize: 20, fontWeight: '900' },
  progressTrack: { height: 9, borderRadius: 6, backgroundColor: '#DCEBFF', overflow: 'hidden', marginTop: 15 },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: colors.blue },
  completionCta: { minHeight: 42, marginTop: 12, borderRadius: 13, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  completionCtaText: { color: colors.blue, fontSize: 13, fontWeight: '900' },
  businessEditor: { marginBottom: 22 },
  editorTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  editorHint: { color: colors.body, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 4 },
  field: { marginTop: 11 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 7 },
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 19, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.blue, fontSize: 17, fontWeight: '900' },
  profileCopy: { flex: 1, marginLeft: 12 },
  profileName: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  profileEmail: { color: colors.body, fontSize: 12, marginTop: 4 },
  editButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  editForm: { marginTop: 18, gap: 8 },
  label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 5 },
  input: { minHeight: 48, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 13, color: colors.ink, fontSize: 14 },
  errorBanner: { borderRadius: 12, backgroundColor: colors.dangerSoft, padding: 11, marginTop: 13 },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  savedBanner: { minHeight: 40, borderRadius: 12, backgroundColor: colors.mint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 13 },
  savedText: { color: colors.mintText, fontSize: 12, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  infoRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  infoLabel: { color: colors.body, fontSize: 13 },
  infoValue: { color: colors.ink, fontSize: 13, fontWeight: '800', maxWidth: '58%', textAlign: 'right' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  statusRow: { minHeight: 69, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  statusRowLast: { borderBottomWidth: 0 },
  statusIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1 },
  rowTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  rowBody: { color: colors.body, fontSize: 11, lineHeight: 16, marginTop: 3 },
  linkCard: { paddingVertical: 4, marginBottom: 22 },
  accountLink: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11 },
  linkIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  linkCopy: { flex: 1 },
  signOutWrap: { marginTop: 2 },
  version: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 17 },
});
