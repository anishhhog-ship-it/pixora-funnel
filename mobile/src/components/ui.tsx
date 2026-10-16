import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, ArrowRight, CheckCircle2, RefreshCw, Star } from 'lucide-react-native';
import { colors, radii, shadow } from '@/theme';

export function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <View style={[styles.logoMark, small && styles.logoMarkSmall]}>
      <Text style={[styles.logoText, small && styles.logoTextSmall]}>P</Text>
    </View>
  );
}

export function Screen({ children, scroll = true, contentContainerStyle }: { children: ReactNode; scroll?: boolean; contentContainerStyle?: object }) {
  if (!scroll) return <View style={[styles.screen, contentContainerStyle]}>{children}</View>;
  const { ScrollView } = require('react-native') as typeof import('react-native');
  return <ScrollView style={styles.screen} contentContainerStyle={[styles.screenContent, contentContainerStyle]} showsVerticalScrollIndicator={false}>{children}</ScrollView>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerText}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, tone = 'surface' }: { children: ReactNode; style?: object; tone?: 'surface' | 'blue' | 'mint' }) {
  return <View style={[styles.card, tone === 'blue' && styles.blueCard, tone === 'mint' && styles.mintCard, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, icon, disabled = false, compact = false }: { label: string; onPress: () => void; icon?: ReactNode; disabled?: boolean; compact?: boolean }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.primaryButton, compact && styles.compactButton, disabled && styles.disabledButton]}>
      {icon}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, onPress, icon, disabled = false }: { label: string; onPress: () => void; icon?: ReactNode; disabled?: boolean }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.secondaryButton, disabled && styles.disabledSecondaryButton]}>
      {icon}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function IconButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>{children}</TouchableOpacity>;
}

export function StatusPill({ label, tone = 'mint' }: { label: string; tone?: 'mint' | 'blue' | 'neutral' | 'danger' }) {
  return <View style={[styles.statusPill, tone === 'blue' && styles.bluePill, tone === 'neutral' && styles.neutralPill, tone === 'danger' && styles.dangerPill]}><CheckCircle2 size={13} color={tone === 'danger' ? colors.danger : tone === 'blue' ? colors.blue : tone === 'neutral' ? colors.body : colors.mintText} /><Text style={[styles.statusText, tone === 'blue' && styles.blueText, tone === 'neutral' && styles.neutralText, tone === 'danger' && styles.dangerText]}>{label}</Text></View>;
}

export function SectionTitle({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{actionLabel && onAction ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction}><Text style={styles.sectionAction}>{actionLabel}</Text></TouchableOpacity> : null}</View>;
}

export function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return <View style={styles.stars}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={size} color={star <= rating ? colors.orange : colors.border} fill={star <= rating ? colors.orange : 'transparent'} />)}</View>;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: { icon?: ReactNode; title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return <Card style={styles.emptyState}><View style={styles.emptyIcon}>{icon || <Star color={colors.muted} size={26} />}</View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyDescription}>{description}</Text>{actionLabel && onAction ? <View style={styles.emptyAction}><SecondaryButton label={actionLabel} onPress={onAction} icon={<RefreshCw size={16} color={colors.blue} />} /></View> : null}</Card>;
}

export function LoadingState({ label = 'Loading your workspace…' }: { label?: string }) {
  return <View style={styles.centerState}><ActivityIndicator color={colors.blue} size="large" /><Text style={styles.centerLabel}>{label}</Text></View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.centerState}><View style={styles.errorIcon}><AlertCircle color={colors.danger} size={28} /></View><Text style={styles.emptyTitle}>Something went wrong</Text><Text style={styles.emptyDescription}>{message}</Text><View style={styles.emptyAction}><PrimaryButton label="Try again" onPress={onRetry} icon={<RefreshCw size={17} color="#fff" />} /></View></View>;
}

export function ArrowLink({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.arrowLink}><Text style={styles.arrowLinkText}>{label}</Text><ArrowRight size={18} color={colors.blue} /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36 },
  logoMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  logoMarkSmall: { width: 28, height: 28, borderRadius: 8 },
  logoText: { color: '#fff', fontSize: 23, fontWeight: '900', fontStyle: 'italic' },
  logoTextSmall: { fontSize: 18 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  headerText: { flex: 1, paddingRight: 12 },
  pageTitle: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { color: colors.body, fontSize: 15, lineHeight: 21, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 18, borderWidth: 1, borderColor: colors.border, ...shadow },
  blueCard: { backgroundColor: colors.blueSoft, borderColor: '#DCEBFF' },
  mintCard: { backgroundColor: colors.mint, borderColor: '#D4F3E4' },
  primaryButton: { minHeight: 48, borderRadius: radii.button, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  compactButton: { minHeight: 42, paddingHorizontal: 14 },
  disabledButton: { opacity: 0.55 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryButton: { minHeight: 46, borderRadius: radii.button, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#C6DAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  disabledSecondaryButton: { opacity: 0.55 },
  secondaryButtonText: { color: colors.blue, fontSize: 14, fontWeight: '800' },
  iconButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.mint },
  bluePill: { backgroundColor: '#E7F0FF' },
  neutralPill: { backgroundColor: '#F0F3F8' },
  dangerPill: { backgroundColor: colors.dangerSoft },
  statusText: { color: colors.mintText, fontSize: 12, fontWeight: '800' },
  blueText: { color: colors.blue },
  neutralText: { color: colors.body },
  dangerText: { color: colors.danger },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  sectionAction: { color: colors.blue, fontSize: 13, fontWeight: '800' },
  stars: { flexDirection: 'row', gap: 3 },
  emptyState: { alignItems: 'center', paddingVertical: 28 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.bluePale, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  errorIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyDescription: { color: colors.body, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, maxWidth: 310 },
  emptyAction: { marginTop: 18, width: '100%' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  centerLabel: { color: colors.body, fontSize: 14, marginTop: 14 },
  arrowLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrowLinkText: { color: colors.blue, fontSize: 13, fontWeight: '800' },
});
