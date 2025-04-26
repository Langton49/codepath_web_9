import { useState } from "react";
import { Comment } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { useAppContext } from "@/contexts/AppContext";
import { Trash2 } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
}

export function CommentSection({ postId, comments }: CommentSectionProps) {
  const { user, createComment, deleteComment } = useAppContext();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      await createComment(postId, content);
      setContent("");
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setIsDeleting(commentId);

    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Comments ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add your comment..."
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </form>

      <div className="space-y-4 mt-6">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Be the first to comment on this post!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-card p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">
                    {comment.user_name || "Anonymous"}
                    {comment.user_id === user.id && (
                      <span className="ml-1 text-xs">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.created_at, {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {comment.user_id === user.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(comment.id)}
                    disabled={isDeleting === comment.id}
                    className="h-6 w-6"
                  >
                    {isDeleting === comment.id ? (
                      <LoadingSpinner />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>

              <p className="mt-2">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
