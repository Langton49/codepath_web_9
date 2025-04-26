import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PostForm } from "@/components/PostForm";
import { useAppContext } from "@/contexts/AppContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Post } from "@/types";
import { toast } from "@/components/ui/use-toast";

export default function CreatePostPage() {
  const { createPost, getPostById, isLoading } = useAppContext();
  const [repostId, setRepostId] = useState<string | undefined>(undefined);
  const [originalPost, setOriginalPost] = useState<Post | undefined>(undefined);
  const [localLoading, setLocalLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepostInfo = async () => {
      // Check if the URL has a repost query parameter
      const query = new URLSearchParams(location.search);
      const repost = query.get("repost");

      if (repost) {
        setRepostId(repost);
        setLocalLoading(true);

        try {
          // Fetch the original post
          const post = await getPostById(repost);

          if (!post) {
            // If repost ID is invalid, redirect to regular create
            navigate("/create", { replace: true });
            return;
          }

          setOriginalPost(post);
        } catch (error) {
          console.error("Error fetching original post:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "Failed to load the original post. Creating a new post instead.",
          });
          navigate("/create", { replace: true });
        } finally {
          setLocalLoading(false);
        }
      }
    };

    fetchRepostInfo();
  }, [location.search, getPostById, navigate]);

  const handleSubmit = async (
    title: string,
    content: string,
    imageUrl?: string,
    flag?: string
  ) => {
    setLocalLoading(true);
    try {
      const newPost = await createPost(
        title,
        content,
        imageUrl,
        flag as any,
        repostId
      );
      navigate(`/post/${newPost.id}`);
      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the post. Please try again.",
      });
      return false;
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Layout>
      {isLoading || localLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            {repostId ? "Create Repost" : "Create New Post"}
          </h1>

          {repostId && originalPost && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <p className="font-medium mb-2">You're reposting:</p>
              <div className="p-3 rounded bg-card">
                <h3 className="font-medium">{originalPost.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {originalPost.user_id || "Anonymous"}
                </p>
              </div>
            </div>
          )}

          <PostForm
            onSubmit={handleSubmit}
            submitLabel={repostId ? "Create Repost" : "Create Post"}
            repostOf={repostId}
          />
        </div>
      )}
    </Layout>
  );
}
