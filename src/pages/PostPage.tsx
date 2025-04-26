import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { CommentSection } from "@/components/CommentSection";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAppContext } from "@/contexts/AppContext";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Post, Comment } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowUp, Edit, Trash2, Share2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const {
    getPostById,
    getCommentsForPost,
    upvotePost,
    deletePost,
    user,
    isLoading,
  } = useAppContext();

  const [post, setPost] = useState<Post | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [originalPost, setOriginalPost] = useState<Post | undefined>(undefined);
  const [localLoading, setLocalLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const navigate = useNavigate();

  // Fetch post and comments
  useEffect(() => {
    const fetchData = async () => {
      if (!postId) {
        navigate("/404");
        return;
      }

      setLocalLoading(true);
      try {
        // Fetch the post data
        const postData = await getPostById(postId);
        if (!postData) {
          navigate("/404");
          return;
        }

        setPost(postData);

        // Fetch comments for the post
        const commentsData = await getCommentsForPost(postId);
        setComments(commentsData);

        // If this is a repost, fetch the original post
        if (postData.repost_of) {
          const originalPostData = await getPostById(postData.repost_of);
          setOriginalPost(originalPostData);
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchData();
  }, [postId, getPostById, getCommentsForPost, navigate]);

  if (isLoading || localLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isCurrentUserAuthor = post.user_id === user?.id;

  const handleUpvote = async () => {
    try {
      await upvotePost(post.id);
      // Update local state for immediate feedback
      setPost((prev) => (prev ? { ...prev, upvotes: prev.upvotes + 1 } : prev));
    } catch (error) {
      console.error("Error upvoting post:", error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deletePost(post.id);
      if (success) {
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: `Check out this post on Artemis Eco Forum: ${post.title}`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-card shadow-sm rounded-lg p-6">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{post.title}</h1>
                {post.flag && (
                  <Badge
                    variant="outline"
                    className={cn(
                      post.flag === "Question" &&
                        "bg-blue-100 text-blue-800 border-blue-200",
                      post.flag === "Opinion" &&
                        "bg-purple-100 text-purple-800 border-purple-200",
                      post.flag === "Tip" &&
                        "bg-green-100 text-green-800 border-green-200",
                      post.flag === "News" &&
                        "bg-amber-100 text-amber-800 border-amber-200",
                      post.flag === "Project" &&
                        "bg-teal-100 text-teal-800 border-teal-200",
                      post.flag === "Discussion" &&
                        "bg-indigo-100 text-indigo-800 border-indigo-200"
                    )}
                  >
                    {post.flag}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Posted{" "}
                {formatDistanceToNow(post.created_at, { addSuffix: true })} • by{" "}
                {post.user_name || "Anonymous"}
                {isCurrentUserAuthor && (
                  <span className="ml-1 text-xs">(You)</span>
                )}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                title="Share post"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>

              {showCopiedToast && (
                <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded text-sm">
                  URL copied!
                </div>
              )}

              {isCurrentUserAuthor && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/edit/${post.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This post and all its
                          comments will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {post.image_url && (
            <div className="mb-6">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full rounded-md max-h-96 object-cover"
              />
            </div>
          )}

          <div className="prose max-w-none mb-6">
            {post.content.split("\n").map((paragraph, i) => (
              <p key={i} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          {originalPost && (
            <div className="mb-6 p-4 border rounded-md bg-muted/30">
              <p className="text-sm font-medium mb-2">This is a repost of:</p>
              <div className="p-3 border rounded bg-card">
                <Link
                  to={`/post/${originalPost.id}`}
                  className="hover:underline"
                >
                  <h3 className="font-medium text-artemis-primary">
                    {originalPost.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground">
                  by {originalPost.user_id || "Anonymous"} •{" "}
                  {formatDistanceToNow(originalPost.created_at, {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-b py-4 my-6">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleUpvote}
                className="flex items-center gap-1"
              >
                <ArrowUp className="h-4 w-4" />
                <span>Upvote</span>
              </Button>
              <span className="text-lg font-medium">{post.upvotes}</span>
            </div>

            <Button
              variant="outline"
              className="flex items-center gap-1"
              asChild
            >
              <Link to={`/create?repost=${post.id}`}>
                <LinkIcon className="h-4 w-4" />
                <span>Repost</span>
              </Link>
            </Button>
          </div>

          <CommentSection postId={post.id} comments={comments} />
        </div>
      </div>
    </Layout>
  );
}
