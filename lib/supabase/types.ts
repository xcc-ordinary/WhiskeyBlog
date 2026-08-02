export type PhotographStatus = "draft" | "published";

/** A focal crop in normalized image coordinates, persisted as JSONB. */
export type PhotographCrop = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type Photograph = {
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
};

/** Database-shaped form returned by Supabase before application mapping. */
export type PhotographRow = {
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
};

export type PhotographInsert = {
  id?: string;
  original_path: string;
  thumbnail_path?: string | null;
  gallery_path?: string | null;
  detail_path?: string | null;
  title?: string | null;
  alt?: string | null;
  caption?: string | null;
  captured_at?: string | null;
  location?: string | null;
  category?: string | null;
  display_order?: number;
  crop?: PhotographCrop;
  status?: PhotographStatus;
  created_at?: string;
  published_at?: string | null;
};

export type PhotographUpdate = Partial<Omit<PhotographInsert, "id" | "original_path" | "created_at">>;

/** The only photograph shape exposed to anonymous public-page queries. */
export type PublishedPhotographRow = {
  id: string;
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
  published_at: string;
};

export type PublishedPhotograph = {
  id: string;
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
  publishedAt: string;
};

export type Database = {
  public: {
    Tables: {
      photographs: {
        Row: PhotographRow;
        Insert: PhotographInsert;
        Update: PhotographUpdate;
        Relationships: [];
      };
    };
    Views: {
      published_photographs: {
        Row: PublishedPhotographRow;
        Relationships: [];
      };
    };
    Functions: {
      is_media_studio_owner: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      photograph_status: PhotographStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
