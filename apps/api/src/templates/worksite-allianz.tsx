const ALLIANZ_LOGO = 'https://static.cdnlogo.com/logos/a/21/allianz-1.svg';
const SEGWISE_LOGO =
	'https://customer.segwise.com.br/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.2b0eddfb.png&w=1920&q=100';
const HERO_IMAGE =
	'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80';

function TemplateWorksiteAllianz({ leadId }: { leadId?: string } = {}) {
	const urlMessage = new URL('https://segwise.com.br/worksite-allianz');

	if (leadId) {
		urlMessage.searchParams.set('leadId', leadId);
	}

	return (
		<html lang="pt-BR">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Worksite Allianz — XCAR CORRETORA DE SEGUROS / SEGWISE</title>
				<script src="https://cdn.tailwindcss.com"></script>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							tailwind.config = {
								theme: {
									extend: {
										colors: {
											allianzBlue: '#00305D',
											allianzBlueLight: '#0B4A85',
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
					<div className="flex items-center justify-between px-10 py-5 break-inside-avoid">
						<img
							src={ALLIANZ_LOGO}
							alt="Allianz"
							width={110}
							height={28}
							className="object-contain"
						/>
						<img
							src={SEGWISE_LOGO}
							alt="SEGWISE"
							width={110}
							height={26}
							className="object-contain"
							style={{ filter: 'invert(1)' }}
						/>
					</div>
					<div className="px-10">
						<p className="text-[12px] font-bold text-[#374151] m-0 mb-1">
							Ao Responsável pelo Departamento de Recursos Humanos
						</p>
						<p className="text-[12px] text-[#374151] m-0 mb-6">
							Prezado(a) Senhor(a),
						</p>
						<h1 className="text-[18px] font-bold text-allianzBlue leading-tight m-0 mb-5">
							Worksite Allianz – Uma ótima oportunidade de levar descontos e
							benefícios aos colaboradores da sua empresa
						</h1>
						<div className="relative rounded-lg overflow-hidden mb-5 break-inside-avoid">
							<img
								src={HERO_IMAGE}
								alt="Worksite Allianz"
								className="w-full h-[160px] object-cover"
							/>
							<div className="absolute inset-0 bg-allianzBlue/40" />
							<div className="absolute left-6 bottom-5">
								<p className="text-[9px] font-semibold text-white uppercase tracking-wide m-0 mb-1">
									Seguros com mais benefícios
								</p>
								<p className="text-[22px] font-bold text-white leading-none m-0">
									Worksite Allianz
								</p>
							</div>
						</div>
						<p className="text-[12px] leading-[19px] text-[#374151] m-0 mb-3">
							Meu nome é <b>Fernando Luiz Malheiros de Sena</b>, diretor da{' '}
							<b>XCAR CORRETORA DE SEGUROS / SEGWISE</b> e gostaria de oferecer
							a sua empresa: o programa <b>Worksite Allianz</b>.
						</p>
						<p className="text-[12px] leading-[19px] text-[#374151] m-0 mb-3">
							O Worksite Allianz trata-se de um conjunto de produtos da Allianz
							Seguros com <b>descontos diferenciados</b> para colaboradores
							(extensivo a cônjuges, pais e filhos) disponível para empresas com
							mais de 50 colaboradores.
						</p>
						<p className="text-[12px] leading-[19px] text-[#374151] m-0 mb-3">
							O programa vem para ampliar os benefícios que sua empresa já
							oferece sem qualquer custo para implantação.
						</p>
						<p className="text-[12px] leading-[19px] text-[#374151] m-0 mb-3">
							Por meio do Worksite Allianz, seus colaboradores poderão contratar
							os seguintes seguros: <b>Auto, Moto, Residência, Vida e Viagem</b>
							, aproveitando os descontos diferenciados, benefícios e toda a
							proteção exclusiva da Allianz Seguros.
						</p>
						<p className="text-[12px] leading-[19px] text-[#374151] m-0 mb-8">
							Com o Worksite Allianz, são muito mais benefícios para os
							colaboradores da sua empresa. Coloco-me à disposição para
							esclarecer eventuais dúvidas e apresentar mais detalhes sobre o
							programa.
						</p>
						<div className="pb-6 break-inside-avoid">
							<p className="text-[12px] text-[#374151] m-0 mb-5">
								Atenciosamente,
							</p>
							<p className="text-[12px] font-bold text-allianzBlue m-0">
								Fernando Luiz Malheiros de Sena
							</p>
							<p className="text-[11px] text-muted m-0">Diretor Geral</p>
							<p className="text-[11px] text-muted m-0">
								Fones: (81) 98696-1991 &nbsp;-&nbsp; (81) 3229-1728
							</p>
							<p className="text-[11px] text-muted m-0">
								XCAR CORRETORA DE SEGUROS / SEGWISE
							</p>
						</div>
					</div>
					<div className="bg-[#F4F6FB] px-10 py-5 border-t border-solid border-[#E5E7EB]">
						<p className="text-[8px] leading-[12px] text-muted m-0">
							Allianz Seguros S.A., CNPJ: 61.573.796/0001-66, Rua Eugênio de
							Medeiros nº 303, ands. 1-parte, 2 ao 9, 15 e 16, Pinheiros, São
							Paulo - CEP: 05425-000. Processos SUSEP nº 15414.002216/2004-57,
							15414.001289.2007-74, 15414.002283/2007-14. Consulte as Condições
							Gerais, assim como os planos de assistência 24h, serviços e
							abrangência do seguro no site www.allianz.com.br. O registro do
							produto é automático e não representa aprovação ou recomendação
							por parte da SUSEP. A aceitação do seguro está sujeita a análise
							do risco. Algumas coberturas e serviços possuem restrições,
							carência e limites diferenciados. Para saber todos os detalhes e
							conhecer a lista completa consulte o Manual do Segurado/Condições
							Gerais. Linha Direta Allianz Corretor: 4090 1120 (Capitais e
							Regiões Metropolitanas), 0800 777 8243 (demais regiões). SAC (24
							horas): 08000 115 215. Ouvidoria Allianz Seguros: 0800 771 3313.
							Atendimento à pessoa com deficiência auditiva ou de fala: 08000
							121 239. A Allianz Seguros respeita a sua privacidade e é contra o
							spam na rede. Para mais informações, acesse a Política de
							Privacidade de Dados da Allianz, disponível em:
							www.allianz.com.br/politica-de-privacidade.
						</p>
					</div>
				</div>
			</body>
		</html>
	);
}

export { TemplateWorksiteAllianz };
