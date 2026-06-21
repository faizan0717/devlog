export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

type Visibility = 'private' | 'public' | 'shared' | 'unlisted'
type LogMood = 'building' | 'shipped' | 'stuck' | 'reflecting' | 'inspired' | 'learning'
type LogMedia = { url: string; type: 'image' | 'video'; name: string }
type SocialLinks = {
  github?: string
  twitter?: string
  website?: string
  linkedin?: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string | null
          bio: string | null
          avatar_url: string | null
          social_links: SocialLinks | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email?: string | null
          bio?: string | null
          avatar_url?: string | null
          social_links?: SocialLinks | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          bio?: string | null
          avatar_url?: string | null
          social_links?: SocialLinks | null
          is_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          visibility: Visibility
          cover_image_url: string | null
          tags: string[]
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          visibility?: Visibility
          cover_image_url?: string | null
          tags?: string[]
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          owner_id?: string
          title?: string
          description?: string | null
          visibility?: Visibility
          cover_image_url?: string | null
          tags?: string[]
          view_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          id: string
          project_id: string
          title: string
          content: string | null
          visibility: Visibility
          mood: LogMood | null
          media: LogMedia[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          content?: string | null
          visibility?: Visibility
          mood?: LogMood | null
          media?: LogMedia[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_id?: string
          title?: string
          content?: string | null
          visibility?: Visibility
          mood?: LogMood | null
          media?: LogMedia[]
          updated_at?: string
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'viewer' | 'editor' | 'admin'
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: 'viewer' | 'editor' | 'admin'
        }
        Update: {
          role?: 'viewer' | 'editor' | 'admin'
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          log_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          log_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      reactions: {
        Row: {
          id: string
          log_id: string
          user_id: string
          type: 'heart' | 'fire' | 'rocket'
          created_at: string
        }
        Insert: {
          id?: string
          log_id: string
          user_id: string
          type: 'heart' | 'fire' | 'rocket'
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: 'follow' | 'comment' | 'reaction'
          project_id: string | null
          log_id: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          type: 'follow' | 'comment' | 'reaction'
          project_id?: string | null
          log_id?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
        }
        Relationships: []
      }
      agent_tokens: {
        Row: {
          id: string
          owner_id: string
          name: string
          token_hash: string
          scopes: string[]
          allowed_project_ids: string[] | null
          expires_at: string | null
          revoked_at: string | null
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          token_hash: string
          scopes?: string[]
          allowed_project_ids?: string[] | null
          expires_at?: string | null
          revoked_at?: string | null
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          scopes?: string[]
          allowed_project_ids?: string[] | null
          expires_at?: string | null
          revoked_at?: string | null
          last_used_at?: string | null
        }
        Relationships: []
      }
      agent_audit_logs: {
        Row: {
          id: string
          token_id: string | null
          owner_id: string
          action: string
          project_id: string | null
          log_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          token_id?: string | null
          owner_id: string
          action: string
          project_id?: string | null
          log_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: {
      trending_projects_view: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          visibility: Visibility
          cover_image_url: string | null
          tags: string[]
          view_count: number
          created_at: string
          updated_at: string
          owner_username: string
          owner_avatar_url: string | null
          trend_score: number
          log_count: number
        }
        Relationships: []
      }
    }
    Functions: {
      increment_project_views: {
        Args: { project_id: string }
        Returns: void
      }
    }
    Enums: {
      visibility: Visibility
    }
    CompositeTypes: Record<string, never>
  }
}
