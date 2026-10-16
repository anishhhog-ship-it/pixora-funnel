import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Lock } from 'lucide-react-native';
import { useSession } from '@/ctx';
import { colors, radii } from '@/theme';
import { LogoMark } from '@/components/ui';

export default function ResetPasswordScreen() {
  const { updatePassword } = useSession();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const savePassword = async () => {
    if (password.length < 8) {
      Alert.alert('Choose a stronger password', 'Use at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      Alert.alert('Passwords do not match', 'Enter the same password in both fields.');
      return;
    }
    setIsSaving(true);
    try {
      await updatePassword(password);
    } catch (error) {
      Alert.alert('Could not update password', error instanceof Error ? error.message : 'The reset link may have expired.');
    } finally {
      setIsSaving(false);
    }
  };

  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.content}><View style={styles.brandRow}><LogoMark /><Text style={styles.brandName}>Pixora <Text style={styles.brandAccent}>Funnel</Text></Text></View><View style={styles.heroCircle}><Lock color={colors.blue} size={32} /></View><Text style={styles.title}>Set a new password</Text><Text style={styles.subtitle}>Choose a secure password for your Pixora Funnel account.</Text><Text style={styles.label}>New password</Text><View style={styles.inputWrap}><Lock size={18} color={colors.muted} /><TextInput secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} style={styles.input} /></View><Text style={styles.label}>Confirm password</Text><View style={styles.inputWrap}><Lock size={18} color={colors.muted} /><TextInput secureTextEntry autoComplete="new-password" placeholder="Repeat your password" placeholderTextColor={colors.muted} value={confirmation} onChangeText={setConfirmation} style={styles.input} /></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Save password" onPress={savePassword} disabled={isSaving} style={[styles.button, isSaving && styles.disabled]}><Text style={styles.buttonText}>{isSaving ? 'Saving…' : 'Save password'}</Text><ArrowRight size={19} color="#fff" /></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Return to sign in" onPress={() => router.replace('/sign-in')} style={styles.back}><Text style={styles.backText}>Return to sign in</Text></TouchableOpacity></View></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42 },
  brandName: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  brandAccent: { color: colors.blue },
  heroCircle: { width: 72, height: 72, borderRadius: 26, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.body, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 26 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 12, marginBottom: 9 },
  inputWrap: { height: 52, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  input: { flex: 1, color: colors.ink, fontSize: 15 },
  button: { minHeight: 54, borderRadius: 16, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 28 },
  disabled: { opacity: 0.55 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  back: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  backText: { color: colors.blue, fontWeight: '800', fontSize: 14 },
});
