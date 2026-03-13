import IMAGE from '@/assets/images/image-request-code.png';
import { Button } from '@/components/ui/button';
import { Input, InputError } from '@/components/ui/input';
import { BottomSafe } from '@/containers/bottom-safe';
import { TopSafe } from '@/containers/top-safe';
import { store } from '@/libraries/store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import z from 'zod';

function RequestReferralScreen() {
	const { height } = useWindowDimensions();
	const { top, bottom } = useSafeAreaInsets();

	const { replace } = useRouter();

	const { control, handleSubmit } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(
			z.object({
				code: z
					.string('Código inválido')
					.min(5, 'Código inválido')
					.toLowerCase(),
			}),
		),
		defaultValues: {
			code: '',
		},
	});

	function onSubmit({ code }: { code: string }) {
		store.set('referral', code);

		replace('/(stacks)/request-quote?first-init=true');
	}

	return (
		<View>
			<TopSafe className='bg-transparent' />
			<KeyboardAwareScrollView
				bottomOffset={bottom}
				showsVerticalScrollIndicator={false}
			>
				<View
					style={{
						height: height - top - bottom,
					}}
				>
					<View>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='text-3xl font-extrabold text-center px-10 leading-none'
						>
							ATIVE SEU CÓDIGO DE DESCONTO
						</Text>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='text-base text-foreground/80 px-8 text-center leading-tight font-medium mt-4 mb-10'
						>
							Insira o código que você recebeu e garanta seu cashback
						</Text>
						<Image
							source={IMAGE}
							style={{
								width: 'auto',
								height: 220,
							}}
							contentFit='contain'
							contentPosition='center'
							priority='high'
							cachePolicy='memory-disk'
							allowDownscaling={false}
							accessible={false}
						/>
						<View className='px-6'>
							<Controller
								control={control}
								name='code'
								render={({ field, fieldState }) => (
									<View>
										<Input
											{...field}
											onChangeText={field.onChange}
											label='Código de Desconto'
											placeholder='Digite o código aqui'
											className='h-14 placeholder:text-lg placeholder:leading-tight'
											autoCapitalize='characters'
											autoComplete='off'
											autoCorrect={false}
											returnKeyLabel='Confirmar'
											returnKeyType='done'
											enablesReturnKeyAutomatically
											keyboardAppearance='dark'
											enterKeyHint='done'
											maxLength={10}
										/>
										{fieldState.error?.message && (
											<InputError>{fieldState.error.message}</InputError>
										)}
									</View>
								)}
							/>
							<Button
								variant='default'
								size='lg'
								className='w-full mt-4 h-14'
								onPress={handleSubmit(onSubmit)}
							>
								<Text
									allowFontScaling={false}
									accessible={false}
									className='text-white text-xl font-semibold'
								>
									INSERIR CÓDIGO
								</Text>
							</Button>
						</View>
					</View>
				</View>
			</KeyboardAwareScrollView>
			<BottomSafe className='bg-primary' />
		</View>
	);
}

export default RequestReferralScreen;
