import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Post, Comment, User, PostFlag, UserPreferences } from "../types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppContextProps {
  posts: Post[];
  comments: Comment[];
  user: User;
  isLoading: boolean;
  createPost: (
    title: string,
    content: string,
    imageUrl?: string,
    flag?: PostFlag,
    repostOf?: string
  ) => Promise<Post>;
  updatePost: (
    postId: string,
    title: string,
    content: string,
    imageUrl?: string,
    flag?: PostFlag
  ) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  upvotePost: (postId: string) => Promise<void>;
  createComment: (postId: string, content: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<boolean>;
  getPostById: (postId: string) => Promise<Post | undefined>;
  getCommentsForPost: (postId: string) => Promise<Comment[]>;
  setUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  toggleColorMode: () => Promise<void>;
  searchPosts: (query: string) => Promise<Post[]>;
  sortedPosts: (by: "time" | "upvotes") => Promise<Post[]>;
  filterPostsByFlag: (flag: PostFlag | null) => Promise<Post[]>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const generateRandomUsername = () => {
  const adjectives = [
    "Green",
    "Forest",
    "Earth",
    "River",
    "Ocean",
    "Wild",
    "Nature",
    "Eco",
    "Solar",
    "Wind",
  ];
  const nouns = [
    "Guardian",
    "Defender",
    "Warrior",
    "Friend",
    "Hero",
    "Spirit",
    "Advocate",
    "Pioneer",
    "Keeper",
    "Voice",
  ];
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective}${randomNoun}`;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session) {
        // User is authenticated
        const { data: userData, error: userError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single();

        if (userError || !userData) {
          // Create user with their actual email/name if available
          const newUser: User = {
            id: sessionData.session.user.id,
            full_name:
              sessionData.session.user.user_metadata.full_name ||
              sessionData.session.user.email?.split("@")[0] ||
              "EcoUser", // Fallback if no name or email
            preferences: {
              showImagesInFeed: true,
              showContentInFeed: false,
              colorScheme: "system" as const,
            },
          };

          await supabase.from("user_profiles").insert(newUser);
          setUser(newUser);
        } else {
          setUser(userData as User);
        }
      } else {
        // Anonymous user with local ID
        const localUserId =
          localStorage.getItem("artemis-eco-user-id") || uuidv4();
        localStorage.setItem("artemis-eco-user-id", localUserId);

        // Check if anonymous user exists in database
        const { data: anonUser, error: anonUserError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", localUserId)
          .single();

        if (anonUserError || !anonUser) {
          const newAnonUser: User = {
            id: localUserId,
            full_name: generateRandomUsername(), // Only generate for anonymous users
            preferences: {
              showImagesInFeed: true,
              showContentInFeed: false,
              colorScheme: "system" as const,
            },
          };

          await supabase.from("user_profiles").insert(newAnonUser);
          setUser(newAnonUser);
        } else {
          setUser(anonUser as User);
        }
      }

      // Fetch initial posts and comments
      await fetchPosts();
      await fetchComments();

      setIsLoading(false);
    };

    initializeApp();
  }, []);

  const handleAccountCreation = async (userData: {
    id: string;
    email?: string;
    full_name?: string;
  }) => {
    if (!user) return;

    // Check if this was previously an anonymous user
    const wasAnonymous =
      !user.email && user.full_name === generateRandomUsername();

    if (wasAnonymous) {
      // Update the existing user record with real account info
      const updatedUser: Partial<User> = {
        full_name:
          userData.full_name || userData.email?.split("@")[0] || "EcoUser",
        // Add email if available
        ...(userData.email ? { email: userData.email } : {}),
      };

      const { error } = await supabase
        .from("user_profiles")
        .update(updatedUser)
        .eq("id", userData.id);

      if (!error) {
        setUser((prev) => ({
          ...prev!,
          ...updatedUser,
        }));
      }
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await handleAccountCreation({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata.full_name,
          });
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [user]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching posts",
        description: error.message,
      });
      return;
    }

    setPosts(data as Post[]);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching comments",
        description: error.message,
      });
      return;
    }

    setComments(data as Comment[]);
  };

  useEffect(() => {
    const updateTheme = () => {
      if (user?.preferences.colorScheme === "system") {
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        document.documentElement.classList.toggle("dark", systemPrefersDark);
      } else {
        document.documentElement.classList.toggle(
          "dark",
          user?.preferences.colorScheme === "dark"
        );
      }
    };

    if (user) {
      updateTheme();

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        if (user.preferences.colorScheme === "system") {
          updateTheme();
        }
      };
      mediaQuery.addEventListener("change", handleChange);

      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [user?.preferences?.colorScheme]);

  // Set up real-time listeners for posts and comments
  useEffect(() => {
    const postsSubscription = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new as Post, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((post) =>
                post.id === payload.new.id ? (payload.new as Post) : post
              )
            );
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) =>
              prev.filter((post) => post.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const commentsSubscription = supabase
      .channel("comments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setComments((prev) => [...prev, payload.new as Comment]);
          } else if (payload.eventType === "UPDATE") {
            setComments((prev) =>
              prev.map((comment) =>
                comment.id === payload.new.id
                  ? (payload.new as Comment)
                  : comment
              )
            );
          } else if (payload.eventType === "DELETE") {
            setComments((prev) =>
              prev.filter((comment) => comment.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }, []);

  const createPost = async (
    title: string,
    content: string,
    image_url?: string,
    flag?: PostFlag,
    repost_of?: string
  ): Promise<Post> => {
    setIsLoading(true);

    if (!user) {
      throw new Error("User not authenticated");
    }

    const newPost: Omit<Post, "id" | "createdAt"> & { created_at: Date } = {
      title,
      content,
      image_url,
      created_at: new Date(),
      upvotes: 0,
      user_id: user.id,
      user_name: user.full_name,
      flag,
      repost_of,
    };

    const { data, error } = await supabase
      .from("posts")
      .insert(newPost)
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating post",
        description: error.message,
      });
      throw error;
    }

    toast({
      title: "Post created",
      description: "Your post has been published successfully.",
    });

    return data as Post;
  };

  const updatePost = async (
    post_id: string,
    title: string,
    content: string,
    image_url?: string,
    flag?: PostFlag
  ): Promise<boolean> => {
    setIsLoading(true);

    if (!user) {
      throw new Error("User not authenticated");
    }

    // First verify post belongs to user
    const { data: postData } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", post_id)
      .single();

    if (!postData || postData.user_id !== user.id) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You can only edit your own posts.",
      });
      return false;
    }

    const { error } = await supabase
      .from("posts")
      .update({
        title,
        content,
        image_url,
        flag,
      })
      .eq("id", post_id);

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating post",
        description: error.message,
      });
      return false;
    }

    toast({
      title: "Post updated",
      description: "Your changes have been saved.",
    });

    return true;
  };

  const deletePost = async (post_id: string): Promise<boolean> => {
    setIsLoading(true);

    if (!user) {
      throw new Error("User not authenticated");
    }

    // First verify post belongs to user
    const { data: postData } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", post_id)
      .single();

    if (!postData || postData.user_id !== user.id) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You can only delete your own posts.",
      });
      return false;
    }

    // Delete associated comments first (using cascade would be better in DB design)
    await supabase.from("comments").delete().eq("post_id", post_id);

    // Then delete the post
    const { error } = await supabase.from("posts").delete().eq("id", post_id);

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting post",
        description: error.message,
      });
      return false;
    }

    toast({
      title: "Post deleted",
      description: "Your post has been removed.",
    });

    return true;
  };

  const upvotePost = async (post_id: string): Promise<void> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // First get current upvotes
    const { data } = await supabase
      .from("posts")
      .select("upvotes")
      .eq("id", post_id)
      .single();

    if (!data) {
      toast({
        variant: "destructive",
        title: "Post not found",
        description: "The post you're trying to upvote doesn't exist.",
      });
      return;
    }

    // Then update with incremented value
    await supabase
      .from("posts")
      .update({ upvotes: data.upvotes + 1 })
      .eq("id", post_id);

    // Update local state for immediate UI feedback
    setPosts((prev) =>
      prev.map((post) =>
        post.id === post_id ? { ...post, upvotes: post.upvotes + 1 } : post
      )
    );
  };

  const createComment = async (
    post_id: string,
    content: string
  ): Promise<Comment> => {
    setIsLoading(true);

    if (!user) {
      throw new Error("User not authenticated");
    }

    const newComment = {
      post_id,
      content,
      created_at: new Date(),
      user_id: user.id,
      user_name: user.full_name,
    };

    const { data, error } = await supabase
      .from("comments")
      .insert(newComment)
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating comment",
        description: error.message,
      });
      throw error;
    }

    return data as Comment;
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    setIsLoading(true);

    if (!user) {
      throw new Error("User not authenticated");
    }

    // First verify comment belongs to user
    const { data: commentData } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!commentData || commentData.user_id !== user.id) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You can only delete your own comments.",
      });
      return false;
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting comment",
        description: error.message,
      });
      return false;
    }

    toast({
      title: "Comment deleted",
      description: "Your comment has been removed.",
    });

    return true;
  };

  const getPostById = async (postId: string): Promise<Post | undefined> => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error) {
      return undefined;
    }

    return data as Post;
  };

  const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      return [];
    }

    return data as Comment[];
  };

  const setUserPreferences = async (
    preferences: Partial<UserPreferences>
  ): Promise<void> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const updatedPreferences = {
      ...user.preferences,
      ...preferences,
    };

    const { error } = await supabase
      .from("user_profiles")
      .update({ preferences: updatedPreferences })
      .eq("id", user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating preferences",
        description: error.message,
      });
      return;
    }

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        preferences: updatedPreferences,
      };
    });
  };

  const toggleColorMode = async (): Promise<void> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const currentMode = user.preferences.colorScheme;
    let newMode: "light" | "dark" | "system";

    if (currentMode === "light") newMode = "dark";
    else if (currentMode === "dark") newMode = "system";
    else newMode = "light";

    await setUserPreferences({ colorScheme: newMode });
  };

  const searchPosts = async (query: string): Promise<Post[]> => {
    if (!query.trim()) {
      return posts;
    }

    // Using Supabase's text search capabilities
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error searching posts",
        description: error.message,
      });
      return [];
    }

    return data as Post[];
  };

  const sortedPosts = async (by: "time" | "upvotes"): Promise<Post[]> => {
    let query = supabase.from("posts").select("*");

    if (by === "time") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("upvotes", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      toast({
        variant: "destructive",
        title: "Error sorting posts",
        description: error.message,
      });
      return [];
    }

    return data as Post[];
  };

  const filterPostsByFlag = async (flag: PostFlag | null): Promise<Post[]> => {
    if (!flag) {
      return posts;
    }

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("flag", flag);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error filtering posts",
        description: error.message,
      });
      return [];
    }

    return data as Post[];
  };

  return (
    <AppContext.Provider
      value={{
        posts,
        comments,
        user: user as User,
        isLoading,
        createPost,
        updatePost,
        deletePost,
        upvotePost,
        createComment,
        deleteComment,
        getPostById,
        getCommentsForPost,
        setUserPreferences,
        toggleColorMode,
        searchPosts,
        sortedPosts,
        filterPostsByFlag,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
