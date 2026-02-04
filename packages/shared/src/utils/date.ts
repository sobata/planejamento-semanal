import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  addDays,
  isWithinInterval,
  isBefore,
  isAfter,
  eachDayOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Retorna as datas de início (segunda) e fim (sexta) da semana útil
 * contendo a data fornecida.
 */
export function getWeekBounds(date: Date | string): { inicio: string; fim: string } {
  const d = typeof date === 'string' ? parseISO(date) : date;

  // Semana começa na segunda-feira (weekStartsOn: 1)
  const inicio = startOfWeek(d, { weekStartsOn: 1 });
  // Fim é sexta-feira (4 dias após segunda)
  const fim = addDays(inicio, 4);

  return {
    inicio: format(inicio, 'yyyy-MM-dd'),
    fim: format(fim, 'yyyy-MM-dd'),
  };
}

/**
 * Retorna array com as 5 datas dos dias úteis da semana (seg-sex).
 */
export function getWeekDays(dataInicio: string): string[] {
  const start = parseISO(dataInicio);
  return Array.from({ length: 5 }, (_, i) =>
    format(addDays(start, i), 'yyyy-MM-dd')
  );
}

/**
 * Retorna os dias úteis da semana com informações detalhadas.
 */
export function getWeekDaysDetailed(dataInicio: string): Array<{
  date: string;
  dayName: string;
  dayShort: string;
  dayNumber: number;
}> {
  const start = parseISO(dataInicio);
  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const dayShorts = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

  return Array.from({ length: 5 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      dayName: dayNames[i],
      dayShort: dayShorts[i],
      dayNumber: parseInt(format(date, 'd')),
    };
  });
}

/**
 * Formata o intervalo da semana para exibição.
 * Ex: "27 Jan - 31 Jan 2025"
 */
export function formatWeekRange(inicio: string, fim: string): string {
  const startDate = parseISO(inicio);
  const endDate = parseISO(fim);

  const startMonth = format(startDate, 'MMM', { locale: ptBR });
  const endMonth = format(endDate, 'MMM', { locale: ptBR });
  const year = format(endDate, 'yyyy');

  if (startMonth === endMonth) {
    return `${format(startDate, 'd')} - ${format(endDate, 'd')} ${startMonth} ${year}`;
  }

  return `${format(startDate, 'd')} ${startMonth} - ${format(endDate, 'd')} ${endMonth} ${year}`;
}

/**
 * Formata uma data para exibição curta.
 * Ex: "27/01"
 */
export function formatDateShort(date: string): string {
  return format(parseISO(date), 'dd/MM');
}

/**
 * Formata uma data completa para exibição.
 * Ex: "Segunda, 27 de Janeiro de 2025"
 */
export function formatDateFull(date: string): string {
  return format(parseISO(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Retorna a data atual no formato ISO.
 */
export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Verifica se uma data está dentro de uma semana.
 */
export function isDateInWeek(date: string, weekStart: string, weekEnd: string): boolean {
  const d = parseISO(date);
  const start = parseISO(weekStart);
  const end = parseISO(weekEnd);

  return isWithinInterval(d, { start, end });
}

/**
 * Retorna o início da semana anterior.
 */
export function getPreviousWeekStart(currentWeekStart: string): string {
  const start = parseISO(currentWeekStart);
  return format(addDays(start, -7), 'yyyy-MM-dd');
}

/**
 * Retorna o início da próxima semana.
 */
export function getNextWeekStart(currentWeekStart: string): string {
  const start = parseISO(currentWeekStart);
  return format(addDays(start, 7), 'yyyy-MM-dd');
}

/**
 * Verifica se a semana é a semana atual.
 */
export function isCurrentWeek(weekStart: string): boolean {
  const currentWeekBounds = getWeekBounds(new Date());
  return weekStart === currentWeekBounds.inicio;
}

/**
 * Verifica se a semana já passou.
 */
export function isPastWeek(weekEnd: string): boolean {
  const end = parseISO(weekEnd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isBefore(end, today);
}

/**
 * Verifica se a semana é futura.
 */
export function isFutureWeek(weekStart: string): boolean {
  const start = parseISO(weekStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isAfter(start, today);
}
