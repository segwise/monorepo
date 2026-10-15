import { Stack } from 'expo-router';
import { Header } from '@/containers/header';

function InsurancesRoot() {
	return (
		<Stack
			initialRouteName='index'
			screenOptions={{
				title: 'Meus Seguros',
				header: (props) => <Header {...props} titlePosition='center' />,
			}}
		>
			<Stack.Screen name='index' />
			<Stack.Screen name='listining' />
		</Stack>
	);
}

export default InsurancesRoot;
