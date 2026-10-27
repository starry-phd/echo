import { Stack } from 'expo-router';
import { palette } from '../src/theme';

export default function RootLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: palette.white },
      headerTintColor: palette.brand,
      contentStyle: { backgroundColor: palette.paper },
      headerTitleStyle: { fontWeight: '700' }
    }}>
      <Stack.Screen name="index" options={{ title: '繁星回聲' }} />
      <Stack.Screen name="profile" options={{ title: '中央會員' }} />
      <Stack.Screen name="track/[id]" options={{ title: '音檔詳情' }} />
    </Stack>
  );
}
