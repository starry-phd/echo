import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:false}}});
import { palette } from '../src/theme';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
    <Stack screenOptions={{
      headerStyle: { backgroundColor: palette.white },
      headerTintColor: palette.brand,
      contentStyle: { backgroundColor: palette.paper },
      headerTitleStyle: { fontWeight: '700' }
    }}>
      <Stack.Screen name="index" options={{ title: '繁星回聲' }} />
      <Stack.Screen name="profile" options={{ title: '中央會員' }} />
      <Stack.Screen name="speaker/index" options={{ title: '講師作品' }} />
      <Stack.Screen name="speaker/[name]" options={{ title: '講師作品' }} />
      <Stack.Screen name="track/[id]" options={{ title: '音檔詳情' }} />
    </Stack>
    </QueryClientProvider>
  );
}
