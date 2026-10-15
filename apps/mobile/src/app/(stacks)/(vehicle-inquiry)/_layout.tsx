import { Stack } from 'expo-router';
import { Header } from '@/containers/header';

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
