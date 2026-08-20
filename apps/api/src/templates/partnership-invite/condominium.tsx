import {
	Body,
	Column,
	Container,
	Font,
	Head,
	Heading,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from 'react-email';

const tailwindConfig = {
	theme: {
		extend: {
			colors: {
				primary: '#09090b',
				primaryDark: '#FF6900',
				surface: '#F4F6FB',
				muted: '#6B7280',
			},
		},
	},
};

const LOGO_WHITE = `https://cdn.segwise.com.br/images-public/Group%2077.svg`;

const partnerInsurers = [
	{
		name: 'porto seguro',
		logo: 'https://seguros.ababas.com.br/wp-content/uploads/2023/05/porto-seguro-logo-1024x306.png',
	},
	{
		name: 'allianz',
		logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-QN2R1vV-4DFVXc4G20kUF11Rsocijhji7WDsk1vNLg&s=10',
	},
	{
		name: 'tokio marine',
		logo: 'https://brinfinite.com.br/wp-content/uploads/2022/11/logo-tokio-marine-seguradora-1024-copia.png',
	},
	{
		name: 'mapfre',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mapfre_logo.svg/500px-Mapfre_logo.svg.png?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=thumbnail',
	},
	{
		name: 'azul',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Logotipo_da_Azul_Seguros.svg?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=original',
	},
	{
		name: 'bradesco seguros',
		logo: 'https://www.seguroauto.org/wp-content/themes/SA2023/images/logo_seguradora_bradesco_seguro.webp',
	},
	{
		name: 'hdi',
		logo: 'https://vamosescrever.com.br/assets/img/clients/hdi.png',
	},
	{
		name: 'itaú seguros',
		logo: 'https://vectorseek.com/wp-content/uploads/2023/09/Itau-Seguros-Logo-Vector.svg-.png',
	},
	{
		name: 'yelum',
		logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXpFdG03G9WEJl1azWKr9g_PrxNhlo6LbN7jNE7_3kBbFXXHn8WhjbOUA&s=10',
	},
	{
		name: 'suhai',
		logo: 'https://seguros.ababas.com.br/wp-content/uploads/2023/05/suhai.png',
	},
	{
		name: 'ezze seguros',
		logo: 'https://mo4web.com.br/wp-content/uploads/2025/06/B.png',
	},
	{
		name: 'aliro seguro',
		logo: 'https://cdn.dealerspace.ai/lider/aquila-seguros/conteudo-online/seguradoras/aliro-seguro.png',
	},
	{
		name: 'mitsui sumitomo',
		logo: 'https://neonseguros.com.br/wp-content/uploads/2024/06/Logo-Mitsui-Sumitomo.png',
	},
	{
		name: 'novo seguros',
		logo: 'https://www.gruporesenderibeiro.com.br/logos/novo-seguros.png',
	},
	{
		name: 'usebens',
		logo: 'https://parceiro.usebens.com.br/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-usebens-login-filled.de22e6d8.png&w=750&q=75',
	},
	{
		name: 'justos seguros',
		logo: 'https://cdn.prod.website-files.com/63bdbbd2c764e85f370a866e/65b0678c2788500d8aaf36ee_justons-new-black.svg',
	},
];

function InsurerLogoGrid() {
	const rows: (typeof partnerInsurers)[number][][] = [];

	for (let i = 0; i < partnerInsurers.length; i += 4) {
		rows.push(partnerInsurers.slice(i, i + 4));
	}

	return (
		<>
			{rows.map((row, rowIndex) => (
				<Row key={rowIndex.toString()} className="mb-3">
					{row.map((insurer) => (
						<Column key={insurer.name} align="center" className="px-1">
							<div className="bg-white border border-solid border-[#E5E7EB] rounded-lg py-3 px-2 text-center">
								<Img
									src={insurer.logo}
									alt={insurer.name}
									width={72}
									height={28}
									className="mx-auto object-contain"
								/>
							</div>
						</Column>
					))}
					{row.length < 4 &&
						Array.from({ length: 4 - row.length }).map((_, idx) => (
							<Column key={`empty-${idx.toString()}`} className="px-1" />
						))}
				</Row>
			))}
		</>
	);
}

function TemplatePartnershipInviteCondominium({
	leadId,
}: {
	leadId?: string;
} = {}) {
	const urlMessage = new URL('https://segwise.com.br/nova-parceria');

	if (leadId) {
		urlMessage.searchParams.set('leadId', leadId);
	}

	return (
		<Html>
			<Head>
				<Font
					fontFamily="Inter"
					fallbackFontFamily="Arial"
					webFont={{
						url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
						format: 'woff2',
					}}
					fontWeight={400}
					fontStyle="normal"
				/>
			</Head>
			<Preview>
				Parceria comercial - Administradora de condomínio e a SEGWISE / XCAR
				CORRETORA DE SEGUROS
			</Preview>
			<Tailwind config={tailwindConfig}>
				<Body className="bg-surface font-sans">
					<Container className="mx-auto my-0 max-w-[600px]">
						<Section className="bg-primary rounded-t-lg py-6 px-8">
							<Row>
								<Column>
									<Img
										src={LOGO_WHITE}
										alt="SEGWISE / XCAR CORRETORA DE SEGUROS"
										width={140}
										height={32}
									/>
								</Column>
							</Row>
						</Section>
						<Section className="bg-white px-8 py-8">
							<Heading className="text-[18px] font-bold text-[#111827] m-0 mb-1 text-center">
								Parceria comercial
							</Heading>
							<Heading className="text-[16px] font-bold text-[#111827] m-0 mb-1 text-center">
								Administradora de condomínio
							</Heading>
							<Heading className="text-[16px] font-bold text-[#111827] m-0 mb-4 text-center">
								SEGWISE / XCAR CORRETORA DE SEGUROS
							</Heading>
							<Text className="text-[14px] leading-[22px] text-[#374151] m-0 mb-4">
								Somos da SEGWISE / XCAR CORRETORA DE SEGUROS, empresa com mais
								de doze anos no mercado segurador, me chamo Fernando Sena, e
								gostaria de convidar você para uma ação conjunta na proteção
								financeira e tranquilidade dos condôminos diante de imprevistos
								dos edifícios sob sua Gestão.
							</Text>
							<Text className="text-[14px] leading-[22px] text-[#374151] m-0 mb-4">
								Com o programa – Gestão + Proteção , você levará descontos,
								conhecimento e benefícios aos condôminos sem qualquer custo
								nesta operação.
							</Text>
							<Text className="text-[14px] leading-[22px] text-[#374151] m-0 mb-4">
								Abaixo nossa proposta:
							</Text>
							<Section className="bg-surface rounded-lg p-6 mb-5">
								<Text className="text-[14px] font-bold text-[#111827] m-0 mb-3">
									BENEFÍCIOS PARA SUA EMPRESA
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									Comissionamento de ____% do ganho da corretora decorrente da
									indicação de condôminos que resulte na efetiva contratação de
									seguros através da indicação
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									Comissionamento vitalício, mesmo que o CONDÔMINO deixe seu
									escritório, por qualquer motivo, você continua sendo o
									beneficiário do comissionamento enquanto este cliente estiver
									segurado na segwise / xcar corretora de seguros
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									O cliente , mesmo que no primeiro momento não faça adesão ao
									seguro, continuaremos com as ofertas de seguros com preços
									promocionais, e a qualquer época que ele faça a adesão a
									administradora continua com o direito ao comissionamento
									vitalício de ___% sobre o ganho trazido a corretora.
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									A administradora do condomínio receberá todo apoio necessário
									a divulgação da parceria, não haverá custos , apenas ganhos
									advindos dos seguros adquiridos pelos clientes da
									administradora.
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									Demonstrativo, em tempo real das adesões ao aplicativo
									disponibilizado aos condôminos. Obs. Uma vez sendo cadastrado
									em nome da administradora, este cadastro sempre será lingado a
									administradora que o originou, mesmo não havendo mais vinculo.
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0">
									Levar benefícios com parcerias que gerem diminuição de custos
									para os condôminos e aumento de receita para a administradora.
								</Text>
							</Section>
							<Section className="bg-surface rounded-lg p-6 mb-5">
								<Text className="text-[14px] font-bold text-[#111827] m-0 mb-3">
									BENEFÍCIOS PARA AOS CONDÔMINOS
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									Acesso ao aplicativo segwise
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									Um aplicativo verdadeiramente relevante, funcionando como um
									assistente de bolso, centralizando serviços e informações
									essenciais como os descritos abaixo:
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									- Desconto exclusivo na aquisição ou renovação de seguros
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									- Orçamentos grátis e sem compromisso
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									- Saber que ação tomar em cada tipo de sinistro
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0">
									- Como agir, para onde ligar, o que fazer e se houver vítima ?
								</Text>
							</Section>
							<Text className="text-[14px] font-bold text-[#111827] m-0 mb-1 text-center">
								VOCÊS TERIAM 15 MINUTOS PARA:
							</Text>
							<Text className="text-[14px] leading-[21px] text-[#374151] m-0 mb-1 text-center">
								BATERMOS UM PAPO RÁPIDO
							</Text>
							<Text className="text-[14px] leading-[21px] text-[#374151] m-0 mb-4 text-center">
								DEMONSTRAR A TRANSPARÊNCIA DO PROCESSO E DO PROGRAMA
							</Text>
							<Text className="text-[14px] leading-[21px] text-[#374151] m-0 mb-1">
								UM ABRAÇO
							</Text>
							<Text className="text-[14px] leading-[21px] text-[#374151] m-0 mb-1">
								FERNANDO LUIZ MALHEIROS DE SENA - SEGWISE / XCAR CORRETORA DE
								SEGUROS
							</Text>
							<Text className="text-[14px] leading-[21px] text-[#374151] m-0 mb-1">
								DIRETOR GERAL
							</Text>
							<Text className="text-[14px] leading-[21px] text-[#374151] m-0 mb-6">
								FONES: (81) 98696-1991 | 3229-1728
							</Text>
							<Section className="mt-3 mb-6">
								<InsurerLogoGrid />
							</Section>
							<Section className="bg-primary rounded-lg p-6 text-center">
								<Link
									href={urlMessage.toJSON()}
									className="bg-white text-primary text-[14px] font-bold rounded-md px-6 py-3 no-underline inline-block"
								>
									Agendar conversa
								</Link>
							</Section>
						</Section>
						<Section className="bg-primary rounded-b-lg px-8 py-6">
							<Text className="text-white text-[13px] font-bold m-0 mb-1">
								FERNANDO LUIZ MALHEIROS DE SENA
							</Text>
							<Text className="text-[#9CA3AF] text-[12px] m-0 mb-3">
								SEGWISE / XCAR CORRETORA DE SEGUROS - DIRETOR GERAL
							</Text>
							<Row>
								<Column>
									<Link
										href={urlMessage.toJSON()}
										className="text-[#D1D5DB] text-[12px] no-underline mr-4"
									>
										WhatsApp: (81) 98696-1991
									</Link>
								</Column>
								<Column>
									<Text className="text-[#D1D5DB] text-[12px] m-0">
										Telefone: 3229-1728
									</Text>
								</Column>
							</Row>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

export { TemplatePartnershipInviteCondominium };
