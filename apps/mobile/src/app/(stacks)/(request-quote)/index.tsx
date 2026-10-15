import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { type Href, Link, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { cloneElement, Fragment, useState } from 'react';
import {
	Pressable,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { Button } from '@/components/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { isCompany } from '@/configs/consts/company';
import { Header } from '@/containers/header';
import { cn } from '@/libraries/classname';

const insurances: Array<{
	id: number;
	label: string;
	items?: Array<{
		id: string;
		label: string;
	}>;
	icon: (
		props:
			| React.ComponentProps<typeof FontAwesome5>
			| React.ComponentProps<typeof Feather>,
	) =>
		| React.ComponentProps<typeof FontAwesome5>
		| React.ComponentProps<typeof Feather>;
	screen: Href;
	content?: React.JSX.Element;
}> = [
	{
		id: 1,
		label: 'seguro veicular',
		icon: (props) => <FontAwesome5 name='car' {...props} />,
		screen: '/(request-quote)/vehicle',
	},
	{
		id: 2,
		label: 'plano de saúde',
		icon: (props) => <FontAwesome5 name='heart' {...props} />,
		screen: '/(request-quote)/health',
		content: (
			<Text
				allowFontScaling={false}
				className='text-lg font-normal text-foreground'
			>
				Planos médicos e odontológicos que sua familia ou sua empresa necessita.
				{`\n\n`}
				Saúde é o nosso bem mais valioso, proteja-se.
				{`\n\n`}
				Ótimas soluções em plano de saúde para sua proteção com o melhor da
				medicina.
				{`\n\n`}
				<Text className='text-lg font-bold text-foreground uppercase'>
					coberturas:
				</Text>{' '}
				<Text
					className={cn(
						'text-sm font-medium text-primary',
						isCompany && 'text-primary-xcar',
					)}
				>
					( de acordo com o seu plano )
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Internações',
						'Cirurgias',
						'Consultas',
						'Parto',
						'Exames',
						'Psicológia',
						'Telemedicina',
						'Coberturas regionais e nacionais',
						'Reembolso',
					]}
				/>
			</Text>
		),
	},
	{
		id: 3,
		label: 'seguro residência',
		icon: (props) => <FontAwesome5 name='home' {...props} />,
		screen: '/(request-quote)/residence',
		content: (
			<Text allowFontScaling={false}>
				<Text className='text-lg font-normal text-foreground'>
					A residência é um dos bens mais valioso que temos.
					{`\n\n`}O seguro residencial existe para cobrir prejuízos que poderiam
					facilmente destruir nossas finanças e custa até 4x menos que o seguro
					do seu carro.
					{`\n\n`}
				</Text>
				<Text className='text-lg font-bold text-foreground uppercase'>
					coberturas:
				</Text>{' '}
				<Text
					className={cn(
						'text-sm font-medium text-primary',
						isCompany && 'text-primary-xcar',
					)}
				>
					( de acordo com o seu plano )
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Incêndio',
						'Danos elétricos',
						'Queda de raio',
						'Explosão de qualquer natureza',
						'Fumaça',
						'Roubo e furto qualificado de bens',
						'Impacto de veículos',
						'Vendaval, furacão, ciclone, granizo e tornado',
						'Responsabilidade civil familiar',
						'Perda e pagamento de aluguel',
						'Roubo e furto qualificado de bens fora do local segurado',
						'Quebra de vidros, mármore e granito',
						'Desmoronamento',
						'Danos por água',
						'Tumultos, greve e lock-outs',
						'Despesas extraordinárias',
						'Jóias e obra de arte',
					]}
				/>
				{`\n\n`}
				<Text className='text-lg font-bold text-foreground uppercase'>
					assistência:
				</Text>{' '}
				<Text
					className={cn(
						'text-sm font-medium text-primary',
						isCompany && 'text-primary-xcar',
					)}
				>
					( de acordo com o seu plano )
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Chaveiro',
						'Cobertura provisória de telhado',
						'Conserto de aquecedor de gás',
						'Conserto de ar condicionado',
						'Conserto de eletrodomésticos',
						'Dedetização',
						'Hidráulica',
						'Hospedagem',
						'Limpeza',
						'Recuperação de veículo',
						'Reparos elétricos',
						'Retorno antecipado ao domicílio',
						'Substituição de telhas',
						'Transporte e guarda móveis',
						'Vidraceiro',
						'Vigilância e segurança',
					]}
				/>
			</Text>
		),
	},
	{
		id: 4,
		label: 'seguro empresarial',
		icon: (props) => <FontAwesome5 name='building' {...props} />,
		screen: '/(request-quote)/business',
		content: (
			<Text allowFontScaling={false}>
				<Text className='text-lg font-normal text-foreground'>
					O seguro empresarial foi feito para você empresário , que possui uma
					pequena, média ou grande empresa, seja comércio, serviço ou indústria.
					{`\n\n`}
					Sua empresa não precisa correr riscos que podem levar ao encerramento
					de suas atividades e das suas receitas.
					{`\n\n`}
				</Text>
				<Text className='text-lg font-bold text-foreground uppercase'>
					coberturas:
				</Text>{' '}
				<Text
					className={cn(
						'text-sm font-medium text-primary',
						isCompany && 'text-primary-xcar',
					)}
				>
					( de acordo com o seu plano )
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Incêndio',
						'Danos elétricos',
						'Perda de lucro bruto',
						'Despesas fixas',
						'Quebra de máquinas e equipamentos',
						'Alagamento',
						'Vendaval, furacão, ciclone, granizo e tornado',
						'Roubo',
						'Quebra de vidros, mármore e granito',
					]}
				/>
				{`\n\n`}
				<Text className='text-lg font-bold text-foreground uppercase'>
					assistência:
				</Text>{' '}
				<Text
					className={cn(
						'text-sm font-medium text-primary',
						isCompany && 'text-primary-xcar',
					)}
				>
					( de acordo com o seu plano )
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Substituição de telhas',
						'Cobertura provisória de telhado',
						'Manutenção de portas e portões',
						'Reparos elétricos',
						'Reparos hidraúlicos',
						`Reparo de central telefônica, interfone e\nporteiro eletrônico`,
						'Troca de vidros',
						'Limpeza',
						'Limpeza de caixa d`àgua',
						'Serviço de desintetização e desratização',
						'Abertura de porta',
						'Conserto de ar condicionado',
						'Conserto de eletrodomésticos',
						'Instalação de fechadura tetra',
						'Troca de fechadura simples',
						'Locação de microcomputadores e impressoras',
						'Porteiro substituto',
						'Escritório provisório',
						'Transporte e guarda móveis',
						'Vigilância/segurança',
						'Checkup empresarial',
						'Instalação de luzes de mergência',
						'Instalação de antiderrapantes',
						'Limpeza de ar condicionado',
						'Verificação de extintores',
					]}
				/>
			</Text>
		),
	},
	{
		id: 5,
		label: 'seguro condomínio',
		icon: (props) => <FontAwesome5 name='building' {...props} />,
		screen: '/(request-quote)/condominium',
		content: (
			<Text allowFontScaling={false}>
				<Text className='text-lg font-bold text-foreground uppercase'>
					seguro obrigatório:
				</Text>
				{`\n`}
				<Text className='text-lg font-normal text-foreground'>
					De acordo com o artigo 1346 do{' '}
					<Text className='underline'>Código Civil de 1964</Text>.{`\n\n`}
					Vale salientar que o seguro condomínio protege as áreas comuns do
					condomínio e não as residências.
					{`\n\n`}O seguro residencial protege a sua residência e o que há nela,
					não é obrigatório e deve ser contratado pelo proprietário ou inquilino
					do imóvel.
					{`\n\n`}
				</Text>
				<Text className='text-lg font-bold text-foreground uppercase'>
					coberturas obrigatórias:
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Incêndio',
						'Explosão de qualquer natureza',
						'Queda de raio e de aeronaves',
					]}
				/>
				{`\n\n`}
				<Text className='text-lg font-bold text-foreground uppercase'>
					coberturas:
				</Text>{' '}
				<Text
					className={cn(
						'text-sm font-medium text-primary',
						isCompany && 'text-primary-xcar',
					)}
				>
					( de acordo com o seu plano )
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Danos elétricos',
						'Desmoranamento',
						'Roubo de bens do condomínio',
						'Impacto de veículos',
						'Vendaval',
						'Vazamento de tanques',
						'Responsabilidade civil do síndico',
						'Responsabilidade civil do condomínio',
					]}
				/>
				{`\n\n`}
				<Text className='text-lg font-bold text-foreground uppercase'>
					observação:
				</Text>
				{`\n`}
				<Text className='text-lg font-normal text-foreground'>
					Na renovação do seu seguro atualize as coberturas e valores.
				</Text>
			</Text>
		),
	},
	{
		id: 6,
		label: 'seguro viagem',
		icon: (props) => <FontAwesome5 name='plane' {...props} />,
		screen: '/(request-quote)/travel',
		content: (
			<Text
				allowFontScaling={false}
				className='text-lg font-normal text-foreground'
			>
				Acidente em viagem, nacional ou internacional a trabalho ou férias, o
				importante é ter o risco coberto com uma proteção que{' '}
				<Text className='font-bold'>CUSTA POUCO</Text> e garante imprevistos que
				podem ter um valor muito elevado como:
				{`\n\n`}
				<Text className='text-lg font-bold text-foreground uppercase'>
					coberturas:
				</Text>{' '}
				<Text
					className={cn(
						'text-sm font-medium text-primary',
						isCompany && 'text-primary-xcar',
					)}
				>
					( de acordo com o seu plano )
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Despesas médicas e hospitalares (DMH)',
						'Translado médico',
						'Translado de corpo',
						'Regresso sanitário',
						'Morte acidental',
						'Extrávio de bagagem',
						`Invalidez permanente total ou parcial por\nacidente`,
						'Assistência funeral',
						'Entre outras...',
					]}
				/>
			</Text>
		),
	},
	{
		id: 7,
		label: 'RC Profissional',
		items: [
			{
				id: 'attorney',
				label: 'advogado',
			},
			{
				id: 'healthcare',
				label: 'profissional de saúde',
			},
			{
				id: 'counter',
				label: 'contador',
			},
			{
				id: 'architect_engineer',
				label: 'arquiteto / engenheiro',
			},
			{
				id: 'administrator',
				label: 'administrador',
			},
			{
				id: 'others',
				label: 'outras profissões',
			},
		],
		icon: (props) => <FontAwesome5 name='user-tie' {...props} />,
		screen: '/(request-quote)/professional',
		content: (
			<Text
				allowFontScaling={false}
				className='text-lg font-normal text-foreground'
			>
				<Text>
					<Text className='text-lg font-bold text-foreground uppercase'>
						Artigo 927 do código civil brasileiro
					</Text>
					{`\n`}
					<Text className='text-lg font-normal text-foreground'>
						"Haverá obrigação de reparar o dano independente da culpa."
					</Text>
				</Text>
				{`\n\n`}O produto de{' '}
				<Text className='font-bold'>
					Seguro de Responsabilidade Civil Profissional
				</Text>{' '}
				foi desenvolvido para profissionais de diversas áreas e seu objetivo é{' '}
				<Text className='font-bold'>
					protegê-los diante de reclamações de terceiros
				</Text>{' '}
				decorrentes de alegadas falhas profissionais por erros ou omissões.
				{`\n\n`}
				<Text className='text-lg font-bold text-foreground uppercase'>
					principais coberturas:
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Danos morais',
						'Custo de comparecimento a tribunais',
						'Custo de restituição de imagem',
						'Responsabilidade solidária',
						'Propriedade intelectual',
						'Extravio, roubo ou furto de documentos',
					]}
				/>
			</Text>
		),
	},
	{
		id: 8,
		label: 'RC Obras e Reformas',
		icon: (props) => <FontAwesome5 name='wrench' {...props} />,
		screen: '/(request-quote)/construction',
		content: (
			<Text
				allowFontScaling={false}
				className='text-lg font-normal text-foreground'
			>
				O{' '}
				<Text className='font-bold'>
					Seguro de Responsabilidade Civil Obras e Reformas
				</Text>{' '}
				pode ser contratado por empresas incorporadoras, construtoras,
				empreiteiras, proprietários ( pessoa física ou jurídica ).
				{`\n\n`}O{' '}
				<Text className='font-bold'>
					Seguro de Responsabilidade Civil Obras e Reformas
				</Text>{' '}
				serve para reparação de um malefício causado a outra pessoa ou
				organização, e para proteção de maquinários e equipamentos.
				{`\n\n`}
				Isso significa que ele tem a finalidade de ajudar o segurado, caso ele
				seja responsabilizado judicialmente por algum fato ocorrido na
				realização de sua obra ou reforma, protegendo também equipamentos e
				máquinas pertinentes a obra.
				{`\n\n`}
				<Text className='text-lg font-bold text-foreground uppercase'>
					principais coberturas:
				</Text>
				{`\n`}
				<ListUL
					data={[
						'Danos morais e estéticos',
						'Erro de projeto',
						'Danos materiais causados ao proprietário da obra',
						'Poluição, Contaminação e/ou Vazamento Súbitos',
						'Equipamentos moveis e estacionários',
					]}
				/>
			</Text>
		),
	},
];

