import { Header } from '@/containers/header';
import { storage } from '@/libraries/storage';
import { Stack } from 'expo-router';

export const unstable_settings = {
	initialRouteName: '/home',
};

function StackLayout() {
	const isReferral = !!storage.getString('referral');

	return (
		<Stack
			screenOptions={{
				header: (props) => <Header {...props} titlePosition='center' />,
			}}
			initialRouteName='home'
		>
			<Stack.Screen
				redirect={isReferral}
				name='request-referral'
				options={{
					title: 'Seu amigo na hora do sinistro',
				}}
			/>
			<Stack.Screen
				name='home'
				options={{
					title: 'Bem-vindo!',
					header: (props) => (
						<Header {...props} titlePosition='left' showReturn={false} />
					),
				}}
			/>
			<Stack.Screen
				name='(insurances)'
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name='request-quote'
				options={{
					title: 'Faça sua Cotação',
				}}
			/>
			<Stack.Screen
				name='(required-reading)'
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name='(what-to-do)'
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name='(useful-contacts)'
				options={{
					headerShown: false,
				}}
			/>
		</Stack>
	);
}

export default StackLayout;
