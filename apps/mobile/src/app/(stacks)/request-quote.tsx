import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input, InputError } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { maskPhone, maskPlate, maskPostalCode } from '@segwise/core/masks';
import {
	SchemaName,
	SchemaPhone,
	SchemaPlate,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '@segwise/core/schemas';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Controller, useForm } from 'react-hook-form';
import {
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import z from 'zod';

interface LabelProps {
	title: string;
	icon: SymbolViewProps['name'];
}

function Label({ title, icon }: LabelProps) {
	return (
		<View className='flex flex-row items-center justify-start gap-x-2'>
			<View className='bg-primary rounded-full size-9 flex flex-row items-center justify-center'>
				<SymbolView name={icon} size={18} tintColor='#FFFFFF' />
			</View>
			<Text allowFontScaling={false} className='text-xl font-semibold'>
				{title}
			</Text>
		</View>
	);
}

function RequestQuote() {
	const { width } = useWindowDimensions();

	const {
		control,
		watch,
		formState: { isValid, isDirty },
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(
			z
				.object({
					vehicleWithLicensePlate: z.coerce.boolean(),
					plate: SchemaPlate,
					use: z.object({
						label: z.string(),
						value: SchemaVehicleUsage,
					}),
					postalCode: SchemaPostalCode,
					insured: z.object({
						name: SchemaName,
						phone: SchemaPhone,
					}),
					renewal: z.coerce.boolean(),
				})
				.transform((props) => ({ ...props, use: props.use.value }))
				.transform(({ plate, ...props }) => ({
					...props,
					...(props.vehicleWithLicensePlate && {
						plate,
					}),
				})),
		),
		defaultValues: {
			vehicleWithLicensePlate: true,
		},
	});

	const vehicleWithLicensePlate = watch('vehicleWithLicensePlate');

	const isRenewal = watch('renewal') || false;

	return (
		<View className='py-6 px-4 gap-6'>
			<View className='gap-y-5'>
				<View className='gap-y-2 mb-1'>
					<Label
						title='Dados do Veículo'
						icon={{
							ios: 'car.fill',
							android: 'car_crash',
						}}
					/>
					<View className='flex flex-row items-center justify-start gap-x-6'>
						<Controller
							control={control}
							name='vehicleWithLicensePlate'
							render={({ field }) => (
								<TouchableOpacity
									onPress={() => field.onChange(true)}
									className='flex flex-row items-center justify-start gap-x-2'
								>
									<Checkbox
										checked={field.value as boolean}
										onCheckedChange={() => {}}
										className='size-[1.1rem] pointer-events-none'
									/>
									<Text
										allowFontScaling={false}
										className='text-base font-medium'
									>
										Com Placa
									</Text>
								</TouchableOpacity>
							)}
						/>
						<Controller
							control={control}
							name='vehicleWithLicensePlate'
							render={({ field }) => (
								<TouchableOpacity
									onPress={() => field.onChange(false)}
									className='flex flex-row items-center justify-start gap-x-2'
								>
									<Checkbox
										checked={!field.value as boolean}
										onCheckedChange={() => {}}
										className='size-[1.1rem] pointer-events-none'
									/>
									<Text
										allowFontScaling={false}
										className='text-base font-medium'
									>
										Sem Placa
									</Text>
								</TouchableOpacity>
							)}
						/>
					</View>
				</View>
				{!!vehicleWithLicensePlate && (
					<Controller
						control={control}
						name='plate'
						render={({ field, fieldState }) => (
							<View>
								<Input
									{...field}
									onChangeText={(value) =>
										field.onChange(maskPlate(value.toUpperCase()))
									}
									label='Placa'
									placeholder='AAA-0000 ou AAA0A00'
									className='uppercase'
									maxLength={
										field.value?.[4] && Number.isInteger(field.value?.[4])
											? 8
											: 7
									}
									keyboardAppearance='dark'
								/>
								{fieldState.error?.message && (
									<InputError>{fieldState.error.message}</InputError>
								)}
							</View>
						)}
					/>
				)}
				<Controller
					control={control}
					name='use'
					render={({ field, fieldState }) => (
						<View>
							<Select {...field} onValueChange={field.onChange}>
								<SelectTrigger label='Uso do Veículo'>
									<SelectValue placeholder='Selecionar' />
								</SelectTrigger>
								<SelectContent style={{ width: width - 32 }}>
									<SelectItem
										value='leisure_and_work'
										label='LAZER E TRABALHO'
									/>
									<SelectItem value='leisure' label='SOMENTE LAZER' />
									<SelectItem
										value='client_supplier_visits'
										label='VISITA A CLIENTES'
									/>
									<SelectItem
										value='app_based_transport'
										label='TRANSPORTE POR APLICATIVO'
									/>
									<SelectItem value='taxi' label='TAXI' />
									<SelectItem value='public_transportation' label='LOTAÇÃO' />
									<SelectItem value='delivieries' label='ENTREGAS' />
									<SelectItem value='tourism' label='TURISMO' />
								</SelectContent>
							</Select>
							{fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<Controller
					control={control}
					name='postalCode'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								onChangeText={(value) => field.onChange(maskPostalCode(value))}
								label='CEP de Pernoite'
								placeholder='00000-000'
								maxLength={9}
								keyboardAppearance='dark'
							/>
							{fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
			</View>
			<View className='gap-y-5'>
				<View className='mb-1'>
					<Label
						title='Dados do Segurado'
						icon={{
							ios: 'person.fill',
							android: 'car_crash',
						}}
					/>
				</View>
				<Controller
					control={control}
					name='insured.name'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								onChangeText={(value) => field.onChange(value.toUpperCase())}
								label='Nome Completo'
								placeholder='Nome Completo'
								className='uppercase'
								keyboardAppearance='dark'
							/>
							{fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<Controller
					control={control}
					name='insured.phone'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								onChangeText={(value) => field.onChange(maskPhone(value))}
								label='Celular / Whatsapp'
								placeholder='(00) 00000-0000'
								keyboardAppearance='dark'
								maxLength={15}
							/>
							{fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<Separator />
				<Select>
					<SelectTrigger label='Tipo de Cotação'>
						<SelectValue placeholder='Selecionar' />
					</SelectTrigger>
					<SelectContent style={{ width: width - 32 }}>
						<SelectItem value='new' label='Seguro Novo' />
						<SelectItem value='renewal' label='Renovação' />
					</SelectContent>
				</Select>
			</View>
			<Button
				size='lg'
				className='h-[3.25rem] flex-row items-center'
				onPress={alert}
				disabled={!isDirty || !isValid}
			>
				<Text className='text-xl text-white font-semibold'>
					ENVIAR SOLICITAÇÃO
				</Text>
				<View className='absolute right-10'>
					<SymbolView
						name={{
							ios: 'paperplane',
							android: 'send',
						}}
						size={24}
						tintColor='#FFFFFF'
					/>
				</View>
			</Button>
		</View>
	);
}

export default RequestQuote;
