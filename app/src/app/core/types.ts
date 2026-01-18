export type GenreStat = { genre: string; cnt: number };
export type MonthStat = { month: string; cnt: number };
export type GoogleBookDTO = {
    id: string;
    title: string;
    author?: string;
    coverUrl?: string;
    description?: string;
    categories?: string[] | null;
    publishedYear?: number;
    pageCount?: number;
    maturity?: string;
};
export type MyBookDto = {
    bookId: number;
    googleId: string;
    title: string;
    author: string;
    coverUrl: string;
    status: 'planned' | 'reading' | 'finished' | 'dropped';
    collections: string[];
};
export type CollectionDto = { id: number; name: string; count: number };
export type ReviewDto = { id: string; userName: string; createdAt: string; rating?: number; text: string };

