import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ExternalLink, Filter, RefreshCw, Search, Star } from 'lucide-react-native';
import { useWorkspace } from '@/workspace';
import { colors } from '@/theme';
import { formatDate, formatRelativeDate, initials } from '@/lib/format';
import { Card, EmptyState, ErrorState, IconButton, LoadingState, PageHeader, PrimaryButton, Stars, StatusPill } from '@/components/ui';
import type { MobileReview } from '@/lib/types';

type ReplyFilter = 'all' | 'unanswered' | 'replied';

export default function ReviewsScreen() {
  const { workspace, status, error, refresh, isRefreshing, loadMoreReviews, syncReviews } = useWorkspace();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const filteredReviews = useMemo(() => {
    const reviews = workspace?.reviews || [];
    return reviews.filter((review) => (!ratingFilter || review.rating === ratingFilter) && (replyFilter === 'all' || review.reply_status === replyFilter));
  }, [ratingFilter, replyFilter, workspace?.reviews]);

  if (status === 'loading') return <LoadingState label="Loading your reviews…" />;
  if (status === 'error') return <ErrorState message={error || 'The reviews workspace could not be loaded.'} onRetry={() => void refresh()} />;
  if (status === 'empty' || !workspace) return <EmptyState icon={<Search color={colors.blue} size={26} />} title="No business workspace linked" description="Reviews are scoped to your authenticated business workspace. Sign in with the account created during Pixora onboarding." actionLabel="Try again" onAction={() => void refresh()} />;

  const { business, reviewsError } = workspace;
  const connection = business.googleConnection;
  const isConnected = connection?.status === 'connected';
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncReviews();
      if (result.status === 'access_pending') {
        Alert.alert('Google API access pending', result.message || 'The Google account is connected, but review API access is not approved for this project yet.');
      } else if (result.success) {
        Alert.alert('Reviews refreshed', `${result.syncedCount || 0} review${result.syncedCount === 1 ? '' : 's'} synchronized from Google.`);
      } else {
        Alert.alert('Review sync unavailable', result.message || 'Google review synchronization is not available right now.');
      }
    } catch (syncError) {
      Alert.alert('Review sync unavailable', syncError instanceof Error ? syncError.message : 'Please try again later.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      await loadMoreReviews();
    } catch (loadError) {
      Alert.alert('Could not load more reviews', loadError instanceof Error ? loadError.message : 'Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh(true)} tintColor={colors.blue} />}><PageHeader title="Reviews" subtitle="Manage your Google Business Profile reviews." right={<IconButton label="Refresh reviews" onPress={() => void refresh(true)}><RefreshCw color={colors.ink} size={19} /></IconButton>} />
    {!isConnected ? <Card tone="blue" style={styles.connectCard}><View style={styles.illustration}><View style={styles.googleBubble}><Text style={styles.googleG}>G</Text></View><Stars rating={5} size={14} /></View><Text style={styles.connectTitle}>Connect Google to sync reviews</Text><Text style={styles.connectBody}>A Pixora sign-in and Google Business Profile authorization are separate. Automatic synchronization also requires approved Google Business Profile API access.</Text><PrimaryButton label="Open connection settings" onPress={() => router.push('/account')} icon={<ExternalLink color="#fff" size={17} />} />{business.google_review_url ? <TouchableOpacity accessibilityRole="link" accessibilityLabel="Open Google review page" onPress={() => void Linking.openURL(business.google_review_url || '')} style={styles.openGoogle}><Text style={styles.openGoogleText}>Open Google Reviews</Text><ExternalLink color={colors.blue} size={15} /></TouchableOpacity> : null}</Card> : <Card style={styles.syncCard}><View style={styles.syncTop}><StatusPill label={connection?.last_synced_at ? `Last sync ${formatRelativeDate(connection.last_synced_at)}` : 'Connection recorded'} tone="mint" /><TouchableOpacity accessibilityRole="button" accessibilityLabel="Sync Google reviews" onPress={handleSync} disabled={isSyncing} style={styles.syncButton}><RefreshCw color={colors.blue} size={17} /><Text style={styles.syncText}>{isSyncing ? 'Syncing…' : 'Sync now'}</Text></TouchableOpacity></View>{connection?.sync_error ? <Text style={styles.syncError}>{connection.sync_error}</Text> : <Text style={styles.syncNote}>Sync uses the official Google Business Profile API. If access is still pending, the app will keep your connected state honest.</Text>}</Card>}

    <View style={styles.filterHeader}><Text style={styles.resultTitle}>{filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}</Text><View style={styles.filterLabel}><Filter color={colors.body} size={15} /><Text style={styles.filterLabelText}>Filters</Text></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><FilterChip label="All ratings" active={!ratingFilter} onPress={() => setRatingFilter(null)} />{[5, 4, 3, 2, 1].map((rating) => <FilterChip key={rating} label={`${rating} stars`} active={ratingFilter === rating} onPress={() => setRatingFilter(rating)} />)}<FilterChip label="Unanswered" active={replyFilter === 'unanswered'} onPress={() => setReplyFilter(replyFilter === 'unanswered' ? 'all' : 'unanswered')} /><FilterChip label="Replied" active={replyFilter === 'replied'} onPress={() => setReplyFilter(replyFilter === 'replied' ? 'all' : 'replied')} /></ScrollView>

    {reviewsError ? <Card tone="blue" style={styles.warningCard}><Text style={styles.warningTitle}>Reviews are unavailable</Text><Text style={styles.warningText}>{reviewsError}</Text><PrimaryButton compact label="Retry" onPress={() => void refresh(true)} icon={<RefreshCw color="#fff" size={16} />} /></Card> : filteredReviews.length === 0 ? <EmptyState icon={<Star color={colors.muted} size={27} />} title={isConnected ? 'No reviews to show yet' : 'No Google reviews synced'} description={isConnected ? 'Your available reviews will appear here after a successful Google Business Profile synchronization.' : 'Connect Google Business Profile to make real review data available. No sample reviews are shown.'} /> : <View style={styles.reviewList}>{filteredReviews.map((review) => <ReviewCard key={review.id} review={review} />)}</View>}
    {workspace.hasMoreReviews && !reviewsError ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Load more reviews" onPress={handleLoadMore} disabled={isLoadingMore} style={styles.loadMore}>{isLoadingMore ? <ActivityIndicator color={colors.blue} /> : <Text style={styles.loadMoreText}>Load more reviews</Text>}</TouchableOpacity> : null}
  </ScrollView>;
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.chip, active && styles.activeChip]}><Text style={[styles.chipText, active && styles.activeChipText]}>{label}</Text></TouchableOpacity>;
}

function ReviewCard({ review }: { review: MobileReview }) {
  const statusLabel = review.reply_status === 'replied' ? 'Replied' : review.reply_status === 'draft' ? 'Draft reply' : 'Needs reply';
  return <Card style={styles.reviewCard}><View style={styles.reviewTop}><View style={styles.reviewer}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(review.reviewer_name)}</Text></View><View><Text style={styles.reviewerName}>{review.reviewer_name || 'Google customer'}</Text><Stars rating={review.rating} size={13} /></View></View><Text style={styles.reviewDate}>{formatDate(review.review_time)}</Text></View><Text style={styles.reviewText}>{review.review_text || 'Google returned no written comment for this review.'}</Text><View style={styles.reviewBottom}><StatusPill label={statusLabel} tone={review.reply_status === 'replied' ? 'mint' : review.reply_status === 'draft' ? 'blue' : 'neutral'} />{review.reply_text ? <Text numberOfLines={1} style={styles.replyPreview}>“{review.reply_text}”</Text> : null}</View></Card>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 18, paddingBottom: 38 },
  connectCard: { alignItems: 'center', marginBottom: 22 },
  illustration: { width: 148, height: 105, borderRadius: 30, backgroundColor: '#F8FBFF', alignItems: 'center', justifyContent: 'center', marginBottom: 17, gap: 12 },
  googleBubble: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D5E6FF', alignItems: 'center', justifyContent: 'center' },
  googleG: { color: '#4285F4', fontSize: 29, fontWeight: '900' },
  connectTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  connectBody: { color: colors.body, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 7, marginBottom: 17 },
  openGoogle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  openGoogleText: { color: colors.blue, fontSize: 13, fontWeight: '800' },
  syncCard: { marginBottom: 20 },
  syncTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  syncButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 5 },
  syncText: { color: colors.blue, fontSize: 13, fontWeight: '800' },
  syncNote: { color: colors.body, fontSize: 12, lineHeight: 18, marginTop: 12 },
  syncError: { color: colors.danger, fontSize: 12, lineHeight: 18, marginTop: 10 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  resultTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  filterLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterLabelText: { color: colors.body, fontSize: 12, fontWeight: '700' },
  chips: { gap: 8, paddingBottom: 16 },
  chip: { minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  activeChip: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { color: colors.body, fontSize: 12, fontWeight: '700' },
  activeChipText: { color: '#fff' },
  warningCard: { marginBottom: 12 },
  warningTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  warningText: { color: colors.body, fontSize: 13, lineHeight: 19, marginVertical: 7 },
  reviewList: { gap: 12 },
  reviewCard: { padding: 16 },
  reviewTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  reviewer: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.blue, fontSize: 13, fontWeight: '900' },
  reviewerName: { color: colors.ink, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  reviewDate: { color: colors.muted, fontSize: 11 },
  reviewText: { color: colors.body, fontSize: 14, lineHeight: 21, marginTop: 14 },
  reviewBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  replyPreview: { color: colors.muted, fontSize: 11, flex: 1 },
  loadMore: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  loadMoreText: { color: colors.blue, fontSize: 14, fontWeight: '900' },
});
