import { focusManager, onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
import { useEffect } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

function useFetchSetup() {
	useEffect(() => {
		function onAppStateChange(status: AppStateStatus) {
			if (Platform.OS !== 'web') {
				focusManager.setFocused(status === 'active');
			}
		}

		function onListenerNetwork(setOnline: (value: boolean) => void) {
			let initialised = false;

			const eventSubscription = addNetworkStateListener((state) => {
				initialised = true;

				setOnline(!!state.isConnected);
			});

			getNetworkStateAsync().then((state) => {
				if (!initialised) {
					setOnline(!!state.isConnected);
				}
			});

			return () => {
				eventSubscription.remove();
			};
		}

		const subscriptionFocus = AppState.addEventListener(
			'change',
			onAppStateChange,
		);

		const subscriptionNetwork = onlineManager.setEventListener(
			onListenerNetwork,
		) as (() => void) | undefined;

		return () => {
			subscriptionFocus.remove();
			subscriptionNetwork?.();
		};
	}, []);
}

export { useFetchSetup };
