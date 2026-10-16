export interface Report {
  id: string;
  title: string;
  description: string;
  publicEmbedUrl: string;
}
export interface Department {
  id: string;
  name: string;
  reports: readonly Report[];
}
export const DEPARTMENTS: readonly Department[] = [
  {
    id: 'epidemiologia',
    name: 'Epidemiología',
    reports: [
      {
        id: 'graficas',
        title: 'Gráficas',
        description: 'Consulta el informe interactivo y aplica sus filtros originales de Power BI.',
        publicEmbedUrl:
          'https://app.powerbi.com/view?r=eyJrIjoiY2FlMjBmOTYtZGI0ZS00NzIzLWE3ZTctMjdiYzIyNWUyMTU4IiwidCI6ImFmMmZkMTk2LTFkOWYtNDdiNC05MDY5LTM5MWE0NmY4MzYwMSIsImMiOjR9&pageName=71ece924eafb685c258f',
      },
      {
        id: 'canales-endemicos',
        title: 'Canales Endémicos',
        description:
          'Consulta el informe de canales endémicos y aplica sus filtros originales de Power BI.',
        publicEmbedUrl:
          'https://app.powerbi.com/view?r=eyJrIjoiZmExZTFiMjctZDg0OC00YzE4LTkzNTgtZGIzYjFhNjgxZGU0IiwidCI6ImFmMmZkMTk2LTFkOWYtNDdiNC05MDY5LTM5MWE0NmY4MzYwMSIsImMiOjR9',
      },
    ],
  },
  {
    id: 'trans',
    name: 'TRANS',
    reports: [
      {
        id: 'trans-puerto-cortes',
        title: 'TRANS',
        description:
          'Informe público de TRANS de Puerto Cortés. Consulta sus gráficos y filtros originales.',
        publicEmbedUrl:
          'https://app.powerbi.com/view?r=eyJrIjoiMzQ1ZjkwZjUtYTFlNS00M2YzLTk4YWMtMmM2MDYwY2U5Y2FlIiwidCI6ImFmMmZkMTk2LTFkOWYtNDdiNC05MDY5LTM5MWE0NmY4MzYwMSIsImMiOjR9',
      },
    ],
  },
  { id: 'salud-ambiental', name: 'Salud Ambiental', reports: [] },
];
export function validateReportUrl(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'app.powerbi.com' ||
    url.pathname !== '/view' ||
    !url.searchParams.get('r') ||
    url.username ||
    url.password
  ) {
    throw new Error('URL de Power BI no permitida');
  }
  return url.href;
}
