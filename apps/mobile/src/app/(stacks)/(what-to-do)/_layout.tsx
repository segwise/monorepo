import { Header } from '@/containers/header';
import { Stack } from 'expo-router';

function WhatToDoLayout() {
	return (
		<Stack
			screenOptions={{
				title: 'O que fazer?',
				header: (props) => <Header {...props} titlePosition='center' />,
			}}
		>
			<Stack.Screen name='index' />
			<Stack.Screen name='[reading]' />
		</Stack>
	);
}

export default WhatToDoLayout;
