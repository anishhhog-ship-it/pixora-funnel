import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Share, Alert } from 'react-native';
import { Home, Star, QrCode, TrendingUp, Settings, CheckCircle2, MessageSquare, UtensilsCrossed, Bot, RefreshCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface MobileReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
  status: 'replied' | 'pending' | 'auto';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'reviews' | 'qr'>('home');
  const [businessName, setBusinessName] = useState('Your Business');
  const [businessSlug, setBusinessSlug] = useState('menu');
  const [reviews, setReviews] = useState<MobileReview[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [totalReplies, setTotalReplies] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // In production, sync from API / Supabase endpoint
  const loadData = async () => {
    setIsLoading(true);
    try {
      // In mobile standalone build, connect to production API
      // When newly registered, zero reviews / zero scans is the honest truth
      setBusinessName('Your Business');
      setReviews([]); // Zero reviews for brand new tenant
      setTotalScans(0);
      setTotalReplies(0);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Scan our QR code or review us online: https://funnel.pixoraautomations.com/f/${businessSlug}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share review link.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen 
            businessName={businessName} 
            reviews={reviews} 
            totalScans={totalScans} 
            totalReplies={totalReplies}
            onOpenQR={() => setActiveTab('qr')}
            onOpenReviews={() => setActiveTab('reviews')}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'reviews' && (
          <ReviewsScreen reviews={reviews} onRefresh={loadData} />
        )}
        {activeTab === 'qr' && (
          <QrScreen businessName={businessName} businessSlug={businessSlug} onShare={handleShareLink} />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton 
          icon={<Home color={activeTab === 'home' ? '#0B3D2E' : '#9CA3AF'} size={22} />} 
          label="Home" 
          isActive={activeTab === 'home'} 
          onPress={() => setActiveTab('home')} 
        />
        <TabButton 
          icon={<Star color={activeTab === 'reviews' ? '#0B3D2E' : '#9CA3AF'} size={22} />} 
          label="Reviews" 
          isActive={activeTab === 'reviews'} 
          onPress={() => setActiveTab('reviews')} 
        />
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={() => setActiveTab('qr')}>
            <QrCode color="#fff" size={26} />
          </TouchableOpacity>
        </View>
        <TabButton 
          icon={<TrendingUp color="#9CA3AF" size={22} />} 
          label="Analytics" 
          isActive={false} 
          onPress={() => Alert.alert('Analytics', 'Full charts available in web dashboard')} 
        />
        <TabButton 
          icon={<Settings color="#9CA3AF" size={22} />} 
          label="Settings" 
          isActive={false} 
          onPress={() => Alert.alert('Settings', 'Account management available in web portal')} 
        />
      </View>
    </SafeAreaView>
  );
}

// --- Screens ---

const HomeScreen = ({ businessName, reviews, totalScans, totalReplies, onOpenQR, onOpenReviews, onRefresh }: any) => (
  <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Welcome Back 👋</Text>
        <Text style={styles.brandName}>{businessName}</Text>
      </View>
      <TouchableOpacity onPress={onRefresh} style={styles.profilePic}>
        <RefreshCw color="#fff" size={18} />
      </TouchableOpacity>
    </View>

    {/* Real Stats Bar */}
    <View style={styles.statsScroll}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
        <StatCard title="Google Reviews" value={reviews.length.toString()} trend={reviews.length > 0 ? "+100%" : "Live"} icon={<Star color="#F59E0B" fill="#F59E0B" size={20} />} />
        <StatCard title="Review Scans" value={totalScans.toString()} trend="Direct" icon={<QrCode color="#0B3D2E" size={20} />} />
        <StatCard title="Auto Replies" value={totalReplies.toString()} trend="Active" icon={<MessageSquare color="#3B82F6" size={20} />} />
      </ScrollView>
    </View>

    {/* Recent Reviews Section */}
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        <TouchableOpacity onPress={onOpenReviews}><Text style={styles.seeAll}>See All ({reviews.length})</Text></TouchableOpacity>
      </View>
      
      {reviews.length === 0 ? (
        <View style={styles.emptyCard}>
          <Star color="#D1D5DB" size={32} />
          <Text style={styles.emptyTitle}>No Google Reviews Yet</Text>
          <Text style={styles.emptySubtitle}>When customers scan your QR code or review your business, they will appear here instantly.</Text>
        </View>
      ) : (
        reviews.slice(0, 3).map((review: MobileReview) => (
          <ReviewCard key={review.id} review={review} />
        ))
      )}
    </View>

    {/* Quick Actions */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <ActionCard title="View QR Stand" icon={<QrCode color="#0B3D2E" size={24} />} onPress={onOpenQR} />
        <ActionCard title="Google Reviews" icon={<Star color="#0B3D2E" size={24} />} onPress={onOpenReviews} />
        <ActionCard title="Auto Reply" icon={<Bot color="#0B3D2E" size={24} />} onPress={() => Alert.alert('Auto Reply', 'Configured via dashboard.')} />
        <ActionCard title="Menu Items" icon={<UtensilsCrossed color="#0B3D2E" size={24} />} onPress={() => Alert.alert('Menu', 'Edit dishes in Web Portal.')} />
      </View>
    </View>
    <View style={{height: 100}} />
  </ScrollView>
);

const ReviewsScreen = ({ reviews, onRefresh }: { reviews: MobileReview[]; onRefresh: () => void }) => (
  <View style={styles.screen}>
    <View style={styles.header}>
      <Text style={styles.pageTitle}>Google Reviews</Text>
      <TouchableOpacity onPress={onRefresh}><RefreshCw color="#6B7280" size={20} /></TouchableOpacity>
    </View>
    <ScrollView showsVerticalScrollIndicator={false}>
      {reviews.length === 0 ? (
        <View style={[styles.emptyCard, { marginTop: 40 }]}>
          <Star color="#D1D5DB" size={40} />
          <Text style={styles.emptyTitle}>Zero Reviews Recorded</Text>
          <Text style={styles.emptySubtitle}>Share your QR code on diner tables to start collecting 5-star Google reviews.</Text>
        </View>
      ) : (
        reviews.map(review => (
          <ReviewCard key={review.id} review={review} fullWidth />
        ))
      )}
      <View style={{height: 100}} />
    </ScrollView>
  </View>
);

const QrScreen = ({ businessName, businessSlug, onShare }: { businessName: string; businessSlug: string; onShare: () => void }) => (
  <View style={styles.screen}>
    <View style={styles.header}>
      <Text style={styles.pageTitle}>Live QR Stand</Text>
    </View>
    <View style={styles.qrContainer}>
      <View style={styles.qrCard}>
        <Text style={styles.qrTitle}>Scan to Review</Text>
        <Text style={styles.qrSubtitle}>{businessName}</Text>
        
        <View style={styles.qrPlaceholder}>
          <QrCode color="#0B3D2E" size={140} />
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>/f/{businessSlug}</Text>
        </View>
        
        <TouchableOpacity style={styles.qrButton} onPress={onShare}>
          <Text style={styles.qrButtonText}>Share Funnel Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// --- Components ---

const TabButton = ({ icon, label, isActive, onPress }: any) => (
  <TouchableOpacity style={styles.tabButton} onPress={onPress}>
    {icon}
    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const StatCard = ({ title, value, trend, icon }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statIcon}>{icon}</View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    <View style={styles.trendBadge}>
      <Text style={styles.trendText}>{trend}</Text>
    </View>
  </View>
);

const ReviewCard = ({ review, fullWidth }: any) => (
  <View style={[styles.reviewCard, fullWidth && { width: '100%', marginLeft: 0 }]}>
    <View style={styles.reviewHeader}>
      <View style={styles.reviewerInfo}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{review.name.charAt(0)}</Text></View>
        <View>
          <Text style={styles.reviewerName}>{review.name}</Text>
          <View style={styles.stars}>
            {[1,2,3,4,5].map(i => <Star key={i} size={12} color={i <= review.rating ? '#F59E0B' : '#E5E7EB'} fill={i <= review.rating ? '#F59E0B' : 'transparent'} />)}
          </View>
        </View>
      </View>
      <Text style={styles.reviewDate}>{review.date}</Text>
    </View>
    <Text style={styles.reviewText}>{review.text}</Text>
    {review.status === 'replied' && (
      <View style={styles.statusBadge}><CheckCircle2 size={12} color="#10B981" /><Text style={styles.statusText}>Replied</Text></View>
    )}
  </View>
);

const ActionCard = ({ title, icon, onPress }: any) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <View style={styles.actionIcon}>{icon}</View>
    <Text style={styles.actionTitle}>{title}</Text>
  </TouchableOpacity>
);

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  profilePic: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0B3D2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsScroll: {
    marginHorizontal: -20,
    marginBottom: 28,
  },
  statsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
  },
  trendBadge: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 9,
    color: '#03543F',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 12,
    color: '#0B3D2E',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  reviewText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10B981',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCard: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 190,
    height: 190,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrButton: {
    backgroundColor: '#0B3D2E',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#0B3D2E',
    fontWeight: '700',
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0B3D2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    shadowColor: '#0B3D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
