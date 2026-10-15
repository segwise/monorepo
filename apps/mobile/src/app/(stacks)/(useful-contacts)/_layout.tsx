import { Header } from '@/containers/header';
import { Stack } from 'expo-router';

function UsefulContactsRoot() {
	return (
		<Stack
			initialRouteName='index'
			screenOptions={{
				title: 'Contatos Úteis',
				header: (props) => <Header {...props} />,
			}}
		>
			<Stack.Screen name='index' />
			<Stack.Screen
				name='(insurance-companies)'
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name='emergency'
				options={{
					title: 'Contatos de Emergência',
				}}
			/>
		</Stack>
	);
}

export default UsefulContactsRoot;
