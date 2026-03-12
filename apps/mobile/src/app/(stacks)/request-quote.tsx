import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
import {
	maskDateString,
	maskPhone,
	maskPlate,
	maskPostalCode,
} from '@segwise/core/masks';
import {
	SchemaName,
	SchemaPhone,
	SchemaPlate,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '@segwise/core/schemas';
import { isDateString } from '@segwise/core/valids';
import { startOfDay } from 'date-fns';
import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Fragment, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	ScrollView,
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import CurrencyInput from 'react-native-currency-input';
import Svg, { Path } from 'react-native-svg';
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

const Schema = z
	.object({
		vehicleWithLicensePlate: z.coerce.boolean(),
		plate: SchemaPlate.nullish(),
		use: z.object({
			label: z.string(),
			value: SchemaVehicleUsage,
		}),
		postalCode: SchemaPostalCode,
		insured: z.object({
			name: SchemaName,
			phone: SchemaPhone,
		}),
		renewal: z.object({
			label: z.string(),
			value: z.enum(['new', 'renewal']),
		}),
		insuranceCompany: z
			.object(
				{
					label: z.string(),
					value: z.uuidv7('Seguradora inválida'),
				},
				'Seguradora inválida',
			)
			.nullish(),
		expiration: z
			.string()
			.refine(isDateString, 'Vigência inválida')
			.transform((value) => {
				const splits = value.split('/').flatMap((value) => Number(value));

				const day = splits[0];
				const month = splits[1] - 1;
				const year = splits[2];

				return new Date(year, month, day);
			})
			.refine(
				(value) => startOfDay(new Date()) < startOfDay(value),
				'Vigência não pode ser retroativa',
			)
			.nullish(),
		franchise: z.coerce.number('Frânquia inválido').nullish(),
	})
	.transform((props) => ({ ...props, use: props.use.value }))
	.transform(
		({
			plate,
			renewal,
			insuranceCompany,
			expiration,
			franchise,
			...props
		}) => ({
			...props,
			...(props.vehicleWithLicensePlate && {
				plate,
			}),
			...(renewal.value === 'renewal' && {
				renewal: true,
				insuranceCompany,
				expiration,
				franchise,
			}),
		}),
	)
	.superRefine((values, ctx) => {
		if (values.vehicleWithLicensePlate) {
			if (!values.plate) {
				ctx.addIssue({
					code: 'custom',
					path: ['plate'],
					message: 'Placa inválida',
				});
			}
		}

		if (values.renewal) {
			if (!values.insuranceCompany) {
				ctx.addIssue({
					code: 'custom',
					path: ['insuranceCompany'],
					message: 'Seguradora inválida',
				});
			}

			if (!values.expiration) {
				ctx.addIssue({
					code: 'custom',
					path: ['expiration'],
					message: 'Vigência inválida',
				});
			}
		}

		return z.NEVER;
	});

function RequestQuote() {
	const [openDialog, setOpenDialog] = useState<boolean>(false);

	const { back, replace: _replace } = useRouter();

	const { width } = useWindowDimensions();

	const {
		control,
		watch,
		formState: { isValid, isDirty },
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(Schema),
		defaultValues: {
			vehicleWithLicensePlate: true,
		},
	});

	const vehicleWithLicensePlate = watch('vehicleWithLicensePlate');

	const isRenewal = watch('renewal');

	function onSubmit() {}

	return (
		<ScrollView>
			<View className='pt-4 pb-6 px-4 gap-6'>
				<View className='gap-y-5'>
					<View className='gap-y-2'>
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
										value={field.value || ''}
										onChangeText={(value) =>
											field.onChange(
												value ? maskPlate(value.toUpperCase()) : null,
											)
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
									onChangeText={(value) =>
										field.onChange(maskPostalCode(value))
									}
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
					<Label
						title='Dados do Segurado'
						icon={{
							ios: 'person.fill',
							android: 'car_crash',
						}}
					/>
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
					<Controller
						control={control}
						name='renewal'
						render={({ field }) => (
							<Select {...field} onValueChange={field.onChange}>
								<SelectTrigger label='Tipo de Cotação'>
									<SelectValue placeholder='Selecionar' />
								</SelectTrigger>
								<SelectContent style={{ width: width - 32 }}>
									<SelectItem value='new' label='SEGURO NOVO' />
									<SelectItem value='renewal' label='RENOVAÇÃO' />
								</SelectContent>
							</Select>
						)}
					/>
					{isRenewal?.value === 'renewal' && (
						<Fragment>
							<Controller
								control={control}
								name='insuranceCompany'
								render={({ field, fieldState }) => (
									<View>
										<Select
											{...field}
											value={field.value || undefined}
											onValueChange={field.onChange}
										>
											<SelectTrigger label='Seguradora'>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
											<SelectContent style={{ width: width - 32 }}>
												<SelectItem
													value='019cdf6d-39b1-79b4-a679-7d872ebafc34'
													label='PORTO SEGURO'
													image='https://play-lh.googleusercontent.com/o2LsthtON1hku1FRjca4YzKbJJuJucWY6Y-WbiVnsTkiHJXN-Dt6Lvd-cE9BpCgE6Cw'
												/>
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
								name='expiration'
								render={({ field, fieldState }) => (
									<View>
										<Input
											{...field}
											value={field.value || undefined}
											onChangeText={(value) =>
												field.onChange(maskDateString(value))
											}
											label='Vigência'
											placeholder='00/00/0000'
											keyboardAppearance='dark'
											maxLength={10}
										/>
										{fieldState.error?.message && (
											<InputError>{fieldState.error.message}</InputError>
										)}
									</View>
								)}
							/>
							<Controller
								control={control}
								name='franchise'
								render={({ field, fieldState }) => (
									<View>
										{/* @ts-ignore */}
										<CurrencyInput
											{...field}
											onChangeValue={(value) =>
												field.onChange(value ? value : null)
											}
											renderTextInput={(props) => (
												<Input
													{...props}
													label='Frânquia ( Opcional )'
													placeholder='R$ 0.000,00'
													keyboardAppearance='dark'
													maxLength={11}
												/>
											)}
											prefix='R$ '
											delimiter='.'
											separator=','
											precision={2}
											minValue={0}
										/>
										{fieldState.error?.message && (
											<InputError>{fieldState.error.message}</InputError>
										)}
									</View>
								)}
							/>
						</Fragment>
					)}
				</View>
				<Button
					size='lg'
					className='h-[3.25rem] flex-row items-center'
					onPress={onSubmit}
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
			<Dialog open={openDialog} onOpenChange={setOpenDialog}>
				<DialogContent showClose={false}>
					<DialogHeader className='gap-1'>
						<DialogTitle className='text-xl text-center font-bold leading-none'>
							Cotação enviada com sucesso!
						</DialogTitle>
						<DialogDescription className='text-sm font-semibold text-center leading-none px-6 text-gray-500'>
							O seguro que você enviou está vigente e foi adicionado ao
							aplicativo.
						</DialogDescription>
						<View className=' items-center justify-center my-4'>
							<Svg width={100} height={100} viewBox='0 0 76 76' fill='none'>
								<Path
									d='M69.6666 35.1046V38.018C69.6628 44.8466 67.4516 51.4912 63.3628 56.9603C59.2743 62.4298 53.5271 66.4309 46.9787 68.367C40.4301 70.3031 33.4314 70.0707 27.0258 67.7042C20.6203 65.3378 15.1514 60.964 11.4347 55.2355C7.71799 49.507 5.95264 42.7303 6.40196 35.9163C6.85125 29.1025 9.49114 22.6164 13.9279 17.4255C18.3646 12.2345 24.3605 8.61677 31.0212 7.11185C37.682 5.60692 44.6509 6.29545 50.8883 9.0747M69.6666 12.6666L38 44.3649L28.5 34.8649'
									stroke='#00B10F'
									strokeWidth={5}
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</Svg>
						</View>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='text-sm font-semibold text-center leading-none px-6 text-gray-500'
						>
							Agora ele fica armazenado aqui para facilitar o seu acesso sempre
							que precisar.
						</Text>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='text-sm font-semibold text-center leading-none px-6 text-gray-500 mt-4'
						>
							Você pode consultar todos os detalhes e informações importantes a
							qualquer momento na página{' '}
							<Text
								allowFontScaling={false}
								accessible={false}
								className='font-extrabold text-primary'
							>
								Meus Seguros
							</Text>
							.
						</Text>
						<View className='mt-4 gap-y-2'>
							<Button
								variant='outline'
								className='border-primary'
								onPress={back}
							>
								<Text
									allowFontScaling={false}
									accessible={false}
									className='text-sm leading-tight font-semibold text-primary'
								>
									FECHAR
								</Text>
							</Button>
							<Button
								className='border-primary'
								// onPress={() => replace('/(stacks)/insurances')}
							>
								<Text
									allowFontScaling={false}
									accessible={false}
									className='text-sm leading-tight font-semibold text-white'
								>
									VER MEUS SEGUROS
								</Text>
							</Button>
						</View>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</ScrollView>
	);
}

export default RequestQuote;