function ListUL({ data = [] }: { data: string[] }) {
	return (
		<View
			style={{
				flexDirection: 'column',
			}}
		>
			{data?.map((item, index) => (
				<View
					key={index.toString()}
					style={{
						flexDirection: 'row',
						alignItems: 'flex-start',
						justifyContent: 'flex-start',
					}}
				>
					<View
						style={{
							width: 16,
						}}
					>
						<Text allowFontScaling={false} className='text-foreground text-lg'>
							-
						</Text>
					</View>
					<Text allowFontScaling={false} className='text-foreground text-lg'>
						{item}
					</Text>
				</View>
			))}
		</View>
	);
}

function Item({
	content,
	isBlock = false,
	children,
	isCollapsible = false,
	contentCollapsible: CollapsibleItems,
	href,
	title,
}: React.PropsWithChildren<{
	content?: React.JSX.Element;
	isBlock?: boolean;
	isCollapsible?: boolean;
	contentCollapsible?: () => React.JSX.Element | null;
	href?: Href;
	title: string;
}>) {
	const [open, setOpen] = useState<boolean>(false);
	const [isOpenCollapsible, setIsOpenCollapsible] = useState(false);

	function toggleCollapsible() {
		setIsOpenCollapsible(!isOpenCollapsible);
	}

	if (content && !isBlock) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{children}</DialogTrigger>
				<DialogContent
					showClose={false}
					className='w-screen h-full px-0 pt-0 pb-safe border-0 mb-0'
				>
					{/* @ts-expect-error */}
					<Header
						options={{
							title,
						}}
						titlePosition='center'
						showReturn
						returnCallback={() => setOpen(false)}
					/>
					<ScrollView
						showsVerticalScrollIndicator={false}
						className='px-6 -mt-4'
					>
						{href && (
							<View className='-mx-6'>
								<Link href={href} asChild className='my-4 mx-5'>
									<DialogClose asChild>
										<Button className='h-fit'>
											<Text className='text-white text-base font-bold uppercase'>
												fazer uma cotação
											</Text>
											<SymbolView
												name={{
													ios: 'paperplane',
													android: 'send',
												}}
												size={20}
												tintColor='white'
											/>
										</Button>
									</DialogClose>
								</Link>
								<Separator className='mb-4' />
							</View>
						)}
						<Pressable>{content}</Pressable>
					</ScrollView>
				</DialogContent>
			</Dialog>
		);
	}

	if (isCollapsible) {
		return (
			<Collapsible open={isOpenCollapsible} onOpenChange={setIsOpenCollapsible}>
				<CollapsibleTrigger>
					{cloneElement(
						children as React.ReactElement<{ onPress: () => void }>,
						{ onPress: toggleCollapsible },
					)}
				</CollapsibleTrigger>
				<CollapsibleContent>
					{CollapsibleItems && <CollapsibleItems />}
				</CollapsibleContent>
			</Collapsible>
		);
	}

	return children;
}

