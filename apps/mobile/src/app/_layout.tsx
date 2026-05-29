import '@/styles/globals.css';

import 'react-native-reanimated';

import { Toasts } from '@/components/ui/toast';
import { Providers } from '@/contexts/providers';
import { cn } from '@/libraries/classname';
import { NAV_THEME } from '@/libraries/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Constants from 'expo-constants';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
	fade: true,
	duration: 500,
});

setDefaultOptions({
	locale: ptBR,
});

const isCompany = !!Constants.expoConfig?.extra?.company;

export const unstable_settings = {
	initialRouteName: '/index',
};

function RootLayout() {
	useEffect(() => {
		SplashScreen.hideAsync();
	}, []);

	return (
		<KeyboardProvider>
			<GestureHandlerRootView
				className={cn('flex-1', isCompany && 'theme-company')}
			>
				<Providers>
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
				</Providers>
			</GestureHandlerRootView>
		</KeyboardProvider>
	);
}

export default RootLayout;
