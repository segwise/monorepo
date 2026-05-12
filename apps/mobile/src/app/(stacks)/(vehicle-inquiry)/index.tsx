import { Button } from '@/components/ui/button';
import { InputOTP } from '@/components/ui/input-otp';
import { Feather } from '@expo/vector-icons';
import { maskPlate } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { isPlate } from '@segwise/core/valids';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useMMKVObject } from 'react-native-mmkv';

function VehicleInquiryScreen() {
	const [plate, setPlate] = useState<string>('');

	const [histories] = useMMKVObject<
		Array<{
			plate: string;
			model: string;
			year: number;
		}>
	>('vehicle-inquiry-plate');

	const isValid = isPlate(plate);

	return (
		<View className='p-4 gap-y-4'>
			<View className='border border-border rounded-md p-4 overflow-hidden relative'>
				<View className='bg-primary py-1.5 -mx-4 -mt-4 mb-4'>
					<Text className='text-center text-white font-bold uppercase text-base'>
						PLACA
					</Text>
				</View>
				<InputOTP
					value={plate}
					onValueChange={setPlate}
					length={7}
					classNameSquare='flex-1 aspect-square uppercase'
					autoFocus
					keyboardType='default'
				/>
			</View>
			{!!plate.length && !isValid && (
				<Text className='text-destructive text-sm font-medium -mt-3 -mb-2'>
					Placa Inválida
				</Text>
			)}
			<Link href={`/(vehicle-inquiry)/${plate}`} asChild disabled={!isValid}>
				<Button disabled={!isValid} className='h-fit'>
					<Text className='text-white font-medium text-base leading-tight text-center uppercase'>
						Consultar Simples{'\n'}Gratuito
					</Text>
					<Feather
						name='search'
						size={20}
						color='#FFFFFF'
						className='absolute right-4'
					/>
				</Button>
			</Link>
			<Link
				href={`/(vehicle-inquiry)/complete?plate=${plate}`}
				asChild
				disabled={!isValid}
			>
				<Button disabled={!isValid} className='h-fit'>
					<Text className='text-white font-medium text-base leading-tight text-center uppercase'>
						Consultar Completa{'\n'}R$ ---,--
					</Text>
					<Feather
						name='search'
						size={20}
						color='#FFFFFF'
						className='absolute right-4'
					/>
				</Button>
			</Link>
			<View className='border border-primary/20 rounded-md px-4 pt-3 pb-4 flex-row gap-2 bg-primary/5'>
				<Feather name='info' size={16} className='mt-1' />
				<Text className='flex-1 text-sm leading-snug'>
					<Text className='font-bold'>OBS:</Text> Em Consulta Completa,
					Histórico de:{'\n'}Roubo e Furto, Recall, Multas, Leilão, Sinistros,
					Débitos e Outros.
				</Text>
			</View>
			{!!histories?.length && (
				<View>
					<Text className='font-bold text-base capitalize'>
						Consultas Recentes
					</Text>
					<View className='mt-2 gap-y-2'>
						{histories
							.reverse()
							.slice(0, 5)
							?.map(({ plate, model, year }) => (
								<Link href={`/(vehicle-inquiry)/${plate}`} key={plate} asChild>
									<TouchableOpacity className='flex-row items-center justify-between gap-x-2 border border-primary/20 rounded-md p-2 gap-2 bg-primary/5'>
										<View className='flex-row items-center justify-start gap-x-2'>
											<View className='size-8 rounded-sm bg-primary items-center justify-center flex-row'>
												<Feather name='clock' size={20} color='#FFFFFF' />
											</View>
											<View>
												<Text className='font-bold text-sm mb-0.5'>
													{maskPlate(plate)}
												</Text>
												<Text className='text-muted-foreground text-sm leading-none capitalize'>
													{capitalizeFirstLetters(model)} {year}
												</Text>
											</View>
										</View>
										<View>
											<Feather name='arrow-up-right' size={20} />
										</View>
									</TouchableOpacity>
								</Link>
							))}
					</View>
				</View>
			)}
		</View>
	);
}

export default VehicleInquiryScreen;
