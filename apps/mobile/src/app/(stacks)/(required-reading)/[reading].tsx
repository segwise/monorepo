import { requiredReading } from '@/configs/consts/required-reading';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

function RequiredReadingScreen() {
	const { reading } = useLocalSearchParams<{
		reading: keyof typeof requiredReading;
	}>();

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<Stack.Screen
				options={{
					...(typeof reading === 'string' && {
						title: requiredReading[reading].title,
					}),
				}}
			/>
			<View className='p-4 bg-white border border-border rounded-sm m-4'>
				{requiredReading[reading].content}
			</View>
		</ScrollView>
	);
}

export default RequiredReadingScreen;
