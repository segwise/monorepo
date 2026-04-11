import { useInsuranceCompaniesSimple } from '@/libraries/hooks/api/insurance-companies/simple';
import { maskCNPJ } from '@segwise/core/masks';
import type { InsuranceCompanySimple } from '@segwise/core/types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

function Item({ id, name, cnpj, icon }: InsuranceCompanySimple) {
	const { push } = useRouter();

	function navigate() {
		push(`/(stacks)/(useful-contacts)/(insurance-companies)/${id}`);
	}

	return (
		<TouchableOpacity
			className='bg-background border border-border h-fit rounded-sm px-4 py-2.5 flex flex-row items-center justify-between gap-x-6'
			onPress={navigate}
		>
			<View className='flex-row items-center justify-start gap-x-3 flex-1'>
				<View className='rounded overflow-hidden size-14'>
					<Image
						source={icon}
						style={{ width: '100%', height: '100%' }}
						contentFit='cover'
						contentPosition='center'
						className='aspect-square'
					/>
				</View>
				<View className='flex-1 truncate'>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='text-base text-inherit uppercase font-semibold line-clamp-1 leading-none'
					>
						{name}
					</Text>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='text-sm text-inherit uppercase font-semibold line-clamp-1 opacity-70 leading-none mt-1'
					>
						{maskCNPJ(cnpj)}
					</Text>
				</View>
			</View>
			<SymbolView
				name={{
					ios: 'phone.fill.arrow.up.right',
					android: 'phone_in_talk',
				}}
				tintColor='#232323'
			/>
		</TouchableOpacity>
	);
}

function InsuranceCompaniesScreen() {
	const { data } = useInsuranceCompaniesSimple();

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<View className='p-4 gap-y-3 pb-10'>
				{data?.map(({ id, name, cnpj, icon }, index) => (
					<Item
						key={index.toString()}
						id={id}
						name={name}
						cnpj={cnpj}
						icon={icon}
					/>
				))}
			</View>
		</ScrollView>
	);
}

export default InsuranceCompaniesScreen;
