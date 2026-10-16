import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, ArrowRight, KeyRound } from 'lucide-react-native';
import { useSession } from '@/ctx';
import { colors, radii } from '@/theme';
import { LogoMark } from '@/components/ui';

export default function SignInScreen() {
  const { signIn, sendPasswordReset, error: authError } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Enter your details', 'Use the email and password from your Pixora Funnel account.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Add your account email first so we can send the reset link.');
      return;
    }
    setIsResetting(true);
    try {
      await sendPasswordReset(email);
      Alert.alert('Reset link sent', 'Check your email for a secure password reset link.');
    } catch (error) {
      Alert.alert('Could not send reset link', error instanceof Error ? error.message : 'Please try again later.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}><LogoMark /><Text style={styles.brandName}>Pixora <Text style={styles.brandAccent}>Funnel</Text></Text></View>
        <View style={styles.heroCircle}><Lock size={34} color={colors.blue} /></View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to manage your customer review funnel.</Text>

        {authError ? <View style={styles.errorBanner}><Text style={styles.errorText}>{authError}</Text></View> : null}

        <View style={styles.form}>
          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputWrap}><Mail size={18} color={colors.muted} /><TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@business.com" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} style={styles.input} /></View>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}><Lock size={18} color={colors.muted} /><TextInput secureTextEntry autoComplete="password" placeholder="Your password" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} style={styles.input} /></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Forgot password" onPress={handleReset} disabled={isResetting} style={styles.forgot}><KeyRound size={15} color={colors.blue} /><Text style={styles.forgotText}>{isResetting ? 'Sending reset link…' : 'Forgot password?'}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Sign in" onPress={handleSignIn} disabled={isSubmitting} style={[styles.signInButton, isSubmitting && styles.disabled]}><Text style={styles.signInText}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Text><ArrowRight size={19} color="#fff" /></TouchableOpacity>
        </View>

        <View style={styles.helpCard}><Text style={styles.helpTitle}>Already have a Pixora account?</Text><Text style={styles.helpText}>Use the account created during onboarding or by your Pixora representative. This app does not create a second customer identity.</Text></View>
        <Text style={styles.legal}>By continuing, you agree to Pixora Funnel’s Terms and Privacy Policy.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, paddingTop: 28, justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42 },
  brandName: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  brandAccent: { color: colors.blue },
  heroCircle: { width: 76, height: 76, borderRadius: 28, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.body, fontSize: 16, lineHeight: 23, marginTop: 8, marginBottom: 28 },
  errorBanner: { backgroundColor: '#FFF1F0', borderRadius: 14, padding: 13, marginBottom: 18 },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  form: { gap: 11 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 5 },
  inputWrap: { height: 52, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  input: { flex: 1, color: colors.ink, fontSize: 15 },
  forgot: { minHeight: 44, flexDirection: 'row', gap: 7, alignItems: 'center', alignSelf: 'flex-end', paddingHorizontal: 4 },
  forgotText: { color: colors.blue, fontSize: 13, fontWeight: '800' },
  signInButton: { minHeight: 54, borderRadius: 16, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 },
  disabled: { opacity: 0.55 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  helpCard: { backgroundColor: colors.bluePale, borderRadius: 18, padding: 16, marginTop: 28 },
  helpTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  helpText: { color: colors.body, fontSize: 12, lineHeight: 18, marginTop: 5 },
  legal: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 24 },
});
