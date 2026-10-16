import { type ReactNode, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, ChevronRight, ExternalLink, Link2, QrCode, Settings, Smartphone, Star, UsersRound } from 'lucide-react-native';
import { useWorkspace } from '@/workspace';
import { colors, radii, shadow } from '@/theme';
import { formatRelativeDate, formatEventLabel } from '@/lib/format';
import { getPublicFunnelUrl } from '@/lib/config';
import { Card, EmptyState, ErrorState, IconButton, LoadingState, LogoMark, PrimaryButton, SectionTitle, StatusPill } from '@/components/ui';

export default function HomeScreen() {
  const { workspace, status, error, refresh } = useWorkspace();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error || 'The business workspace could not be loaded.'} onRetry={() => void refresh()} />;
  if (status === 'empty' || !workspace) return <EmptyState icon={<UsersRound color={colors.blue} size={27} />} title="No business workspace linked" description="Sign in with the Pixora customer account created during onboarding. A workspace will appear here once it is linked." actionLabel="Try again" onAction={() => void refresh()} />;

  const { business, funnelUrl, activities, stats } = workspace;
  const connection = business.googleConnection;
  const isConnected = connection?.status === 'connected';
  const publicUrl = funnelUrl || getPublicFunnelUrl(business.funnel?.slug || business.slug);
  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh(true);
    setIsRefreshing(false);
  };

  const openGoogleSettings = () => {
    Alert.alert('Google Business Profile', 'The current server flow is still awaiting Google Business Profile API approval. You can open the web settings to review the connection status.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open settings', onPress: () => router.push('/account') },
    ]);
  };

  return <View style={styles.container}><View style={styles.decorativeOrb} /><View style={styles.header}><View style={styles.brandRow}><LogoMark small /><View><Text style={styles.brandName}>Pixora <Text style={styles.brandAccent}>Funnel</Text></Text><Text style={styles.greeting}>Good morning</Text></View></View><IconButton label="Open account" onPress={() => router.push('/account')}><Bell color={colors.ink} size={21} /></IconButton></View><ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.blue} />}><Text style={styles.welcome}>Let&apos;s grow <Text style={styles.welcomeAccent}>{business.name || 'your business'}</Text> with more genuine reviews.</Text>

    <Card style={styles.googleCard}>
      <View style={styles.googleTop}><View style={styles.googleIcon}><Text style={styles.googleG}>G</Text></View><View style={styles.googleCopy}><Text style={styles.cardTitle}>{isConnected ? 'Google Business Profile connected' : 'Connect your Google Business Profile'}</Text><Text style={styles.cardBody}>{isConnected ? 'Your connection is recorded. Review sync availability depends on Google API access approval.' : 'Connect your business to sync available Google reviews.'}</Text></View></View>
      {isConnected ? <View style={styles.connectionMeta}><StatusPill label={connection?.last_synced_at ? `Last synced ${formatRelativeDate(connection.last_synced_at)}` : 'Connection recorded'} tone="mint" /><TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh Google connection" onPress={openGoogleSettings} style={styles.refreshLink}><Text style={styles.refreshLinkText}>Review status</Text><ExternalLink color={colors.blue} size={15} /></TouchableOpacity></View> : <PrimaryButton label="Connect account" onPress={openGoogleSettings} icon={<Link2 color="#fff" size={18} />} />}
      {!isConnected && business.google_review_url ? <TouchableOpacity accessibilityRole="link" accessibilityLabel="Open Google review page" onPress={() => Alert.alert('Open Google review page', business.google_review_url || '')} style={styles.googleLink}><Text style={styles.googleLinkText}>Open Google Reviews</Text><ExternalLink color={colors.blue} size={15} /></TouchableOpacity> : null}
    </Card>

    <SectionTitle title="Quick actions" />
    <View style={styles.actionsGrid}><QuickAction label="My Funnel" icon={<Link2 color={colors.blue} size={22} />} onPress={() => router.push('/funnel')} /><QuickAction label="QR Code" icon={<QrCode color={colors.blue} size={22} />} onPress={() => router.push('/funnel')} /><QuickAction label="NFC Cards" icon={<Smartphone color={colors.blue} size={22} />} onPress={() => router.push('/account')} /><QuickAction label="Settings" icon={<Settings color={colors.blue} size={22} />} onPress={() => router.push('/account')} /></View>

    <SectionTitle title="Your review funnel" />
    <Card style={styles.funnelCard}><View style={styles.funnelText}><Text style={styles.cardTitle}>{business.funnel ? 'Customer review funnel' : 'Funnel not configured'}</Text><Text style={styles.cardBody}>{business.funnel ? 'A simple, effective funnel to collect genuine Google reviews from your customers.' : 'Complete your Pixora onboarding to publish a customer review funnel.'}</Text>{business.funnel ? <StatusPill label={business.funnel.status === 'active' ? 'Published' : business.funnel.status} tone={business.funnel.status === 'active' ? 'mint' : 'neutral'} /> : null}</View><View style={styles.funnelVisual}><View style={styles.phoneMock}><View style={styles.phoneNotch} /><Star color={colors.orange} fill={colors.orange} size={24} /><View style={styles.mockLine} /><View style={[styles.mockLine, { width: 42 }]} /></View></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Manage funnel" onPress={() => router.push('/funnel')} style={styles.manageLink}><Text style={styles.manageLinkText}>Manage funnel</Text><ChevronRight color={colors.blue} size={19} /></TouchableOpacity></Card>

    <SectionTitle title="Recent activity" actionLabel="View all" onAction={() => router.push('/reviews')} />
    {activities.length === 0 ? <Card tone="blue" style={styles.activityEmpty}><Text style={styles.activityEmptyTitle}>No activity yet</Text><Text style={styles.cardBody}>Your synced reviews and customer activity will appear here after your funnel starts receiving visits.</Text></Card> : <View style={styles.activityList}>{activities.slice(0, 4).map((activity) => <View key={activity.id} style={styles.activityRow}><View style={styles.activityDot}><QrCode color={colors.blue} size={16} /></View><View style={styles.activityCopy}><Text style={styles.activityTitle}>{formatEventLabel(activity.event_type)}</Text><Text style={styles.activityDate}>{formatRelativeDate(activity.created_at)}</Text></View></View>)}</View>}
    <View style={styles.bottomSpace} /></ScrollView></View>;
}

