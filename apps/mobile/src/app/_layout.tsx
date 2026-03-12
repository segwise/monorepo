import '@/styles/globals.css';

import 'react-native-reanimated';

import { Toasts } from '@/components/ui/toast';
import { NAV_THEME } from '@/libraries/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
	fade: true,
	duration: 100,
});

export const unstable_settings = {
	initialRouteName: '/index',
};

function RootLayout() {
	useEffect(() => {
		SplashScreen.hideAsync();
	}, []);

	return (
		<KeyboardProvider>
			<GestureHandlerRootView>
				<ThemeProvider value={NAV_THEME.light}>
					<StatusBar style='light' />
					<Tabs
						initialRouteName='index'
						screenOptions={{
							headerShown: false,
							tabBarStyle: {
								display: 'none',
							},
						}}
					>
						<Tabs.Screen name='index' />
						<Tabs.Screen name='(stacks)' />
					</Tabs>
					<Toasts />
					<PortalHost />
				</ThemeProvider>
			</GestureHandlerRootView>
		</KeyboardProvider>
	);
}

export default RootLayout;
