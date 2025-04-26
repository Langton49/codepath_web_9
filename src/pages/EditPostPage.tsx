import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PostForm } from "@/components/PostForm";
import { useAppContext } from "@/contexts/AppContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";
import { Post, PostFlag } from "@/types";

export default function EditPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { getPostById, updatePost, user, isLoading } = useAppContext();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | undefined>(undefined);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        navigate("/404");
        return;
      }

      setLocalLoading(true);
      try {
        const fetchedPost = await getPostById(postId);

        if (!fetchedPost) {
          navigate("/404");
          return;
        }

        // Check if current user is the post author
        if (fetchedPost.user_id !== user?.id) {
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "You can only edit your own posts.",
          });
          navigate(`/post/${postId}`, { replace: true });
          return;
        }

        setPost(fetchedPost);
      } catch (error) {
        console.error("Error fetching post:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load the post. Please try again.",
        });
      } finally {
        setLocalLoading(false);
      }
    };

    fetchPost();
  }, [postId, getPostById, user?.id, navigate]);

  const handleSubmit = async (
    title: string,
    content: string,
    imageUrl?: string,
    flag?: PostFlag
  ) => {
    if (!postId) return false;

    setLocalLoading(true);
    try {
      const success = await updatePost(postId, title, content, imageUrl, flag);

      if (success) {
        navigate(`/post/${postId}`);
      }

      return success;
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the post. Please try again.",
      });
      return false;
    } finally {
      setLocalLoading(false);
    }
  };

  if (isLoading || localLoading || !post) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Post</h1>
        <PostForm
          defaultValues={{
            title: post.title,
            content: post.content,
            imageUrl: post.image_url,
            flag: post.flag,
          }}
          onSubmit={handleSubmit}
          submitLabel="Update Post"
          isEdit={true}
        />
      </div>
    </Layout>
  );
}
