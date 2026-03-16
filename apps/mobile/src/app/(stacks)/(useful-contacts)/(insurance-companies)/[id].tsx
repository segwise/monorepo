import { Separator } from '@/components/ui/separator';
import { cn } from '@/libraries/classname';
import { useInsuranceCompaniesDetailsById } from '@/libraries/hooks/api/insurance-companies/details';
import { maskCNPJ, maskPhone } from '@segwise/core/masks';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
	Linking,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

function InsuranceCompaniesDetailsScreen() {
	const { id } = useLocalSearchParams<{
		id: string;
	}>();

	const { data } = useInsuranceCompaniesDetailsById(id);

	return (
		<ScrollView>
			<View className='p-4'>
				<Stack.Screen
					options={{
						title: `Dados da Seguradora`,
					}}
				/>
				<View className='border border-border rounded-md px-4 pt-3 pb-4'>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold text-2xl uppercase'
					>
						Assistências 24 horas
					</Text>
					<Separator className='mt-2 mb-3' />
					<View className='flex-row items-center justify-start gap-x-3'>
						<View className='rounded overflow-hidden size-14'>
							<Image
								source={data?.icon}
								style={{ width: '100%', height: '100%' }}
								contentFit='cover'
								contentPosition='center'
								className='aspect-square'
							/>
						</View>
						<View>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='text-lg text-inherit uppercase font-semibold line-clamp-1 opacity-70 leading-none'
							>
								{data?.name}
							</Text>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='text-xl text-inherit uppercase font-semibold line-clamp-1 leading-none mt-1'
							>
								{maskCNPJ(data?.cnpj || '')}
							</Text>
						</View>
					</View>
					<View className='gap-y-4 mt-3'>
						{data?.contacts
							.sort((a, b) => a.index - b.index)
							.map(({ label, contacts }, id) => (
								<View
									key={id.toString()}
									className='bg-muted rounded-sm px-4 py-3'
								>
									<Text
										allowFontScaling={false}
										accessible={false}
										className='uppercase text-xl font-semibold leading-tight line-clamp-1'
									>
										{label}
									</Text>
									<Separator className='my-2' />
									<View className='gap-y-6 mt-2'>
										{contacts.map(({ value, coverage, isWhatsapp }, index) => (
											<TouchableOpacity
												key={index.toString()}
												className='flex-row items-center justify-between gap-x-3 pr-1'
												onPress={() => {
													if (isWhatsapp) {
														Linking.openURL(`https://wa.me/${value}`);

														return;
													}

													Linking.openURL(`tel:${value}`);
												}}
											>
												<View>
													<Text
														allowFontScaling={false}
														accessible={false}
														className={cn(
															'text-lg font-medium leading-none',
															isWhatsapp && 'text-green-600',
														)}
													>
														{maskPhone(value)}
														{isWhatsapp && (
															<Text
																allowFontScaling={false}
																accessible={false}
																className='text-xs leading-none'
															>
																{' '}
																- Whatsapp
															</Text>
														)}
													</Text>
													<Text
														allowFontScaling={false}
														accessible={false}
														className={cn(
															'text-sm font-medium leading-none mt-1',
															isWhatsapp && 'text-green-600',
														)}
													>
														{coverage === 'all_regions'
															? 'Todas as Regiões'
															: 'Capitais e Regiões Metropolitanas'}
													</Text>
												</View>
												<SymbolView
													name={{
														ios: isWhatsapp
															? 'phone.circle.fill'
															: 'phone.fill.arrow.up.right',
														android: isWhatsapp
															? 'smartphone'
															: 'phone_in_talk',
													}}
													tintColor={isWhatsapp ? '#16a34a' : '#232323'}
												/>
											</TouchableOpacity>
										))}
									</View>
								</View>
							))}
					</View>
				</View>
			</View>
		</ScrollView>
	);
}

export default InsuranceCompaniesDetailsScreen;