function QuickAction({ label, icon, onPress }: { label: string; icon: ReactNode; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.quickAction}><View style={styles.quickIcon}>{icon}</View><Text style={styles.quickLabel}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  decorativeOrb: { position: 'absolute', right: -50, top: 82, width: 190, height: 190, borderRadius: 95, backgroundColor: '#F0F7FF', opacity: 0.8 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  brandAccent: { color: colors.blue },
  greeting: { color: colors.body, fontSize: 12, marginTop: 2 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 7 },
  welcome: { color: colors.ink, fontSize: 25, fontWeight: '900', lineHeight: 32, maxWidth: 330, marginBottom: 18 },
  welcomeAccent: { color: colors.blue },
  googleCard: { marginBottom: 24 },
  googleTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 17 },
  googleIcon: { width: 47, height: 47, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  googleG: { color: '#4285F4', fontSize: 28, fontWeight: '900' },
  googleCopy: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  cardBody: { color: colors.body, fontSize: 13, lineHeight: 19, marginTop: 4 },
  connectionMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  refreshLink: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5 },
  refreshLinkText: { color: colors.blue, fontSize: 12, fontWeight: '800' },
  googleLink: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  googleLinkText: { color: colors.blue, fontSize: 13, fontWeight: '800' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 24 },
  quickAction: { width: '47.5%', minHeight: 98, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow },
  quickIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  funnelCard: { marginBottom: 24, paddingBottom: 12 },
  funnelText: { paddingRight: 85 },
  funnelVisual: { position: 'absolute', right: 20, top: 37, width: 72, height: 102, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft, borderRadius: 20 },
  phoneMock: { width: 42, height: 70, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.navy, alignItems: 'center', paddingTop: 18, gap: 6 },
  phoneNotch: { position: 'absolute', top: 3, width: 20, height: 5, borderRadius: 4, backgroundColor: colors.navy },
  mockLine: { width: 28, height: 3, borderRadius: 2, backgroundColor: colors.border },
  manageLink: { minHeight: 44, borderRadius: 13, backgroundColor: colors.blueSoft, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  manageLinkText: { color: colors.blue, fontSize: 13, fontWeight: '900' },
  activityEmpty: { marginBottom: 20 },
  activityEmptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  activityList: { backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border },
  activityRow: { minHeight: 63, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityDot: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  activityCopy: { flex: 1 },
  activityTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  activityDate: { color: colors.muted, fontSize: 11, marginTop: 2 },
  bottomSpace: { height: 25 },
});
