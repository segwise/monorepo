import { whatToDo } from '@/configs/consts/what-to-do';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

function WhatToDoReadingScreen() {
	const { reading } = useLocalSearchParams<{
		reading: keyof typeof whatToDo;
	}>();

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<Stack.Screen
				options={{
					...(typeof reading === 'string' && {
						title: whatToDo[reading].title,
					}),
				}}
			/>
			<View className='p-4 bg-white border border-border rounded-sm m-4'>
				{whatToDo[reading].content}
			</View>
		</ScrollView>
	);
}

export default WhatToDoReadingScreen;
