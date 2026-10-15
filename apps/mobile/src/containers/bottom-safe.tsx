import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BottomSafe({ className }: { className?: string }) {
	const { bottom } = useSafeAreaInsets();

	return (
		<View
			className={className}
			style={{
				height: bottom,
			}}
		/>
	);
}

export { BottomSafe };
