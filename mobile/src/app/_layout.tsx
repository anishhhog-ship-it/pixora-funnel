import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SessionProvider, SplashScreenController, useSession } from '@/ctx';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <SplashScreenController />
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
          <RootNavigator />
        </SafeAreaView>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();
  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
    </Stack>
  );
}
