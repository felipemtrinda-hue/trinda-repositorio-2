-- Dados institucionais oficiais informados pela Empiric (editáveis em Configurações).
update public.settings set value = jsonb_build_object(
  'name', 'Empiric Negócios Imobiliários',
  'legal_name', 'EMPIRIC NEGÓCIOS IMOBILIÁRIOS LTDA',
  'creci', '9497-J',
  'address', 'Rua Visconde do Rio Branco, 759 · Oficinas · Ponta Grossa/PR',
  'hours', 'Segunda a sexta, 8h às 19h · Sábado, 8h às 17h',
  'phone', '(42) 99958-4779',
  'email', null,
  'site', 'https://www.empiricimob.com.br/'
) where key = 'company';

update public.settings set value = value || jsonb_build_object('number', '5542999584779')
 where key = 'whatsapp';
