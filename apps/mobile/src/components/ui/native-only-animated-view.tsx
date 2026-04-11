import { Fragment } from 'react';
import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';

function NativeOnlyAnimatedView(
	props: React.ComponentProps<typeof Animated.View> &
		React.RefAttributes<Animated.View>,
) {
	if (Platform.OS === 'web') {
		return <Fragment>{props.children as React.ReactNode}</Fragment>;
	} else {
		return <Animated.View {...props} />;
	}
}

export { NativeOnlyAnimatedView };
