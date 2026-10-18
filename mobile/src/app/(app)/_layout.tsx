import { Tabs } from 'expo-router';
import { Home, Star, Grid2X2, UserRound, ShoppingBag } from 'lucide-react-native';
import { WorkspaceProvider } from '@/workspace';
import { colors } from '@/theme';

export default function AppLayout() {
  return <WorkspaceProvider><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: '#8E9AB2', tabBarLabelStyle: { fontSize: 10, fontWeight: '700' }, tabBarStyle: { height: 76, paddingTop: 8, paddingBottom: 12, borderTopColor: colors.border, backgroundColor: '#fff' } }}><Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} /><Tabs.Screen name="reviews" options={{ title: 'Reviews', tabBarIcon: ({ color, size }) => <Star color={color} size={size} /> }} /><Tabs.Screen name="store" options={{ title: 'Store', tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} /> }} /><Tabs.Screen name="funnel" options={{ title: 'Funnel', tabBarIcon: ({ color, size }) => <Grid2X2 color={color} size={size} /> }} /><Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} /></Tabs></WorkspaceProvider>;
}
