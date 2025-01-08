import { parse } from 'date-fns';

function parseRowDate(row: TableData): TableData {
  if (typeof row.date === 'string') {
    // parse("12/20/2024", "MM/dd/yyyy", new Date()) => a Date
    row.date = parse(row.date, 'MM/dd/yyyy', new Date());
  }
  return row;
}
