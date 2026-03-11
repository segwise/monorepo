import LOGO from '@/assets/images/logo/segwise.png';
import BACKGROUND_MAP from '@/assets/images/splash-screen/background-map.png';
import { Image, ImageBackground } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Svg, {
	Circle,
	Defs,
	Ellipse,
	FeBlend,
	FeFlood,
	FeGaussianBlur,
	Filter,
	G,
	Rect,
} from 'react-native-svg';

function IndexScreen() {
	const { width, height } = useWindowDimensions();

	const { replace } = useRouter();

	const navigation = useCallback(() => {
		replace('/(stacks)/home');
	}, [replace]);

	useEffect(() => {
		setTimeout(() => {
			navigation();
		}, 3000);
	}, [navigation]);

	return (
		<View className='bg-primary size-full'>
			<ImageBackground
				source={BACKGROUND_MAP}
				contentFit='contain'
				contentPosition='center'
				style={{
					width,
					height,
				}}
				allowDownscaling={false}
				accessible={false}
			>
				<View className='flex flex-col items-center justify-between py-10 absolute inset-0 z-10 size-full'>
					<View />
					<Image
						source={LOGO}
						contentFit='contain'
						contentPosition='center'
						style={{
							width,
							height: width / 10,
						}}
						allowDownscaling={false}
						accessible={false}
					/>
					<Text
						allowFontScaling={false}
						className='text-base text-white text-center'
					>
						Todos os Direitos Reservados
					</Text>
				</View>
				<View className='size-full pt-16 absolute inset-0 z-0'>
					<Svg
						width={width}
						height={height}
						viewBox={`0 0 ${width} ${height}`}
						fill='none'
					>
						<Circle
							opacity='0.57'
							cx='216'
							cy='401'
							r='71.5'
							stroke='#FFFFFF'
						/>
						<Circle
							opacity='0.4'
							cx='216'
							cy='401'
							r='120.5'
							stroke='white'
							strokeOpacity='0.7'
						/>
						<G filter='url(#filter0_f_0_1)'>
							<Circle
								cx='216'
								cy='401'
								r='169.5'
								stroke='white'
								strokeOpacity='0.2'
							/>
						</G>
						<G filter='url(#filter1_f_0_1)'>
							<Circle
								cx='216'
								cy='401'
								r='228.5'
								stroke='white'
								strokeOpacity='0.2'
							/>
						</G>
						<G filter='url(#filter2_f_0_1)'>
							<Circle
								cx='215.5'
								cy='400.5'
								r='297'
								stroke='white'
								strokeOpacity='0.2'
							/>
						</G>
						<G opacity='0.85' filter='url(#filter3_f_0_1)'>
							<Rect
								x='-6'
								y='466'
								width='436'
								height='394'
								fill='black'
								fillOpacity='0.5'
							/>
						</G>
						<G filter='url(#filter4_f_0_1)'>
							<Ellipse
								cx='363.5'
								cy='-15.5'
								rx='180.5'
								ry='171.5'
								fill='#D3E1D0'
								fillOpacity='0.1'
							/>
						</G>
						<G filter='url(#filter5_f_0_1)'>
							<Circle
								cx='157'
								cy='1039'
								r='119'
								fill='#F0FFED'
								fillOpacity='0.1'
							/>
						</G>
						<G filter='url(#filter6_f_0_1)'>
							<Ellipse
								cx='98.5'
								cy='887.5'
								rx='180.5'
								ry='171.5'
								fill='#D3E1D0'
								fillOpacity='0.05'
							/>
						</G>
						<G filter='url(#filter7_f_0_1)'>
							<Ellipse
								cx='39'
								cy='893'
								rx='322'
								ry='306'
								fill='#D3E1D0'
								fillOpacity='0.05'
							/>
						</G>
						<Defs>
							<Filter
								id='filter0_f_0_1'
								x='42'
								y='227'
								width='348'
								height='348'
								filterUnits='userSpaceOnUse'
								color-interpolation-filters='sRGB'
							>
								<FeFlood floodOpacity='0' result='BackgroundImageFix' />
								<FeBlend
									mode='normal'
									in='SourceGraphic'
									in2='BackgroundImageFix'
									result='shape'
								/>
								<FeGaussianBlur
									stdDeviation='2'
									result='effect1_foregroundBlur_0_1'
								/>
							</Filter>
							<Filter
								id='filter1_f_0_1'
								x='-15'
								y='170'
								width='462'
								height='462'
								filterUnits='userSpaceOnUse'
								color-interpolation-filters='sRGB'
							>
								<FeFlood floodOpacity='0' result='BackgroundImageFix' />
								<FeBlend
									mode='normal'
									in='SourceGraphic'
									in2='BackgroundImageFix'
									result='shape'
								/>
								<FeGaussianBlur
									stdDeviation='1'
									result='effect1_foregroundBlur_0_1'
								/>
							</Filter>
							<Filter
								id='filter2_f_0_1'
								x='-86'
								y='99'
								width='603'
								height='603'
								filterUnits='userSpaceOnUse'
								color-interpolation-filters='sRGB'
							>
								<FeFlood floodOpacity='0' result='BackgroundImageFix' />
								<FeBlend
									mode='normal'
									in='SourceGraphic'
									in2='BackgroundImageFix'
									result='shape'
								/>
								<FeGaussianBlur
									stdDeviation='2'
									result='effect1_foregroundBlur_0_1'
								/>
							</Filter>
							<Filter
								id='filter3_f_0_1'
								x='-166'
								y='306'
								width='756'
								height='714'
								filterUnits='userSpaceOnUse'
								color-interpolation-filters='sRGB'
							>
								<FeFlood floodOpacity='0' result='BackgroundImageFix' />
								<FeBlend
									mode='normal'
									in='SourceGraphic'
									in2='BackgroundImageFix'
									result='shape'
								/>
								<FeGaussianBlur
									stdDeviation='80'
									result='effect1_foregroundBlur_0_1'
								/>
							</Filter>
							<Filter
								id='filter5_f_0_1'
								x='-162'
								y='720'
								width='638'
								height='638'
								filterUnits='userSpaceOnUse'
								color-interpolation-filters='sRGB'
							>
								<FeFlood floodOpacity='0' result='BackgroundImageFix' />
								<FeBlend
									mode='normal'
									in='SourceGraphic'
									in2='BackgroundImageFix'
									result='shape'
								/>
								<FeGaussianBlur
									stdDeviation='100'
									result='effect1_foregroundBlur_0_1'
								/>
							</Filter>
							<Filter
								id='filter6_f_0_1'
								x='-282'
								y='516'
								width='761'
								height='743'
								filterUnits='userSpaceOnUse'
								color-interpolation-filters='sRGB'
							>
								<FeFlood floodOpacity='0' result='BackgroundImageFix' />
								<FeBlend
									mode='normal'
									in='SourceGraphic'
									in2='BackgroundImageFix'
									result='shape'
								/>
								<FeGaussianBlur
									stdDeviation='100'
									result='effect1_foregroundBlur_0_1'
								/>
							</Filter>
							<Filter
								id='filter7_f_0_1'
								x='-583'
								y='287'
								width='1244'
								height='1212'
								filterUnits='userSpaceOnUse'
								color-interpolation-filters='sRGB'
							>
								<FeFlood floodOpacity='0' result='BackgroundImageFix' />
								<FeBlend
									mode='normal'
									in='SourceGraphic'
									in2='BackgroundImageFix'
									result='shape'
								/>
								<FeGaussianBlur
									stdDeviation='150'
									result='effect1_foregroundBlur_0_1'
								/>
							</Filter>
						</Defs>
					</Svg>
				</View>
			</ImageBackground>
		</View>
	);
}

export default IndexScreen;
