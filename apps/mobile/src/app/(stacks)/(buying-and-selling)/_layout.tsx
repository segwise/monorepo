import { Stack } from 'expo-router';
import { Header } from '@/containers/header';

function BuyingAndSellingLayout() {
	return (
		<Stack
			screenOptions={{
				title: 'Compra & Venda',
				header: (props) => <Header {...props} />,
			}}
		>
			<Stack.Screen name='index' />
			<Stack.Screen name='[id]' />
			<Stack.Screen name='register-update' />
			<Stack.Screen name='vehicles' />
		</Stack>
	);
}

export default BuyingAndSellingLayout;
