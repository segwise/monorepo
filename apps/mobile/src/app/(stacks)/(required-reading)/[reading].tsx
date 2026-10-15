import { Stack, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requiredReading } from '@/configs/consts/required-reading';

function RequiredReadingScreen() {
	const { reading } = useLocalSearchParams<{
		reading: keyof typeof requiredReading;
	}>();

	const { bottom } = useSafeAreaInsets();

	return (
		<Fragment>
			<Stack.Screen
				options={{
					...(typeof reading === 'string' && {
						title: requiredReading[reading].title,
					}),
				}}
			/>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View
					className='p-4 bg-white border border-border rounded-sm m-4'
					style={{
						marginBottom: bottom + 20,
					}}
				>
					{requiredReading[reading].content}
				</View>
			</ScrollView>
		</Fragment>
	);
}

export default RequiredReadingScreen;
