import { Header } from '@/containers/header';
import { storage } from '@/libraries/storage';
import { Stack } from 'expo-router';

export const unstable_settings = {
	initialRouteName: '/index',
};

function StackLayout() {
	const isAuthBuyingAndSelling = !!storage.getString('buying-and-selling');

	return (
		<Stack
			screenOptions={{
				header: (props) => <Header {...props} titlePosition='center' />,
				title: 'Compra e Venda',
			}}
		>
			<Stack.Screen redirect={isAuthBuyingAndSelling} name='index' />
			<Stack.Screen name='listining' />
			<Stack.Screen name='my-vehicles' />
			<Stack.Screen name='vehicle-register' />
		</Stack>
	);
}

export default StackLayout;
