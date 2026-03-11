import { Header } from '@/containers/header';
import { Stack } from 'expo-router';

export const unstable_settings = {
	initialRouteName: '/home',
};

function StackLayout() {
	return (
		<Stack
			screenOptions={{
				header: (props) => <Header {...props} titlePosition='center' />,
			}}
			initialRouteName='home'
		>
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
					title: 'Faça sua Cotação',
				}}
			/>
		</Stack>
	);
}

export default StackLayout;