function RequestQuote() {
	const { colors } = useTheme();

	const { push } = useRouter();

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<View className='px-2 bg-white border border-border rounded-sm m-4'>
				{insurances.map(({ icon: Icon, ...item }, index) => (
					<Fragment key={index.toString()}>
						<View className='mb-0 p-0'>
							<Item
								title={item.label}
								href={item.screen}
								content={item.content}
								isBlock={!!item.items?.length}
								isCollapsible={!!item.items?.length}
								contentCollapsible={() => {
									if (item.items?.length) {
										return (
											<View className='gap-y-2'>
												{item.items?.map((item1, index) => (
													<View
														key={index.toString()}
														className='bg-border rounded-sm p-2 border border-border'
													>
														<Item
															title={item1.label}
															content={item.content}
															href={item.screen}
														>
															<Text className='text-foreground text-lg font-medium uppercase w-full'>
																{item1.label}
															</Text>
														</Item>
													</View>
												))}
											</View>
										);
									}

									return null;
								}}
							>
								<TouchableOpacity
									className='p-2 flex-row items-center justify-between'
									onPress={() => {
										if (!item.content) {
											return push(item.screen);
										}
									}}
								>
									<View className='flex-row items-center justify-start gap-3'>
										<View
											className={cn(
												'size-12 items-center justify-center bg-primary rounded-full',
												isCompany && 'bg-primary-xcar',
											)}
										>
											<Icon size={24} color='#FFFFFF' />
										</View>
										<Text className='text-foreground text-lg font-bold uppercase'>
											{item.label}
										</Text>
									</View>
									<Feather
										name='chevron-right'
										color={colors.primary}
										size={30}
									/>
								</TouchableOpacity>
							</Item>
						</View>
						<Separator />
					</Fragment>
				))}
			</View>
			<View className='h-32' />
		</ScrollView>
	);
}

export default RequestQuote;
