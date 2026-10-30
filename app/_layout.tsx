import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {View} from 'react-native';
import {LegacyThemeProvider,useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {LegacyHeader} from '../src/ui/echo/LegacyHeader';
import {DevicePreferencesProvider} from '../src/ui/echo/DevicePreferences';
import {FontZoomProvider} from '../src/ui/echo/FontZoom';
import {QuickActionProvider} from '../src/ui/echo/QuickActions';

const queryClient=new QueryClient({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:false}}});

function AppShell(){
 const theme=useLegacyTheme();
 return <View style={{flex:1,backgroundColor:theme.bg}}>
   <LegacyHeader/>
   <View style={{flex:1}}>
     <Stack screenOptions={{
       headerShown:false,
       contentStyle:{backgroundColor:theme.bg},
       animation:'fade'
     }}>
       <Stack.Screen name="index" />
       <Stack.Screen name="profile" />
       <Stack.Screen name="favorites" />
       <Stack.Screen name="stats" />
       <Stack.Screen name="preview/[id]" />
       <Stack.Screen name="speaker/index" />
       <Stack.Screen name="speaker/[name]" />
       <Stack.Screen name="track/[id]" />
     </Stack>
   </View>
 </View>;
}
export default function RootLayout(){
 return <QueryClientProvider client={queryClient}>
   <LegacyThemeProvider><FontZoomProvider><QuickActionProvider><DevicePreferencesProvider><AppShell/></DevicePreferencesProvider></QuickActionProvider></FontZoomProvider></LegacyThemeProvider>
 </QueryClientProvider>;
}
