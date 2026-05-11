export interface UserPayload {
  userId: number;
  role: string;
}

export interface AccessEventData {
  userId: number | null;
  result: "GRANTED" | "DENIED" | "REGISTERED";
  note: string;
}

export interface LogFilters {
  userId?: number;
  status?: "GRANTED" | "DENIED" | "REGISTERED";
  date?: string;
  month?: number;
  year?: number;
  limit?: number;
}
