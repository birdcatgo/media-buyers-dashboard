export interface TableData {
    date: string | Date;
    mediaBuyer: string;
    network: string;
    offer: string;
    adAccount: string;
    adRev: number;
    adSpend: number;
    profit: number;
}

export interface DailyData {
    date: string;
    revenue: number;
    adSpend: number;
    profit: number;
}

export interface PerformanceData {
    name: string;
    revenue: number;
    profit: number;
}

export interface DashboardData {
    dailyData: DailyData[];
    offerData: PerformanceData[];
    networkData: PerformanceData[];
    tableData: TableData[];
    overviewData?: any[];
}

export type UserRole = 'admin' | 'media_buyer' | 'viewer';

export interface User {
    id: string;
    name: string;
    role: UserRole;
}

export type DateRange = 'eod' | '7d' | 'mtd' | 'all';