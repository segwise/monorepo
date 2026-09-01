import type { PropsWithChildren } from 'hono/jsx';

const LOGO_WHITE = 'https://cdn.segwise.com.br/images-public/Group%2077.svg';

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
		logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPXYwtQrp2OmLV8dSV-vnQIJKBk9nBNnZOexohCq9_DfiQ1eoMqhDQ5jH0&s=10',
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
	return (
		<div className="grid grid-cols-8 gap-1">
			{partnerInsurers.map((insurer) => (
				<div
					key={insurer.name}
					className="border border-solid border-[#E5E7EB] rounded py-1 px-1 flex items-center justify-center"
				>
					<img
						src={insurer.logo}
						alt={insurer.name}
						width={40}
						height={15}
						className="object-contain"
					/>
				</div>
			))}
		</div>
	);
}

function SectionTitle({ children }: PropsWithChildren) {
	return (
		<h2 className="text-[12px] font-bold text-primary tracking-wide uppercase m-0 mb-2 pb-1.5 border-b border-solid border-[#D1D5DB]">
			{children}
		</h2>
	);
}

function BulletItem({ children }: PropsWithChildren) {
	return (
		<div className="flex items-start gap-2 mb-0.5">
			<span className="text-[11px] text-[#9CA3AF] leading-[15px]">–</span>
			<p className="text-[11px] leading-[15px] text-[#374151] m-0">
				{children}
			</p>
		</div>
	);
}

function TemplatePartnershipInviteCondominium({
	leadId,
}: {
	leadId?: string;
} = {}) {
	const urlMessage = new URL('https://segwise.com.br/nova-parceria');
	if (leadId) urlMessage.searchParams.set('leadId', leadId);

	return (
		<html lang="pt-BR">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>
					Parceria comercial — Administradora de condomínio | XCAR Corretora de
					Seguros / SEGWISE
				</title>
				<script src="https://cdn.tailwindcss.com"></script>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							tailwind.config = {
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
						`,
					}}
				/>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
					rel="stylesheet"
				/>
				<style>{`
					body { font-family: 'Inter', Arial, sans-serif; }
					@media print {
						* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
					}
				`}</style>
			</head>
			<body className="bg-white m-0">
				<div className="mx-auto max-w-[680px]">
					<div className="flex items-center justify-between bg-primary px-10 py-4 break-inside-avoid">
						<img
							src={LOGO_WHITE}
							alt="XCAR CORRETORA DE SEGUROS / SEGWISE"
							width={120}
							height={27}
						/>
						<span className="text-[10px] tracking-wide text-[#9CA3AF] uppercase">
							Proposta de parceria comercial
						</span>
					</div>
					<div className="px-10 pt-5 pb-5">
						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-3">
							Ao Sr.(a) Responsável por novos negócios da administradora de
							condomínios
						</p>
						<h1 className="text-[18px] font-bold text-primary m-0 mb-0.5 leading-tight">
							Prezado(a) Senhor(a),
						</h1>
						<p className="text-[12px] font-semibold text-[#4B5563] m-0 mb-3">
							Uma ótima oportunidade de levar benefícios aos clientes sob Gestão
							de sua empresa
						</p>
						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-3">
							Meu nome é Fernando Luiz Malheiros de Sena, diretor da{' '}
							<b>XCAR CORRETORA DE SEGUROS / SEGWISE</b> e gostaria, em parceria
							com sua empresa, oferecer: o programa gestão + proteção – conheça
							os benefícios
						</p>
						<div className="mb-3 break-inside-avoid">
							<SectionTitle>Benefícios aos clientes</SectionTitle>
							<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-1.5">
								Acesso ao aplicativo - SEGWISE
							</p>
							<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-1.5">
								Um aplicativo verdadeiramente relevante que vem para ampliar os
								benefícios que sua empresa já oferece, funcionando como um
								assistente de bolso, centralizando serviços e informações
								essências como os descritos abaixo:
							</p>
							<BulletItem>
								EVITAR NEGATIVA DE SINISTRO – orientações sobre temas como:
								Principal Condutor, CEP de pernoite, cobertura para condutores
								entre 18 a 25 anos de idade, deveres do segurado, recusa da
								apólice.........
							</BulletItem>
							<BulletItem>
								CONSULTA VEICULAR – Informações sobre: Valor médio da FIPE –
								multas – gravames – infrações – débitos – IPVA - licenciamentos
								– DPVAT – roubo – sinistros
							</BulletItem>
							<BulletItem>
								ASSISTÊNCIAS – telefones para solicitar reboque, abrir um
								sinistro, solicitar substituição de vidros, faróis, lanternas e
								etc...
							</BulletItem>
							<BulletItem>
								ORIENTAÇÃO NO SINISTRO – como agir, para onde ligar, o que fazer
								e se houver vítima...
							</BulletItem>
							<BulletItem>
								DESCONTOS EXCLUSIVOS – na aquisição ou renovação de seguros
							</BulletItem>
						</div>
						<div className="mb-4 break-inside-avoid">
							<SectionTitle>Benefícios ao escritório</SectionTitle>
							<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-1.5">
								Acesso ao aplicativo - PARCEIRO
							</p>
							<BulletItem>
								Aplicativo dedicado ao escritório, com demonstrativo do número
								de adesões e ao relatório financeiro decorrentes das indicações,
								e aos direitos conforme abaixo:
							</BulletItem>
							<BulletItem>
								COMISSIONAMENTO VITALÍCIO – percentual dos ganhos da corretora
								decorrente da indicação dos condôminos que resulte na efetiva
								contratação de seguros.
							</BulletItem>
							<BulletItem>
								CUSTO DE IMPLANTAÇÃO – sem qualquer custo financeiro ou laboral
							</BulletItem>
						</div>
						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-3">
							Coloco-me à disposição para esclarecer eventuais dúvidas e
							apresentar mais detalhes sobre o programa.
						</p>
						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-3">
							Atenciosamente,
						</p>
						<div className="pt-8 border-t border-solid border-[#D1D5DB] break-inside-avoid">
							<p className="text-[11px] leading-[15px] text-[#374151] m-0">
								Fernando Luiz Malheiros de Sena
							</p>
							<p className="text-[11px] leading-[15px] text-[#374151] m-0">
								Diretor Geral
							</p>
							<p className="text-[11px] leading-[15px] text-muted m-0 mb-3">
								Fones: (81) 98696-1991 - (81) 3229-1728
							</p>
							<p className="text-[11px] leading-[15px] text-muted m-0 mb-3">
								XCAR Corretora de Seguros / SEGWISE
							</p>
							<p className="text-[9px] tracking-wide text-muted uppercase m-0 mb-1.5">
								Seguradoras parceiras
							</p>
							<InsurerLogoGrid />
						</div>
					</div>
					<div className="px-10 py-4 border-t border-solid border-[#E5E7EB] flex items-center justify-between">
						<span className="text-[10px] text-muted">
							XCAR CORRETORA DE SEGUROS / SEGWISE
						</span>
						<span className="text-[10px] text-muted">segwise.com.br</span>
					</div>
				</div>
			</body>
		</html>
	);
}

export { TemplatePartnershipInviteCondominium };
