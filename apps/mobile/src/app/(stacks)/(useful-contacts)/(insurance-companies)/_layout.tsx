import { Stack } from 'expo-router';
import { Header } from '@/containers/header';

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
