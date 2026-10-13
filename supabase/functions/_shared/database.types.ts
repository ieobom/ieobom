export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answered_at: string
          early_asked_at: string | null
          early_choice: string | null
          early_chosen_at: string | null
          exchange_question_id: string
          id: string
          method: string
          relationship_id: string
          text: string
          user_id: string
          visible_to_partner: boolean
        }
        Insert: {
          answered_at?: string
          early_asked_at?: string | null
          early_choice?: string | null
          early_chosen_at?: string | null
          exchange_question_id: string
          id?: string
          method?: string
          relationship_id: string
          text: string
          user_id: string
          visible_to_partner?: boolean
        }
        Update: {
          answered_at?: string
          early_asked_at?: string | null
          early_choice?: string | null
          early_chosen_at?: string | null
          exchange_question_id?: string
          id?: string
          method?: string
          relationship_id?: string
          text?: string
          user_id?: string
          visible_to_partner?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "answers_exchange_question_id_relationship_id_fkey"
            columns: ["exchange_question_id", "relationship_id"]
            isOneToOne: false
            referencedRelation: "exchange_questions"
            referencedColumns: ["id", "relationship_id"]
          },
          {
            foreignKeyName: "answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          enabled: boolean
          key: string
          note: string
          updated_at: string
          value: Json
        }
        Insert: {
          enabled?: boolean
          key: string
          note?: string
          updated_at?: string
          value?: Json
        }
        Update: {
          enabled?: boolean
          key?: string
          note?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      call_times: {
        Row: {
          created_at: string
          days: string
          end_hour: number
          id: string
          start_hour: number
          user_id: string
        }
        Insert: {
          created_at?: string
          days: string
          end_hour: number
          id?: string
          start_hour: number
          user_id: string
        }
        Update: {
          created_at?: string
          days?: string
          end_hour?: number
          id?: string
          start_hour?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_times_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcripts: {
        Row: {
          call_id: string
          created_at: string
          segments: Json
          user_id: string
        }
        Insert: {
          call_id: string
          created_at?: string
          segments?: Json
          user_id: string
        }
        Update: {
          call_id?: string
          created_at?: string
          segments?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_transcripts_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_transcripts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          answered_at: string | null
          callee_draft_on: boolean | null
          callee_id: string | null
          caller_draft_on: boolean | null
          caller_id: string | null
          ended_at: string | null
          id: string
          in_free_time: boolean
          missed_seen_at: string | null
          recording: string
          relationship_id: string
          room_name: string | null
          started_at: string
          status: string
        }
        Insert: {
          answered_at?: string | null
          callee_draft_on?: boolean | null
          callee_id?: string | null
          caller_draft_on?: boolean | null
          caller_id?: string | null
          ended_at?: string | null
          id?: string
          in_free_time?: boolean
          missed_seen_at?: string | null
          recording?: string
          relationship_id: string
          room_name?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          answered_at?: string | null
          callee_draft_on?: boolean | null
          callee_id?: string | null
          caller_draft_on?: boolean | null
          caller_id?: string | null
          ended_at?: string | null
          id?: string
          in_free_time?: boolean
          missed_seen_at?: string | null
          recording?: string
          relationship_id?: string
          room_name?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      client_errors: {
        Row: {
          app_version: string
          created_at: string
          id: number
          kind: string
          platform: string
          screen: string
        }
        Insert: {
          app_version?: string
          created_at?: string
          id?: never
          kind: string
          platform: string
          screen?: string
        }
        Update: {
          app_version?: string
          created_at?: string
          id?: never
          kind?: string
          platform?: string
          screen?: string
        }
        Relationships: []
      }
      code_attempts: {
        Row: {
          attempted_at: string
          id: number
          ok: boolean
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: never
          ok: boolean
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: never
          ok?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          agreed_at: string
          doc: string
          id: string
          user_id: string
          version: string
          withdrawn_at: string | null
        }
        Insert: {
          agreed_at?: string
          doc: string
          id?: string
          user_id: string
          version: string
          withdrawn_at?: string | null
        }
        Update: {
          agreed_at?: string
          doc?: string
          id?: string
          user_id?: string
          version?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_questions: {
        Row: {
          author_id: string
          created_at: string
          id: string
          relationship_id: string
          send_on: string
          status: string
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          relationship_id: string
          send_on: string
          status?: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          relationship_id?: string
          send_on?: string
          status?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_questions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          app_version: string
          call_token: string | null
          id: string
          install_id: string
          last_active_at: string
          platform: string
          push_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string
          call_token?: string | null
          id?: string
          install_id: string
          last_active_at?: string
          platform: string
          push_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string
          call_token?: string | null
          id?: string
          install_id?: string
          last_active_at?: string
          platform?: string
          push_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          anon_id: string
          created_at: string
          detail: Json
          id: number
          name: string
        }
        Insert: {
          anon_id: string
          created_at?: string
          detail?: Json
          id?: never
          name: string
        }
        Update: {
          anon_id?: string
          created_at?: string
          detail?: Json
          id?: never
          name?: string
        }
        Relationships: []
      }
      exchange_questions: {
        Row: {
          bank_question_id: string | null
          child_seen_at: string | null
          closed_at: string | null
          custom_question_id: string | null
          id: string
          opened_at: string | null
          parent_seen_at: string | null
          relationship_id: string
          sent_on: string
          seq_no: number
          status: string
          text: string
        }
        Insert: {
          bank_question_id?: string | null
          child_seen_at?: string | null
          closed_at?: string | null
          custom_question_id?: string | null
          id?: string
          opened_at?: string | null
          parent_seen_at?: string | null
          relationship_id: string
          sent_on: string
          seq_no: number
          status?: string
          text: string
        }
        Update: {
          bank_question_id?: string | null
          child_seen_at?: string | null
          closed_at?: string | null
          custom_question_id?: string | null
          id?: string
          opened_at?: string | null
          parent_seen_at?: string | null
          relationship_id?: string
          sent_on?: string
          seq_no?: number
          status?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_questions_bank_question_id_fkey"
            columns: ["bank_question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_questions_custom_question_id_fkey"
            columns: ["custom_question_id"]
            isOneToOne: false
            referencedRelation: "custom_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_questions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          answer: string | null
          answer_seen_at: string | null
          answered_at: string | null
          body: string
          created_at: string
          help_item: string
          id: string
          user_id: string | null
        }
        Insert: {
          answer?: string | null
          answer_seen_at?: string | null
          answered_at?: string | null
          body: string
          created_at?: string
          help_item?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          answer?: string | null
          answer_seen_at?: string | null
          answered_at?: string | null
          body?: string
          created_at?: string
          help_item?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          invite_as: string
          inviter_id: string
          joined_by: string | null
          parent_kind: string
          relationship_id: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_as: string
          inviter_id: string
          joined_by?: string | null
          parent_kind: string
          relationship_id?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_as?: string
          inviter_id?: string
          joined_by?: string | null
          parent_kind?: string
          relationship_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_joined_by_fkey"
            columns: ["joined_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      memo_drafts: {
        Row: {
          call_id: string
          created_at: string
          expires_at: string
          id: string
          memo_id: string | null
          relationship_id: string
          status: string
          text: string | null
          user_id: string
        }
        Insert: {
          call_id: string
          created_at?: string
          expires_at?: string
          id?: string
          memo_id?: string | null
          relationship_id: string
          status?: string
          text?: string | null
          user_id: string
        }
        Update: {
          call_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          memo_id?: string | null
          relationship_id?: string
          status?: string
          text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memo_drafts_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memo_drafts_memo_id_fkey"
            columns: ["memo_id"]
            isOneToOne: false
            referencedRelation: "memos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memo_drafts_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memo_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memos: {
        Row: {
          call_id: string | null
          created_at: string
          id: string
          mood: string | null
          relationship_id: string
          suggest_status: string
          text: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          call_id?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          relationship_id: string
          suggest_status?: string
          text?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          call_id?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          relationship_id?: string
          suggest_status?: string
          text?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "memos_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memos_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string
          created_at: string
          id: string
          method: string
          relationship_id: string
          seen_at: string | null
          text: string
          topic: string | null
          topic_by: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          method?: string
          relationship_id: string
          seen_at?: string | null
          text?: string
          topic?: string | null
          topic_by?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          method?: string
          relationship_id?: string
          seen_at?: string | null
          text?: string
          topic?: string | null
          topic_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      news_photos: {
        Row: {
          file_path: string
          id: string
          news_id: string
          relationship_id: string
          sort: number
          thumb_path: string
        }
        Insert: {
          file_path: string
          id?: string
          news_id: string
          relationship_id: string
          sort: number
          thumb_path: string
        }
        Update: {
          file_path?: string
          id?: string
          news_id?: string
          relationship_id?: string
          sort?: number
          thumb_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_photos_news_id_relationship_id_fkey"
            columns: ["news_id", "relationship_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id", "relationship_id"]
          },
        ]
      }
      notice_reads: {
        Row: {
          confirmed_at: string
          notice_id: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string
          notice_id: string
          user_id: string
        }
        Update: {
          confirmed_at?: string
          notice_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_reads_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          note: string
          show_from: string
          show_until: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          note?: string
          show_from?: string
          show_until: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          note?: string
          show_from?: string
          show_until?: string
          title?: string
        }
        Relationships: []
      }
      push_log: {
        Row: {
          body: string
          dedupe_key: string | null
          id: number
          kind: string
          relationship_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          body?: string
          dedupe_key?: string | null
          id?: never
          kind: string
          relationship_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          body?: string
          dedupe_key?: string | null
          id?: never
          kind?: string
          relationship_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_log_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          created_at: string
          id: string
          is_example: boolean
          reviewed: boolean
          text: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_example?: boolean
          reviewed?: boolean
          text: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_example?: boolean
          reviewed?: boolean
          text?: string
          topic?: string | null
        }
        Relationships: []
      }
      relationship_settings: {
        Row: {
          avoid_topics: string[]
          curious_topics: string[]
          next_freq: number | null
          next_freq_from: string | null
          question_freq: number
          relationship_id: string
          user_id: string
        }
        Insert: {
          avoid_topics?: string[]
          curious_topics?: string[]
          next_freq?: number | null
          next_freq_from?: string | null
          question_freq?: number
          relationship_id: string
          user_id: string
        }
        Update: {
          avoid_topics?: string[]
          curious_topics?: string[]
          next_freq?: number | null
          next_freq_from?: string | null
          question_freq?: number
          relationship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_settings_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          child_id: string | null
          connected_at: string
          ended_at: string | null
          ended_by: string | null
          id: string
          parent_id: string | null
          parent_kind: string
          status: string
        }
        Insert: {
          child_id?: string | null
          connected_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          parent_id?: string | null
          parent_kind: string
          status?: string
        }
        Update: {
          child_id?: string | null
          connected_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          parent_id?: string | null
          parent_kind?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          id: string
          round: number
          sort: number
          text: string
        }
        Insert: {
          id?: string
          round: number
          sort: number
          text: string
        }
        Update: {
          id?: string
          round?: number
          sort?: number
          text?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          comment: string
          id: string
          relationship_id: string
          round: number
          scores: Json
          submitted_at: string
          user_id: string
        }
        Insert: {
          comment?: string
          id?: string
          relationship_id: string
          round: number
          scores?: Json
          submitted_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          id?: string
          relationship_id?: string
          round?: number
          scores?: Json
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      talk_suggestions: {
        Row: {
          asked_on: string | null
          created_at: string
          exchange_question_id: string | null
          id: string
          made_by: string
          memo_id: string | null
          news_id: string | null
          owner_id: string
          relationship_id: string
          source: string
          status: string
          text: string
        }
        Insert: {
          asked_on?: string | null
          created_at?: string
          exchange_question_id?: string | null
          id?: string
          made_by?: string
          memo_id?: string | null
          news_id?: string | null
          owner_id: string
          relationship_id: string
          source: string
          status?: string
          text: string
        }
        Update: {
          asked_on?: string | null
          created_at?: string
          exchange_question_id?: string | null
          id?: string
          made_by?: string
          memo_id?: string | null
          news_id?: string | null
          owner_id?: string
          relationship_id?: string
          source?: string
          status?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "talk_suggestions_exchange_question_id_fkey"
            columns: ["exchange_question_id"]
            isOneToOne: false
            referencedRelation: "exchange_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talk_suggestions_memo_id_fkey"
            columns: ["memo_id"]
            isOneToOne: false
            referencedRelation: "memos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talk_suggestions_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talk_suggestions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talk_suggestions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      usage: {
        Row: {
          amount: number
          created_at: string
          id: number
          kind: string
          relationship_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          kind: string
          relationship_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          kind?: string
          relationship_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          large_text: boolean
          memo_draft_on: boolean
          name: string
          notify_on: boolean
          notify_time: string
          side: string
        }
        Insert: {
          created_at?: string
          id: string
          large_text?: boolean
          memo_draft_on?: boolean
          name: string
          notify_on?: boolean
          notify_time?: string
          side: string
        }
        Update: {
          created_at?: string
          id?: string
          large_text?: boolean
          memo_draft_on?: boolean
          name?: string
          notify_on?: boolean
          notify_time?: string
          side?: string
        }
        Relationships: []
      }
      weather_lines: {
        Row: {
          season: string
          to_child: string
          to_parent: string
          topic: string
        }
        Insert: {
          season: string
          to_child: string
          to_parent: string
          topic?: string
        }
        Update: {
          season?: string
          to_child?: string
          to_parent?: string
          topic?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { code: string }; Returns: Json }
      align_side: { Args: { uid: string; wanted: string }; Returns: undefined }
      answer_call: {
        Args: { call: string }
        Returns: {
          answered_at: string | null
          callee_draft_on: boolean | null
          callee_id: string | null
          caller_draft_on: boolean | null
          caller_id: string | null
          ended_at: string | null
          id: string
          in_free_time: boolean
          missed_seen_at: string | null
          recording: string
          relationship_id: string
          room_name: string | null
          started_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "calls"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      call_days: { Args: { days: string }; Returns: number[] }
      call_time_overlap: {
        Args: { at?: string; relationship: string }
        Returns: {
          free_now: boolean
          next_ends_at: string
          next_starts_at: string
        }[]
      }
      cancel_call: {
        Args: { call: string; missed?: boolean }
        Returns: {
          answered_at: string | null
          callee_draft_on: boolean | null
          callee_id: string | null
          caller_draft_on: boolean | null
          caller_id: string | null
          ended_at: string | null
          id: string
          in_free_time: boolean
          missed_seen_at: string | null
          recording: string
          relationship_id: string
          room_name: string | null
          started_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "calls"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_invite: { Args: { invite: string }; Returns: undefined }
      choose_early: {
        Args: { choice: string; question: string }
        Returns: undefined
      }
      create_custom_question: {
        Args: { relationship: string; text: string }
        Returns: {
          author_id: string
          created_at: string
          id: string
          relationship_id: string
          send_on: string
          status: string
          text: string
        }
        SetofOptions: {
          from: "*"
          to: "custom_questions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_invite: {
        Args: { invite_as: string; my_kind?: string }
        Returns: {
          code: string
          created_at: string
          expires_at: string
          id: string
          invite_as: string
          inviter_id: string
          joined_by: string | null
          parent_kind: string
          relationship_id: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_news: {
        Args: {
          method?: string
          news_id: string
          photo_count?: number
          relationship: string
          text?: string
          topic?: string
          topic_by?: string
        }
        Returns: {
          author_id: string
          created_at: string
          id: string
          method: string
          relationship_id: string
          seen_at: string | null
          text: string
          topic: string | null
          topic_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "news"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      custom_question_slot: {
        Args: { after: string; relationship: string }
        Returns: string
      }
      decline_call: {
        Args: { call: string }
        Returns: {
          answered_at: string | null
          callee_draft_on: boolean | null
          callee_id: string | null
          caller_draft_on: boolean | null
          caller_id: string | null
          ended_at: string | null
          id: string
          in_free_time: boolean
          missed_seen_at: string | null
          recording: string
          relationship_id: string
          room_name: string | null
          started_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "calls"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_custom_question: { Args: { question: string }; Returns: undefined }
      delete_memo: { Args: { memo: string }; Returns: undefined }
      delete_news: { Args: { news_id: string }; Returns: undefined }
      discard_draft: { Args: { draft: string }; Returns: undefined }
      end_call: {
        Args: { call: string }
        Returns: {
          answered_at: string | null
          callee_draft_on: boolean | null
          callee_id: string | null
          caller_draft_on: boolean | null
          caller_id: string | null
          ended_at: string | null
          id: string
          in_free_time: boolean
          missed_seen_at: string | null
          recording: string
          relationship_id: string
          room_name: string | null
          started_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "calls"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      end_relationship: { Args: { relationship: string }; Returns: undefined }
      feature_enabled: { Args: { feature: string }; Returns: boolean }
      freq_on: {
        Args: {
          day: string
          s: Database["public"]["Tables"]["relationship_settings"]["Row"]
        }
        Returns: number
      }
      home: { Args: { at?: string }; Returns: Json }
      invite_lookup: {
        Args: { code: string; uid: string }
        Returns: Record<string, unknown>
      }
      is_connected: { Args: { relationship: string }; Returns: boolean }
      is_family: { Args: { other: string }; Returns: boolean }
      is_member: { Args: { relationship: string }; Returns: boolean }
      mark_asked: {
        Args: { relationship: string; suggestion?: string }
        Returns: string
      }
      mark_early_asked: { Args: { question: string }; Returns: undefined }
      my_families: {
        Args: never
        Returns: {
          connected_at: string
          my_side: string
          parent_kind: string
          partner_id: string
          partner_name: string
          relationship_id: string
          status: string
        }[]
      }
      next_question_day: {
        Args: { day: string; relationship: string }
        Returns: string
      }
      overlap_windows: {
        Args: { a: string; at?: string; b: string }
        Returns: {
          ends_at: string
          starts_at: string
        }[]
      }
      partner_custom_question: {
        Args: { relationship: string }
        Returns: {
          send_on: string
        }[]
      }
      preview_invite: { Args: { code: string }; Returns: Json }
      purge_expired: { Args: { at?: string }; Returns: Json }
      question_days: { Args: { freq: number }; Returns: number[] }
      random_code: { Args: never; Returns: string }
      record_calendar: {
        Args: { month: string; relationship: string }
        Returns: Json
      }
      record_items: {
        Args: { relationship: string; uid: string }
        Returns: {
          at: string
          id: string
          kind: string
        }[]
      }
      records: {
        Args: {
          before_at?: string
          before_id?: string
          kind?: string
          page_size?: number
          relationship: string
        }
        Returns: Json
      }
      register_device: {
        Args: {
          app_version: string
          call_token?: string
          install_id: string
          platform: string
          push_token?: string
        }
        Returns: undefined
      }
      relationship_freq: {
        Args: { day: string; relationship: string }
        Returns: number
      }
      restore_draft: { Args: { draft: string }; Returns: undefined }
      save_call_memo: {
        Args: { call: string; mood?: string; text?: string }
        Returns: {
          call_id: string | null
          created_at: string
          id: string
          mood: string | null
          relationship_id: string
          suggest_status: string
          text: string
          updated_at: string
          user_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "memos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      season_of: { Args: { day: string }; Returns: string }
      see_missed_call: { Args: { call: string }; Returns: undefined }
      see_news: { Args: { news_id: string }; Returns: undefined }
      see_question: { Args: { question: string }; Returns: undefined }
      send_due_questions: { Args: { day?: string }; Returns: number }
      seoul_today: { Args: never; Returns: string }
      set_memo_draft: {
        Args: { doc_version?: string; turn_on: boolean }
        Returns: undefined
      }
      set_question_freq: {
        Args: { freq: number; relationship: string }
        Returns: {
          avoid_topics: string[]
          curious_topics: string[]
          next_freq: number | null
          next_freq_from: string | null
          question_freq: number
          relationship_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "relationship_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      signup_complete: {
        Args: {
          agreed: string[]
          doc_version?: string
          name: string
          side: string
        }
        Returns: {
          created_at: string
          id: string
          large_text: boolean
          memo_draft_on: boolean
          name: string
          notify_on: boolean
          notify_time: string
          side: string
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_call: {
        Args: { relationship: string }
        Returns: {
          answered_at: string | null
          callee_draft_on: boolean | null
          callee_id: string | null
          caller_draft_on: boolean | null
          caller_id: string | null
          ended_at: string | null
          id: string
          in_free_time: boolean
          missed_seen_at: string | null
          recording: string
          relationship_id: string
          room_name: string | null
          started_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "calls"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_answer: {
        Args: { method?: string; question: string; text: string }
        Returns: Json
      }
      talk_list: { Args: { relationship: string }; Returns: Json }
      try_uuid: { Args: { value: string }; Returns: string }
      unmark_asked: { Args: { suggestion: string }; Returns: undefined }
      unregister_device: { Args: { install_id: string }; Returns: undefined }
      update_memo: {
        Args: { memo: string; mood: string; text: string }
        Returns: {
          call_id: string | null
          created_at: string
          id: string
          mood: string | null
          relationship_id: string
          suggest_status: string
          text: string
          updated_at: string
          user_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "memos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
