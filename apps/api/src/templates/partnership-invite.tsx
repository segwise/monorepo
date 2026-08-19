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

interface TemplatePartnershipInviteProps {
	scheduleMeetingUrl?: string;
}

function TemplatePartnershipInvite({
	scheduleMeetingUrl,
}: TemplatePartnershipInviteProps) {
	const previewText =
		'Parceria comercial - Escritório de Contabilidade e a XCAR Corretora de Seguros/Segwise';

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
			<Preview>{previewText}</Preview>
			<Tailwind config={tailwindConfig}>
				<Body className="bg-surface font-sans">
					<Container className="mx-auto my-0 max-w-[600px]">
						<Section className="bg-primary rounded-t-lg py-6 px-8">
							<Row>
								<Column>
									<Img
										src={LOGO_WHITE}
										alt="XCAR Corretora de Seguros/Segwise"
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
								Escritório de Contabilidade e a
							</Heading>
							<Heading className="text-[16px] font-bold text-[#111827] m-0 mb-4 text-center">
								XCAR CORRETORA DE SEGUROS/SEGWISE
							</Heading>
							<Text className="text-[14px] leading-[22px] text-[#374151] m-0 mb-4">
								Somos da XCAR CORRETORA DE SEGUROS/SEGWISE , empresa com mais de
								doze anos no mercado segurador, me chamo Fernando Sena, e
								gostaria de convidar você para uma ação conjunta na proteção
								financeira e na tranquilidade dos seus clientes diante de
								imprevistos.
							</Text>
							<Text className="text-[14px] leading-[22px] text-[#374151] m-0 mb-4">
								Com o programa – Contabilidade Estratégica e Proteção de Bens,
								Vida e Negócios, você levará descontos e benefícios aos seus
								clientes sem qualquer custo na operação.
							</Text>
							<Text className="text-[14px] leading-[22px] text-[#374151] m-0 mb-4">
								Abaixo nossa proposta:
							</Text>
							<Section className="bg-surface rounded-lg p-6 mb-5">
								<Text className="text-[14px] font-bold text-[#111827] m-0 mb-3">
									BENEFÍCIOS PARA SUA EMPRESA
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									· Comissionamento de 10% sobre o ganho da corretora sobre os
									produtos adquiridos através da indicação do escritório de
									contabilidade
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									· Comissionamento vitalício, mesmo que o empresário deixe seu
									escritório, por qualquer motivo, você continua sendo o
									beneficiário do comissionamento enquanto este cliente estiver
									segurado na XCAR CORRETORA DE SEGUROS/SEGWISE
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									· O cliente , mesmo que no primeiro momento não faça adesão ao
									seguro, continuaremos com as ofertas de seguros com preços
									promocionais, e a qualquer época que ele faça a adesão o
									escritório continua com o direiro ao comissionamento vitalício
									de 10% sobre o ganho trazido a corretora.
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									· O escritório de contabilidade receberá todo apoio necessário
									a divulgação da parceria, não haverá custos para o escritório,
									apenas ganhos advindos dos seguros adquiridos pelos clientes
									do escritório.
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									· Demonstrativo, em tempo real das adesões ao aplicativo
									disponibilizado aos clientes do escritório. Obs. Uma vez sendo
									cadastrado em nome do escritório, este cadastro sempre será
									lingado ao escritório que o originou, mesmo não havendo mais
									vinculo com este escritório
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0">
									· Levar benefícios aos clientes com parcerias que gerem
									diminuição de custos para a empresa.
								</Text>
							</Section>
							<Section className="bg-surface rounded-lg p-6 mb-5">
								<Text className="text-[14px] font-bold text-[#111827] m-0 mb-3">
									BENEFÍCIOS PARA SEUS CLIENTES
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									· Desconto exclusivo na aquisição ou renovação de seguros
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									· Orçamentos grátis e sem compromisso
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									· Acesso ao aplicativo segwise
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-3">
									Um aplicativo verdadeiramente relevante, funciona como um
									assistente de bolso, centralizando serviços e informações
									essenciais com suporte imediato para o motorista:
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									- Saber que ação tomar em cada tipo de sinistro
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									- Como agir, para onde ligar, o que fazer e se houver vítima ?
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									- Telefones das assistência para solicitar um reboque, abrir
									um sinistro, substituição de vidros
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									- Orientações sobre temas como: Principal Condutor, CEP de
									pernoite, Cobertura para condutores entre 18 a 25 anos de
									idade, deveres do segurado, recusa da apólice.......
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0 mb-1">
									- Consulta veicular – na compra de um veículo informações
									sobre: VALOR MÉDIO DA FIPE – MULTAS – GRAVAMES – INFRAÇÕES –
									DÉDITOS – IPVA – LICENCIAMENTOS – DPVAT – ROUBO – SINISTROS
								</Text>
								<Text className="text-[14px] leading-[21px] text-[#1F2937] m-0">
									- Plataforma gratuita para compra e venda de veículos com
									maior segurança, apenas clientes XCAR CORRETORA DE
									SEGUROS/SEGWISE terão acesso a inclusão e visitação aos
									anúncios
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
								FERNANDO LUIZ MALHEIROS DE SENA - XCAR CORRETORA DE
								SEGUROS/SEGWISE
							</Text>
							<Text className="text-[14px] leading-[21px] text-[#374151] m-0 mb-1">
								DIRETOR GERAL
							</Text>
							<Text className="text-[14px] leading-[21px] text-[#374151] m-0 mb-6">
								FONES: (81) 98696-1991 | 3229-1728
							</Text>
							<Section className="mb-6">
								<InsurerLogoGrid />
							</Section>
							<Section className="bg-primary rounded-lg p-6 text-center">
								<Link
									href={scheduleMeetingUrl}
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
								XCAR CORRETORA DE SEGUROS/SEGWISE - DIRETOR GERAL
							</Text>
							<Row>
								<Column>
									<Link
										href="https://wa.me/5581986961991"
										className="text-[#D1D5DB] text-[12px] no-underline mr-4"
									>
										WhatsApp: (81) 98696-1991
									</Link>
								</Column>
								<Column>
									<Text className="text-[#D1D5DB] text-[12px] m-0">
										Tel: 3229-1728
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

export { TemplatePartnershipInvite };
