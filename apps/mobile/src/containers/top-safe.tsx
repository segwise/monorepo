import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TopSafe({ className }: { className?: string }) {
	const { top } = useSafeAreaInsets();

	return (
		<View
			className={className}
			style={{
				height: top,
			}}
		/>
	);
}

export { TopSafe };
