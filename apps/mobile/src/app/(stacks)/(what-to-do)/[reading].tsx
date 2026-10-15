import { Stack, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { ScrollView, View } from 'react-native';
import { whatToDo } from '@/configs/consts/what-to-do';

function WhatToDoReadingScreen() {
	const { reading } = useLocalSearchParams<{
		reading: keyof typeof whatToDo;
	}>();

	return (
		<Fragment>
			<Stack.Screen
				options={{
					...(typeof reading === 'string' && {
						title: whatToDo[reading].title,
					}),
				}}
			/>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View className='p-4 bg-white border border-border rounded-sm m-4'>
					{whatToDo[reading].content}
				</View>
			</ScrollView>
		</Fragment>
	);
}

export default WhatToDoReadingScreen;
