export type PhotographStatus = "draft" | "published";

/** A focal crop in normalized image coordinates, persisted as JSONB. */
export interface PhotographCrop {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface Photograph {
  id: string;
  originalPath: string;
  thumbnailPath: string | null;
  galleryPath: string | null;
  detailPath: string | null;
  title: string | null;
  alt: string | null;
  caption: string | null;
  capturedAt: string | null;
  location: string | null;
  category: string | null;
  displayOrder: number;
  crop: PhotographCrop;
  status: PhotographStatus;
  createdAt: string;
  publishedAt: string | null;
}

/** Database-shaped form returned by Supabase before application mapping. */
export interface PhotographRow {
  id: string;
  original_path: string;
  thumbnail_path: string | null;
  gallery_path: string | null;
  detail_path: string | null;
  title: string | null;
  alt: string | null;
  caption: string | null;
  captured_at: string | null;
  location: string | null;
  category: string | null;
  display_order: number;
  crop: PhotographCrop;
  status: PhotographStatus;
  created_at: string;
  published_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      photographs: {
        Row: PhotographRow;
        Insert: Omit<PhotographRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PhotographRow, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      photograph_status: PhotographStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
