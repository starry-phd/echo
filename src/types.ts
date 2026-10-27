/** Echo App 專屬資料：不包含會員基本個資。 */
export interface EchoTrack {
  id: string;
  title: string;
  speaker: string;
  description: string | null;
  durationSeconds: number;
  categories: string[];
  playable: boolean;
}

export type CatalogResult = { tracks: EchoTrack[] };
export type ApiProblem = { code: string; message: string };
