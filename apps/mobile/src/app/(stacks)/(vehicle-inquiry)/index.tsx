import { Button } from '@/components/ui/button';
import { InputOTP } from '@/components/ui/input-otp';
import { isCompany } from '@/configs/consts/company';
import { cn } from '@/libraries/classname';
import { useGetAmountSearchVehicleComplete } from '@/libraries/hooks/api/get-amount-search-vehicle-complete';
import { Feather } from '@expo/vector-icons';
import { maskPlate } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { isPlate } from '@segwise/core/valids';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
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

	const historiesMap = useMemo(
		() => histories?.reverse().slice(0, 3),
		[histories],
	);

	const { data: amountSearchVehicleComplete } =
		useGetAmountSearchVehicleComplete();

	const isValid = isPlate(plate);

	return (
		<View className='p-4 gap-y-4'>
			<View className='border border-border rounded-md p-4 overflow-hidden relative'>
				<View
					className={cn(
						'bg-primary py-1.5 -mx-4 -mt-4 mb-4',
						isCompany && 'bg-primary-xcar',
					)}
				>
					<Text className='text-center text-white font-bold uppercase text-base'>
						PLACA
					</Text>
				</View>
				<InputOTP
					value={plate}
					onValueChange={setPlate}
					length={7}
					classNameSquare='flex-1 h-12 uppercase'
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
						Consulta Simples{'\n'}Gratuito
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
				{/* <Button disabled={!isValid} className='h-fit'> */}
				<Button disabled className='h-fit'>
					<Text className='text-white font-medium text-base leading-tight text-center uppercase'>
						Consulta Completa
						{'\n'}
						{/* {amountSearchVehicleComplete?.amount
							? new Intl.NumberFormat('pt-BR', {
									style: 'currency',
									currency: 'BRL',
								}).format(amountSearchVehicleComplete.amount)
							: undefined} */}
						Em Construção
					</Text>
					<Feather
						name='search'
						size={20}
						color='#FFFFFF'
						className='absolute right-4'
					/>
				</Button>
			</Link>
			<View
				className={cn(
					'border border-primary/20 rounded-md px-4 pt-3 pb-4 flex-row gap-2 bg-primary/5',
					isCompany && 'bg-primary-xcar/5 border-r-primary-xcar/20',
				)}
			>
				<Feather name='info' size={16} className='mt-1' />
				<Text className='flex-1 text-sm leading-snug'>
					<Text className='font-bold'>OBS:</Text> Em Consulta Completa,
					Histórico de:{'\n'}Roubo e Furto, Recall, Multas, Leilão, Sinistros,
					Débitos e Outros.
				</Text>
			</View>
			{!!historiesMap?.length && (
				<View>
					<Text className='font-bold text-base capitalize'>
						Consultas Recentes
					</Text>
					<View className='mt-2 gap-y-2'>
						{historiesMap.map(({ plate, model, year }) => (
							<Link href={`/(vehicle-inquiry)/${plate}`} key={plate} asChild>
								<TouchableOpacity
									className={cn(
										'flex-row items-center justify-between gap-x-2 border border-primary/20 rounded-md p-2 gap-2 bg-primary/5',
										isCompany && 'bg-primary-xcar/5 border-r-primary-xcar/20',
									)}
								>
									<View className='flex-row items-center justify-start gap-x-2'>
										<View
											className={cn(
												'size-8 rounded-sm bg-primary items-center justify-center flex-row',
												isCompany && 'bg-primary-xcar',
											)}
										>
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
