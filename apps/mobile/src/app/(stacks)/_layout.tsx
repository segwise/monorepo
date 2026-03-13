import { Header } from '@/containers/header';
import { store } from '@/libraries/store';
import { Stack } from 'expo-router';

export const unstable_settings = {
	initialRouteName: '/home',
};

function StackLayout() {
	const isReferral = !!store.getString('referral');
	const storeFirstQuote = store.getBoolean('first-quote');

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
				name='request-quote'
				options={{
					title: !storeFirstQuote ? 'Inclua seus Dados' : 'Faça sua Cotação',
				}}
			/>
		</Stack>
	);
}

export default StackLayout;
