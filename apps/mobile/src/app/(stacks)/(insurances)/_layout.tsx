import { Header } from '@/containers/header';
import { Stack } from 'expo-router';

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
		</Stack>
	);
}

export default InsurancesRoot;
