import type { QueryClient } from '@tanstack/react-query';

// Depois de cadastrar, editar, excluir ou mexer em convite de produtor/parceiro,
// nada que mostre esses dados pode ficar com cópia antiga em cache:
// - ['producers']: a listagem, os seletores (simple/full) e o link público;
//   `refetchType: 'all'` refaz até as consultas que não estão na tela agora.
// - ['analytics', 'producers-ranking']: o ranking do dashboard mostra nome e foto.
function invalidateProducers(client: QueryClient) {
	return Promise.all([
		client.invalidateQueries({ queryKey: ['producers'], refetchType: 'all' }),
		client.invalidateQueries({ queryKey: ['analytics', 'producers-ranking'] }),
	]);
}

export { invalidateProducers };
