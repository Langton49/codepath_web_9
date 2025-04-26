export type PostFlag =
  | "Question"
  | "Opinion"
  | "Tip"
  | "News"
  | "Project"
  | "Discussion";

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: Date; // timestamp
  upvotes: number;
  user_id: string;
  user_name?: string;
  flag?: PostFlag;
  repost_of?: string; // ID of original post if this is a repost
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  created_at: Date;
  user_id: string;
  user_name?: string;
}

export interface User {
  id: string;
  full_name?: string;
  preferences: UserPreferences;
  email?: string;
}

export interface UserPreferences {
  showImagesInFeed: boolean;
  showContentInFeed: boolean;
  colorScheme: "light" | "dark" | "system";
}
