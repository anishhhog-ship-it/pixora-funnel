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
  const { workspace, status, error, refresh, updateProfile } = useWorkspace();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
  const [phone, setPhone] = useState(user?.phone || user?.user_metadata?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
    setPhone(user?.phone || user?.user_metadata?.phone || '');
  }, [user?.id, user?.phone, user?.user_metadata]);

  if (status === 'loading') return <LoadingState label="Loading your account…" />;
  if (status === 'error') return <ErrorState message={error || 'The account workspace could not be loaded.'} onRetry={() => void refresh()} />;
  if (status === 'empty' || !workspace) return <EmptyState icon={<UserRound color={colors.blue} size={26} />} title="No account workspace linked" description="Your authenticated account is active, but no business has been linked yet. Ask your Pixora representative to finish onboarding." actionLabel="Try again" onAction={() => void refresh()} />;

  const { business, nfcOrder } = workspace;
  const connection = business.googleConnection;
  const planLabel = business.plan_status || 'Plan status not available';

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

  const confirmSignOut = () => Alert.alert('Sign out of Pixora Funnel?', 'You can sign back in with the same account at any time.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => void signOut() }]);
  const requestDeletion = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Pixora Funnel account deletion request')}&body=${encodeURIComponent(`Please help me request deletion of the Pixora Funnel account for ${user?.email || ''}.`)}`);
  const openWeb = (path: string) => Linking.openURL(`${API_URL}${path}`);

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><PageHeader title="Account" subtitle="Your Pixora Funnel profile and business settings." />
    <Card style={styles.profileCard}><View style={styles.profileTop}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(fullName || user?.email)}</Text></View><View style={styles.profileCopy}><Text style={styles.profileName}>{fullName || 'Pixora account'}</Text><Text style={styles.profileEmail}>{user?.email || 'Email not available'}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => setIsEditing((value) => !value)} style={styles.editButton}><Pencil color={colors.blue} size={16} /></TouchableOpacity></View>{isEditing ? <View style={styles.editForm}><Text style={styles.label}>Full name</Text><TextInput value={fullName} onChangeText={setFullName} placeholder="Your name" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>Phone</Text><TextInput value={phone} onChangeText={setPhone} placeholder="Optional phone number" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={styles.input} /><PrimaryButton label={isSaving ? 'Saving…' : 'Save profile'} onPress={() => void saveProfile()} disabled={isSaving} icon={<Check color="#fff" size={16} />} /></View> : null}</Card>

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 18, paddingBottom: 40 },
  profileCard: { marginBottom: 24 },
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
