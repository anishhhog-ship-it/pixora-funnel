import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Edit3, ExternalLink, Link2, Save, Share2, Smartphone } from 'lucide-react-native';
import { useWorkspace } from '@/workspace';
import { colors, shadow } from '@/theme';
import { formatDate } from '@/lib/format';
import { Card, EmptyState, ErrorState, IconButton, LoadingState, PageHeader, PrimaryButton, SecondaryButton, StatusPill } from '@/components/ui';

export default function FunnelScreen() {
  const { workspace, status, error, refresh, updateBusiness } = useWorkspace();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(colors.blue);

  // Keep the draft aligned with the remote business record after refreshes.
  useEffect(() => {
    if (!workspace?.business) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusinessName(workspace.business.name);
    setTagline(workspace.business.tagline || '');
    setLogoUrl(workspace.business.logo_url || '');
    setPrimaryColor(workspace.business.primary_color || colors.blue);
  }, [workspace?.business]);

  if (status === 'loading') return <LoadingState label="Loading your funnel…" />;
  if (status === 'error') return <ErrorState message={error || 'The funnel workspace could not be loaded.'} onRetry={() => void refresh()} />;
  if (status === 'empty' || !workspace) return <EmptyState icon={<Link2 color={colors.blue} size={26} />} title="No funnel workspace linked" description="Your published funnel is scoped to the business linked to your Pixora account." actionLabel="Try again" onAction={() => void refresh()} />;

  const { business, funnelUrl, nfcOrder } = workspace;
  const publicUrl = funnelUrl;
  const isValidColor = /^#[0-9A-Fa-f]{6}$/.test(primaryColor.trim());
  const hasChanges = businessName !== business.name || tagline !== (business.tagline || '') || logoUrl !== (business.logo_url || '') || primaryColor !== (business.primary_color || colors.blue);

  const shareFunnel = async () => {
    if (!publicUrl) {
      Alert.alert('Funnel URL unavailable', 'This business does not have a published funnel URL yet.');
      return;
    }
    try {
      await Share.share({ message: `${business.name}\n${publicUrl}`, url: publicUrl });
    } catch (shareError) {
      Alert.alert('Could not share funnel', shareError instanceof Error ? shareError.message : 'Please try again.');
    }
  };

  const copyFunnel = async () => {
    if (!publicUrl) return;
    await Clipboard.setStringAsync(publicUrl);
    Alert.alert('Link copied', 'The published funnel link is ready to paste.');
  };

  const saveAppearance = async () => {
    if (!businessName.trim()) {
      Alert.alert('Business name required', 'Add a business name before saving.');
      return;
    }
    if (!isValidColor) {
      Alert.alert('Invalid color', 'Use a six-digit hex color such as #0B6BFF.');
      return;
    }
    if (logoUrl && !/^https:\/\//i.test(logoUrl.trim())) {
      Alert.alert('Logo URL not supported', 'Use an HTTPS image URL or leave the logo field empty.');
      return;
    }
    setIsSaving(true);
    try {
      await updateBusiness({ name: businessName.trim(), tagline: tagline.trim() || null, logo_url: logoUrl.trim() || null, primary_color: primaryColor.trim() });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2400);
    } catch (saveError) {
      Alert.alert('Could not save appearance', saveError instanceof Error ? saveError.message : 'Your changes were not saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><PageHeader title="My Funnel" subtitle="Customize your customer review funnel." right={<IconButton label="Refresh funnel" onPress={() => void refresh(true)}><Link2 color={colors.ink} size={19} /></IconButton>} />
    <Card style={styles.previewCard}><View style={styles.previewTop}><View style={styles.previewCopy}><Text style={styles.cardTitle}>Customer review funnel</Text><Text style={styles.cardBody}>A simple and effective funnel to collect genuine Google reviews from your customers.</Text><StatusPill label={business.funnel?.status === 'active' ? 'Ready to customize' : business.funnel?.status || 'Not published'} tone={business.funnel?.status === 'active' ? 'mint' : 'neutral'} /></View><View style={styles.previewPhone}><View style={styles.phoneNotch} /><Text style={styles.phoneLogo}>G</Text><Text style={styles.phoneTitle}>Share Your Experience</Text><View style={styles.phoneStars}>★★★★★</View><View style={styles.phoneButton} /></View></View><View style={styles.previewActions}><PrimaryButton label="Preview funnel" onPress={() => publicUrl ? void Linking.openURL(publicUrl) : Alert.alert('Funnel unavailable', 'No published URL is configured.')} icon={<ExternalLink color="#fff" size={17} />} /><SecondaryButton label={isEditing ? 'Close editor' : 'Edit appearance'} onPress={() => setIsEditing((value) => !value)} icon={isEditing ? <Check color={colors.blue} size={17} /> : <Edit3 color={colors.blue} size={17} />} /></View></Card>

    {isEditing ? <Card style={styles.editorCard}><Text style={styles.editorTitle}>Appearance settings</Text><Text style={styles.editorHint}>These fields update the same business configuration used by the public funnel. Access remains protected by Supabase tenant policies.</Text><Field label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="Your business name" /><Field label="Tagline" value={tagline} onChangeText={setTagline} placeholder="A short line about your business" /><Field label="Logo URL" value={logoUrl} onChangeText={setLogoUrl} placeholder="https://… (optional)" keyboardType="url" autoCapitalize="none" /><Field label="Primary color" value={primaryColor} onChangeText={setPrimaryColor} placeholder="#0B6BFF" autoCapitalize="characters" /><PrimaryButton label={isSaving ? 'Saving changes…' : 'Save appearance'} onPress={() => void saveAppearance()} disabled={isSaving || !hasChanges} icon={<Save color="#fff" size={17} />} /></Card> : null}
    {saved ? <View style={styles.savedBanner}><Check color={colors.mintText} size={17} /><Text style={styles.savedText}>Appearance saved to your published funnel.</Text></View> : null}

    <Card style={styles.qrCard}><View style={styles.qrHeader}><View><Text style={styles.cardTitle}>QR code for your funnel</Text><Text style={styles.cardBody}>Use this real destination at your shop, counter, packaging, or on your NFC card.</Text></View><QrIcon /></View>{publicUrl ? <><View style={styles.qrFrame}><QRCode value={publicUrl} size={174} color={colors.ink} backgroundColor="#fff" quietZone={8} /></View><Text selectable style={styles.urlText}>{publicUrl}</Text><View style={styles.qrActions}><SecondaryButton label="Copy link" onPress={() => void copyFunnel()} icon={<Copy color={colors.blue} size={16} />} /><PrimaryButton label="Share link" onPress={() => void shareFunnel()} icon={<Share2 color="#fff" size={16} />} /></View><Text style={styles.verifiedText}>Destination is taken from the published funnel record. No sample QR data is used.</Text></> : <EmptyState icon={<QrCodeIcon />} title="QR code unavailable" description="A published funnel URL is required before a production QR code can be shown." />}</Card>

    <Card tone="mint" style={styles.nfcCard}><View style={styles.nfcIcon}><Smartphone color={colors.mintText} size={22} /></View><View style={styles.nfcCopy}><Text style={styles.cardTitle}>NFC cards</Text>{nfcOrder ? <><Text style={styles.cardBody}>Order status: {nfcOrder.status}</Text><Text style={styles.nfcDate}>Placed {formatDate(nfcOrder.created_at)}{nfcOrder.tracking_number ? ` · Tracking ${nfcOrder.tracking_number}` : ''}</Text></> : <Text style={styles.cardBody}>No NFC order is recorded for this business yet. Fulfilment status will appear here after an order is created in Pixora.</Text>}</View></Card>
  </ScrollView></KeyboardAvoidingView>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize = 'sentences' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'url'; autoCapitalize?: 'none' | 'sentences' | 'characters' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={styles.fieldInput} /></View>;
}

function QrIcon() {
  return <View style={styles.qrIcon}><QrCodeIcon /></View>;
}

function QrCodeIcon() {
  return <View style={styles.qrIconGrid}><View style={styles.qrSquare} /><View style={styles.qrSquare} /><View style={styles.qrSquare} /><View style={styles.qrSquareSmall} /><View style={styles.qrSquareSmall} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 18, paddingBottom: 40 },
  previewCard: { marginBottom: 16 },
  previewTop: { minHeight: 198, flexDirection: 'row', justifyContent: 'space-between' },
  previewCopy: { flex: 1, paddingRight: 10 },
  previewPhone: { width: 108, height: 158, borderRadius: 25, borderWidth: 2, borderColor: colors.ink, backgroundColor: '#fff', alignItems: 'center', paddingTop: 29, marginLeft: 8, ...shadow },
  phoneNotch: { position: 'absolute', top: 6, width: 42, height: 8, borderRadius: 5, backgroundColor: colors.ink },
  phoneLogo: { color: '#4285F4', fontWeight: '900', fontSize: 27 },
  phoneTitle: { color: colors.ink, fontWeight: '800', fontSize: 9, marginTop: 6 },
  phoneStars: { color: colors.orange, fontSize: 14, marginTop: 8, letterSpacing: 1 },
  phoneButton: { width: 78, height: 16, borderRadius: 8, backgroundColor: colors.blue, marginTop: 18 },
  previewActions: { gap: 10, marginTop: 14 },
  editorCard: { marginBottom: 16 },
  editorTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  editorHint: { color: colors.body, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 8 },
  field: { marginTop: 12 },
  fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 7 },
  fieldInput: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', color: colors.ink, paddingHorizontal: 13, fontSize: 14 },
  savedBanner: { minHeight: 42, borderRadius: 14, backgroundColor: colors.mint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 16 },
  savedText: { color: colors.mintText, fontSize: 12, fontWeight: '800' },
  qrCard: { marginBottom: 16 },
  qrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  qrIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  qrIconGrid: { width: 23, height: 23, position: 'relative' },
  qrSquare: { position: 'absolute', width: 9, height: 9, borderWidth: 2, borderColor: colors.blue },
  qrSquareSmall: { position: 'absolute', width: 5, height: 5, backgroundColor: colors.blue, right: 1, bottom: 1 },
  qrFrame: { alignSelf: 'center', padding: 14, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, marginVertical: 18, ...shadow },
  urlText: { color: colors.body, fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 12 },
  qrActions: { gap: 9 },
  verifiedText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
  nfcCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  nfcIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  nfcCopy: { flex: 1 },
  nfcDate: { color: colors.mintText, fontSize: 11, marginTop: 5 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  cardBody: { color: colors.body, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
