import { Header } from '@/containers/header';
import { Stack } from 'expo-router';

function InsuranceCompaniesRoot() {
	return (
		<Stack
			initialRouteName='index'
			screenOptions={{
				title: 'Contatos de Seguradoras',
				header: (props) => <Header {...props} />,
			}}
		>
			<Stack.Screen name='index' />
			<Stack.Screen name='[id]' />
		</Stack>
	);
}

export default InsuranceCompaniesRoot;
