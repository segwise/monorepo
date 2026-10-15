import { Header } from '@/containers/header';
import { Stack } from 'expo-router';

function StackLayout() {
	return (
		<Stack
			screenOptions={{
				title: 'Consulta Veícular',
				header: (props) => <Header {...props} titlePosition='center' />,
			}}
		>
			<Stack.Screen name='index' />
			<Stack.Screen name='[plate]' />
			<Stack.Screen name='complete' />
			<Stack.Screen name='checkout-complete' />
		</Stack>
	);
}

export default StackLayout;
